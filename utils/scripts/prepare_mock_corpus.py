#!/usr/bin/env python3
"""Generate zh mocks and rename mock corpus files to semantic names."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path


ROOT = Path(".tmp/input-mocks")


def seed_zh_mocks(zh_dir: Path) -> None:
    zh_dir.mkdir(parents=True, exist_ok=True)
    if list(zh_dir.glob("*.txt")):
        return

    payloads = [
        "请把报告发送到 li.wei@example.com。",
        "备用邮箱：chen.min@test.example。",
        "联系电话：13812345678。",
        "手机号：+86 139 8888 7766。",
        "身份证号：11010519491231002X。",
        "居民身份证: 310101198001011234。",
        "API_KEY=sk-proj-zhservice12345678901234567890",
        "访问令牌: access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.payload.signature",
        "JWT token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
        "Bearer token: Bearer abc123_def456-ghi789.jkl012~mno345+pqr678",
        "数据库密码: db_password=\"M1ma!2026Secure\"",
        "加密密钥: encryption_key=aes256_cn_key_1234567890abcdef",
        "信用卡号：4532 1488 0343 6467",
        "备用支付卡：6011 8765 4321 0987",
        "邮箱: ops-alert@monitor.example",
        "GitHub token: ghp_cnservice1234567890abcdef1234567890",
        "AWS key: AKIAIOSFODNN7EXAMPLE",
        "Twilio SID: AC1234567890abcdef1234567890abcdef",
        "Twilio auth: AuthToken=abcdef1234567890abcdef1234567890",
        "SendGrid API: SG.abc123def456ghi789jkl012mno345pqr",
        "Mailgun key: key-1234567890abcdef1234567890abcdef",
        "Firebase key: AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr",
        "Azure: DefaultEndpointsProtocol=https;AccountName=storage;AccountKey=abc123==;EndpointSuffix=core.windows.net",
        "安全文本：这段内容不应触发任何脱敏规则。",
    ]

    for idx, payload in enumerate(payloads, start=1):
        file_path = zh_dir / f"seed-zh-{idx:03d}.txt"
        file_path.write_text(payload, encoding="utf-8")


def classify(text: str) -> str:
    checks = [
        ("email", re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)),
        ("jwt-token", re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b")),
        ("bearer-token", re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]{10,}\b", re.I)),
        ("api-key", re.compile(r"\b(?:sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9_-]{20,}|SG\.[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|key-[A-Za-z0-9]{20,})\b")),
        ("aws-key", re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
        ("twilio-sid", re.compile(r"\bAC[a-f0-9]{32}\b", re.I)),
        ("credential-assignment", re.compile(r"\b(?:access[_\s-]?token|api[_\s-]?key|api[_\s-]?secret|app[_\s-]?secret|auth[_\s-]?token|authtoken|client[_\s-]?secret|database[_\s-]?password|db[_\s-]?password|encryption[_\s-]?key|master[_\s-]?password|oauth[_\s-]?secret|password|secret[_\s-]?key|session[_\s-]?token|token|senha|contrase(?:n|ñ)a|clave|chave|segredo)\b[^\n\r]{0,12}[:=]", re.I)),
        ("credit-card", re.compile(r"\b(?:\d[ -]?){13,19}\b")),
        ("cpf", re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")),
        ("cnpj", re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")),
        ("cuit", re.compile(r"\b\d{2}-\d{8}-\d\b")),
        ("phone", re.compile(r"(?:\+?\d[\d .-]{8,}\d)")),
        ("cn-id", re.compile(r"\b\d{17}[\dX]\b", re.I)),
        ("safe-text", re.compile(r".*", re.S)),
    ]

    for label, pattern in checks:
        if pattern.search(text):
            return label
    return "safe-text"


def semantic_rename(lang_dir: Path) -> dict[str, str]:
    counts: defaultdict[str, int] = defaultdict(int)
    mapping: dict[str, str] = {}

    files = sorted(
        [path for path in lang_dir.glob("*.txt") if path.is_file()],
        key=lambda p: p.name,
    )

    for file_path in files:
        text = file_path.read_text(encoding="utf-8")
        category = classify(text)
        counts[category] += 1

        while True:
            candidate = f"{category}-{counts[category]:03d}.txt"
            target = lang_dir / candidate
            if target == file_path or not target.exists():
                break
            counts[category] += 1

        if file_path.name != candidate:
            target = lang_dir / candidate
            file_path.rename(target)
            mapping[file_path.name] = target.name
        else:
            mapping[file_path.name] = file_path.name

    return mapping


def main() -> None:
    if not ROOT.exists():
        raise SystemExit(f"Missing mock root: {ROOT}")

    seed_zh_mocks(ROOT / "zh")
    languages = sorted([path.name for path in ROOT.iterdir() if path.is_dir()])

    corpus_map: dict[str, dict[str, str]] = {}
    for language in languages:
        mapping = semantic_rename(ROOT / language)
        corpus_map[language] = mapping

    map_path = ROOT / "_rename-map.json"
    map_path.write_text(
        json.dumps(corpus_map, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Prepared corpus languages: {', '.join(languages)}")
    print(f"Wrote rename map: {map_path}")


if __name__ == "__main__":
    main()
