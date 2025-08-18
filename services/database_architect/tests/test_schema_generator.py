import pytest
import sys
import os
import shutil

# This assumes pytest is run from the root directory with `pythonpath = .` in pytest.ini
from services.database_architect.app.schema_generator import generate_sqlalchemy_models, WORKSPACE_DIR

@pytest.fixture(scope="function")
def cleanup_workspace():
    """A fixture to ensure the workspace directory is clean before and after a test."""
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)
    yield
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)

def test_generate_sqlalchemy_models_file_creation(cleanup_workspace):
    """
    Tests that the schema generator creates a file in the correct location.
    """
    project_name = "E-commerce Site"
    entities = ["user", "product"]

    generated_file_path = generate_sqlalchemy_models(project_name, entities)

    expected_dir = os.path.join(WORKSPACE_DIR, "e-commerce_site")
    expected_file = os.path.join(expected_dir, "models.py")

    assert generated_file_path == expected_file
    assert os.path.exists(generated_file_path)

def test_generate_sqlalchemy_models_content(cleanup_workspace):
    """
    Tests that the generated schema file contains the correct SQLAlchemy models.
    """
    project_name = "E-commerce Site"
    entities = ["user", "product", "order"]

    generated_file_path = generate_sqlalchemy_models(project_name, entities)

    with open(generated_file_path, "r") as f:
        content = f.read()

    # Check for imports and base class
    assert 'from sqlalchemy import Column, Integer, String' in content
    assert 'Base = declarative_base()' in content

    # Check for each entity's class definition
    assert 'class User(Base):' in content
    assert '__tablename__ = "users"' in content

    assert 'class Product(Base):' in content
    assert '__tablename__ = "products"' in content

    assert 'class Order(Base):' in content
    assert '__tablename__ = "orders"' in content

    # Check for common columns
    assert 'id = Column(Integer, primary_key=True, index=True)' in content
    assert 'name = Column(String, index=True)' in content
