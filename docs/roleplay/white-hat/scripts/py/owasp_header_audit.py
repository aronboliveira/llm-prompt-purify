"""
[WHITE HAT] OWASP Header Audit — Auditoria de cabeçalhos de segurança

Objetivo: Verificar se a API retorna todos os cabeçalhos de segurança
recomendados pelo OWASP Secure Headers Project.

Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
"""
import os
import sys
from urllib.request import urlopen, Request
from urllib.error import URLError

APP_URL = os.environ.get("APP_URL", "http://127.0.0.1:5147")

REQUIRED_HEADERS = {
    "Strict-Transport-Security": {
        "description": "Enforces HTTPS connections",
        "expected": "max-age=",
    },
    "X-Content-Type-Options": {
        "description": "Prevents MIME-type sniffing",
        "expected": "nosniff",
    },
    "X-Frame-Options": {
        "description": "Prevents clickjacking",
        "expected": "DENY",
    },
    "Content-Security-Policy": {
        "description": "Controls resource loading",
        "expected": "default-src",
    },
    "X-XSS-Protection": {
        "description": "Legacy XSS filter (still useful for older browsers)",
        "expected": "1",
    },
    "Referrer-Policy": {
        "description": "Controls referrer information leakage",
        "expected": "strict-origin",
    },
    "Permissions-Policy": {
        "description": "Controls browser feature access",
        "expected": None,
    },
    "Cache-Control": {
        "description": "Prevents caching of sensitive data",
        "expected": "no-store",
    },
}

DANGEROUS_HEADERS = [
    "Server",
    "X-Powered-By",
    "X-AspNet-Version",
    "X-AspNetMvc-Version",
]


def audit_headers(url: str) -> dict:
    """Audita cabeçalhos de segurança de um endpoint."""
    result = {
        "url": url,
        "present": [],
        "missing": [],
        "dangerous_exposed": [],
        "grade": "F",
    }

    try:
        req = Request(f"{url}/api/health", headers={"Accept": "application/json"})
        with urlopen(req, timeout=5) as resp:
            headers = {k.lower(): v for k, v in resp.getheaders()}

            for header, info in REQUIRED_HEADERS.items():
                h_lower = header.lower()
                if h_lower in headers:
                    value = headers[h_lower]
                    if info["expected"] and info["expected"] not in value:
                        result["missing"].append(
                            f"{header} present but misconfigured"
                        )
                    else:
                        result["present"].append(header)
                else:
                    result["missing"].append(header)

            for header in DANGEROUS_HEADERS:
                if header.lower() in headers:
                    result["dangerous_exposed"].append(
                        f"{header}: {headers[header.lower()]}"
                    )

    except URLError as exc:
        result["missing"].append(f"Connection failed: {exc.reason}")

    total = len(REQUIRED_HEADERS)
    found = len(result["present"])
    penalty = len(result["dangerous_exposed"])
    score = max(0, found - penalty)

    if score >= total:
        result["grade"] = "A"
    elif score >= total - 2:
        result["grade"] = "B"
    elif score >= total - 4:
        result["grade"] = "C"
    elif score >= total - 6:
        result["grade"] = "D"
    else:
        result["grade"] = "F"

    return result


def main() -> int:
    print(f"[WHITE HAT] OWASP Header Audit — alvo {APP_URL}")
    result = audit_headers(APP_URL)

    print(f"\n  Grade: {result['grade']}")
    print(f"  Present: {len(result['present'])}/{len(REQUIRED_HEADERS)}")

    for h in result["present"]:
        print(f"    ✓ {h}")
    for h in result["missing"]:
        print(f"    ✗ {h}")
    for h in result["dangerous_exposed"]:
        print(f"    ⚠ EXPOSED: {h}")

    return 0 if result["grade"] in ("A", "B") else 1


if __name__ == "__main__":
    sys.exit(main())
