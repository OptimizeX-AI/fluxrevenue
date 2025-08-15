import logging
import sys
from pythonjsonlogger import jsonlogger

def setup_logging(log_level="INFO"):
    """
    Sets up structured JSON logging for the application.
    """
    logger = logging.getLogger()
    logger.setLevel(log_level)
    logHandler = logging.StreamHandler(sys.stdout)

    # Example formatter, can be customized
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s %(module)s %(funcName)s'
    )

    logHandler.setFormatter(formatter)

    # Avoid adding duplicate handlers if this function is called multiple times
    if not logger.handlers:
        logger.addHandler(logHandler)

    return logger
