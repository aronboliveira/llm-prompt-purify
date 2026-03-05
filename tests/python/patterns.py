"""
Pattern registry — Python mirror of the TypeScript PATTERNS dictionary.

Each entry is a dict with:
  - regex : compiled re.Pattern (flags already applied)
  - label : human-readable name
  - mask  : replacement token string

The module is deliberately kept *flat*; no framework imports so it can be
used from a plain script, a notebook, or pytest.
"""

from __future__ import annotations

import re
from typing import TypedDict


class PatternDef(TypedDict):
    regex: re.Pattern[str]
    label: str
    mask: str


# ── Helpers ──────────────────────────────────────────────────────────────
_I = re.IGNORECASE


def _p(pattern: str, flags: int = 0) -> re.Pattern[str]:
    """Compile a pattern, stripping Python-incompatible \\b for non-ASCII."""
    return re.compile(pattern, flags)


# ═════════════════════════════════════════════════════════════════════════
#  PATTERN REGISTRY  (matches src/constants.ts on the extension branch)
# ═════════════════════════════════════════════════════════════════════════

PATTERNS: dict[str, PatternDef] = {
    # ── Common ────────────────────────────────────────────────────────
    "EMAIL": {
        "regex": _p(r"\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b", _I),
        "label": "Email",
        "mask": "[EMAIL]",
    },
    "PHONE": {
        "regex": _p(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
        "label": "Phone",
        "mask": "[PHONE]",
    },
    "SSN": {
        "regex": _p(r"\b\d{3}-\d{2}-\d{4}\b"),
        "label": "SSN",
        "mask": "[SSN]",
    },
    "CREDIT_CARD": {
        "regex": _p(
            r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}"
            r"|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b"
        ),
        "label": "Credit Card",
        "mask": "[CARD-XXXX]",
    },
    # ── API keys & secrets ────────────────────────────────────────────
    "API_KEY": {
        "regex": _p(
            r"\b(?:api[_\-]?key|apikey)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{20,}['\"]?\b",
            _I,
        ),
        "label": "API Key",
        "mask": "[API_KEY]",
    },
    "AWS_KEY": {
        "regex": _p(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
        "label": "AWS Key",
        "mask": "[AWS_KEY]",
    },
    "AWS_SECRET": {
        "regex": _p(
            r"\baws[_\-]?secret[_\-]?access[_\-]?key\s*[:=]\s*[A-Za-z0-9/+=]{40}\b",
            _I,
        ),
        "label": "AWS Secret",
        "mask": "[AWS_SECRET]",
    },
    "GITHUB_PAT": {
        "regex": _p(r"\bgh[pous]_[A-Za-z0-9]{36,}\b"),
        "label": "GitHub Token",
        "mask": "[GITHUB_TOKEN]",
    },
    "GITLAB_PAT": {
        "regex": _p(r"\bglpat-[A-Za-z0-9]{20}\b"),
        "label": "GitLab Token",
        "mask": "[GITLAB_TOKEN]",
    },
    "SLACK_TOKEN": {
        "regex": _p(r"\bxox[baprs]-[A-Za-z0-9\-]{10,48}\b"),
        "label": "Slack Token",
        "mask": "[SLACK_TOKEN]",
    },
    "STRIPE_KEY": {
        "regex": _p(r"\b[sr]k_(?:live|test)_[A-Za-z0-9]{24,}\b"),
        "label": "Stripe Key",
        "mask": "[STRIPE_KEY]",
    },
    "GOOGLE_API": {
        "regex": _p(r"\bAIza[0-9A-Za-z\-_]{35}\b"),
        "label": "Google API Key",
        "mask": "[GOOGLE_API_KEY]",
    },
    "SENDGRID_KEY": {
        "regex": _p(r"\bSG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}\b"),
        "label": "SendGrid Key",
        "mask": "[SENDGRID_KEY]",
    },
    "TWILIO_SID": {
        "regex": _p(r"\bAC[a-f0-9]{32}\b"),
        "label": "Twilio SID",
        "mask": "[TWILIO_SID]",
    },
    "OPENAI_KEY": {
        "regex": _p(r"\bsk-[A-Za-z0-9]{48}\b"),
        "label": "OpenAI Key",
        "mask": "[OPENAI_KEY]",
    },
    "ANTHROPIC_KEY": {
        "regex": _p(r"\bsk-ant-[A-Za-z0-9\-]{40,}\b"),
        "label": "Anthropic Key",
        "mask": "[ANTHROPIC_KEY]",
    },
    # ── Crypto / security ─────────────────────────────────────────────
    "JWT": {
        "regex": _p(
            r"\beyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.+/=]+\b"
        ),
        "label": "JWT Token",
        "mask": "[JWT]",
    },
    "PRIVATE_KEY": {
        "regex": _p(r"-----BEGIN\s(?:RSA|EC|OPENSSH|DSA)?\s?PRIVATE KEY-----", _I),
        "label": "Private Key",
        "mask": "[PRIVATE_KEY]",
    },
    "PEM_CERT": {
        "regex": _p(r"-----BEGIN\sCERTIFICATE-----", _I),
        "label": "Certificate",
        "mask": "[CERTIFICATE]",
    },
    "BITCOIN_ADDR": {
        "regex": _p(r"\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b"),
        "label": "Bitcoin Address",
        "mask": "[BTC_ADDR]",
    },
    "ETH_ADDR": {
        "regex": _p(r"\b0x[a-fA-F0-9]{40}\b"),
        "label": "Ethereum Address",
        "mask": "[ETH_ADDR]",
    },
    # ── Personal identifiers ──────────────────────────────────────────
    "UUID": {
        "regex": _p(
            r"\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}"
            r"-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b",
            _I,
        ),
        "label": "UUID",
        "mask": "[UUID]",
    },
    "MAC_ADDR": {
        "regex": _p(r"\b(?:[0-9A-F]{2}[:\-]){5}[0-9A-F]{2}\b", _I),
        "label": "MAC Address",
        "mask": "[MAC_ADDR]",
    },
    "IPV4": {
        "regex": _p(
            r"\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}"
            r"(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b"
        ),
        "label": "IP Address",
        "mask": "[IP_ADDR]",
    },
    # ── Brazil ────────────────────────────────────────────────────────
    "CPF": {
        "regex": _p(r"\b\d{3}[.\-]?\d{3}[.\-]?\d{3}[\-]?\d{2}\b"),
        "label": "CPF",
        "mask": "[CPF]",
    },
    "CNPJ": {
        "regex": _p(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}\-?\d{2}\b"),
        "label": "CNPJ",
        "mask": "[CNPJ]",
    },
    "BR_PHONE": {
        "regex": _p(r"\b(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}-?\d{4}\b"),
        "label": "BR Phone",
        "mask": "[BR_PHONE]",
    },
    "PIS_PASEP": {
        "regex": _p(r"\b\d{3}\.?\d{5}\.?\d{2}-?\d\b"),
        "label": "PIS/PASEP",
        "mask": "[PIS]",
    },
    "RG": {
        "regex": _p(r"\b\d{2}\.?\d{3}\.?\d{3}-?[\dXx]\b"),
        "label": "RG",
        "mask": "[RG]",
    },
    "TITULO_ELEITOR": {
        "regex": _p(r"\b\d{4}\s?\d{4}\s?\d{4}\b"),
        "label": "Titulo de Eleitor",
        "mask": "[TITULO_ELEITOR]",
    },
    # ── Spain / Latin America ─────────────────────────────────────────
    "DNI": {
        "regex": _p(r"\b\d{8}[A-Z]\b", _I),
        "label": "DNI",
        "mask": "[DNI]",
    },
    "NIE": {
        "regex": _p(r"\b[XYZ]\d{7}[A-Z]\b", _I),
        "label": "NIE",
        "mask": "[NIE]",
    },
    "CURP_MX": {
        "regex": _p(r"\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b"),
        "label": "CURP",
        "mask": "[CURP]",
    },
    "CUIT": {
        "regex": _p(r"\b(?:20|23|24|27|30|33|34)-?\d{8}-?\d\b"),
        "label": "CUIT",
        "mask": "[CUIT]",
    },
    "RUT_CL": {
        "regex": _p(r"\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]\b"),
        "label": "RUT",
        "mask": "[RUT]",
    },
    "NIT_CO": {
        "regex": _p(r"\b\d{9,10}-?\d\b"),
        "label": "NIT",
        "mask": "[NIT]",
    },
    "RUC_PE": {
        "regex": _p(r"\b(?:10|15|17|20)\d{9}\b"),
        "label": "RUC",
        "mask": "[RUC]",
    },
    # ── Portugal ──────────────────────────────────────────────────────
    "PT_NIF": {
        "regex": _p(r"\b[1-3]\d{8}\b"),
        "label": "NIF",
        "mask": "[NIF]",
    },
    "PT_NISS": {
        "regex": _p(r"\b[12]\d{10}\b"),
        "label": "NISS",
        "mask": "[NISS]",
    },
    # ── China ─────────────────────────────────────────────────────────
    "CN_RESIDENT_ID": {
        "regex": _p(r"\b\d{17}[\dXx]\b"),
        "label": "CN Resident ID",
        "mask": "[CN_ID]",
    },
    "CN_PHONE": {
        "regex": _p(r"\b(?:\+?86[\s\-]?)?1[3-9]\d[\s\-]?\d{4}[\s\-]?\d{4}\b"),
        "label": "CN Phone",
        "mask": "[CN_PHONE]",
    },
    # ── Russia ────────────────────────────────────────────────────────
    "RU_INN": {
        "regex": _p(r"\b\d{12}\b|\b\d{10}\b"),  # 12-digit first!
        "label": "INN",
        "mask": "[INN]",
    },
    "RU_SNILS": {
        "regex": _p(r"\b\d{3}-\d{3}-\d{3}\s?\d{2}\b"),
        "label": "SNILS",
        "mask": "[SNILS]",
    },
    # ── India ─────────────────────────────────────────────────────────
    "IN_AADHAAR": {
        "regex": _p(r"\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b"),
        "label": "Aadhaar",
        "mask": "[AADHAAR]",
    },
    "IN_PAN": {
        "regex": _p(r"\b[A-Z]{5}\d{4}[A-Z]\b"),
        "label": "PAN",
        "mask": "[PAN]",
    },
    "IN_GSTIN": {
        "regex": _p(r"\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9][Zz][A-Z0-9]\b"),
        "label": "GSTIN",
        "mask": "[GSTIN]",
    },
    # ── Banking ───────────────────────────────────────────────────────
    "IBAN": {
        "regex": _p(
            r"\b[A-Z]{2}\d{2}[\s\-]?(?:[A-Z0-9]{4}[\s\-]?){2,7}[A-Z0-9]{1,4}\b",
            _I,
        ),
        "label": "IBAN",
        "mask": "[IBAN]",
    },
    "SWIFT": {
        "regex": _p(r"\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b"),
        "label": "SWIFT Code",
        "mask": "[SWIFT]",
    },
    # ── URLs / connection strings ─────────────────────────────────────
    "URL_WITH_CREDS": {
        "regex": _p(r"\b(?:https?|ftp)://[^:]+:[^@]+@[^\s]+\b", _I),
        "label": "URL with Credentials",
        "mask": "[URL_REDACTED]",
    },
    "CONNECTION_STRING": {
        "regex": _p(
            r"\b(?:mongodb|postgres|mysql|redis)://[^\s]+:[^\s]+@[^\s]+\b", _I
        ),
        "label": "Connection String",
        "mask": "[DB_CONNECTION]",
    },
    # ── Passwords / tokens ────────────────────────────────────────────
    "PASSWORD_CONTEXT": {
        "regex": _p(
            r"\b(?:password|passwd|pwd)\s*[:=]\s*['\"]?[^\s'\"]{6,}['\"]?\b", _I
        ),
        "label": "Password",
        "mask": "[PASSWORD]",
    },
    "BEARER_TOKEN": {
        "regex": _p(r"\bBearer\s+([A-Za-z0-9\-._~+/]+=*)\b"),
        "label": "Bearer Token",
        "mask": "[BEARER]",
    },
}
