"""
HTTP integration tests for the LLMPromptPurify backend API.

Designed to run against a live API instance (e.g. via docker-compose).
Set the BASE_URL environment variable to point at the API.

    BASE_URL=http://localhost:48080 python -m pytest tests/python/test_api_http.py -v

Default: http://localhost:5185 (dev profile from launchSettings.json)
"""

import os
import uuid
import pytest
import urllib.request
import urllib.error
import json
from typing import Any

BASE_URL = os.environ.get("BASE_URL", "http://localhost:5185").rstrip("/")


def _post_json(path: str, body: Any) -> tuple[int, dict]:
    """POST JSON to the API and return (status_code, parsed_body)."""
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def _get(path: str) -> tuple[int, dict]:
    """GET from the API and return (status_code, parsed_body)."""
    req = urllib.request.Request(f"{BASE_URL}{path}", method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


# ── Connectivity guard ───────────────────────────────────────────────

def _api_reachable() -> bool:
    try:
        with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=3):
            return True
    except Exception:
        return False


skip_if_no_api = pytest.mark.skipif(
    not _api_reachable(),
    reason=f"Backend API not reachable at {BASE_URL}",
)


# ══════════════════════════════════════════════════════════════════════
# Health endpoint
# ══════════════════════════════════════════════════════════════════════


@skip_if_no_api
class TestHealthEndpoint:
    def test_returns_200_with_status_ok(self):
        status, body = _get("/api/health")
        assert status == 200
        assert body["status"] == "ok"
        assert body["service"] == "feedback-api"


# ══════════════════════════════════════════════════════════════════════
# Feedback endpoint — valid submissions
# ══════════════════════════════════════════════════════════════════════


@skip_if_no_api
class TestFeedbackValidSubmissions:
    def test_general_feedback_returns_201(self):
        status, body = _post_json("/api/feedback", {
            "category": "general-feedback",
            "message": "Great tool for detecting PII leaks.",
            "email": "tester@example.com",
        })
        assert status == 201
        assert "id" in body
        assert body["id"] != str(uuid.UUID(int=0))

    def test_appraisal_with_rating_returns_201(self):
        status, _ = _post_json("/api/feedback", {
            "category": "appraisal",
            "message": "Very intuitive scanner.",
            "rating": 4,
        })
        assert status == 201

    def test_bug_report_returns_201(self):
        status, _ = _post_json("/api/feedback", {
            "category": "bug-report",
            "message": "CPF regex misses formatted values like 123.456.789-09.",
        })
        assert status == 201

    def test_contact_developers_with_all_fields_returns_201(self):
        status, body = _post_json("/api/feedback", {
            "category": "contact-developers",
            "email": "lead@corp.com",
            "message": "Interested in enterprise licensing.",
            "name": "Tech Lead",
            "subject": "Enterprise inquiry",
            "wantsReply": True,
        })
        assert status == 201
        assert "deliveryStatus" in body
        assert "createdAtUtc" in body

    def test_response_contains_message_field(self):
        _, body = _post_json("/api/feedback", {
            "category": "general-feedback",
            "message": "Testing response shape.",
        })
        assert "message" in body
        assert len(body["message"]) > 0


# ══════════════════════════════════════════════════════════════════════
# Feedback endpoint — validation errors
# ══════════════════════════════════════════════════════════════════════


@skip_if_no_api
class TestFeedbackValidation:
    def test_empty_body_returns_400(self):
        status, body = _post_json("/api/feedback", {})
        assert status == 400

    def test_missing_category_returns_category_error(self):
        status, body = _post_json("/api/feedback", {
            "message": "No category here.",
        })
        assert status == 400
        assert "category" in body.get("errors", {})

    def test_unknown_category_returns_category_error(self):
        status, body = _post_json("/api/feedback", {
            "category": "nonexistent-category",
            "message": "Unknown cat.",
        })
        assert status == 400
        assert "category" in body.get("errors", {})

    def test_missing_message_returns_message_error(self):
        status, body = _post_json("/api/feedback", {
            "category": "general-feedback",
        })
        assert status == 400
        assert "message" in body.get("errors", {})

    def test_message_over_4000_chars_returns_error(self):
        status, body = _post_json("/api/feedback", {
            "category": "general-feedback",
            "message": "A" * 4001,
        })
        assert status == 400
        assert "message" in body.get("errors", {})

    def test_appraisal_without_rating_returns_rating_error(self):
        status, body = _post_json("/api/feedback", {
            "category": "appraisal",
            "message": "Missing rating.",
        })
        assert status == 400
        assert "rating" in body.get("errors", {})

    def test_rating_out_of_range_low(self):
        status, body = _post_json("/api/feedback", {
            "category": "general-feedback",
            "message": "Rating too low.",
            "rating": 0,
        })
        assert status == 400
        assert "rating" in body.get("errors", {})

    def test_rating_out_of_range_high(self):
        status, body = _post_json("/api/feedback", {
            "category": "general-feedback",
            "message": "Rating too high.",
            "rating": 6,
        })
        assert status == 400
        assert "rating" in body.get("errors", {})

    def test_wants_reply_without_email(self):
        status, body = _post_json("/api/feedback", {
            "category": "general-feedback",
            "message": "Want reply, no email.",
            "wantsReply": True,
        })
        assert status == 400
        assert "email" in body.get("errors", {})

    def test_invalid_email_format(self):
        status, body = _post_json("/api/feedback", {
            "category": "general-feedback",
            "message": "Bad email.",
            "email": "not-an-email",
        })
        assert status == 400
        assert "email" in body.get("errors", {})

    def test_contact_developers_without_email(self):
        status, body = _post_json("/api/feedback", {
            "category": "contact-developers",
            "message": "No email on contact.",
            "subject": "Important",
        })
        assert status == 400
        assert "email" in body.get("errors", {})

    def test_contact_developers_without_subject(self):
        status, body = _post_json("/api/feedback", {
            "category": "contact-developers",
            "message": "No subject.",
            "email": "user@example.com",
        })
        assert status == 400
        assert "subject" in body.get("errors", {})

    def test_name_over_80_chars(self):
        status, body = _post_json("/api/feedback", {
            "category": "general-feedback",
            "message": "Long name.",
            "name": "A" * 81,
        })
        assert status == 400
        assert "name" in body.get("errors", {})

    def test_subject_over_160_chars(self):
        status, body = _post_json("/api/feedback", {
            "category": "general-feedback",
            "message": "Long subject.",
            "subject": "S" * 161,
        })
        assert status == 400
        assert "subject" in body.get("errors", {})


# ══════════════════════════════════════════════════════════════════════
# Mask-safety validation endpoint
# ══════════════════════════════════════════════════════════════════════


@skip_if_no_api
class TestMaskSafetyValidation:
    def _validate(self, candidates: list[dict]) -> tuple[int, dict]:
        return _post_json("/api/mask-safety/validate", {"candidates": candidates})

    # ── CPF ──

    def test_valid_cpf_is_compromising(self):
        status, body = self._validate([
            {"ruleId": "cpf", "candidateValue": "529.982.247-25"},
        ])
        assert status == 200
        r = body["results"][0]
        assert r["isSupported"] is True
        assert r["isCompromising"] is True

    def test_all_same_cpf_is_safe(self):
        status, body = self._validate([
            {"ruleId": "cpf", "candidateValue": "111.111.111-11"},
        ])
        assert status == 200
        assert body["results"][0]["isCompromising"] is False

    # ── CNPJ ──

    def test_valid_cnpj_is_compromising(self):
        status, body = self._validate([
            {"ruleId": "cnpj", "candidateValue": "11.222.333/0001-81"},
        ])
        assert status == 200
        assert body["results"][0]["isCompromising"] is True

    # ── Credit Card ──

    def test_visa_test_card_is_compromising(self):
        status, body = self._validate([
            {"ruleId": "credit-card", "candidateValue": "4111111111111111"},
        ])
        assert status == 200
        assert body["results"][0]["isCompromising"] is True

    def test_random_digits_not_compromising(self):
        status, body = self._validate([
            {"ruleId": "credit-card", "candidateValue": "1234567890123456"},
        ])
        assert status == 200
        assert body["results"][0]["isCompromising"] is False

    # ── IBAN ──

    def test_valid_iban_is_compromising(self):
        status, body = self._validate([
            {"ruleId": "iban", "candidateValue": "GB29NWBK60161331926819"},
        ])
        assert status == 200
        assert body["results"][0]["isCompromising"] is True

    def test_invalid_iban_is_safe(self):
        status, body = self._validate([
            {"ruleId": "iban", "candidateValue": "XX00INVALID0000000000"},
        ])
        assert status == 200
        assert body["results"][0]["isCompromising"] is False

    # ── Chilean RUT ──

    def test_valid_chilean_rut(self):
        status, body = self._validate([
            {"ruleId": "chile-rut", "candidateValue": "12.345.678-5"},
        ])
        assert status == 200
        assert body["results"][0]["isCompromising"] is True

    # ── Argentine CUIT ──

    def test_valid_cuit(self):
        status, body = self._validate([
            {"ruleId": "cuit", "candidateValue": "20-12345678-3"},
        ])
        assert status == 200
        assert body["results"][0]["isCompromising"] is True

    # ── Spanish DNI ──

    def test_valid_spanish_dni(self):
        status, body = self._validate([
            {"ruleId": "es-dni-labeled", "candidateValue": "12345678Z"},
        ])
        assert status == 200
        assert body["results"][0]["isCompromising"] is True

    # ── Unsupported / edge cases ──

    def test_unknown_rule_returns_unsupported(self):
        status, body = self._validate([
            {"ruleId": "made-up-rule", "candidateValue": "12345"},
        ])
        assert status == 200
        r = body["results"][0]
        assert r["isSupported"] is False
        assert r["decision"] == "unsupported"

    def test_empty_candidate_returns_unsupported(self):
        status, body = self._validate([
            {"ruleId": "cpf", "candidateValue": ""},
        ])
        assert status == 200
        assert body["results"][0]["isSupported"] is False

    def test_empty_rule_id_returns_unsupported(self):
        status, body = self._validate([
            {"ruleId": "", "candidateValue": "529.982.247-25"},
        ])
        assert status == 200
        assert body["results"][0]["isSupported"] is False

    def test_batch_over_128_returns_400(self):
        candidates = [{"ruleId": "cpf", "candidateValue": "529.982.247-25"}] * 129
        status, _ = self._validate(candidates)
        assert status == 400

    def test_multiple_rules_in_batch(self):
        status, body = self._validate([
            {"ruleId": "cpf", "candidateValue": "529.982.247-25"},
            {"ruleId": "credit-card", "candidateValue": "4111111111111111"},
            {"ruleId": "iban", "candidateValue": "GB29NWBK60161331926819"},
        ])
        assert status == 200
        assert len(body["results"]) == 3
        assert all(r["isCompromising"] for r in body["results"])
