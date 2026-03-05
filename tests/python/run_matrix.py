"""
Standalone runner — execute outside pytest for a quick DataFrame summary.

Usage:
    source .venv/bin/activate
    python -m tests.python.run_matrix          # pretty table
    python -m tests.python.run_matrix --csv    # CSV to stdout
"""

from __future__ import annotations

import sys
from io import StringIO

import pandas as pd

from .detection import detect_sensitive_data
from .test_matrix import (
    ASIA_RUSSIA_DF,
    BRAZIL_DF,
    EUROPE_DF,
    GLOBAL_DF,
    LATAM_DF,
    MULTI_DF,
)


def _run_single_type(df: pd.DataFrame, region: str) -> pd.DataFrame:
    """Evaluate every row and return a results DataFrame."""
    rows: list[dict] = []
    for _, r in df.iterrows():
        results = detect_sensitive_data(r["input_text"])
        found = [d for d in results if d.type == r["expected_type"]]
        matched = bool(found)
        passed = matched == r["should_match"]
        first_val = found[0].value if found else None
        exp_val = r["expected_value"]
        value_missing = pd.isna(exp_val) if isinstance(exp_val, float) else exp_val is None
        value_ok = (
            True
            if value_missing
            else any(d.value == exp_val for d in found)
        )
        rows.append(
            {
                "region": region,
                "type": r["expected_type"],
                "input": r["input_text"][:50],
                "should_match": r["should_match"],
                "matched": matched,
                "value_ok": value_ok,
                "passed": passed and value_ok,
            }
        )
    return pd.DataFrame(rows)


def _run_multi(df: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict] = []
    for _, r in df.iterrows():
        results = detect_sensitive_data(r["input_text"])
        found_types = {d.type for d in results}
        expected = r["expected_types"]
        missing = expected - found_types
        rows.append(
            {
                "region": "MULTI",
                "type": ",".join(sorted(expected)),
                "input": r["input_text"][:50],
                "should_match": True,
                "matched": not missing,
                "value_ok": True,
                "passed": not missing,
            }
        )
    return pd.DataFrame(rows)


def main() -> None:
    frames = [
        _run_single_type(BRAZIL_DF, "BR"),
        _run_single_type(LATAM_DF, "LATAM"),
        _run_single_type(EUROPE_DF, "EU"),
        _run_single_type(ASIA_RUSSIA_DF, "ASIA/RU"),
        _run_single_type(GLOBAL_DF, "GLOBAL"),
        _run_multi(MULTI_DF),
    ]
    report = pd.concat(frames, ignore_index=True)

    total = len(report)
    passed = int(report["passed"].sum())
    failed = total - passed

    if "--csv" in sys.argv:
        report.to_csv(sys.stdout, index=False)
    else:
        try:
            from tabulate import tabulate  # type: ignore[import-untyped]

            print(tabulate(report, headers="keys", tablefmt="github", showindex=False))
        except ImportError:
            print(report.to_string(index=False))

    print(f"\n{'='*60}")
    print(f"  TOTAL: {total}   PASSED: {passed}   FAILED: {failed}")
    print(f"{'='*60}")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
