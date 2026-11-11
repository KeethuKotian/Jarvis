import logging
import sys
import re

API_KEY_REGEX = re.compile(r"(AQ\.[A-Za-z0-9_\-]{20,}|AIza[0-9A-Za-z-_]{35})")

class SecretMaskingFormatter(logging.Formatter):
    """Custom formatter to prevent sensitive API keys from appearing in logs."""
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        return API_KEY_REGEX.sub("[REDACTED_API_KEY]", original)

def get_logger(name: str = "jarvis") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = SecretMaskingFormatter(
            "%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False
    return logger

logger = get_logger("jarvis")
