"""
[GREEN HAT] Session Dump — Despejo de cookies de sessão

Objetivo: Verificar se a API expõe tokens de sessão ou cookies
sem proteção adequada nas respostas HTTP.

Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
"""
import os
import sys
from urllib.request import urlopen, Request
from urllib.error import URLError


APP_URL = os.environ.get("APP_URL", "http://127.0.0.1:5147")


def dump_session_headers(url: str) -> dict:
    """Faz requisição GET e retorna todos os headers relativos a sessão."""
    session_keywords = ["set-cookie", "authorization", "x-session", "x-token"]
    result = {"url": url, "session_headers": {}, "issues": []}

    try:
        req = Request(f"{url}/api/health", headers={"Accept": "application/json"})
        with urlopen(req, timeout=5) as resp:
            for key, val in resp.getheaders():
                if any(kw in key.lower() for kw in session_keywords):
                    result["session_headers"][key] = val
                    if "httponly" not in val.lower() and "set-cookie" in key.lower():
                        result["issues"].append(
                            f"Cookie '{key}' está SEM HttpOnly flag"
                        )
                    if "secure" not in val.lower() and "set-cookie" in key.lower():
                        result["issues"].append(
                            f"Cookie '{key}' está SEM Secure flag"
                        )
    except URLError as exc:
        result["issues"].append(f"Conexão falhou: {exc.reason}")
    return result


def check_cors_headers(url: str) -> dict:
    """Verifica se headers CORS estão restritivos."""
    result = {"cors_open": False, "headers": {}}

    try:
        req = Request(
            f"{url}/api/health",
            headers={"Origin": "https://malicious-site.example.com"},
        )
        with urlopen(req, timeout=5) as resp:
            acao = dict(resp.getheaders()).get("Access-Control-Allow-Origin", "")
            result["headers"]["Access-Control-Allow-Origin"] = acao
            if acao == "*":
                result["cors_open"] = True
    except URLError:
        pass
    return result


def main() -> int:
    print(f"[GREEN HAT] Session Dump — alvo {APP_URL}")
    session = dump_session_headers(APP_URL)
    cors = check_cors_headers(APP_URL)

    if session["session_headers"]:
        print(f"⚠ Headers de sessão encontrados: {session['session_headers']}")
    else:
        print("✓ Nenhum header de sessão exposto.")

    for issue in session["issues"]:
        print(f"  ⚠ {issue}")

    if cors["cors_open"]:
        print("⚠ CORS está aberto para qualquer origem (wildcard *)!")
    else:
        print("✓ CORS restrito corretamente.")

    return 1 if session["issues"] or cors["cors_open"] else 0


if __name__ == "__main__":
    sys.exit(main())
