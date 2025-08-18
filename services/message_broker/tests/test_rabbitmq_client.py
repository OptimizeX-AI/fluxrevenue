import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add the parent directory to the Python path to allow for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from rabbitmq_client import RabbitMQClient

class TestRabbitMQClient(unittest.TestCase):

    @patch('pika.BlockingConnection')
    def test_publish_message(self, mock_blocking_connection):
        # Arrange
        mock_channel = MagicMock()
        mock_connection = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_blocking_connection.return_value = mock_connection

        client = RabbitMQClient()
        client.connect()

        queue_name = "test_queue"
        message = RabbitMQClient.create_message(
            source_agent='test_agent',
            target_agent='test_target',
            task_type='test_task',
            payload={'data': 'test'}
        )

        # Act
        client.publish_message(queue_name, message)

        # Assert
        mock_channel.basic_publish.assert_called_once()
        args, kwargs = mock_channel.basic_publish.call_args
        self.assertEqual(kwargs['routing_key'], queue_name)
        self.assertIn('message_id', kwargs['body'])

if __name__ == '__main__':
    unittest.main()
