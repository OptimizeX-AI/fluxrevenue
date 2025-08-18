from pydantic import BaseModel, validator, ValidationError
import logging

logger = logging.getLogger(__name__)

class SecureBaseModel(BaseModel):
    """
    A base Pydantic model that includes basic sanitization for all string fields.
    """
    @validator('*', pre=True)
    def sanitize_strings(cls, v):
        if isinstance(v, str):
            # A very basic sanitizer: strip leading/trailing whitespace.
            # A real implementation might also remove potential script tags, etc.
            return v.strip()
        return v

def validate_input(data: dict, model: BaseModel) -> (Optional[BaseModel], Optional[str]):
    """
    Validates and sanitizes input data against a given Pydantic model.

    Args:
        data: The raw input data dictionary.
        model: The Pydantic model class to validate against.

    Returns:
        A tuple containing (validated_model, error_message).
        If validation is successful, validated_model is the Pydantic object
        and error_message is None.
        If validation fails, validated_model is None and error_message is a string.
    """
    try:
        validated_model = model(**data)
        return validated_model, None
    except ValidationError as e:
        error_message = f"Input validation failed: {e}"
        logger.warning(error_message)
        return None, error_message
