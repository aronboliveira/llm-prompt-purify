"""
[CISO] GDPR/LGPD Scanner — Verificação de conformidade com privacidade

Objetivo: Escanear respostas da API e comportamento da aplicação
para verificar conformidade com GDPR (EU) e LGPD (Brasil).

Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
"""
import os
import re
import sys
from urllib.request import urlopen, Request
from urllib.error import URLError

APP_URL = os.environ.get("APP_URL", "http://127.0.0.1:5147")

PII_PATTERNS = {
    "email": re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}"),
    "cpf": re.compile(r"\d{3}\.\d{3}\.\d{3}-\d{2}"),
    "cnpj": re.compile(r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}"),
    "phone_br": re.compile(r"\(\d{2}\)\s?\d{4,5}-\d{4}"),
    "credit_card": re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"),
    "ssn_us": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "ipv4": re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"),
}

PRIVACY_HEADERS = {
    "X-Content-Type-Options": "Previne MIME sniffing",
    "Strict-Transport-Security": "Garante HTTPS",
    "Cache-Control": "Evita cache de dados sensíveis",
    "Referrer-Policy": "Controla vazamento de referrer",
}


def scan_response_for_pii(body: str) -> list[dict]:
    """Varre corpo da resposta procurando PII exposto."""
    findings = []
    for pii_type, pattern in PII_PATTERNS.items():
        matches = pattern.findall(body)
        if matches:
            findings.append({
                "type": pii_type,
                "count": len(matches),
                "samples": matches[:3],
            })
    return findings


def check_privacy_headers(url: str) -> dict:
    """Verifica cabeçalhos de privacidade na resposta."""
    result = {"present": [], "missing": [], "grade": "F"}
    try:
        req = Request(f"{url}/api/health", headers={"Accept": "application/json"})
        with urlopen(req, timeout=5) as resp:
            headers = {k.lower(): v for k, v in resp.getheaders()}
            for header, desc in PRIVACY_HEADERS.items():
                if header.lower() in headers:
                    result["present"].append(f"{header}: {desc}")
                else:
                    result["missing"].append(f"{header}: {desc}")
    except URLError as exc:
        result["missing"].append(f"Conexão falhou: {exc.reason}")
        return result

    total = len(PRIVACY_HEADERS)
    found = len(result["present"])
    if found == total:
        result["grade"] = "A"
    elif found >= total - 1:
        result["grade"] = "B"
    elif found >= total - 2:
        result["grade"] = "C"
    else:
        result["grade"] = "F"
    return result


def test_error_pii_leakage(url: str) -> list[dict]:
    """Testa se erros da API vazam PII nos detalhes."""
    findings = []
    malformed_payloads = [
        "{}",
        '{"candidates": "not-an-array"}',
        '{"email": "test@test.com", "message": "x" }',
    ]

    for payload in malformed_payloads:
        try:
            req = Request(
                f"{url}/api/feedback",
                data=payload.encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(req, timeout=5) as resp:
                body = resp.read().decode()
                pii = scan_response_for_pii(body)
                if pii:
                    findings.extend(pii)
        except URLError as exc:
            if hasattr(exc, "read"):
                body = exc.read().decode()
                pii = scan_response_for_pii(body)
                if pii:
                    findings.extend(pii)
    return findings


def main() -> int:
    print(f"[CISO] GDPR/LGPD Scanner — alvo {APP_URL}")
    issues = 0

    print("\n--- Privacy Headers ---")
    headers = check_privacy_headers(APP_URL)
    for h in headers["present"]:
        print(f"  ✓ {h}")
    for h in headers["missing"]:
        print(f"  ✗ {h}")
        issues += 1
    print(f"  Grade: {headers['grade']}")

    print("\n--- Error Response PII Leakage ---")
    leaks = test_error_pii_leakage(APP_URL)
    if leaks:
        for leak in leaks:
            print(f"  ⚠ PII leak: {leak['type']} ({leak['count']} ocorrências)")
            issues += 1
    else:
        print("  ✓ Nenhum PII encontrado em respostas de erro.")

    print(f"\n=== Resultado: {issues} problema(s) encontrado(s) ===")
    return 1 if issues > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
