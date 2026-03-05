"""
Python mirror of develop branch detection engine.

Mirrors the core detection logic of MaskingEngine without validators.
Uses the RULES list from patterns.py (which mirrors MASKING_RULES).
"""

from __future__ import annotations

from dataclasses import dataclass

from .patterns import RULES, DetectionRuleDef


@dataclass(frozen=True, slots=True)
class Detection:
    rule_id: str
    label: str
    value: str
    start: int
    end: int


def detect_sensitive_data(text: str) -> list[Detection]:
    """
    Run all rules against *text* and return deduplicated detections.

    Uses the same dedup strategy as MaskingEngine: key on
    rule_id + start_position + matched_value.
    """
    seen: set[str] = set()
    results: list[Detection] = []

    for rule in RULES:
        regex = rule["regex"]
        value_group = rule.get("value_group")

        for m in regex.finditer(text):
            if value_group is not None:
                try:
                    value = m.group(value_group)
                except IndexError:
                    value = m.group(0)
            else:
                value = m.group(0)

            start = m.start(value_group) if value_group else m.start()
            end = m.end(value_group) if value_group else m.end()

            dedup_key = f"{rule['id']}:{start}:{value}"
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            results.append(
                Detection(
                    rule_id=rule["id"],
                    label=rule["label"],
                    value=value,
                    start=start,
                    end=end,
                )
            )

    return results


def detect_by_rule(text: str, rule_id: str) -> list[Detection]:
    """Detect using only a specific rule (by ID)."""
    from .patterns import RULES_BY_ID

    rule = RULES_BY_ID.get(rule_id)
    if not rule:
        return []

    results: list[Detection] = []
    regex = rule["regex"]
    value_group = rule.get("value_group")

    for m in regex.finditer(text):
        if value_group is not None:
            try:
                value = m.group(value_group)
            except IndexError:
                value = m.group(0)
        else:
            value = m.group(0)

        start = m.start(value_group) if value_group else m.start()
        end = m.end(value_group) if value_group else m.end()

        results.append(
            Detection(
                rule_id=rule["id"],
                label=rule["label"],
                value=value,
                start=start,
                end=end,
            )
        )

    return results
