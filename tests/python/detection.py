"""
Detection engine — Python mirror of src/detection.ts.

Provides the same ``detect_sensitive_data`` and ``generate_masks`` functions
so the pandas-driven test matrix can exercise regexes natively in Python
without spawning a Node process.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .patterns import PATTERNS


@dataclass(frozen=True, slots=True)
class Detection:
    type: str
    label: str
    mask: str
    value: str
    start: int
    end: int


def detect_sensitive_data(text: str) -> list[Detection]:
    """Run every pattern against *text* and return sorted detections."""
    results: list[Detection] = []
    seen: set[str] = set()

    for key, pdef in PATTERNS.items():
        for m in pdef["regex"].finditer(text):
            value = m.group(0)
            pos_key = f"{key}:{m.start()}:{value}"
            if pos_key not in seen:
                seen.add(pos_key)
                results.append(
                    Detection(
                        type=key,
                        label=pdef["label"],
                        mask=pdef["mask"],
                        value=value,
                        start=m.start(),
                        end=m.end(),
                    )
                )

    results.sort(key=lambda d: d.start)
    return results


def generate_masks(det: Detection) -> list[str]:
    """Return a list of mask suggestions for a single detection."""
    suggestions = [det.mask]

    match det.type:
        case "EMAIL":
            parts = det.value.split("@")
            if len(parts) == 2:
                local, domain = parts
                suggestions.append(f"[EMAIL:{domain}]")
                suggestions.append(f"{local[0]}***@{domain}")

        case "PHONE" | "BR_PHONE" | "CN_PHONE":
            digits = re.sub(r"\D", "", det.value)
            if len(digits) >= 4:
                suggestions.append(f"[PHONE:XXX-XXX-{digits[-4:]}]")

        case "CREDIT_CARD":
            suggestions.append(f"[CARD:****-****-****-{det.value[-4:]}]")

        case (
            "CPF"
            | "DNI"
            | "SSN"
            | "CUIT"
            | "NIT_CO"
            | "RUT_CL"
            | "RUC_PE"
            | "PT_NIF"
            | "RU_INN"
            | "IN_AADHAAR"
        ):
            suggestions.append(f"[{det.type}:***{det.value[-3:]}]")

        case "IPV4":
            suggestions.extend(["[IP:xxx.xxx.xxx.xxx]", "[INTERNAL_IP]"])

    return suggestions
