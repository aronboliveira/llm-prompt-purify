"""
Prompt corpus detection tests — validates that the generated prompt mock
files contain PII that the Python detection engine can find.

Uses the detect_sensitive_data function from detection.py to verify
that prompt files across all languages, formalities, roles, and lengths
produce at least one detection hit.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from .detection import detect_sensitive_data

PROMPTS_ROOT = Path(os.getcwd()) / ".tmp" / "input-mocks" / "prompts"

LANGUAGES = ("en", "pt-br", "es", "zh")
FORMALITIES = ("formal", "neutral", "informal")
LENGTHS = ("short", "medium", "long")
SAMPLE_ROLES = (
    "regular", "lawyer", "doctor", "banker", "accountant",
    "hr", "developer", "nurse", "pharmacist", "secretary",
    "tax_preparer", "insurance_agent", "researcher",
)

corpus_exists = PROMPTS_ROOT.is_dir()
skip_no_corpus = pytest.mark.skipif(
    not corpus_exists,
    reason="Prompt corpus not generated (.tmp/input-mocks/prompts missing)",
)


def _read_first_prompt(lang: str, formality: str, role: str, length: str) -> str | None:
    d = PROMPTS_ROOT / lang / formality / role / length
    if not d.is_dir():
        return None
    files = sorted(f for f in d.iterdir() if f.suffix == ".txt")
    if not files:
        return None
    return files[0].read_text(encoding="utf-8")


# ════════════════════════════════════════════════════════════════════════
#  Per-language detection coverage
# ════════════════════════════════════════════════════════════════════════

@skip_no_corpus
@pytest.mark.parametrize("lang", LANGUAGES)
def test_language_prompts_contain_detectable_pii(lang: str) -> None:
    hits = 0
    total = 0

    for formality in FORMALITIES:
        for role in SAMPLE_ROLES:
            for length in LENGTHS:
                text = _read_first_prompt(lang, formality, role, length)
                if text is None:
                    continue
                total += 1
                detections = detect_sensitive_data(text)
                if detections:
                    hits += 1

    assert total > 0, f"No prompt files found for {lang}"
    assert hits / total >= 0.5, (
        f"{lang}: only {hits}/{total} prompts had detections"
    )


# ════════════════════════════════════════════════════════════════════════
#  Per-role detection (en/formal/medium)
# ════════════════════════════════════════════════════════════════════════

@skip_no_corpus
@pytest.mark.parametrize("role", SAMPLE_ROLES)
def test_role_prompts_contain_pii(role: str) -> None:
    text = _read_first_prompt("en", "formal", role, "medium")
    if text is None:
        pytest.skip(f"No en/formal/{role}/medium prompt file")
    detections = detect_sensitive_data(text)
    assert len(detections) > 0, f"No PII detected in en/formal/{role}/medium"


# ════════════════════════════════════════════════════════════════════════
#  Per-formality detection
# ════════════════════════════════════════════════════════════════════════

@skip_no_corpus
@pytest.mark.parametrize("formality", FORMALITIES)
def test_formality_prompts_contain_pii(formality: str) -> None:
    hits = 0
    total = 0
    for role in ("regular", "lawyer", "doctor"):
        text = _read_first_prompt("en", formality, role, "long")
        if text is None:
            continue
        total += 1
        detections = detect_sensitive_data(text)
        if detections:
            hits += 1

    assert total > 0, f"No prompt files for formality={formality}"
    assert hits > 0, f"No detections in any {formality} prompt"


# ════════════════════════════════════════════════════════════════════════
#  Per-length detection
# ════════════════════════════════════════════════════════════════════════

@skip_no_corpus
@pytest.mark.parametrize("length", LENGTHS)
def test_length_prompts_contain_pii(length: str) -> None:
    hits = 0
    total = 0
    for role in ("regular", "banker", "accountant"):
        text = _read_first_prompt("en", "formal", role, length)
        if text is None:
            continue
        total += 1
        detections = detect_sensitive_data(text)
        if detections:
            hits += 1

    assert total > 0, f"No prompt files for length={length}"
    assert hits > 0, f"No detections in any {length} prompt"


# ════════════════════════════════════════════════════════════════════════
#  Corpus structure validation
# ════════════════════════════════════════════════════════════════════════

@skip_no_corpus
def test_corpus_has_minimum_file_count() -> None:
    total = sum(1 for _ in PROMPTS_ROOT.rglob("*.txt"))
    assert total >= 1000, f"Expected ≥1000 prompt files, found {total}"


@skip_no_corpus
def test_all_languages_have_files() -> None:
    for lang in LANGUAGES:
        lang_dir = PROMPTS_ROOT / lang
        assert lang_dir.is_dir(), f"Missing language directory: {lang}"
        count = sum(1 for _ in lang_dir.rglob("*.txt"))
        assert count > 0, f"No .txt files under {lang}/"


@skip_no_corpus
def test_prompt_files_are_non_empty() -> None:
    empty = []
    for f in list(PROMPTS_ROOT.rglob("*.txt"))[:200]:
        content = f.read_text(encoding="utf-8").strip()
        if len(content) < 10:
            empty.append(str(f))
    assert not empty, f"Found {len(empty)} near-empty files: {empty[:5]}"
