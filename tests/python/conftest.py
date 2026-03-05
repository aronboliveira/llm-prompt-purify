"""Shared pytest fixtures for the Python detection test suite."""

from __future__ import annotations

import pandas as pd
import pytest

from .detection import detect_sensitive_data


@pytest.fixture()
def detect():
    """Shorthand fixture for the detection function."""
    return detect_sensitive_data


@pytest.fixture()
def summary_table(request):
    """
    Collect pass/fail per parametrised case and print a DataFrame summary
    at the end of the test session.
    """
    results: list[dict] = []
    yield results
    if results:
        df = pd.DataFrame(results)
        print("\n\n─── Test Summary ───")
        print(df.to_string(index=False))
