from abc import ABC, abstractmethod

class MessageBroker(ABC):
    """
    Abstract base class for a message broker.
    Defines the interface for connecting, publishing, and consuming messages.
    """

    @abstractmethod
    def connect(self):
        """Connect to the message broker."""
        pass

    @abstractmethod
    def close(self):
        """Disconnect from the message broker."""
        pass

    @abstractmethod
    def publish_message(self, queue_name, message, exchange_name='', routing_key=''):
        """
        Publish a message to a specific queue.

        Args:
            queue_name (str): The name of the queue to publish to.
            message (dict): The message to be sent, in dictionary format.
            exchange_name (str): The name of the exchange to publish to.
            routing_key (str): The routing key for the message.
        """
        pass

    @abstractmethod
    def consume_messages(self, queue_name, callback):
        """
        Consume messages from a specific queue.

        Args:
            queue_name (str): The name of the queue to consume from.
            callback (function): The function to be called when a message is received.
        """
        pass
