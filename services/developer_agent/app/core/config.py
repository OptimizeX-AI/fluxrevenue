import logging
import sys
from pythonjsonlogger import jsonlogger

def setup_logging(log_level="INFO"):
    """
    Sets up structured JSON logging for the application, following the ecosystem standard.
    """
    logger = logging.getLogger()
    logger.setLevel(log_level)
    logHandler = logging.StreamHandler(sys.stdout)

    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s %(module)s %(funcName)s'
    )

    logHandler.setFormatter(formatter)

    # Avoid adding duplicate handlers
    if not logger.handlers:
        logger.addHandler(logHandler)

    return logger
