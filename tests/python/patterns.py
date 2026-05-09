"""
Python mirror of develop branch masking rules.

Mirrors  src/app/core/masking/constants/masking-rules.constants.ts
and      src/app/core/masking/constants/mask-flag-dictionaries.constants.ts

Each entry is a DetectionRuleDef that mirrors the TypeScript DetectionRule,
including support for labeled patterns via create_delimited_label_value_pattern.
"""

from __future__ import annotations

import re
from typing import TypedDict


# ════════════════════════════════════════════════════════════════════════
#  LABEL FLAG DICTIONARIES
#  (mirror of mask-flag-dictionaries.constants.ts)
# ════════════════════════════════════════════════════════════════════════

SHARED_SECRET_ASSIGNMENT_FLAGS = (
    "access token", "api key", "api secret", "apikey", "auth token",
    "authorization token", "bearer token", "client secret", "password",
    "passphrase", "private key", "refresh token", "secret", "secret key",
    "session token", "token",
)

PT_BR_SECRET_ASSIGNMENT_FLAGS = (
    "chave api", "chave da api", "chave de api", "chave de acesso",
    "chave secreta", "segredo cliente", "senha", "senha api",
    "token acesso", "token atualizacao", "token de acesso",
    "token de atualizacao",
)

PT_PT_SECRET_ASSIGNMENT_FLAGS = (
    "chave api", "chave da api", "chave de api", "chave secreta",
    "palavra passe", "palavra-passe", "segredo cliente", "token acesso",
    "token atualizacao", "token de acesso", "token de atualizacao",
    "token de renovacao",
)

ES_SECRET_ASSIGNMENT_FLAGS = (
    "clave api", "clave de api", "clave secreta", "contrasena",
    "contraseña", "llave api", "llave de api", "secreto cliente",
    "token acceso", "token actualizacion", "token de acceso",
    "token de actualizacion",
)

NUMERIC_SECRET_ASSIGNMENT_FLAGS = (
    "cert password", "contrasena", "contrasena de base de datos",
    "contrasena maestra", "contraseña", "contraseña de base de datos",
    "contraseña maestra", "database password", "db password",
    "डेटाबेस पासवर्ड", "keystore password", "mail password",
    "master password", "pass", "passphrase", "पासफ्रेज़", "पासवर्ड",
    "palavra passe", "palavra-passe", "password", "redis password",
    "senha", "senha admin", "senha api", "senha do banco de dados",
    "senha mestra", "senha mongo", "senha mysql", "senha postgres",
    "senha redis", "senha root", "senha do servidor", "senha_master",
    "senha_mestre", "smtp password", "пароль", "пароль базы данных",
    "парольная фраза", "密码", "密码短语", "数据库密码",
)

SECRET_ASSIGNMENT_FLAGS = (
    *SHARED_SECRET_ASSIGNMENT_FLAGS,
    *PT_BR_SECRET_ASSIGNMENT_FLAGS,
    *PT_PT_SECRET_ASSIGNMENT_FLAGS,
    *ES_SECRET_ASSIGNMENT_FLAGS,
)

SHARED_PHONE_LABEL_FLAGS = (
    "celular", "contact number", "mobile", "mobile number", "movil",
    "móvil", "numero celular", "numero de celular", "numero de telefone",
    "numero de telefono", "número de celular", "número de telefone",
    "número de teléfono", "phone", "phone no", "phone number",
    "telephone", "telefone", "telefone principal", "telefono",
    "telefono principal", "whatsapp", "whatsapp number",
)

SHARED_NAME_LABEL_FLAGS = (
    "complete name", "full name", "legal name", "name", "nombre",
    "nombre completo", "nombre legal", "nome", "nome completo",
    "nome legal",
)

SHARED_ADDRESS_LABEL_FLAGS = (
    "address", "direccion", "direccion postal", "dirección",
    "dirección postal", "domicilio", "endereco", "endereco completo",
    "endereço", "endereço completo", "mailing address", "morada",
    "postal address", "residential address", "street address",
)

SHARED_PASSPORT_LABEL_FLAGS = (
    "numero de pasaporte", "numero do passaporte",
    "número de pasaporte", "número do passaporte",
    "passport", "passport no", "passport number", "passport #",
    "pasaporte", "pasaporte numero", "passaporte", "passaporte numero",
)

BR_CEP_LABEL_FLAGS = ("cep", "codigo postal", "código postal")

BR_CNH_LABEL_FLAGS = (
    "cnh", "carteira nacional de habilitacao",
    "carteira nacional de habilitação",
    "registro nacional de habilitacao",
    "registro nacional de habilitação",
)

BR_PIS_PASEP_LABEL_FLAGS = (
    "nis", "numero do nis", "numero do pis", "número do nis",
    "número do pis", "pasep", "pis",
)

BR_RG_LABEL_FLAGS = (
    "carteira de identidade", "documento de identidade",
    "identidade", "registro geral", "rg",
)

BR_VOTER_LABEL_FLAGS = (
    "inscricao eleitoral", "inscrição eleitoral",
    "titulo de eleitor", "titulo eleitoral", "título de eleitor",
)

LATAM_CEDULA_LABEL_FLAGS = (
    "cedula", "cedula de ciudadania", "cedula de identidad",
    "cédula", "cédula de ciudadanía", "cédula de identidad",
    "numero de cedula", "número de cédula",
)

LATAM_DNI_LABEL_FLAGS = (
    "dni", "documento de identidad", "documento nacional de identidad",
    "numero de dni", "número de dni",
)

LATAM_RUC_LABEL_FLAGS = (
    "numero de ruc", "número de ruc",
    "registro unico contribuyentes", "registro unico de contribuyentes",
    "registro único de contribuyentes", "ruc",
)

PT_NIF_LABEL_FLAGS = (
    "nif", "numero contribuinte", "numero de contribuinte",
    "numero de identificacao fiscal", "numero fiscal",
    "número contribuinte", "número de contribuinte",
    "número de identificação fiscal", "número fiscal",
)

PT_NISS_LABEL_FLAGS = (
    "niss",
    "numero de identificacao da seguranca social",
    "numero de seguranca social",
    "numero identificacao seguranca social",
    "número de identificação da segurança social",
    "número de segurança social",
)

ES_DNI_LABEL_FLAGS = (
    "dni", "documento de identidad", "documento nacional de identidad",
    "numero de dni", "número de dni",
)

ES_NIE_LABEL_FLAGS = (
    "identidad de extranjero", "nie",
    "numero de identidad de extranjero", "numero nie",
    "número de identidad de extranjero", "número nie",
)

CN_RESIDENT_ID_LABEL_FLAGS = (
    "id card", "identity card", "national id", "resident id",
    "shen fen zheng", "shenfenzheng", "居民身份证", "身份证", "身份证号",
)

RU_INN_LABEL_FLAGS = (
    "inn", "идентификационный номер налогоплательщика", "инн",
)

RU_SNILS_LABEL_FLAGS = (
    "snils", "страховой номер",
    "страховой номер индивидуального лицевого счета",
    "страховой номер индивидуального лицевого счёта",
    "снилс",
)

IN_AADHAAR_LABEL_FLAGS = (
    "aadhaar", "aadhaar number", "aadhar", "aadhar number",
    "unique identification number",
)

IN_PAN_LABEL_FLAGS = (
    "pan", "pan number", "permanent account no",
    "permanent account number",
)

IN_GSTIN_LABEL_FLAGS = (
    "goods and services tax identification number",
    "goods and services tax number",
    "gst identification number", "gst number", "gstin",
)


# ════════════════════════════════════════════════════════════════════════
#  LABELED PATTERN FACTORY
#  (mirror of mask-pattern.utils.ts)
# ════════════════════════════════════════════════════════════════════════

_FLEXIBLE_JOINER = r"(?:[\s._-]+)"
_UNICODE_WORD = r"[\w]"  # Python's \w covers Unicode when UNICODE flag is set


def _escape_regex(value: str) -> str:
    return re.escape(value)


def _escape_flexible_label(label: str) -> str:
    words = label.strip().split()
    return _FLEXIBLE_JOINER.join(_escape_regex(w) for w in words if w)


def _build_flexible_label_alternation(labels: tuple[str, ...]) -> str:
    return "|".join(_escape_flexible_label(l) for l in labels if l.strip())


def _wrap_unicode_boundaries(pattern: str) -> str:
    return rf"(?<!{_UNICODE_WORD})(?:{pattern})(?!{_UNICODE_WORD})"


def create_delimited_label_value_pattern(
    labels: tuple[str, ...],
    value_pattern: str,
    *,
    delimiter_pattern: str = r"[:=-]",
    flags: re.RegexFlag = re.IGNORECASE | re.UNICODE,
    bounded: bool = True,
    quote_wrapped: bool = False,
) -> re.Pattern[str]:
    """Python mirror of createDelimitedLabelValuePattern from mask-pattern.utils.ts."""
    label_pat = (
        _wrap_unicode_boundaries(_build_flexible_label_alternation(labels))
        if bounded
        else f"(?:{_build_flexible_label_alternation(labels)})"
    )
    wrapped_value = (
        rf"""["']?({value_pattern})["']?""" if quote_wrapped
        else f"({value_pattern})"
    )
    full = rf"{label_pat}\s*{delimiter_pattern}\s*{wrapped_value}"
    return re.compile(full, flags)


# ════════════════════════════════════════════════════════════════════════
#  DETECTION RULE TYPE
# ════════════════════════════════════════════════════════════════════════

class DetectionRuleDef(TypedDict, total=False):
    id: str
    label: str
    regex: re.Pattern[str]
    value_group: int | None  # capture group index for value; None = whole match


# ════════════════════════════════════════════════════════════════════════
#  RULES REGISTRY — mirrors develop's MASKING_RULES
# ════════════════════════════════════════════════════════════════════════

RULES: list[DetectionRuleDef] = [
    # ── Global / Credential ──────────────────────────────────────
    {
        "id": "email-address",
        "label": "Email address",
        "regex": re.compile(
            r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I | re.U
        ),
        "value_group": None,
    },
    {
        "id": "jwt-token",
        "label": "JWT token",
        "regex": re.compile(
            r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b", re.U
        ),
        "value_group": None,
    },
    {
        "id": "openai-style-key",
        "label": "API key",
        "regex": re.compile(
            r"\bsk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}\b", re.U
        ),
        "value_group": None,
    },
    {
        "id": "aws-access-key",
        "label": "AWS access key",
        "regex": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
        "value_group": None,
    },
    {
        "id": "aws-secret-key",
        "label": "AWS secret access key",
        "regex": re.compile(
            r"""\baws[_-]?secret[_-]?access[_-]?key\b\s*[:=]\s*["']?"""
            r"""([A-Za-z0-9/+=]{40})["']?""",
            re.I | re.U,
        ),
        "value_group": 1,
    },
    {
        "id": "github-pat",
        "label": "GitHub token",
        "regex": re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b", re.U),
        "value_group": None,
    },
    {
        "id": "slack-webhook",
        "label": "Slack webhook",
        "regex": re.compile(
            r"https://hooks\.slack\.com/services/T[A-Z0-9]{8,}/B[A-Z0-9]{8,}/[A-Za-z0-9]{20,}",
            re.U,
        ),
        "value_group": None,
    },
    {
        "id": "numeric-secret-assignment",
        "label": "Numeric credential assignment",
        "regex": create_delimited_label_value_pattern(
            NUMERIC_SECRET_ASSIGNMENT_FLAGS,
            r"\d{3,}",
            delimiter_pattern=r"[:=]+",
            quote_wrapped=True,
        ),
        "value_group": 1,
    },
    {
        "id": "secret-assignment",
        "label": "Credential assignment",
        "regex": create_delimited_label_value_pattern(
            SECRET_ASSIGNMENT_FLAGS,
            r"[A-Za-z0-9._~+/=-]{8,}",
            delimiter_pattern=r"[:=]",
            quote_wrapped=True,
        ),
        "value_group": 1,
    },
    {
        "id": "bearer-token",
        "label": "Bearer token",
        "regex": re.compile(
            r"\bBearer\s+([A-Za-z0-9\-._~+/]+=*)", re.U
        ),
        "value_group": 1,
    },
    # ── Financial ────────────────────────────────────────────────
    {
        "id": "credit-card",
        "label": "Credit card number",
        "regex": re.compile(r"\b(?:\d[ -]?){13,19}\b"),
        "value_group": None,
    },
    {
        "id": "iban",
        "label": "IBAN",
        "regex": re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b", re.U),
        "value_group": None,
    },
    # ── US ───────────────────────────────────────────────────────
    {
        "id": "us-ssn",
        "label": "US Social Security number",
        "regex": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
        "value_group": None,
    },
    {
        "id": "us-phone",
        "label": "US phone number",
        "regex": re.compile(
            r"(?:\+1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{4}\b"
        ),
        "value_group": None,
    },
    # ── Brazil ───────────────────────────────────────────────────
    {
        "id": "cpf",
        "label": "CPF",
        "regex": re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b"),
        "value_group": None,
    },
    {
        "id": "cnpj",
        "label": "CNPJ",
        "regex": re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b"),
        "value_group": None,
    },
    {
        "id": "br-phone",
        "label": "Brazil phone number",
        "regex": re.compile(
            r"(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}-?\d{4}\b"
        ),
        "value_group": None,
    },
    {
        "id": "cep-labeled",
        "label": "CEP",
        "regex": create_delimited_label_value_pattern(
            BR_CEP_LABEL_FLAGS, r"\d{5}-?\d{3}"
        ),
        "value_group": 1,
    },
    {
        "id": "cnh-labeled",
        "label": "CNH",
        "regex": create_delimited_label_value_pattern(
            BR_CNH_LABEL_FLAGS, r"\d{11}"
        ),
        "value_group": 1,
    },
    {
        "id": "pis-pasep-labeled",
        "label": "PIS/PASEP",
        "regex": create_delimited_label_value_pattern(
            BR_PIS_PASEP_LABEL_FLAGS,
            r"\d{3}\.?\d{5}\.?\d{2}-?\d|\d{11}",
        ),
        "value_group": 1,
    },
    {
        "id": "rg-labeled",
        "label": "RG",
        "regex": create_delimited_label_value_pattern(
            BR_RG_LABEL_FLAGS,
            r"[0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx]",
        ),
        "value_group": 1,
    },
    {
        "id": "titulo-eleitor-labeled",
        "label": "Titulo de eleitor",
        "regex": create_delimited_label_value_pattern(
            BR_VOTER_LABEL_FLAGS,
            r"(?:\d[\s.-]*){12}",
        ),
        "value_group": 1,
    },
    # ── Chile / LatAm ────────────────────────────────────────────
    {
        "id": "chile-rut",
        "label": "Chilean RUT",
        "regex": re.compile(r"\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]\b", re.U),
        "value_group": None,
    },
    {
        "id": "curp",
        "label": "CURP",
        "regex": re.compile(r"\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b"),
        "value_group": None,
    },
    {
        "id": "rfc",
        "label": "RFC",
        "regex": re.compile(r"\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b", re.I | re.U),
        "value_group": None,
    },
    {
        "id": "cuit",
        "label": "CUIT",
        "regex": re.compile(r"\b\d{2}-\d{8}-\d\b"),
        "value_group": None,
    },
    {
        "id": "nit",
        "label": "NIT",
        "regex": re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d\b"),
        "value_group": None,
    },
    {
        "id": "cedula-labeled",
        "label": "Cedula",
        "regex": create_delimited_label_value_pattern(
            LATAM_CEDULA_LABEL_FLAGS, r"\d{6,12}"
        ),
        "value_group": 1,
    },
    {
        "id": "dni-labeled",
        "label": "DNI",
        "regex": create_delimited_label_value_pattern(
            LATAM_DNI_LABEL_FLAGS, r"\d{7,8}"
        ),
        "value_group": 1,
    },
    {
        "id": "ruc-labeled",
        "label": "RUC",
        "regex": create_delimited_label_value_pattern(
            LATAM_RUC_LABEL_FLAGS, r"\d{11,13}"
        ),
        "value_group": 1,
    },
    # ── Portugal ──────────────────────────────────────────────────
    {
        "id": "pt-nif-labeled",
        "label": "NIF",
        "regex": create_delimited_label_value_pattern(
            PT_NIF_LABEL_FLAGS, r"\d{9}"
        ),
        "value_group": 1,
    },
    {
        "id": "pt-niss-labeled",
        "label": "NISS",
        "regex": create_delimited_label_value_pattern(
            PT_NISS_LABEL_FLAGS, r"\d{11}"
        ),
        "value_group": 1,
    },
    # ── Spain ────────────────────────────────────────────────────
    {
        "id": "es-dni-labeled",
        "label": "Spanish DNI",
        "regex": create_delimited_label_value_pattern(
            ES_DNI_LABEL_FLAGS, r"\d{8}[A-Z]"
        ),
        "value_group": 1,
    },
    {
        "id": "es-nie-labeled",
        "label": "Spanish NIE",
        "regex": create_delimited_label_value_pattern(
            ES_NIE_LABEL_FLAGS, r"[XYZ]\d{7}[A-Z]"
        ),
        "value_group": 1,
    },
    # ── China ────────────────────────────────────────────────────
    {
        "id": "cn-resident-id-labeled",
        "label": "Chinese resident ID",
        "regex": create_delimited_label_value_pattern(
            CN_RESIDENT_ID_LABEL_FLAGS, r"\d{17}[\dXx]"
        ),
        "value_group": 1,
    },
    {
        "id": "cn-phone",
        "label": "China phone number",
        "regex": re.compile(
            r"(?:\+?86[\s-]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}\b"
        ),
        "value_group": None,
    },
    # ── Russia ───────────────────────────────────────────────────
    {
        "id": "ru-inn-labeled",
        "label": "Russian INN",
        "regex": create_delimited_label_value_pattern(
            RU_INN_LABEL_FLAGS, r"\d{12}|\d{10}"
        ),
        "value_group": 1,
    },
    {
        "id": "ru-snils-labeled",
        "label": "Russian SNILS",
        "regex": create_delimited_label_value_pattern(
            RU_SNILS_LABEL_FLAGS, r"\d{3}-?\d{3}-?\d{3}\s?\d{2}"
        ),
        "value_group": 1,
    },
    # ── India ────────────────────────────────────────────────────
    {
        "id": "in-aadhaar-labeled",
        "label": "Aadhaar",
        "regex": create_delimited_label_value_pattern(
            IN_AADHAAR_LABEL_FLAGS, r"\d{4}\s?\d{4}\s?\d{4}"
        ),
        "value_group": 1,
    },
    {
        "id": "in-pan-labeled",
        "label": "PAN",
        "regex": create_delimited_label_value_pattern(
            IN_PAN_LABEL_FLAGS, r"[A-Z]{5}\d{4}[A-Z]"
        ),
        "value_group": 1,
    },
    {
        "id": "in-gstin-labeled",
        "label": "GSTIN",
        "regex": create_delimited_label_value_pattern(
            IN_GSTIN_LABEL_FLAGS,
            r"\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9][Zz][A-Z0-9]",
        ),
        "value_group": 1,
    },
    # ── Labeled generic patterns ─────────────────────────────────
    {
        "id": "labeled-phone",
        "label": "Labeled phone number",
        "regex": create_delimited_label_value_pattern(
            SHARED_PHONE_LABEL_FLAGS, r"\+?[0-9()\s.-]{8,20}\d"
        ),
        "value_group": 1,
    },
    {
        "id": "labeled-name",
        "label": "Labeled full name",
        "regex": create_delimited_label_value_pattern(
            SHARED_NAME_LABEL_FLAGS, r"[^\n\r,;]{3,80}"
        ),
        "value_group": 1,
    },
    {
        "id": "labeled-address",
        "label": "Labeled address",
        "regex": create_delimited_label_value_pattern(
            SHARED_ADDRESS_LABEL_FLAGS, r"[^\n\r]{6,120}"
        ),
        "value_group": 1,
    },
    {
        "id": "labeled-passport",
        "label": "Passport number",
        "regex": create_delimited_label_value_pattern(
            SHARED_PASSPORT_LABEL_FLAGS, r"[A-Z0-9<]{6,12}"
        ),
        "value_group": 1,
    },
]

# Build a lookup by ID for convenience
RULES_BY_ID: dict[str, DetectionRuleDef] = {r["id"]: r for r in RULES}
