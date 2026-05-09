"""
DataFrame-driven parametric test suite for develop branch regex patterns.

Mirrors the TypeScript matrix test suite from
  src/app/core/masking/masking.engine.regression.spec.ts

Uses pandas DataFrames for test-case organization, with pytest.mark.parametrize
for individual test execution.

Key differences from extension branch harness:
  - Many patterns are "labeled" (require a label prefix like "DNI:", "RG:", etc.)
  - Additional develop-only patterns: CEP, CNH, RFC, Cedula, labeled-phone/name/address/passport
  - Detection uses rule IDs (e.g., "es-dni-labeled") instead of pattern type keys
  - value_group support for labeled patterns
"""

from __future__ import annotations

import pandas as pd
import pytest

from .detection import detect_sensitive_data, detect_by_rule


# ════════════════════════════════════════════════════════════════════════
#  HELPER — build a DataFrame from row tuples
# ════════════════════════════════════════════════════════════════════════

def _df(
    rows: list[tuple[str, str, bool, str | None]],
    *,
    multi: bool = False,
) -> pd.DataFrame:
    if multi:
        return pd.DataFrame(rows, columns=["input_text", "expected_types", "should_match", "expected_value"])
    return pd.DataFrame(
        rows,
        columns=["input_text", "expected_rule_id", "should_match", "expected_value"],
    )


# ════════════════════════════════════════════════════════════════════════
#  REGIONAL DataFrames
# ════════════════════════════════════════════════════════════════════════

# ── Global / Credential ──────────────────────────────────────────────
GLOBAL_DF = _df([
    ("Send to joao@empresa.com.br",           "email-address",   True,  "joao@empresa.com.br"),
    ("not-an-email@@double.com",               "email-address",   False, None),
    ("Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
        "jwt-token", True, None),
    ("Key: sk-proj-abc123def456ghi789jkl012mno345", "openai-style-key", True, None),
    ("AKIAIOSFODNN7EXAMPLE is my key",          "aws-access-key",  True,  "AKIAIOSFODNN7EXAMPLE"),
    ("aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "aws-secret-key", True, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
    ("ghp_ABCDEFghijklmnopqrstuvw", "github-pat", True, None),
    ("https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
        "slack-webhook", True, None),
    ("password = MyS3cretP@ssw0rd!",           "secret-assignment", True,  None),
    ("senha=123",                              "numeric-secret-assignment", True, "123"),
    ("密码=321",                                "numeric-secret-assignment", True, "321"),
    ("पासवर्ड=654",                            "numeric-secret-assignment", True, "654"),
    ("Authorization: Bearer SFMyNTY.g2gDYQ.dGVzdA==",
        "bearer-token", True, None),
    ("Call 555-123-4567",                       "us-phone",        True,  None),
    ("SSN: 123-45-6789",                        "us-ssn",          True,  "123-45-6789"),
    ("SSN: 12-345-6789",                        "us-ssn",          False, None),
])

# ── Financial ────────────────────────────────────────────────────────
FINANCIAL_DF = _df([
    ("Card: 4111111111111111",                  "credit-card",     True,  None),
    ("Card: 5500000000000004",                  "credit-card",     True,  None),
    ("Card: 12345",                             "credit-card",     False, None),
    ("IBAN: DE89370400440532013000",            "iban",            True,  None),
    ("IBAN: GB29NWBK60161331926819",            "iban",            True,  None),
    ("AB12",                                    "iban",            False, None),
])

# ── Brazil ───────────────────────────────────────────────────────────
BRAZIL_DF = _df([
    # CPF (standalone regex, no label required)
    ("CPF: 529.982.247-25",                     "cpf",             True,  "529.982.247-25"),
    ("CPF: 52998224725",                        "cpf",             True,  "52998224725"),
    ("O CPF 347.066.120-04 solicitou revisão",  "cpf",             True,  "347.066.120-04"),
    ("CPF: 123.456.78",                         "cpf",             False, None),
    # CNPJ
    ("CNPJ: 11.222.333/0001-81",               "cnpj",            True,  "11.222.333/0001-81"),
    ("CNPJ: 11222333000181",                    "cnpj",            True,  "11222333000181"),
    ("CNPJ: 1122233300018",                     "cnpj",            False, None),
    # BR phone
    ("+55 (11) 99876-5432",                     "br-phone",        True,  None),
    ("Ligar para (11) 98765-4321",              "br-phone",        True,  None),
    ("Contato: 11987654321",                    "br-phone",        True,  None),
    # CEP (labeled)
    ("CEP: 01310-100",                          "cep-labeled",     True,  "01310-100"),
    ("CEP: 01310100",                           "cep-labeled",     True,  "01310100"),
    ("Código postal: 12345-678",                "cep-labeled",     True,  "12345-678"),
    ("01310100",                                "cep-labeled",     False, None),
    # CNH (labeled)
    ("CNH: 12345678901",                        "cnh-labeled",     True,  "12345678901"),
    ("Carteira Nacional de Habilitação: 98765432100",
        "cnh-labeled", True, "98765432100"),
    ("12345678901",                             "cnh-labeled",     False, None),
    # PIS/PASEP (labeled)
    ("PIS: 123.45678.90-0",                     "pis-pasep-labeled", True, "123.45678.90-0"),
    ("PASEP: 12345678900",                      "pis-pasep-labeled", True, "12345678900"),
    ("12345678900",                             "pis-pasep-labeled", False, None),
    # RG (labeled)
    ("RG: 12.345.678-9",                        "rg-labeled",      True,  "12.345.678-9"),
    ("RG: 12.345.678-X",                        "rg-labeled",      True,  "12.345.678-X"),
    ("Identidade: 123456789",                   "rg-labeled",      True,  None),
    ("123456789",                               "rg-labeled",      False, None),
    # Titulo de eleitor (labeled)
    ("Titulo de eleitor: 0123 4567 8901",       "titulo-eleitor-labeled", True, None),
    ("Título de eleitor: 012345678901",         "titulo-eleitor-labeled", True, None),
    ("012345678901",                            "titulo-eleitor-labeled", False, None),
])

# ── Latin America ────────────────────────────────────────────────────
LATAM_DF = _df([
    # CUIT (Argentina — standalone regex)
    ("CUIT: 20-12345678-6",                     "cuit",            True,  "20-12345678-6"),
    # Note: prefix 99 is rejected by isValidArgentineCuit validator in TS,
    # but the bare regex matches. We test regex only here.
    ("CUIT: 99-12345678-1",                     "cuit",            True, None),
    # Chilean RUT (standalone regex)
    ("RUT: 12.345.678-5",                       "chile-rut",       True,  None),
    ("RUT: 7.654.321-K",                        "chile-rut",       True,  None),
    ("RUT: 123456785",                          "chile-rut",       True,  None),
    # CURP (Mexico)
    ("CURP: GARC850101HDFRRL09",                "curp",            True,  "GARC850101HDFRRL09"),
    ("CURP: GAR850101HDFRRL09",                 "curp",            False, None),
    # RFC (Mexico — develop only)
    ("RFC: GARC850101ABC",                      "rfc",             True,  "GARC850101ABC"),
    ("RFC: GAR850101AB",                        "rfc",             False, None),
    # NIT (Colombia — standalone regex)
    ("NIT: 860012503-5",                        "nit",             True,  None),
    ("NIT: 9001234568",                         "nit",             True,  None),
    # Cedula (labeled)
    ("Cédula: 1234567890",                      "cedula-labeled",  True,  "1234567890"),
    ("Cedula de ciudadania: 98765432",          "cedula-labeled",  True,  "98765432"),
    ("1234567890",                              "cedula-labeled",  False, None),
    # DNI (labeled LatAm — not the Spanish DNI!)
    ("DNI: 12345678",                           "dni-labeled",     True,  "12345678"),
    ("Documento de identidad: 7654321",         "dni-labeled",     True,  "7654321"),
    ("12345678",                                "dni-labeled",     False, None),
    # RUC (Peru — labeled)
    ("RUC: 20123456786",                        "ruc-labeled",     True,  "20123456786"),
    ("Número de RUC: 10234567891",              "ruc-labeled",     True,  "10234567891"),
    ("20123456786",                             "ruc-labeled",     False, None),
])

# ── Europe (Spain + Portugal) ────────────────────────────────────────
EUROPE_DF = _df([
    # Spanish DNI (labeled)
    ("DNI: 12345678Z",                          "es-dni-labeled",  True,  "12345678Z"),
    ("Documento de identidad: 00000000T",       "es-dni-labeled",  True,  "00000000T"),
    ("12345678Z",                               "es-dni-labeled",  False, None),
    # Spanish NIE (labeled)
    ("NIE: X1234567L",                          "es-nie-labeled",  True,  "X1234567L"),
    ("Número NIE: Y1234567X",                   "es-nie-labeled",  True,  "Y1234567X"),
    ("NIE: Z1234567R",                          "es-nie-labeled",  True,  "Z1234567R"),
    ("X1234567L",                               "es-nie-labeled",  False, None),
    # Portuguese NIF (labeled)
    ("NIF: 245716840",                          "pt-nif-labeled",  True,  "245716840"),
    ("Número fiscal: 123456789",                "pt-nif-labeled",  True,  "123456789"),
    ("245716840",                               "pt-nif-labeled",  False, None),
    # Portuguese NISS (labeled)
    ("NISS: 11234567890",                       "pt-niss-labeled", True,  "11234567890"),
    ("Número de segurança social: 99876543210", "pt-niss-labeled", True,  "99876543210"),
    ("11234567890",                             "pt-niss-labeled", False, None),
])

# ── Asia / Russia ────────────────────────────────────────────────────
ASIA_RUSSIA_DF = _df([
    # Chinese resident ID (labeled)
    ("Resident ID: 440306198305121333",         "cn-resident-id-labeled", True, "440306198305121333"),
    ("身份证: 11010519491231002X",               "cn-resident-id-labeled", True, "11010519491231002X"),
    ("440306198305121333",                      "cn-resident-id-labeled", False, None),
    # Chinese phone (standalone regex)
    ("Call +86 13712345678",                    "cn-phone",        True,  None),
    ("Contact: 13912345678",                    "cn-phone",        True,  None),
    ("+86-137-1234-5678",                       "cn-phone",        True,  None),
    ("WeChat: 15098765432",                     "cn-phone",        True,  None),
    ("Dial 10086 for service.",                 "cn-phone",        False, None),
    # Russian INN (labeled)
    ("INN: 7728495344",                         "ru-inn-labeled",  True,  "7728495344"),
    ("ИНН: 500123456750",                       "ru-inn-labeled",  True,  "500123456750"),
    ("7728495344",                              "ru-inn-labeled",  False, None),
    # Russian SNILS (labeled)
    ("SNILS: 112-233-445 95",                   "ru-snils-labeled", True, "112-233-445 95"),
    ("СНИЛС: 123-456-789 64",                  "ru-snils-labeled", True, "123-456-789 64"),
    ("112-233-445 95",                          "ru-snils-labeled", False, None),
    # Indian Aadhaar (labeled)
    ("Aadhaar: 276592857148",                   "in-aadhaar-labeled", True, "276592857148"),
    ("Aadhaar number: 9876 5432 1012",          "in-aadhaar-labeled", True, "9876 5432 1012"),
    ("276592857148",                            "in-aadhaar-labeled", False, None),
    # Indian PAN (labeled)
    ("PAN: ABCPD1234E",                         "in-pan-labeled",  True,  "ABCPD1234E"),
    ("PAN number: ZZXPS9999Z",                  "in-pan-labeled",  True,  "ZZXPS9999Z"),
    ("ABCPD1234E",                              "in-pan-labeled",  False, None),
    # Indian GSTIN (labeled)
    ("GSTIN: 33AABCU9603R1ZM",                  "in-gstin-labeled", True, "33AABCU9603R1ZM"),
    ("GST number: 27ABCDE1234F1ZG",             "in-gstin-labeled", True, "27ABCDE1234F1ZG"),
    ("33AABCU9603R1ZM",                         "in-gstin-labeled", False, None),
])

# ── Labeled generic patterns (develop only) ─────────────────────────
LABELED_GENERIC_DF = _df([
    # Labeled phone
    ("Phone: +55 11 98765-4321",                "labeled-phone",   True,  None),
    ("Telefone: (11) 98765-4321",               "labeled-phone",   True,  None),
    ("Telefono: +34 612 345 678",               "labeled-phone",   True,  None),
    # Labeled name
    ("Name: John Doe",                          "labeled-name",    True,  None),
    ("Nome completo: Maria da Silva",           "labeled-name",    True,  None),
    ("Nombre: Carlos García Lopez",             "labeled-name",    True,  None),
    # Labeled address
    ("Address: 1234 Main St, Springfield, IL 62701",
        "labeled-address", True, None),
    ("Endereço: Rua das Flores 42, São Paulo, SP",
        "labeled-address", True, None),
    # Labeled passport
    ("Passport: AB123456",                      "labeled-passport", True, "AB123456"),
    ("Passaporte: CD9876543",                   "labeled-passport", True, None),
    ("Pasaporte numero: EF1234567890",          "labeled-passport", True, None),
    ("AB123456",                                "labeled-passport", False, None),
])

# ── Multi-type detection ─────────────────────────────────────────────
MULTI_DF = _df(
    [
        (
            "CPF: 529.982.247-25 — Email: joao@empresa.com.br",
            {"cpf", "email-address"},
            True,
            None,
        ),
        (
            "Employee SSN: 123-45-6789, contact: a@b.com, phone 555-123-4567",
            {"us-ssn", "email-address", "us-phone"},
            True,
            None,
        ),
        (
            "DNI: 12345678Z, NIE: X1234567L, correo: empleado@corp.es",
            {"es-dni-labeled", "es-nie-labeled", "email-address"},
            True,
            None,
        ),
        (
            "CUIT: 20-12345678-6 y correo info@empresa.com.ar",
            {"cuit", "email-address"},
            True,
            None,
        ),
    ],
    multi=True,
)


# ════════════════════════════════════════════════════════════════════════
#  PARAMETER GENERATION
# ════════════════════════════════════════════════════════════════════════

def _make_params(df: pd.DataFrame):
    """Yield pytest.param tuples from a DataFrame."""
    for idx, row in df.iterrows():
        polarity = "pos" if row["should_match"] else "neg"
        rule_id = row["expected_rule_id"]
        tid = f"{rule_id}-{polarity}-{idx}"
        val = row["expected_value"]
        yield pytest.param(
            row["input_text"],
            rule_id,
            row["should_match"],
            None if pd.isna(val) else val,
            id=tid,
        )


# ════════════════════════════════════════════════════════════════════════
#  PARAMETRIC TESTS
# ════════════════════════════════════════════════════════════════════════

@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(GLOBAL_DF)),
)
def test_global(text: str, expected_rule_id: str, should_match: bool, expected_value: str | None):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(FINANCIAL_DF)),
)
def test_financial(text: str, expected_rule_id: str, should_match: bool, expected_value: str | None):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(BRAZIL_DF)),
)
def test_brazil(text: str, expected_rule_id: str, should_match: bool, expected_value: str | None):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(LATAM_DF)),
)
def test_latam(text: str, expected_rule_id: str, should_match: bool, expected_value: str | None):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(EUROPE_DF)),
)
def test_europe(text: str, expected_rule_id: str, should_match: bool, expected_value: str | None):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(ASIA_RUSSIA_DF)),
)
def test_asia_russia(text: str, expected_rule_id: str, should_match: bool, expected_value: str | None):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(LABELED_GENERIC_DF)),
)
def test_labeled_generic(text: str, expected_rule_id: str, should_match: bool, expected_value: str | None):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_types, should_match, expected_value",
    [
        pytest.param(
            row["input_text"],
            row["expected_types"],
            row["should_match"],
            None,
            id=f"multi-{idx}",
        )
        for idx, row in MULTI_DF.iterrows()
    ],
)
def test_multi_type(text: str, expected_types: set[str], should_match: bool, expected_value):
    results = detect_sensitive_data(text)
    found_ids = {d.rule_id for d in results}
    missing = expected_types - found_ids
    assert not missing, (
        f"Missing rule detections: {missing}\n"
        f"  input: {text!r}\n"
        f"  found: {found_ids}"
    )


# ── INN 12-digit priority test ──────────────────────────────────────
def test_inn_12digit_priority():
    """12-digit INN must match fully, not truncate to 10 digits."""
    results = detect_by_rule("ИНН: 500123456750", "ru-inn-labeled")
    assert results, "Expected INN detection"
    assert results[0].value == "500123456750", (
        f"Expected 12-digit match, got {results[0].value!r}"
    )


# ── Labeled pattern label-requirement test ───────────────────────────
def test_labeled_patterns_require_label():
    """Labeled patterns should NOT match bare values without labels."""
    bare_values = [
        ("01310-100", "cep-labeled"),
        ("12345678901", "cnh-labeled"),
        ("12345678900", "pis-pasep-labeled"),
        ("12.345.678-9", "rg-labeled"),
        ("012345678901", "titulo-eleitor-labeled"),
        ("1234567890", "cedula-labeled"),
        ("12345678", "dni-labeled"),
        ("20123456786", "ruc-labeled"),
        ("245716840", "pt-nif-labeled"),
        ("11234567890", "pt-niss-labeled"),
        ("12345678Z", "es-dni-labeled"),
        ("X1234567L", "es-nie-labeled"),
        ("440306198305121333", "cn-resident-id-labeled"),
        ("7728495344", "ru-inn-labeled"),
        ("112-233-445 95", "ru-snils-labeled"),
        ("276592857148", "in-aadhaar-labeled"),
        ("ABCPD1234E", "in-pan-labeled"),
        ("33AABCU9603R1ZM", "in-gstin-labeled"),
    ]
    for bare_value, rule_id in bare_values:
        results = detect_by_rule(bare_value, rule_id)
        assert not results, (
            f"Labeled rule {rule_id!r} should NOT match bare value {bare_value!r}, "
            f"but got: {[d.value for d in results]}"
        )


# ════════════════════════════════════════════════════════════════════════
#  INTERNAL HELPERS
# ════════════════════════════════════════════════════════════════════════

def _assert_detection(
    text: str,
    expected_rule_id: str,
    should_match: bool,
    expected_value: str | None,
):
    results = detect_sensitive_data(text)
    found = [d for d in results if d.rule_id == expected_rule_id]

    if should_match:
        assert found, (
            f"Expected {expected_rule_id!r} detection in:\n  {text!r}\n"
            f"  got rule IDs: {[d.rule_id for d in results]}"
        )
        if expected_value is not None:
            assert any(d.value == expected_value for d in found), (
                f"Expected value {expected_value!r}, "
                f"got {[d.value for d in found]}"
            )
    else:
        assert not found, (
            f"Did NOT expect {expected_rule_id!r} detection in:\n  {text!r}\n"
            f"  but got: {[d.value for d in found]}"
        )
