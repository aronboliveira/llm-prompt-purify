"""
[BLACK HAT] Advanced SQLi — Injeção SQL avançada multi-técnica

⚠ EXCLUSIVO PARA TESTES DEFENSIVOS — NUNCA USE EM PRODUÇÃO.
Esta pasta é git-ignored (**/black-hat/ no .gitignore).

Objetivo: Testar técnicas avançadas de SQLi incluindo
blind boolean, time-based, e second-order injection.

Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
"""
import json
import os
import sys
import time
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

APP_URL = os.environ.get("APP_URL", "http://127.0.0.1:5147")

SQLI_TECHNIQUES = {
    "error_based": [
        "' AND 1=CONVERT(int, @@version)--",
        "' AND 1=1/(SELECT 0 FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
    ],
    "union_based": [
        "' UNION SELECT NULL--",
        "' UNION SELECT NULL,NULL--",
        "' UNION SELECT NULL,NULL,NULL--",
        "' UNION SELECT NULL,NULL,NULL,NULL,NULL--",
        "' UNION ALL SELECT table_name,column_name FROM information_schema.columns--",
    ],
    "boolean_blind": [
        "' AND 1=1--",
        "' AND 1=2--",
        "' AND (SELECT SUBSTRING(username,1,1) FROM users LIMIT 1)='a'--",
    ],
    "time_blind": [
        "'; WAITFOR DELAY '0:0:3'--",
        "' AND SLEEP(3)--",
        "' AND BENCHMARK(10000000,SHA1('test'))--",
    ],
    "stacked": [
        "'; DROP TABLE feedback;--",
        "'; INSERT INTO audit_log VALUES('pwned');--",
        "'; EXEC xp_cmdshell('whoami');--",
    ],
    "second_order": [
        "admin'--",
        "admin' OR '1'='1",
    ],
}


def send_payload(url: str, payload: str) -> dict:
    """Envia um payload SQLi via POST /api/feedback."""
    body = json.dumps({
        "category": "bug",
        "email": "sqli@test.local",
        "message": payload,
        "name": "Advanced SQLi",
        "rating": 1,
        "subject": "sqli probe",
        "wantsReply": False,
    }).encode()

    start = time.monotonic()
    result = {
        "payload": payload[:60],
        "status": 0,
        "elapsed_ms": 0,
        "error_leak": False,
        "time_suspicious": False,
    }

    try:
        req = Request(
            f"{url}/api/feedback",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=10) as resp:
            result["status"] = resp.status
            resp_body = resp.read().decode()
    except HTTPError as exc:
        result["status"] = exc.code
        resp_body = exc.read().decode() if hasattr(exc, "read") else ""
    except URLError as exc:
        result["status"] = 0
        resp_body = str(exc.reason)

    result["elapsed_ms"] = int((time.monotonic() - start) * 1000)

    # Verifica vazamento de erros SQL
    sql_keywords = [
        "sql", "syntax", "mysql", "postgres", "sqlite",
        "oracle", "mssql", "stack trace", "exception",
        "invalid column", "unclosed quotation",
    ]
    for kw in sql_keywords:
        if kw in resp_body.lower():
            result["error_leak"] = True
            break

    # Verifica time-based (resposta > 2.5s)
    if result["elapsed_ms"] > 2500:
        result["time_suspicious"] = True

    return result


def main() -> int:
    print(f"[BLACK HAT] Advanced SQLi — alvo {APP_URL}")
    total = sum(len(v) for v in SQLI_TECHNIQUES.values())
    print(f"Testando {total} payloads em {len(SQLI_TECHNIQUES)} técnicas...\n")

    issues = 0

    for technique, payloads in SQLI_TECHNIQUES.items():
        print(f"--- {technique} ---")
        for payload in payloads:
            result = send_payload(APP_URL, payload)

            if result["error_leak"]:
                issues += 1
                print(f"  ⚠ ERROR LEAK [{result['status']}] {result['payload']}")
            elif result["time_suspicious"]:
                issues += 1
                print(
                    f"  ⚠ TIME-BASED [{result['status']}] "
                    f"{result['elapsed_ms']}ms {result['payload']}"
                )
            elif result["status"] == 500:
                issues += 1
                print(f"  ⚠ CRASH [500] {result['payload']}")
            else:
                print(f"  ✓ BLOCKED [{result['status']}] {result['payload']}")

    print(f"\n=== {issues} problema(s) encontrado(s) de {total} testes ===")
    return 1 if issues > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
