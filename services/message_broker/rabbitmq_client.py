import pika
import json
import uuid
from datetime import datetime
import time
from .message_broker import MessageBroker
from .message_schema import MESSAGE_SCHEMA
from jsonschema import validate

class RabbitMQClient(MessageBroker):
    """
    RabbitMQ client for sending and receiving messages.
    Implements retry and dead-letter queue mechanisms.
    """

    def __init__(self, host='localhost', port=5672, username='user', password='password', max_retries=3, retry_delay=5):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.connection = None
        self.channel = None

    def connect(self):
        """Connect to RabbitMQ, with retries."""
        for i in range(self.max_retries):
            try:
                credentials = pika.PlainCredentials(self.username, self.password)
                self.connection = pika.BlockingConnection(
                    pika.ConnectionParameters(host=self.host, port=self.port, credentials=credentials)
                )
                self.channel = self.connection.channel()
                print("Successfully connected to RabbitMQ")
                return
            except pika.exceptions.AMQPConnectionError as e:
                print(f"Failed to connect to RabbitMQ (attempt {i+1}/{self.max_retries}): {e}")
                time.sleep(self.retry_delay)
        raise Exception("Could not connect to RabbitMQ after multiple retries.")

    def close(self):
        """Close the connection to RabbitMQ."""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            print("RabbitMQ connection closed.")

    def _declare_queue(self, queue_name):
        """Declare a queue and its corresponding dead-letter queue."""
        dlx_name = f'{queue_name}_dlx'
        dlq_name = f'{queue_name}_dlq'

        # Declare the dead-letter exchange and queue
        self.channel.exchange_declare(exchange=dlx_name, exchange_type='fanout')
        self.channel.queue_declare(queue=dlq_name, durable=True)
        self.channel.queue_bind(exchange=dlx_name, queue=dlq_name)

        # Declare the main queue with dead-lettering configuration
        self.channel.queue_declare(
            queue=queue_name,
            durable=True,
            arguments={
                'x-dead-letter-exchange': dlx_name,
                'x-message-ttl': 60000  # 1 minute
            }
        )

    def publish_message(self, queue_name, message, exchange_name='', routing_key=None):
        """Publish a message to a specific queue."""
        if not self.channel:
            self.connect()

        if routing_key is None:
            routing_key = queue_name

        self._declare_queue(queue_name)

        try:
            # Validate message against schema
            validate(instance=message, schema=MESSAGE_SCHEMA)

            self.channel.basic_publish(
                exchange=exchange_name,
                routing_key=routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # make message persistent
                )
            )
            print(f"Message {message.get('message_id')} published to queue '{queue_name}'")
        except Exception as e:
            print(f"Failed to publish message: {e}")
            # Optionally, implement a retry mechanism here for publishing

    def consume_messages(self, queue_name, callback):
        """Consume messages from a specific queue."""
        if not self.channel:
            self.connect()

        self._declare_queue(queue_name)

        def message_callback(ch, method, properties, body):
            message = json.loads(body)
            try:
                print(f"Received message {message.get('message_id')}")
                callback(message)
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                print(f"Error processing message {message.get('message_id')}: {e}")
                # Negative acknowledgement, requeue=False sends it to the DLQ
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

        self.channel.basic_consume(queue=queue_name, on_message_callback=message_callback)
        print(f"Waiting for messages in queue '{queue_name}'. To exit press CTRL+C")
        self.channel.start_consuming()

    @staticmethod
    def create_message(source_agent, target_agent, task_type, payload, priority=1, correlation_id=None):
        """Create a message dictionary that conforms to the schema."""
        return {
            "message_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "source_agent": source_agent,
            "target_agent": target_agent,
            "task_type": task_type,
            "priority": priority,
            "payload": payload,
            "metadata": {
                "correlation_id": correlation_id or str(uuid.uuid4()),
                "retry_count": 0
            }
        }
