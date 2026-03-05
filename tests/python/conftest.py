"""Shared pytest fixtures for the Python test matrix."""

from __future__ import annotations

import pytest

from .detection import Detection, detect_sensitive_data


@pytest.fixture
def detect():
    """Shorthand fixture that calls detect_sensitive_data."""
    return detect_sensitive_data


@pytest.fixture
def summary_table():
    """Collects (rule_id, input, passed) tuples for post-run reporting."""
    rows: list[tuple[str, str, bool]] = []
    yield rows
