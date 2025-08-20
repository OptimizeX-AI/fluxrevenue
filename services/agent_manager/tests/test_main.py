def test_import():
    """A simple test to see if the main app module can be imported at all."""
    try:
        from services.agent_manager.app import main
        print("SUCCESS: services.agent_manager.app.main imported")
        assert main is not None
    except Exception as e:
        print(f"FAILURE: Could not import main. Error: {e}")
        # Re-raise to make the test fail
        raise e
