"""
[QA] Boundary Value Generator — Gerador de valores de fronteira

Objetivo: Gerar dados de teste para valores de fronteira que
testam limites de validação na API (tamanhos, formatos, edge cases).

Alvo: validação da API /api/feedback e /api/mask-safety/validate
"""
import json
import os
import sys

APP_URL = os.environ.get("APP_URL", "http://127.0.0.1:5147")


def generate_string_boundaries(field_name: str, max_len: int = 1000) -> list[dict]:
    """Gera valores de fronteira para campos de texto."""
    return [
        {"label": f"{field_name}_empty", "value": ""},
        {"label": f"{field_name}_one_char", "value": "a"},
        {"label": f"{field_name}_max", "value": "a" * max_len},
        {"label": f"{field_name}_max_plus_one", "value": "a" * (max_len + 1)},
        {"label": f"{field_name}_whitespace", "value": "   "},
        {"label": f"{field_name}_newlines", "value": "\n\n\n"},
        {"label": f"{field_name}_unicode", "value": "café naïve résumé 日本語"},
        {"label": f"{field_name}_emoji", "value": "🔒🛡️✅❌⚠️"},
        {"label": f"{field_name}_rtl", "value": "\u200Fمرحبا"},
        {"label": f"{field_name}_null_bytes", "value": "hello\x00world"},
        {"label": f"{field_name}_html", "value": "<b>bold</b>"},
        {"label": f"{field_name}_script", "value": '<script>alert(1)</script>'},
    ]


def generate_email_boundaries() -> list[dict]:
    """Gera valores de fronteira para campos de e-mail."""
    return [
        {"label": "email_valid", "value": "user@example.com"},
        {"label": "email_empty", "value": ""},
        {"label": "email_no_at", "value": "userexample.com"},
        {"label": "email_no_domain", "value": "user@"},
        {"label": "email_no_user", "value": "@example.com"},
        {"label": "email_double_at", "value": "user@@example.com"},
        {"label": "email_spaces", "value": "user @example.com"},
        {"label": "email_long_local", "value": f"{'a' * 65}@example.com"},
        {"label": "email_special", "value": "user+tag@example.com"},
        {"label": "email_idn", "value": "user@例え.jp"},
        {"label": "email_xss", "value": "<script>@evil.com"},
    ]


def generate_rating_boundaries() -> list[dict]:
    """Gera valores de fronteira para o campo rating (numérico)."""
    return [
        {"label": "rating_min", "value": 1},
        {"label": "rating_max", "value": 5},
        {"label": "rating_zero", "value": 0},
        {"label": "rating_negative", "value": -1},
        {"label": "rating_over_max", "value": 6},
        {"label": "rating_float", "value": 3.5},
        {"label": "rating_huge", "value": 999999},
        {"label": "rating_string", "value": "five"},
        {"label": "rating_null", "value": None},
    ]


def generate_mask_safety_boundaries() -> list[dict]:
    """Gera valores de fronteira para o endpoint mask-safety."""
    return [
        {"label": "ms_empty_candidates", "value": {"candidates": []}},
        {
            "label": "ms_single_valid",
            "value": {
                "candidates": [
                    {"candidateValue": "[MASKED_001]", "ruleId": "ssn"}
                ]
            },
        },
        {
            "label": "ms_over_batch_limit",
            "value": {
                "candidates": [
                    {"candidateValue": f"[MASK_{i}]", "ruleId": "cpf"}
                    for i in range(200)
                ]
            },
        },
        {
            "label": "ms_empty_value",
            "value": {"candidates": [{"candidateValue": "", "ruleId": "ssn"}]},
        },
        {
            "label": "ms_empty_rule",
            "value": {"candidates": [{"candidateValue": "test", "ruleId": ""}]},
        },
        {
            "label": "ms_xss_value",
            "value": {
                "candidates": [
                    {
                        "candidateValue": '<script>alert(1)</script>',
                        "ruleId": "ssn",
                    }
                ]
            },
        },
        {"label": "ms_no_candidates_field", "value": {}},
        {"label": "ms_candidates_string", "value": {"candidates": "not-array"}},
    ]


def generate_all() -> dict[str, list[dict]]:
    """Gera todos os conjuntos de valores de fronteira."""
    return {
        "name": generate_string_boundaries("name", 200),
        "subject": generate_string_boundaries("subject", 500),
        "message": generate_string_boundaries("message", 5000),
        "email": generate_email_boundaries(),
        "rating": generate_rating_boundaries(),
        "mask_safety": generate_mask_safety_boundaries(),
    }


def main() -> int:
    print("[QA] Boundary Value Generator")
    boundaries = generate_all()

    total = sum(len(v) for v in boundaries.values())
    print(f"Generated {total} boundary test cases across {len(boundaries)} categories:\n")

    for category, cases in boundaries.items():
        print(f"  {category}: {len(cases)} cases")
        for case in cases[:3]:
            val = str(case["value"])[:50]
            print(f"    - {case['label']}: {val}")
        if len(cases) > 3:
            print(f"    ... and {len(cases) - 3} more")

    # Output as JSON for programmatic consumption
    output_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "boundary_test_data.json"
    )
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(boundaries, f, indent=2, ensure_ascii=False, default=str)
    print(f"\n✓ Test data written to {output_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
