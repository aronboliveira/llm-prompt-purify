"""
Exhaustive Brazil + US DataFrame tests — extension branch.

Adapted from the develop-branch ``test_brazil_us_exhaustive.py`` with:
  - No CEP / CNH patterns (extension doesn't define them)
  - No label-variant or bare-value rejection tests (standalone regex only)
  - CPF ``[.\\-]?`` separators at positions 1–2, dash-only ``[\\-]?`` at position 3
  - RG requires exactly 2-digit prefix ``\\d{2}`` (develop allows 1–2)
  - TITULO_ELEITOR allows only space separators ``\\s?`` (not dots / dashes)
  - US PHONE has no area-code 2-9 restriction
  - SSN requires dashes (same as develop)
"""

from __future__ import annotations

import pandas as pd
import pytest

from .detection import Detection, detect_sensitive_data, generate_masks

# ════════════════════════════════════════════════════════════════════════
#  HELPERS
# ════════════════════════════════════════════════════════════════════════

_COLS = ["input_text", "expected_type", "should_match", "expected_value"]


def _df(rows: list[list]) -> pd.DataFrame:
    return pd.DataFrame(rows, columns=_COLS)


def _pos(text: str, typ: str, value: str | None = None) -> list:
    """Positive case — expect *typ* to be detected."""
    return [text, typ, True, value]


def _neg(text: str, typ: str) -> list:
    """Negative case — expect *typ* NOT to be detected."""
    return [text, typ, False, None]


def _make_params(df: pd.DataFrame):
    for idx, row in df.iterrows():
        polarity = "pos" if row["should_match"] else "neg"
        tid = f"{row['expected_type']}-{polarity}-{idx}"
        val = row["expected_value"]
        yield pytest.param(
            row["input_text"],
            row["expected_type"],
            row["should_match"],
            None if pd.isna(val) else val,
            id=tid,
        )


def _assert_detection(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    results = detect_sensitive_data(text)
    found = [d for d in results if d.type == expected_type]

    if should_match:
        assert found, (
            f"Expected {expected_type} detection in:\n  {text!r}\n"
            f"  got types: {[d.type for d in results]}"
        )
        if expected_value is not None:
            assert any(d.value == expected_value for d in found), (
                f"Expected value {expected_value!r}, "
                f"got {[d.value for d in found]}"
            )
    else:
        assert not found, (
            f"Did NOT expect {expected_type} detection in:\n  {text!r}\n"
            f"  but got: {[d.value for d in found]}"
        )


# ════════════════════════════════════════════════════════════════════════
#  CPF — \b\d{3}[.\-]?\d{3}[.\-]?\d{3}[\-]?\d{2}\b
#  Separator positions:  s1=[.\-]?  s2=[.\-]?  s3=[\-]?
# ════════════════════════════════════════════════════════════════════════

CPF_DF = _df(
    [
        # ── Exhaustive separator combos (s1, s2, s3) ─────────────────
        # s1=. s2=. s3=-  (standard)
        _pos("529.982.247-25", "CPF", "529.982.247-25"),
        # s1=. s2=. s3=none
        _pos("529.982.24725", "CPF", "529.982.24725"),
        # s1=. s2=- s3=-
        _pos("529.982-247-25", "CPF", "529.982-247-25"),
        # s1=. s2=- s3=none
        _pos("529.982-24725", "CPF", "529.982-24725"),
        # s1=. s2=none s3=-
        _pos("529.982247-25", "CPF", "529.982247-25"),
        # s1=. s2=none s3=none
        _pos("529.98224725", "CPF", "529.98224725"),
        # s1=- s2=. s3=-
        _pos("529-982.247-25", "CPF", "529-982.247-25"),
        # s1=- s2=. s3=none
        _pos("529-982.24725", "CPF", "529-982.24725"),
        # s1=- s2=- s3=-  (all dashes)
        _pos("529-982-247-25", "CPF", "529-982-247-25"),
        # s1=- s2=- s3=none
        _pos("529-982-24725", "CPF", "529-982-24725"),
        # s1=- s2=none s3=-
        _pos("529-982247-25", "CPF", "529-982247-25"),
        # s1=- s2=none s3=none
        _pos("529-98224725", "CPF", "529-98224725"),
        # s1=none s2=. s3=-
        _pos("529982.247-25", "CPF", "529982.247-25"),
        # s1=none s2=. s3=none
        _pos("529982.24725", "CPF", "529982.24725"),
        # s1=none s2=- s3=-
        _pos("529982-247-25", "CPF", "529982-247-25"),
        # s1=none s2=- s3=none
        _pos("529982-24725", "CPF", "529982-24725"),
        # s1=none s2=none s3=-
        _pos("529982247-25", "CPF", "529982247-25"),
        # s1=none s2=none s3=none  (unformatted)
        _pos("52998224725", "CPF", "52998224725"),
        # ── Edge values ──────────────────────────────────────────────
        _pos("000.000.000-00", "CPF", "000.000.000-00"),
        _pos("999.999.999-99", "CPF", "999.999.999-99"),
        _pos("012.345.678-90", "CPF", "012.345.678-90"),
        _pos("00000000000", "CPF", "00000000000"),
        _pos("99999999999", "CPF", "99999999999"),
        # ── Boundary / embedding tests ───────────────────────────────
        _pos("CPF: 529.982.247-25 registrado", "CPF", "529.982.247-25"),
        _pos("52998224725 é o CPF", "CPF", "52998224725"),
        _pos("dados, 529.982.247-25, ok", "CPF", "529.982.247-25"),
        _pos("(52998224725)", "CPF", "52998224725"),
        _pos("CPF:529.982.247-25!", "CPF", "529.982.247-25"),
        _pos("[529-982-247-25]", "CPF", "529-982-247-25"),
        _pos("o número 52998224725 consta", "CPF", "52998224725"),
        _pos("#529.982.247-25#", "CPF", "529.982.247-25"),
        _pos("CPF=52998224725;", "CPF", "52998224725"),
        # ── Negatives ────────────────────────────────────────────────
        # 10 digits (too short)
        _neg("5299822472", "CPF"),
        # 12 digits continuous (boundaries prevent partial match)
        _neg("529982247250", "CPF"),
        # letter in the middle
        _neg("529.98A.247-25", "CPF"),
        # double separator
        _neg("529..982.247-25", "CPF"),
        # slash separator (not in [.\-])
        _neg("529/982/247-25", "CPF"),
        # space separator
        _neg("529 982 247 25", "CPF"),
        # dot as third separator (only [\-]? allowed there)
        _neg("529.982.247.25", "CPF"),
        # too-short last group (1 digit)
        _neg("529.982.247-2", "CPF"),
        # too-short first group (2 digits)
        _neg("52.982.247-25", "CPF"),
        # trailing letter prevents \b
        _neg("529.982.247-25a", "CPF"),
        # trailing digit prevents \b
        _neg("5299822472500", "CPF"),
        # underscore after (word char, no boundary)
        _neg("52998224725_data", "CPF"),
        # leading digit no boundary
        _neg("152998224725", "CPF"),
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  CNPJ — \b\d{2}\.?\d{3}\.?\d{3}/?\d{4}\-?\d{2}\b
#  Format: XX.XXX.XXX/XXXX-XX  (14 digits)
# ════════════════════════════════════════════════════════════════════════

CNPJ_DF = _df(
    [
        # ── Separator combos ─────────────────────────────────────────
        # standard (dot.dot/slash-dash)
        _pos("12.345.678/0001-95", "CNPJ", "12.345.678/0001-95"),
        # unformatted
        _pos("12345678000195", "CNPJ", "12345678000195"),
        # dots only (no slash, no dash)
        _pos("12.345.678000195", "CNPJ", "12.345.678000195"),
        # no dots, slash, dash
        _pos("12345678/0001-95", "CNPJ", "12345678/0001-95"),
        # no dots, no slash, dash
        _pos("123456780001-95", "CNPJ", "123456780001-95"),
        # no dots, slash, no dash
        _pos("12345678/000195", "CNPJ", "12345678/000195"),
        # dot, no-dot, slash, dash
        _pos("12.345678/0001-95", "CNPJ", "12.345678/0001-95"),
        # no-dot, dot, slash, dash
        _pos("12345.678/0001-95", "CNPJ", "12345.678/0001-95"),
        # dot, dot, no-slash, dash
        _pos("12.345.6780001-95", "CNPJ", "12.345.6780001-95"),
        # dot, dot, slash, no-dash
        _pos("12.345.678/000195", "CNPJ", "12.345.678/000195"),
        # dot, dot, no-slash, no-dash
        _pos("12.345.678000195", "CNPJ", "12.345.678000195"),
        # ── Edge values ──────────────────────────────────────────────
        _pos("00.000.000/0000-00", "CNPJ", "00.000.000/0000-00"),
        _pos("99.999.999/9999-99", "CNPJ", "99.999.999/9999-99"),
        _pos("00000000000000", "CNPJ", "00000000000000"),
        _pos("99999999999999", "CNPJ", "99999999999999"),
        # ── Boundary tests ───────────────────────────────────────────
        _pos("CNPJ: 12.345.678/0001-95 registrado", "CNPJ", "12.345.678/0001-95"),
        _pos("empresa 12345678000195 ativa", "CNPJ", "12345678000195"),
        _pos("(12.345.678/0001-95)", "CNPJ", "12.345.678/0001-95"),
        _pos("[12345678000195]", "CNPJ", "12345678000195"),
        _pos("CNPJ=12.345.678/0001-95;", "CNPJ", "12.345.678/0001-95"),
        _pos("#12345678000195#", "CNPJ", "12345678000195"),
        # ── Negatives ────────────────────────────────────────────────
        # 13 digits (too short)
        _neg("1234567800019", "CNPJ"),
        # 15 digits (too long, boundaries prevent 14-match)
        _neg("123456780001950", "CNPJ"),
        # letter in middle
        _neg("12.34A.678/0001-95", "CNPJ"),
        # double dot
        _neg("12..345.678/0001-95", "CNPJ"),
        # space separator
        _neg("12 345 678 0001 95", "CNPJ"),
        # dash instead of slash
        _neg("12.345.678-0001-95", "CNPJ"),
        # trailing letter
        _neg("12345678000195a", "CNPJ"),
        # leading digit
        _neg("312345678000195", "CNPJ"),
        # underscore after
        _neg("12345678000195_id", "CNPJ"),
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  BR_PHONE — \b(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}-?\d{4}\b
#  \b prevents capturing '+' prefix.  Area code parens partially
#  captured (')' yes, '(' only if preceded by word char).
# ════════════════════════════════════════════════════════════════════════

BR_PHONE_DF = _df(
    [
        # ── Landline (8 digits, no area code) ────────────────────────
        _pos("3456-7890", "BR_PHONE", "3456-7890"),
        _pos("34567890", "BR_PHONE", "34567890"),
        # ── Mobile (9 prefix + 8 digits) ─────────────────────────────
        _pos("98765-4321", "BR_PHONE", "98765-4321"),
        _pos("987654321", "BR_PHONE", "987654321"),
        _pos("91234-5678", "BR_PHONE", "91234-5678"),
        _pos("912345678", "BR_PHONE", "912345678"),
        # ── With area code (no parens) ───────────────────────────────
        _pos("11 98765-4321", "BR_PHONE", "11 98765-4321"),
        _pos("21 91234-5678", "BR_PHONE", "21 91234-5678"),
        _pos("1198765-4321", "BR_PHONE", "1198765-4321"),
        _pos("2191234-5678", "BR_PHONE", "2191234-5678"),
        _pos("11 3456-7890", "BR_PHONE", "11 3456-7890"),
        _pos("1134567890", "BR_PHONE", "1134567890"),
        # ── With area code (parens) — '(' not captured ───────────────
        _pos("(11) 98765-4321", "BR_PHONE", "11) 98765-4321"),
        _pos("(21) 91234-5678", "BR_PHONE", "21) 91234-5678"),
        _pos("(11)98765-4321", "BR_PHONE", "11)98765-4321"),
        _pos("(11) 3456-7890", "BR_PHONE", "11) 3456-7890"),
        _pos("(21)34567890", "BR_PHONE", "21)34567890"),
        # ── With +55 prefix — only captured from first digit ─────────
        _pos("+55 (11) 98765-4321", "BR_PHONE", "11) 98765-4321"),
        _pos("+55 11 91234-5678", "BR_PHONE", "11 91234-5678"),
        _pos("+55 (21) 3456-7890", "BR_PHONE", "21) 3456-7890"),
        # ── No dash ──────────────────────────────────────────────────
        _pos("11 987654321", "BR_PHONE", "11 987654321"),
        _pos("(11) 987654321", "BR_PHONE", "11) 987654321"),
        # ── Edge area codes ──────────────────────────────────────────
        _pos("00 91234-5678", "BR_PHONE", "00 91234-5678"),
        _pos("99 91234-5678", "BR_PHONE", "99 91234-5678"),
        # ── Boundary tests ───────────────────────────────────────────
        _pos("Ligar para 98765-4321 agora", "BR_PHONE", "98765-4321"),
        _pos("Tel: (11) 3456-7890.", "BR_PHONE", "11) 3456-7890"),
        _pos("fone:(11)98765-4321,ok", "BR_PHONE", "11)98765-4321"),
        _pos("[91234-5678]", "BR_PHONE", "91234-5678"),
        _pos("(987654321)", "BR_PHONE", "987654321"),
        _pos("#34567890#", "BR_PHONE", "34567890"),
        # ── Negatives ────────────────────────────────────────────────
        # 7 digits (too short for \d{4}\d{4})
        _neg("3456789", "BR_PHONE"),
        # letter in digits
        _neg("9876A-4321", "BR_PHONE"),
        # double dash
        _neg("9876--4321", "BR_PHONE"),
        # trailing digit (boundary fail)
        _neg("345678901", "BR_PHONE"),
        # underscore after (word boundary fail)
        _neg("34567890_ext", "BR_PHONE"),
        # all letters
        _neg("abcd-efgh", "BR_PHONE"),
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  PIS_PASEP — \b\d{3}\.?\d{5}\.?\d{2}-?\d\b
#  Format: XXX.XXXXX.XX-X  (11 digits)
# ════════════════════════════════════════════════════════════════════════

PIS_PASEP_DF = _df(
    [
        # ── Separator combos (s1=\.?, s2=\.?, s3=-?) ─────────────────
        # s1=. s2=. s3=-  (standard)
        _pos("123.45678.90-1", "PIS_PASEP", "123.45678.90-1"),
        # s1=. s2=. s3=none
        _pos("123.45678.901", "PIS_PASEP", "123.45678.901"),
        # s1=. s2=none s3=-
        _pos("123.4567890-1", "PIS_PASEP", "123.4567890-1"),
        # s1=. s2=none s3=none
        _pos("123.45678901", "PIS_PASEP", "123.45678901"),
        # s1=none s2=. s3=-
        _pos("12345678.90-1", "PIS_PASEP", "12345678.90-1"),
        # s1=none s2=. s3=none
        _pos("12345678.901", "PIS_PASEP", "12345678.901"),
        # s1=none s2=none s3=-
        _pos("1234567890-1", "PIS_PASEP", "1234567890-1"),
        # s1=none s2=none s3=none  (unformatted)
        _pos("12345678901", "PIS_PASEP", "12345678901"),
        # ── Edge values ──────────────────────────────────────────────
        _pos("000.00000.00-0", "PIS_PASEP", "000.00000.00-0"),
        _pos("999.99999.99-9", "PIS_PASEP", "999.99999.99-9"),
        _pos("00000000000", "PIS_PASEP", "00000000000"),
        _pos("99999999999", "PIS_PASEP", "99999999999"),
        # ── Boundary tests ───────────────────────────────────────────
        _pos("PIS: 123.45678.90-1 ok", "PIS_PASEP", "123.45678.90-1"),
        _pos("NIT=12345678901;", "PIS_PASEP", "12345678901"),
        _pos("(123.45678.90-1)", "PIS_PASEP", "123.45678.90-1"),
        _pos("[12345678901]", "PIS_PASEP", "12345678901"),
        _pos("#123.45678.90-1#", "PIS_PASEP", "123.45678.90-1"),
        # ── Negatives ────────────────────────────────────────────────
        # 10 digits (too short)
        _neg("1234567890", "PIS_PASEP"),
        # 12 digits (boundary prevents 11-digit match)
        _neg("123456789012", "PIS_PASEP"),
        # letter in middle
        _neg("123.4567A.90-1", "PIS_PASEP"),
        # double dot
        _neg("123..45678.90-1", "PIS_PASEP"),
        # dash instead of dot for first sep
        _neg("123-45678.90-1", "PIS_PASEP"),
        # space separator
        _neg("123 45678 90 1", "PIS_PASEP"),
        # trailing letter
        _neg("12345678901a", "PIS_PASEP"),
        # trailing digit
        _neg("123456789012", "PIS_PASEP"),
        # leading digit
        _neg("012345678901", "PIS_PASEP"),
        # underscore after
        _neg("12345678901_", "PIS_PASEP"),
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  RG — \b\d{2}\.?\d{3}\.?\d{3}-?[\dXx]\b
#  Format: XX.XXX.XXX-D  (9 chars, last may be X/x)
#  NOTE: Extension requires exactly \d{2}, not \d{1,2} like develop.
# ════════════════════════════════════════════════════════════════════════

RG_DF = _df(
    [
        # ── Separator combos (s1=\.?, s2=\.?, s3=-?) ─────────────────
        # s1=. s2=. s3=-  (standard)
        _pos("12.345.678-9", "RG", "12.345.678-9"),
        # s1=. s2=. s3=none
        _pos("12.345.6789", "RG", "12.345.6789"),
        # s1=. s2=none s3=-
        _pos("12.345678-9", "RG", "12.345678-9"),
        # s1=. s2=none s3=none
        _pos("12.3456789", "RG", "12.3456789"),
        # s1=none s2=. s3=-
        _pos("12345.678-9", "RG", "12345.678-9"),
        # s1=none s2=. s3=none
        _pos("12345.6789", "RG", "12345.6789"),
        # s1=none s2=none s3=-
        _pos("12345678-9", "RG", "12345678-9"),
        # s1=none s2=none s3=none  (unformatted)
        _pos("123456789", "RG", "123456789"),
        # ── Check digit X / x variants ───────────────────────────────
        _pos("12.345.678-X", "RG", "12.345.678-X"),
        _pos("12.345.678-x", "RG", "12.345.678-x"),
        _pos("12345678X", "RG", "12345678X"),
        _pos("12345678x", "RG", "12345678x"),
        _pos("12.345.6780", "RG", "12.345.6780"),
        # ── Edge values ──────────────────────────────────────────────
        _pos("00.000.000-0", "RG", "00.000.000-0"),
        _pos("99.999.999-9", "RG", "99.999.999-9"),
        _pos("000000000", "RG", "000000000"),
        _pos("999999999", "RG", "999999999"),
        _pos("00.000.000-X", "RG", "00.000.000-X"),
        _pos("99.999.999-x", "RG", "99.999.999-x"),
        # ── Boundary tests ───────────────────────────────────────────
        _pos("RG: 12.345.678-9 ok", "RG", "12.345.678-9"),
        _pos("rg=123456789;", "RG", "123456789"),
        _pos("(12.345.678-X)", "RG", "12.345.678-X"),
        _pos("[12345678x]", "RG", "12345678x"),
        _pos("#12.345.678-9#", "RG", "12.345.678-9"),
        _pos("doc 123456789 consta", "RG", "123456789"),
        # ── Negatives ────────────────────────────────────────────────
        # 1-digit prefix (extension requires \d{2})
        _neg("1.234.567-8", "RG"),
        # 10 digits continuous (boundary prevents 9-match)
        _neg("1234567890", "RG"),
        # letter in the middle
        _neg("12.34A.678-9", "RG"),
        # double dot
        _neg("12..345.678-9", "RG"),
        # space separator
        _neg("12 345 678 9", "RG"),
        # slash separator
        _neg("12/345/678-9", "RG"),
        # trailing letter (Y not in [\dXx])
        _neg("12.345.678-Y", "RG"),
        # too short (7 digits + check)
        _neg("1.234.567-8", "RG"),
        # trailing digit boundary fail
        _neg("12345678901", "RG"),
        # underscore after
        _neg("123456789_doc", "RG"),
        # check digit Z (invalid)
        _neg("12.345.678-Z", "RG"),
        # 3-digit prefix (too many initial digits before separators)
        _neg("123.456.789-0", "RG"),
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  TITULO_ELEITOR — \b\d{4}\s?\d{4}\s?\d{4}\b
#  Only space separators allowed (not dots, dashes, etc.)
# ════════════════════════════════════════════════════════════════════════

TITULO_ELEITOR_DF = _df(
    [
        # ── Separator combos ─────────────────────────────────────────
        # space-space (standard display)
        _pos("1234 5678 9012", "TITULO_ELEITOR", "1234 5678 9012"),
        # no separators (unformatted)
        _pos("123456789012", "TITULO_ELEITOR", "123456789012"),
        # space-none
        _pos("1234 56789012", "TITULO_ELEITOR", "1234 56789012"),
        # none-space
        _pos("12345678 9012", "TITULO_ELEITOR", "12345678 9012"),
        # ── Edge values ──────────────────────────────────────────────
        _pos("0000 0000 0000", "TITULO_ELEITOR", "0000 0000 0000"),
        _pos("9999 9999 9999", "TITULO_ELEITOR", "9999 9999 9999"),
        _pos("000000000000", "TITULO_ELEITOR", "000000000000"),
        _pos("999999999999", "TITULO_ELEITOR", "999999999999"),
        # ── Boundary tests ───────────────────────────────────────────
        _pos("Titulo: 1234 5678 9012 ok", "TITULO_ELEITOR", "1234 5678 9012"),
        _pos("num=123456789012;", "TITULO_ELEITOR", "123456789012"),
        _pos("(1234 5678 9012)", "TITULO_ELEITOR", "1234 5678 9012"),
        _pos("[123456789012]", "TITULO_ELEITOR", "123456789012"),
        _pos("#1234 5678 9012#", "TITULO_ELEITOR", "1234 5678 9012"),
        _pos("titulo: 1234 5678 9012.", "TITULO_ELEITOR", "1234 5678 9012"),
        # ── Negatives ────────────────────────────────────────────────
        # 11 digits (too short)
        _neg("12345678901", "TITULO_ELEITOR"),
        # 13 digits continuous (boundary fail)
        _neg("1234567890123", "TITULO_ELEITOR"),
        # dot separator (not \s)
        _neg("1234.5678.9012", "TITULO_ELEITOR"),
        # dash separator (not \s)
        _neg("1234-5678-9012", "TITULO_ELEITOR"),
        # double space (only \s? = 0 or 1 whitespace)
        _neg("1234  5678  9012", "TITULO_ELEITOR"),
        # letter in middle
        _neg("1234 567A 9012", "TITULO_ELEITOR"),
        # trailing digit boundary fail
        _neg("12345678901234", "TITULO_ELEITOR"),
        # underscore after
        _neg("123456789012_id", "TITULO_ELEITOR"),
        # slash separator
        _neg("1234/5678/9012", "TITULO_ELEITOR"),
        # too short with spaces (3+4+4)
        _neg("123 5678 9012", "TITULO_ELEITOR"),
        # tab separator (\s includes \t)
        _pos("1234\t5678\t9012", "TITULO_ELEITOR", "1234\t5678\t9012"),
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  US SSN — \b\d{3}-\d{2}-\d{4}\b
#  MUST have dashes; no optional separators.
# ════════════════════════════════════════════════════════════════════════

US_SSN_DF = _df(
    [
        # ── Standard ─────────────────────────────────────────────────
        _pos("123-45-6789", "SSN", "123-45-6789"),
        _pos("000-00-0000", "SSN", "000-00-0000"),
        _pos("999-99-9999", "SSN", "999-99-9999"),
        _pos("001-01-0001", "SSN", "001-01-0001"),
        _pos("987-65-4321", "SSN", "987-65-4321"),
        _pos("100-00-0000", "SSN", "100-00-0000"),
        _pos("200-30-4000", "SSN", "200-30-4000"),
        _pos("555-55-5555", "SSN", "555-55-5555"),
        # ── Boundary tests ───────────────────────────────────────────
        _pos("SSN: 123-45-6789 on file", "SSN", "123-45-6789"),
        _pos("ssn=123-45-6789;", "SSN", "123-45-6789"),
        _pos("(123-45-6789)", "SSN", "123-45-6789"),
        _pos("[123-45-6789]", "SSN", "123-45-6789"),
        _pos("#123-45-6789#", "SSN", "123-45-6789"),
        _pos("SSN: 123-45-6789.", "SSN", "123-45-6789"),
        _pos("the number 123-45-6789 is valid", "SSN", "123-45-6789"),
        _pos("col:123-45-6789,row:2", "SSN", "123-45-6789"),
        _pos('"123-45-6789"', "SSN", "123-45-6789"),
        # ── Negatives ────────────────────────────────────────────────
        # no dashes
        _neg("123456789", "SSN"),
        # dots instead of dashes
        _neg("123.45.6789", "SSN"),
        # spaces instead of dashes
        _neg("123 45 6789", "SSN"),
        # wrong grouping (2-3-4)
        _neg("12-345-6789", "SSN"),
        # wrong grouping (3-3-3)
        _neg("123-456-789", "SSN"),
        # wrong grouping (4-2-3)
        _neg("1234-56-789", "SSN"),
        # too few digits in last group
        _neg("123-45-678", "SSN"),
        # too many digits in first group
        _neg("1234-56-7890", "SSN"),
        # trailing digit
        _neg("123-45-67890", "SSN"),
        # leading digit
        _neg("0123-45-6789", "SSN"),
        # letter in digits
        _neg("12A-45-6789", "SSN"),
        # slash separator
        _neg("123/45/6789", "SSN"),
        # underscores
        _neg("123_45_6789", "SSN"),
        # trailing underscore
        _neg("123-45-6789_", "SSN"),
        # trailing letter
        _neg("123-45-6789a", "SSN"),
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  US PHONE — \b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b
#  No area-code 2-9 restriction (unlike develop).
#  \b prevents capturing '+' prefix.
# ════════════════════════════════════════════════════════════════════════

US_PHONE_DF = _df(
    [
        # ── Basic formats (no country code) ──────────────────────────
        _pos("555-123-4567", "PHONE", "555-123-4567"),
        _pos("555.123.4567", "PHONE", "555.123.4567"),
        _pos("555 123 4567", "PHONE", "555 123 4567"),
        _pos("5551234567", "PHONE", "5551234567"),
        # ── With parens ──────────────────────────────────────────────
        # '(' not captured when preceded by non-word char
        _pos("(555) 123-4567", "PHONE", "555) 123-4567"),
        _pos("(555)123-4567", "PHONE", "555)123-4567"),
        _pos("(555) 123 4567", "PHONE", "555) 123 4567"),
        _pos("(555)1234567", "PHONE", "555)1234567"),
        _pos("(555).123.4567", "PHONE", "555).123.4567"),
        # ── With country code (no +) — '1' is captured ──────────────
        _pos("1-555-123-4567", "PHONE", "1-555-123-4567"),
        _pos("1.555.123.4567", "PHONE", "1.555.123.4567"),
        _pos("1 555 123 4567", "PHONE", "1 555 123 4567"),
        _pos("15551234567", "PHONE", "15551234567"),
        # ── With country code (+1) — '+' not captured ────────────────
        _pos("+1-555-123-4567", "PHONE", "1-555-123-4567"),
        _pos("+1.555.123.4567", "PHONE", "1.555.123.4567"),
        _pos("+1 555 123 4567", "PHONE", "1 555 123 4567"),
        _pos("+1 (555) 123-4567", "PHONE", "1 (555) 123-4567"),
        _pos("+15551234567", "PHONE", "15551234567"),
        # ── Area codes starting with 0 or 1 (allowed on extension) ──
        _pos("012-345-6789", "PHONE", "012-345-6789"),
        _pos("(012) 345-6789", "PHONE", "012) 345-6789"),
        _pos("(100) 200-3000", "PHONE", "100) 200-3000"),
        _pos("000-000-0000", "PHONE", "000-000-0000"),
        _pos("199-199-0000", "PHONE", "199-199-0000"),
        # ── Mixed separators ─────────────────────────────────────────
        _pos("555.123-4567", "PHONE", "555.123-4567"),
        _pos("555-123.4567", "PHONE", "555-123.4567"),
        _pos("555 123-4567", "PHONE", "555 123-4567"),
        _pos("555-123 4567", "PHONE", "555-123 4567"),
        _pos("555.123 4567", "PHONE", "555.123 4567"),
        _pos("555 123.4567", "PHONE", "555 123.4567"),
        # ── Edge values ──────────────────────────────────────────────
        _pos("000-000-0000", "PHONE", "000-000-0000"),
        _pos("999-999-9999", "PHONE", "999-999-9999"),
        # ── Boundary tests ───────────────────────────────────────────
        _pos("Call 555-123-4567 now", "PHONE", "555-123-4567"),
        _pos("ph:555.123.4567;", "PHONE", "555.123.4567"),
        _pos("[555-123-4567]", "PHONE", "555-123-4567"),
        _pos("#5551234567#", "PHONE", "5551234567"),
        _pos("Tel: (555) 123-4567.", "PHONE", "555) 123-4567"),
        _pos('"555-123-4567"', "PHONE", "555-123-4567"),
        _pos("dial 1-800-555-1234 for info", "PHONE", "1-800-555-1234"),
        _pos("number:5551234567,ext", "PHONE", "5551234567"),
        # ── 1 (country) + paren area ─────────────────────────────────
        _pos("1 (555) 123-4567", "PHONE", "1 (555) 123-4567"),
        _pos("1-(555)-123-4567", "PHONE", "1-(555)-123-4567"),
        _pos("1.(555).123.4567", "PHONE", "1.(555).123.4567"),
        # ── Negatives ────────────────────────────────────────────────
        # 9 digits (too short)
        _neg("55-123-4567", "PHONE"),
        # 7 digits (local number)
        _neg("123-4567", "PHONE"),
        # letter in digits
        _neg("55A-123-4567", "PHONE"),
        # double separator
        _neg("555--123-4567", "PHONE"),
        # trailing digit (boundary fail for 10-digit match)
        _neg("55512345670", "PHONE"),
        # leading digit forming 11+ digits
        _neg("25551234567", "PHONE"),
        # underscore after
        _neg("5551234567_ext", "PHONE"),
        # all letters
        _neg("abc-def-ghij", "PHONE"),
        # only 2 digits in each group
        _neg("55-12-3456", "PHONE"),
        # slash separator
        _neg("555/123/4567", "PHONE"),
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  MULTI-TYPE DETECTION
#  Texts containing multiple recognisable patterns.
# ════════════════════════════════════════════════════════════════════════

BRAZIL_US_MULTI_DF = pd.DataFrame(
    [
        {
            "input_text": "CPF 529.982.247-25 e SSN 123-45-6789",
            "expected_types": {"CPF", "SSN"},
        },
        {
            "input_text": "CNPJ 12.345.678/0001-95, phone 555-123-4567",
            "expected_types": {"CNPJ", "PHONE"},
        },
        {
            "input_text": "RG 12.345.678-9 PIS 123.45678.90-1",
            "expected_types": {"RG", "PIS_PASEP"},
        },
        {
            "input_text": "Titulo 1234 5678 9012 e CPF 529.982.247-25",
            "expected_types": {"TITULO_ELEITOR", "CPF"},
        },
        {
            "input_text": "SSN 123-45-6789 BR phone (11) 98765-4321",
            "expected_types": {"SSN", "BR_PHONE"},
        },
        {
            "input_text": (
                "CPF 529.982.247-25, CNPJ 12.345.678/0001-95, "
                "RG 12.345.678-9, PIS 123.45678.90-1"
            ),
            "expected_types": {"CPF", "CNPJ", "RG", "PIS_PASEP"},
        },
        {
            "input_text": (
                "SSN 123-45-6789 and phone 555-123-4567 "
                "with BR phone (21) 91234-5678"
            ),
            "expected_types": {"SSN", "PHONE", "BR_PHONE"},
        },
        {
            "input_text": "titulo: 1234 5678 9012 rg: 12.345.678-X",
            "expected_types": {"TITULO_ELEITOR", "RG"},
        },
        {
            "input_text": (
                "CPF 529.982.247-25, SSN 987-65-4321, "
                "CNPJ 12.345.678/0001-95, phone 1-800-555-1234"
            ),
            "expected_types": {"CPF", "SSN", "CNPJ", "PHONE"},
        },
        {
            "input_text": "PIS 123.45678.90-1 titulo 1234 5678 9012 RG 99.999.999-x",
            "expected_types": {"PIS_PASEP", "TITULO_ELEITOR", "RG"},
        },
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  CROSS-MATCH AWARENESS
#  11-digit unformatted CPF also matches BR_PHONE (valid substring).
#  We verify the *intended* type is detected alongside the cross-match.
# ════════════════════════════════════════════════════════════════════════

CROSS_MATCH_DF = pd.DataFrame(
    [
        {
            "input_text": "52998224725",
            "primary_type": "CPF",
            "also_matches": {"BR_PHONE"},
        },
        {
            "input_text": "91234567890",
            "primary_type": "CPF",
            "also_matches": {"PIS_PASEP"},
        },
        {
            "input_text": "12345678901",
            "primary_type": "CPF",
            "also_matches": {"PIS_PASEP"},
        },
    ],
)


# ════════════════════════════════════════════════════════════════════════
#  MASK-GENERATION EDGE CASES
# ════════════════════════════════════════════════════════════════════════

_EXTRA_MASK_CASES = [
    pytest.param(
        Detection("CPF", "CPF", "[CPF]", "529.982.247-25", 0, 14),
        "[CPF]",
        id="mask-CPF-formatted",
    ),
    pytest.param(
        Detection("CPF", "CPF", "[CPF]", "52998224725", 0, 11),
        "[CPF]",
        id="mask-CPF-unformatted",
    ),
    pytest.param(
        Detection("SSN", "SSN", "[SSN]", "123-45-6789", 0, 11),
        "[SSN]",
        id="mask-SSN",
    ),
    pytest.param(
        Detection("BR_PHONE", "BR Phone", "[BR_PHONE]", "11) 98765-4321", 0, 14),
        "[BR_PHONE]",
        id="mask-BR_PHONE-area",
    ),
    pytest.param(
        Detection("PHONE", "Phone", "[PHONE]", "555-123-4567", 0, 12),
        "[PHONE]",
        id="mask-US-PHONE",
    ),
]


# ════════════════════════════════════════════════════════════════════════
#  PARAMETRIC TEST FUNCTIONS
# ════════════════════════════════════════════════════════════════════════


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(CPF_DF)),
)
def test_cpf(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(CNPJ_DF)),
)
def test_cnpj(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(BR_PHONE_DF)),
)
def test_br_phone(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(PIS_PASEP_DF)),
)
def test_pis_pasep(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(RG_DF)),
)
def test_rg(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(TITULO_ELEITOR_DF)),
)
def test_titulo(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(US_SSN_DF)),
)
def test_us_ssn(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(US_PHONE_DF)),
)
def test_us_phone(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


# ── Multi-type tests ─────────────────────────────────────────────────


@pytest.mark.parametrize(
    "text, expected_types",
    [
        pytest.param(row["input_text"], row["expected_types"], id=f"multi-{i}")
        for i, row in BRAZIL_US_MULTI_DF.iterrows()
    ],
)
def test_multi_type(text: str, expected_types: set[str]):
    results = detect_sensitive_data(text)
    found = {d.type for d in results}
    missing = expected_types - found
    assert not missing, f"Missing types {missing} in detections: {found}"


# ── Cross-match awareness ────────────────────────────────────────────


@pytest.mark.parametrize(
    "text, primary_type, also_matches",
    [
        pytest.param(
            row["input_text"],
            row["primary_type"],
            row["also_matches"],
            id=f"cross-{i}-{row['primary_type']}",
        )
        for i, row in CROSS_MATCH_DF.iterrows()
    ],
)
def test_cross_match(text: str, primary_type: str, also_matches: set[str]):
    """11-digit unformatted values may match multiple types."""
    results = detect_sensitive_data(text)
    found = {d.type for d in results}
    assert primary_type in found, (
        f"Primary type {primary_type} not found in {found}"
    )
    for extra in also_matches:
        assert extra in found, (
            f"Expected cross-match {extra} not found in {found}"
        )


# ── Mask generation edge cases ───────────────────────────────────────


@pytest.mark.parametrize("det, base_mask", _EXTRA_MASK_CASES)
def test_mask_generation(det: Detection, base_mask: str):
    masks = generate_masks(det)
    assert base_mask in masks, f"Expected {base_mask!r} in masks: {masks}"
    assert len(masks) >= 1
