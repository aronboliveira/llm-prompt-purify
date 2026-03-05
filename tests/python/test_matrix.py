"""
DataFrame-driven detection-matrix tests.

Each country / category gets a pandas DataFrame whose rows are test vectors:

    input_text | expected_type | should_match | expected_value (optional)

``pytest`` parametrises over every row, so each cell becomes its own
clearly-named test.  Run with:

    source .venv/bin/activate
    pytest tests/python/ -v --tb=short

Or generate a rich HTML report:

    pytest tests/python/ -v --tb=short --html=tests/python/report.html
"""

from __future__ import annotations

import pandas as pd
import pytest

from .detection import Detection, detect_sensitive_data, generate_masks

# ════════════════════════════════════════════════════════════════════════
#  FIXTURE BUILDER
# ════════════════════════════════════════════════════════════════════════

_COLS = ["input_text", "expected_type", "should_match", "expected_value"]


def _df(rows: list[list]) -> pd.DataFrame:
    """Build a case DataFrame from raw rows."""
    return pd.DataFrame(rows, columns=_COLS)


def _positive(text: str, typ: str, value: str | None = None) -> list:
    return [text, typ, True, value]


def _negative(text: str, typ: str) -> list:
    return [text, typ, False, None]


# ════════════════════════════════════════════════════════════════════════
#  BRAZIL FIXTURES
# ════════════════════════════════════════════════════════════════════════

BRAZIL_DF = _df(
    [
        # CPF
        _positive("CPF: 529.982.247-25", "CPF", "529.982.247-25"),
        _positive("CPF: 52998224725", "CPF", "52998224725"),
        _positive(
            "O responsável com CPF 347.066.120-04 solicitou revisão.",
            "CPF",
            "347.066.120-04",
        ),
        _negative("CPF: 123.456.78", "CPF"),
        # CNPJ
        _positive("CNPJ: 11.222.333/0001-81", "CNPJ", "11.222.333/0001-81"),
        _positive("CNPJ: 11222333000181", "CNPJ", "11222333000181"),
        _negative("CNPJ: 1122233300018", "CNPJ"),  # 13 digits
        # BR Phone
        _positive("+55 (11) 99876-5432", "BR_PHONE"),
        _positive("Ligar para (11) 98765-4321", "BR_PHONE"),
        _positive("Contato: 11987654321", "BR_PHONE"),
        # PIS/PASEP
        _positive("PIS: 123.45678.90-0", "PIS_PASEP", "123.45678.90-0"),
        _positive("PASEP: 12345678900", "PIS_PASEP"),
        # RG
        _positive("RG: 12.345.678-9", "RG", "12.345.678-9"),
        _positive("RG: 12.345.678-X", "RG", "12.345.678-X"),
        _positive("Identidade: 123456789", "RG"),
        # Titulo de Eleitor
        _positive("Titulo: 0123 4567 8901", "TITULO_ELEITOR"),
        _positive("Titulo: 012345678901", "TITULO_ELEITOR"),
    ]
)

# ════════════════════════════════════════════════════════════════════════
#  LATIN AMERICA FIXTURES
# ════════════════════════════════════════════════════════════════════════

LATAM_DF = _df(
    [
        # CUIT (Argentina)
        _positive("CUIT: 20-12345678-6", "CUIT", "20-12345678-6"),
        _positive("CUIT: 20123456786", "CUIT"),
        _positive("CUIT: 27-12345678-1", "CUIT"),
        _positive("CUIT: 30-12345678-4", "CUIT"),
        _negative("CUIT: 99-12345678-1", "CUIT"),  # bad prefix
        # RUT (Chile)
        _positive("RUT: 12.345.678-5", "RUT_CL"),
        _positive("RUT: 7.654.321-K", "RUT_CL"),
        _positive("RUT: 123456785", "RUT_CL"),
        # NIT (Colombia)
        _positive("NIT: 860012503-5", "NIT_CO"),
        _positive("NIT: 9001234568", "NIT_CO"),
        # RUC (Peru)
        _positive("RUC: 20123456786", "RUC_PE"),
        _positive("RUC: 10234567891", "RUC_PE"),
        _negative("RUC: 99123456786", "RUC_PE"),  # bad prefix
        # CURP (Mexico)
        _positive("CURP: GARC850101HDFRRL09", "CURP_MX"),
        _negative("CURP: GAR850101HDFRRL09", "CURP_MX"),  # 3 letters
    ]
)

# ════════════════════════════════════════════════════════════════════════
#  EUROPE FIXTURES
# ════════════════════════════════════════════════════════════════════════

EUROPE_DF = _df(
    [
        # DNI (Spain)
        _positive("DNI: 12345678Z", "DNI", "12345678Z"),
        _positive("DNI: 00000000T", "DNI"),
        _negative("DNI: 1234567Z", "DNI"),
        # NIE (Spain)
        _positive("NIE: X1234567L", "NIE", "X1234567L"),
        _positive("NIE: Y1234567X", "NIE"),
        _positive("NIE: Z1234567R", "NIE"),
        _negative("NIE: A1234567L", "NIE"),
        # NIF (Portugal)
        _positive("NIF: 245716840", "PT_NIF", "245716840"),
        _positive("NIF: 123456789", "PT_NIF"),
        _negative("NIF: 24571684", "PT_NIF"),  # 8 digits
        _negative("NIF: 412345678", "PT_NIF"),  # starts with 4
        # NISS (Portugal)
        _positive("NISS: 11234567890", "PT_NISS"),
        # IBAN
        _positive("IBAN: DE89370400440532013000", "IBAN"),
        _positive("IBAN: GB29NWBK60161331926819", "IBAN"),
    ]
)

# ════════════════════════════════════════════════════════════════════════
#  ASIA & RUSSIA FIXTURES
# ════════════════════════════════════════════════════════════════════════

ASIA_RUSSIA_DF = _df(
    [
        # CN Resident ID
        _positive("ID: 440306198305121333", "CN_RESIDENT_ID"),
        _positive("ID: 11010519491231002X", "CN_RESIDENT_ID"),
        _negative("Code: 44030619830512133", "CN_RESIDENT_ID"),  # 17 digits
        # CN Phone
        _positive("Call +86 13712345678", "CN_PHONE"),
        _positive("Contact: 13912345678", "CN_PHONE"),
        _positive("+86-137-1234-5678", "CN_PHONE"),
        _positive("WeChat: 15098765432", "CN_PHONE"),
        _negative("Dial 10086 for service.", "CN_PHONE"),
        # RU INN
        _positive("INN: 7728495344", "RU_INN", "7728495344"),
        _positive("INN: 500123456750", "RU_INN", "500123456750"),
        # RU SNILS
        _positive("SNILS: 112-233-445 95", "RU_SNILS"),
        _positive("SNILS: 123-456-789 64", "RU_SNILS"),
        # IN Aadhaar
        _positive("Aadhaar: 276592857148", "IN_AADHAAR"),
        _positive("Aadhaar: 9876 5432 1012", "IN_AADHAAR"),
        _negative("ID: 0123 4567 8901", "IN_AADHAAR"),  # starts with 0
        # IN PAN
        _positive("PAN: ABCPD1234E", "IN_PAN", "ABCPD1234E"),
        _positive("PAN: ZZXPS9999Z", "IN_PAN"),
        _negative("PAN: ABC12345Z", "IN_PAN"),
        # IN GSTIN
        _positive("GSTIN: 33AABCU9603R1ZM", "IN_GSTIN"),
        _positive("GST: 27ABCDE1234F1ZG", "IN_GSTIN"),
        _negative("GST: 27ABCDE1234FAAG", "IN_GSTIN"),  # no Z marker
    ]
)

# ════════════════════════════════════════════════════════════════════════
#  GLOBAL / CREDENTIALS FIXTURES
# ════════════════════════════════════════════════════════════════════════

GLOBAL_DF = _df(
    [
        # Email
        _positive("Send to joao@empresa.com.br", "EMAIL", "joao@empresa.com.br"),
        _negative("not-an-email@@double.com", "EMAIL"),
        # Phone
        _positive("Call 555-123-4567", "PHONE", "555-123-4567"),
        # SSN
        _positive("SSN: 123-45-6789", "SSN", "123-45-6789"),
        _negative("SSN: 12-345-6789", "SSN"),
        # Credit Card
        _positive("Card: 4111111111111111", "CREDIT_CARD"),
        _positive("Card: 5500000000000004", "CREDIT_CARD"),
        # JWT
        _positive(
            "Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
            ".eyJzdWIiOiIxMjM0NTY3ODkwIn0"
            ".dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
            "JWT",
        ),
        # Bearer
        _positive("Authorization: Bearer SFMyNTY.g2gDYQ.dGVzdA==", "BEARER_TOKEN"),
        _positive("Authorization: Bearer abc123-token_value", "BEARER_TOKEN"),
    ]
)

# ════════════════════════════════════════════════════════════════════════
#  MULTI-TYPE FIXTURES
# ════════════════════════════════════════════════════════════════════════

MULTI_DF = pd.DataFrame(
    [
        {
            "input_text": "CPF: 529.982.247-25 — Email: joao@empresa.com.br",
            "expected_types": {"CPF", "EMAIL"},
        },
        {
            "input_text": (
                "Employee SSN: 123-45-6789, contact: a@b.com, phone: 555-123-4567"
            ),
            "expected_types": {"SSN", "EMAIL", "PHONE"},
        },
        {
            "input_text": "DNI: 12345678Z, NIE: X1234567L, correo: empleado@corp.es",
            "expected_types": {"DNI", "NIE", "EMAIL"},
        },
        {
            "input_text": "CUIT: 20-12345678-6 y correo info@empresa.com.ar",
            "expected_types": {"CUIT", "EMAIL"},
        },
    ]
)


# ════════════════════════════════════════════════════════════════════════
#  PARAMETRIC TEST FUNCTIONS
# ════════════════════════════════════════════════════════════════════════


def _ids_from_df(df: pd.DataFrame) -> list[str]:
    """Generate readable test IDs like 'CPF-positive-0', 'DNI-negative-1'."""
    ids: list[str] = []
    for i, row in df.iterrows():
        polarity = "pos" if row["should_match"] else "neg"
        ids.append(f"{row['expected_type']}-{polarity}-{i}")
    return ids


def _make_params(df: pd.DataFrame):
    """Yield pytest.param tuples from a DataFrame."""
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


# ── Single-type detection tests ──────────────────────────────────────


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(BRAZIL_DF)),
)
def test_brazil(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(LATAM_DF)),
)
def test_latam(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(EUROPE_DF)),
)
def test_europe(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(ASIA_RUSSIA_DF)),
)
def test_asia_russia(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_type, should_match, expected_value",
    list(_make_params(GLOBAL_DF)),
)
def test_global(
    text: str,
    expected_type: str,
    should_match: bool,
    expected_value: str | None,
):
    _assert_detection(text, expected_type, should_match, expected_value)


# ── Multi-type detection tests ───────────────────────────────────────


@pytest.mark.parametrize(
    "text, expected_types",
    [
        pytest.param(row["input_text"], row["expected_types"], id=f"multi-{i}")
        for i, row in MULTI_DF.iterrows()
    ],
)
def test_multi_type(text: str, expected_types: set[str]):
    results = detect_sensitive_data(text)
    found = {d.type for d in results}
    missing = expected_types - found
    assert not missing, f"Missing types {missing} in detections: {found}"


# ── Mask generation tests ────────────────────────────────────────────

_MASK_CASES = [
    pytest.param(
        Detection("CUIT", "CUIT", "[CUIT]", "20-12345678-6", 0, 13),
        "[CUIT]",
        True,
        id="mask-CUIT",
    ),
    pytest.param(
        Detection("BR_PHONE", "BR Phone", "[BR_PHONE]", "+55 (11) 99876-5432", 0, 19),
        "[BR_PHONE]",
        True,
        id="mask-BR_PHONE",
    ),
    pytest.param(
        Detection("CN_PHONE", "CN Phone", "[CN_PHONE]", "+86 13712345678", 0, 15),
        "[CN_PHONE]",
        True,
        id="mask-CN_PHONE",
    ),
    pytest.param(
        Detection("RU_INN", "INN", "[INN]", "7728495344", 0, 10),
        "[INN]",
        True,
        id="mask-RU_INN",
    ),
    pytest.param(
        Detection("IN_AADHAAR", "Aadhaar", "[AADHAAR]", "276592857148", 0, 12),
        "[AADHAAR]",
        True,
        id="mask-IN_AADHAAR",
    ),
]


@pytest.mark.parametrize("det, base_mask, has_partial", _MASK_CASES)
def test_generate_masks(det: Detection, base_mask: str, has_partial: bool):
    masks = generate_masks(det)
    assert base_mask in masks
    if has_partial:
        assert len(masks) > 1, "Expected at least one partial mask suggestion"


# ── INN priority test ────────────────────────────────────────────────


def test_inn_12digit_priority():
    """The \\d{12} alternative must match before \\d{10}."""
    results = detect_sensitive_data("INN: 500123456750")
    inn = [d for d in results if d.type == "RU_INN"]
    assert inn, "No RU_INN detected"
    assert inn[0].value == "500123456750", (
        f"Expected 12-digit match, got {inn[0].value!r}"
    )


# ════════════════════════════════════════════════════════════════════════
#  INTERNAL HELPERS
# ════════════════════════════════════════════════════════════════════════


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
