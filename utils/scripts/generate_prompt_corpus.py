#!/usr/bin/env python3
"""
Prompt-style mock corpus generator for LLMPromptPurify.

Generates realistic LLM prompt inputs organized by:
  [language] × [formality] × [role] × [length]

Each combination gets N files (default 5) under:
  .tmp/input-mocks/prompts/{language}/{formality}/{role}/{length}/prompt-NNN.txt

Roles (28 professions that handle sensitive data):
  regular          — layperson, personal use
  student          — university student, learning
  business         — manager / non-tech business user
  techsavvy        — curious mid-tech person
  analyst          — data analyst / compliance officer / auditor
  developer        — software engineer / DevOps
  sysadmin         — IT infra / infosec specialist
  lawyer           — attorney / legal counsel
  doctor           — physician / medical
  nurse            — nursing / clinical
  accountant       — CPA / bookkeeper
  hr               — human resources
  recruiter        — talent acquisition
  secretary        — administrative assistant
  teacher          — educator (K-12 / university)
  pharmacist       — pharmacy professional
  insurance_agent  — insurance / claims
  banker           — banking / financial
  realtor          — real estate
  social_worker    — social services
  researcher       — academic / clinical research
  therapist        — mental health
  journalist       — media / investigative
  government       — civil servant
  customer_support — call center / help desk
  marketing        — digital marketing / CRM
  paralegal        — legal support
  tax_preparer     — tax professional
"""

from __future__ import annotations

import csv
import json
import random
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from prompt_scenarios import COMPOSED_ROLES, build_composed_templates

random.seed(20260329)

# ═══════════════════════════════════════════════════════════════════════
# Sensitive-data generators (imported patterns from generate_massive_corpus)
# ═══════════════════════════════════════════════════════════════════════

def cpf_gen() -> str:
    d = [random.randint(0, 9) for _ in range(9)]
    s1 = sum((10 - i) * d[i] for i in range(9)) % 11
    d.append(0 if s1 < 2 else 11 - s1)
    s2 = sum((11 - i) * d[i] for i in range(10)) % 11
    d.append(0 if s2 < 2 else 11 - s2)
    return f"{d[0]}{d[1]}{d[2]}.{d[3]}{d[4]}{d[5]}.{d[6]}{d[7]}{d[8]}-{d[9]}{d[10]}"

def cnpj_gen() -> str:
    d = [random.randint(0, 9) for _ in range(12)]
    w1 = [5,4,3,2,9,8,7,6,5,4,3,2]
    s1 = sum(w*d for w,d in zip(w1, d)) % 11
    d.append(0 if s1 < 2 else 11 - s1)
    w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]
    s2 = sum(w*d for w,d in zip(w2, d)) % 11
    d.append(0 if s2 < 2 else 11 - s2)
    return f"{d[0]}{d[1]}.{d[2]}{d[3]}{d[4]}.{d[5]}{d[6]}{d[7]}/{d[8]}{d[9]}{d[10]}{d[11]}-{d[12]}{d[13]}"

def rg_gen() -> str:
    return f"{random.randint(10,99)}.{random.randint(100,999)}.{random.randint(100,999)}-{random.choice('0123456789X')}"

def cep_gen() -> str:
    return f"{random.randint(10000,99999)}-{random.randint(100,999)}"

def ssn_gen() -> str:
    return f"{random.randint(100,899)}-{random.randint(10,99)}-{random.randint(1000,9999)}"

def ein_gen() -> str:
    return f"{random.randint(10,99)}-{random.randint(1000000,9999999)}"

def dni_gen() -> str:
    L = "TRWAGMYFPDXBNJZSQVHLCKE"
    n = random.randint(10000000, 99999999)
    return f"{n}{L[n%23]}"

def nie_gen() -> str:
    L = "TRWAGMYFPDXBNJZSQVHLCKE"
    p = random.choice("XYZ")
    n = random.randint(1000000, 9999999)
    fn = {"X":0,"Y":1,"Z":2}[p]*10000000 + n
    return f"{p}{n}{L[fn%23]}"

def cuit_gen() -> str:
    pf = random.choice(["20","23","24","27"])
    d = random.randint(10000000, 45000000)
    ds = [int(c) for c in pf + str(d)]
    w = [5,4,3,2,7,6,5,4,3,2]
    r = 11 - sum(d*w for d,w in zip(ds, w)) % 11
    v = 0 if r == 11 else 9 if r == 10 else r
    return f"{pf}-{d}-{v}"

def ruc_gen() -> str:
    b = f"20{random.randint(10000000,99999999)}"
    w = [5,4,3,2,7,6,5,4,3,2]
    s = sum(int(b[i])*w[i] for i in range(10))
    c = 11 - (s%11)
    if c == 10: c = 0
    elif c == 11: c = 1
    return f"{b}{c}"

def chinese_id_gen() -> str:
    prov = random.choice(["110101","310101","440301","500101","330102"])
    bd = f"19{random.randint(70,99)}{random.randint(1,12):02d}{random.randint(1,28):02d}"
    sq = f"{random.randint(0,999):03d}"
    base = prov + bd + sq
    ws = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2]
    vs = "10X98765432"
    ck = sum(int(base[i])*ws[i] for i in range(17)) % 11
    return base + vs[ck]

def credit_card_gen() -> str:
    pfx = random.choice(["4","51","52","53","34","37","6011"])
    ln = 15 if pfx in ("34","37") else 16
    base = pfx + "".join(str(random.randint(0,9)) for _ in range(ln-len(pfx)-1))
    digits = [int(d) for d in base]
    for i in range(len(digits)-1, -1, -2):
        digits[i] *= 2
        if digits[i] > 9: digits[i] -= 9
    ck = (10 - sum(digits) % 10) % 10
    return base + str(ck)

def email_gen(lang: str) -> str:
    pool = {
        "en": (["john","jane","mike","sarah","chris","lisa"],["gmail.com","outlook.com","yahoo.com"]),
        "pt-br": (["joao","maria","pedro","ana","carlos","juliana"],["gmail.com","hotmail.com","uol.com.br"]),
        "es": (["jose","maria","carlos","ana","miguel","lucia"],["gmail.com","hotmail.com","yahoo.es"]),
        "zh": (["zhang","wang","li","zhao","chen"],["qq.com","163.com","126.com"]),
    }
    nms, doms = pool.get(lang, pool["en"])
    return f"{random.choice(nms)}.{random.choice(nms)}{random.randint(1,999)}@{random.choice(doms)}"

def phone_gen(lang: str) -> str:
    if lang == "pt-br":
        return f"({random.randint(11,99)}) {random.choice([9,8])}{random.randint(1000,9999)}-{random.randint(1000,9999)}"
    if lang == "es":
        return f"+34 {random.randint(600,799)} {random.randint(100,999)} {random.randint(100,999)}"
    if lang == "zh":
        return f"1{random.choice([3,5,7,8,9])}{random.randint(0,9)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}"
    return f"+1-{random.randint(200,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}"

def name_gen(lang: str) -> str:
    pool = {
        "en": (["John","Jane","Mike","Sarah","David","Emily"],["Smith","Johnson","Williams","Brown","Davis"]),
        "pt-br": (["João","Maria","Pedro","Ana","Carlos","Juliana"],["Silva","Santos","Oliveira","Souza","Pereira"]),
        "es": (["José","María","Carlos","Ana","Miguel","Lucía"],["García","Rodríguez","Martínez","López","Pérez"]),
        "zh": ([],[]),
    }
    if lang == "zh":
        return random.choice(["张伟","王芳","李娜","刘洋","陈静","杨磊","黄敏","赵强"])
    f, l = pool.get(lang, pool["en"])
    return f"{random.choice(f)} {random.choice(l)}"

def api_key_gen() -> str:
    c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    return f"sk-{''.join(random.choice(c) for _ in range(48))}"

def jwt_gen() -> str:
    c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    h = "eyJ" + "".join(random.choice(c) for _ in range(25))
    p = "".join(random.choice(c) for _ in range(120))
    s = "".join(random.choice(c) for _ in range(43))
    return f"{h}.{p}.{s}"

def aws_key_gen() -> str:
    return f"AKIA{''.join(random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') for _ in range(16))}"

def ghp_gen() -> str:
    return f"ghp_{''.join(random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') for _ in range(36))}"

def password_gen(lang: str) -> str:
    ps = {
        "en": ["Password123!","Secret#99","P@ssw0rd!","Login$2024","Admin@2024"],
        "pt-br": ["Senha123!","Segredo#99","Admin@2024","Acesso$2024","Chave!2026"],
        "es": ["Clave123!","Secreto#99","Contraseña1!","Admin@2024","Acceso$2024"],
        "zh": ["Password123!","Mima#2024","Secret$99","Admin@2024","Login!2026"],
    }
    return random.choice(ps.get(lang, ps["en"]))

def address_gen(lang: str) -> str:
    if lang == "pt-br":
        return f"Rua {random.choice(['das Flores','Augusta','São Paulo','Ipiranga'])}, {random.randint(1,9999)}, Apto {random.randint(1,999)}"
    if lang == "es":
        return f"Calle {random.choice(['Mayor','Real','Sol','Nueva'])}, {random.randint(1,999)}, Piso {random.randint(1,20)}"
    if lang == "zh":
        return f"{random.choice(['北京路','上海街','广州大道','杭州西路'])}{random.randint(1,999)}号{random.randint(1,50)}楼"
    return f"{random.randint(1,9999)} {random.choice(['Main St','Oak Ave','Maple Dr','Pine Rd'])}, Apt {random.randint(1,999)}"


# ═══════════════════════════════════════════════════════════════════════
# Locale-sensitive PII pools per language
# ═══════════════════════════════════════════════════════════════════════

PII_POOL: dict[str, list[tuple[str, Any]]] = {}

def _pii(lang: str, n: int) -> list[tuple[str, Any]]:
    """Return *n* random PII tuples appropriate for *lang*."""
    builders: dict[str, list[tuple[str, Any]]] = {
        "en": [
            ("SSN", ssn_gen), ("EIN", ein_gen), ("email", lambda: email_gen("en")),
            ("phone", lambda: phone_gen("en")), ("name", lambda: name_gen("en")),
            ("credit card", credit_card_gen), ("address", lambda: address_gen("en")),
            ("API key", api_key_gen), ("password", lambda: password_gen("en")),
            ("AWS key", aws_key_gen), ("GitHub token", ghp_gen),
        ],
        "pt-br": [
            ("CPF", cpf_gen), ("CNPJ", cnpj_gen), ("RG", rg_gen), ("CEP", cep_gen),
            ("email", lambda: email_gen("pt-br")), ("telefone", lambda: phone_gen("pt-br")),
            ("nome", lambda: name_gen("pt-br")), ("cartão", credit_card_gen),
            ("endereço", lambda: address_gen("pt-br")), ("senha", lambda: password_gen("pt-br")),
            ("chave API", api_key_gen), ("JWT", jwt_gen),
        ],
        "es": [
            ("DNI", dni_gen), ("NIE", nie_gen), ("CUIT", cuit_gen), ("RUC", ruc_gen),
            ("email", lambda: email_gen("es")), ("teléfono", lambda: phone_gen("es")),
            ("nombre", lambda: name_gen("es")), ("tarjeta", credit_card_gen),
            ("dirección", lambda: address_gen("es")), ("contraseña", lambda: password_gen("es")),
            ("clave API", api_key_gen), ("token JWT", jwt_gen),
        ],
        "zh": [
            ("身份证", chinese_id_gen), ("email", lambda: email_gen("zh")),
            ("手机", lambda: phone_gen("zh")), ("姓名", lambda: name_gen("zh")),
            ("信用卡", credit_card_gen), ("地址", lambda: address_gen("zh")),
            ("密码", lambda: password_gen("zh")), ("API密钥", api_key_gen),
            ("JWT令牌", jwt_gen), ("AWS密钥", aws_key_gen),
        ],
    }
    pool = builders.get(lang, builders["en"])
    chosen = random.sample(pool, min(n, len(pool)))
    return [(label, fn()) for label, fn in chosen]


# ═══════════════════════════════════════════════════════════════════════
# Template banks per [language × formality × role]
# ═══════════════════════════════════════════════════════════════════════

# Each entry is a list of template strings.  {pii} is replaced with an
# inline block of "label: value" lines.  {pii_inline} is a single PII
# item.  {name} / {email} / {phone} etc. are individual expansions.

_T: dict[str, dict[str, dict[str, list[str]]]] = {}

def _init_templates() -> None:  # noqa: C901 – deliberate monolith
    """Build the template bank.  Called once at module import."""

    # ── English ──────────────────────────────────────────────────────

    _T["en"] = {
        "formal": {
            "regular": [
                "Dear Support Team,\n\nI am writing to request an update to my account information. My current details are as follows:\n\nFull name: {name}\nEmail: {email}\nPhone: {phone}\n{pii}\n\nPlease confirm receipt of this request at your earliest convenience.\n\nRegards,\n{name}",
                "To Whom It May Concern,\n\nI would like to submit the following personal information for verification purposes:\n\n{pii}\n\nThank you for your assistance.",
                "Good afternoon,\n\nI need help updating my billing information. The relevant details are:\n\nCredit card: {card}\nBilling address: {address}\nEmail on file: {email}\n\nKindly process this change and send confirmation to the email above.\n\nBest regards",
            ],
            "student": [
                "Subject: Research Data Collection — Privacy Compliance Check\n\nProfessor,\n\nAs part of my thesis on PII detection, I have compiled the following sample dataset for analysis:\n\n{pii}\n\nCould you verify whether these patterns are correctly classified under GDPR Article 4?\n\nRespectfully,\n{name}",
                "Dear Admissions Office,\n\nPlease find below my updated personal information for enrollment records:\n\nStudent: {name}\nEmail: {email}\nPhone: {phone}\nSSN: {ssn}\n\nThank you for processing this promptly.",
            ],
            "business": [
                "Subject: Q4 Compliance Audit — Employee Data Extract\n\nTeam,\n\nAttached below is the employee data extract required for the quarterly compliance review:\n\nEmployee: {name}\nSSN: {ssn}\nEIN: {ein}\nCorporate email: {email}\nDirect line: {phone}\n\n{pii}\n\nPlease ensure all records are handled per our data retention policy (DRP-2024-07).\n\nRegards,\n{name}\nDirector of Compliance",
                "Subject: Vendor Onboarding — KYC Documentation\n\nDear Procurement,\n\nThe following vendor information has been collected for KYC verification:\n\n{pii}\n\nPlease file under the new vendor category and schedule the compliance review.",
            ],
            "techsavvy": [
                "Hello,\n\nI'm testing a PII detection tool and would like to verify it catches these patterns:\n\nSSN format: {ssn}\nCredit card: {card}\nAPI key: {api_key}\nEmail: {email}\n\nCan you confirm whether all four types are successfully detected and masked?\n\nThanks,\n{name}",
                "Hi there,\n\nI read that credit card numbers follow the Luhn algorithm. Here's a test number to validate: {card}\n\nAlso, does your system detect AWS keys like {aws_key}? And what about JWTs?\n\n{jwt}\n\nLet me know if these get flagged properly.",
            ],
            "analyst": [
                "Subject: Data Loss Prevention — Sensitive Pattern Inventory\n\nTeam,\n\nDuring the DLP audit sweep, the following sensitive patterns were identified in outbound communications:\n\n{pii}\n\nEach item must be classified per ISO 27701 taxonomy and added to the risk register.\n\nAction required: confirm masking coverage by EOD Friday.\n\nRegards,\n{name}\nSenior Data Analyst",
                "MEMO: Quarterly PII Exposure Report\n\nThe following personally identifiable information was found in unencrypted email archives:\n\n{pii}\n\nRemediation: rotate all credentials, notify affected individuals within 72 hours per GDPR Art. 33.",
            ],
            "developer": [
                "Subject: Production Credential Rotation — Pre-deployment Checklist\n\nTeam,\n\nPlease ensure the following credentials are rotated before the v3.2.0 release:\n\nDatabase password: {password}\nAPI key (prod): {api_key}\nAWS access key: {aws_key}\nGitHub PAT: {ghp}\n\nThe JWT signing secret must also be regenerated:\n{jwt}\n\nCC: {email}",
                "Subject: Incident Post-mortem — Credential Leak in Logs\n\nDuring the investigation we found the following values were logged in plaintext by the payment service:\n\n{pii}\n\nRoot cause: missing log sanitizer middleware. Fix deployed in commit abc123.",
            ],
            "sysadmin": [
                "Subject: Infrastructure Audit — Credential Inventory\n\nAttention Security Operations,\n\nThe following credentials were discovered during the quarterly infrastructure sweep:\n\nAWS Access Key: {aws_key}\nAPI Gateway Key: {api_key}\nSSH tunnel password: {password}\nJWT signing key: {jwt}\n\n{pii}\n\nAll items must be rotated within 24 hours per SOC-2 policy 4.3.1.\n\nRegards,\n{name}\nSr. Systems Administrator",
                "ALERT: Exposed secrets in /etc/app/config.yml\n\nThe following sensitive values were found in cleartext configuration:\n\n{pii}\n\nImmediate action: rotate, re-encrypt, and deploy patched config via Ansible.",
            ],
        },
        "neutral": {
            "regular": [
                "Hey, I need to update my info:\n\nName: {name}\nEmail: {email}\nPhone: {phone}\n\n{pii}\n\nThanks!",
                "Hi, can you check if this card number is valid? {card}\n\nAlso, my email is {email} if you need to reach me.",
                "I'm trying to fill out a form and it's asking for my SSN. I put {ssn} but it says it's invalid. What am I doing wrong?",
            ],
            "student": [
                "For my cybersecurity class assignment, I'm collecting sample PII patterns:\n\n{pii}\n\nAre there any types I'm missing that would be common in real-world data breaches?",
                "Working on my data science project. I need to test a regex that catches SSNs like {ssn} and credit cards like {card}. Can you help me write the pattern?",
            ],
            "business": [
                "Hi team,\n\nHere's the updated client info for the Henderson account:\n\nContact: {name}\nEmail: {email}\nPhone: {phone}\nTax ID: {ein}\n\n{pii}\n\nPlease update the CRM accordingly.",
                "Quick update — the new vendor sent over their banking details:\n\nAccount holder: {name}\nIBAN: {card}\nEIN: {ein}\n\nLet me know if you need anything else to complete onboarding.",
            ],
            "techsavvy": [
                "I was reading about PII data leaks and tried to test my browser extension. Here's what I typed into the test field:\n\nSSN: {ssn}\nCard: {card}\nEmail: {email}\nAPI key: {api_key}\n\nDid the extension catch all of them?",
                "Just curious — if I paste this into ChatGPT, will it detect the sensitive data?\n\n{pii}\n\nI know it's not real data, but I want to see what happens.",
            ],
            "analyst": [
                "Running compliance checks on the new dataset. Sample records that triggered DLP alerts:\n\n{pii}\n\nNeed to verify the regex patterns are correct before pushing to production.",
                "Cross-referencing the following PII against our allow-list:\n\n{pii}\n\nIf any of these are real production values, escalate to SOC immediately.",
            ],
            "developer": [
                "Found these in the staging logs while debugging:\n\napi_key: {api_key}\naws_key: {aws_key}\ndb_password: {password}\nuser_email: {email}\n\nOpened a ticket to add log scrubbing.\n\nAlso, someone hardcoded a JWT: {jwt}",
                "PR review note: the test fixtures contain what look like real credentials:\n\n{pii}\n\nCan we replace these with obviously fake values?",
            ],
            "sysadmin": [
                "Checking the config files after the migration:\n\n/etc/app/.env\nDB_PASSWORD={password}\nAPI_KEY={api_key}\nAWS_ACCESS_KEY_ID={aws_key}\nSMTP_USER={email}\n\nThese should be moved to Vault.",
                "Ran a grep across all repos for leaked secrets. Hits:\n\n{pii}\n\nCreating Jira tickets for each team to rotate their creds.",
            ],
        },
        "informal": {
            "regular": [
                "hey so my card number is {card} and my social is {ssn} — can you tell me if those are legit? lol i got them from a random form",
                "yo I need help, the website is asking for my ssn {ssn} and it keeps saying error\n\nmy email is {email} btw",
                "omg I accidentally pasted my password into a public chat: {password}\n\nand my email was right there too: {email}\n\nhow screwed am I??",
                "can u look at this?\nmy name: {name}\nmy number: {phone}\nemail: {email}\ncard: {card}\n\njust making sure nothing weird is going on with my account",
            ],
            "student": [
                "lmao so for my hw i need to find PII in text. here are some examples:\n\n{pii}\n\nis that enough or do i need more types??",
                "dude can u check if this regex catches SSNs? test data:\n{ssn}\n{ssn}\n{card}\n\nalso where do i submit the assignment lol",
                "for the privacy lab we need to demonstrate data masking. im gonna paste these:\n\n{pii}\n\ndo they all count as PII tho?",
            ],
            "business": [
                "quick q — client just emailed their tax id ({ein}) and SSN ({ssn}) in plaintext... should I be worried?\n\nalso their card for billing: {card}",
                "hey {name} sent me their info for the contract:\nemail: {email}\nphone: {phone}\n{pii}\n\ncan you update the file?",
            ],
            "techsavvy": [
                "ok so i built this little scraper and it found these in a public paste:\n\n{pii}\n\nthink any of them are real? the card passes luhn so...",
                "trying out that new PII scanner chrome extension\n\npasted: SSN {ssn}, card {card}, email {email}\n\nit only caught the email 😤 kinda useless",
            ],
            "analyst": [
                "yo the new batch has some sus records:\n\n{pii}\n\nprob test data but flag it anyway just in case\n\nalso whoever put a real api key ({api_key}) in a jupyter notebook needs a talking to lol",
                "found this in the export:\n{pii}\n\nmost likely synthetic but the cpf/ssn patterns look too real. escalating just to be safe",
            ],
            "developer": [
                "bruh someone pushed actual secrets to main:\n\napi_key={api_key}\naws={aws_key}\npassword={password}\n\nrollback incoming 🙃",
                "testing the masking lib. pasting these to see what gets caught:\n\n{pii}\n\n@team if anything leaks through fix the regex before friday pls",
                "guys the env file is literally in the repo:\n\nDB_PASS=\"{password}\"\nSTRIPE_KEY=\"{api_key}\"\nJWT_SECRET=\"{jwt}\"\n\n🤦 who approved that PR",
            ],
            "sysadmin": [
                "so the pentest report just dropped and... yeah\n\nfound in /tmp/debug.log:\n{pii}\n\nalso {aws_key} was in a crontab comment. FML",
                "lol someone put the prod db password in a post-it on their monitor: {password}\n\nalso the AWS key ({aws_key}) was in a slack message from last month\n\nrotating everything NOW",
            ],
        },
    }

    # ── Portuguese (Brazilian) ───────────────────────────────────────

    _T["pt-br"] = {
        "formal": {
            "regular": [
                "Prezado atendimento,\n\nSolicito a atualização dos meus dados cadastrais conforme abaixo:\n\nNome completo: {name}\nCPF: {cpf}\nE-mail: {email}\nTelefone: {phone}\n\nAgradeço a atenção.\n\nAtenciosamente,\n{name}",
                "Boa tarde,\n\nNecessito de auxílio para alterar meus dados de pagamento:\n\nCartão: {card}\nEndereço de cobrança: {address}\nE-mail cadastrado: {email}\n\nGentileza confirmar o recebimento desta solicitação.",
                "Ao setor de cadastro,\n\nVenho por meio desta informar meus dados pessoais para fins de verificação:\n\n{pii}\n\nAguardo retorno com a confirmação.",
            ],
            "student": [
                "Professor(a),\n\nSegue abaixo o conjunto de dados de exemplo para o trabalho sobre proteção de dados pessoais (LGPD):\n\n{pii}\n\nGostaria de saber se esses padrões estão corretamente classificados conforme a Lei 13.709/2018.\n\nRespeitosamente,\n{name}",
                "Prezada Secretaria Acadêmica,\n\nSegue minha documentação atualizada:\n\nAluno(a): {name}\nCPF: {cpf}\nRG: {rg}\nE-mail: {email}\n\nAgradeço a atenção dispensada.",
            ],
            "business": [
                "Assunto: Auditoria Trimestral — Extração de Dados de Colaboradores\n\nEquipe,\n\nSegue a extração de dados necessária para a revisão trimestral de compliance:\n\nColaborador: {name}\nCPF: {cpf}\nCNPJ Empresa: {cnpj}\nE-mail corporativo: {email}\nRamal: {phone}\n\n{pii}\n\nFavor garantir que todos os registros sejam tratados conforme a LGPD.\n\nAtt,\n{name}\nDiretor(a) de Compliance",
                "Prezados,\n\nInformamos os dados do novo fornecedor para cadastro:\n\n{pii}\n\nFavor inserir no ERP e agendar a revisão de conformidade.",
            ],
            "techsavvy": [
                "Olá,\n\nEstou testando uma ferramenta de detecção de PII e gostaria de verificar se ela identifica os seguintes padrões:\n\nCPF: {cpf}\nCartão de crédito: {card}\nChave API: {api_key}\nE-mail: {email}\n\nPoderia confirmar se todos os quatro tipos são detectados e mascados corretamente?\n\nObrigado(a),\n{name}",
            ],
            "analyst": [
                "Assunto: Inventário de Dados Sensíveis — Prevenção de Perda de Dados\n\nEquipe,\n\nDurante a varredura de DLP, os seguintes padrões sensíveis foram identificados em comunicações de saída:\n\n{pii}\n\nCada item deve ser classificado conforme a taxonomia da LGPD e adicionado ao registro de riscos.\n\nAção necessária: confirmar cobertura de mascaramento até sexta-feira.\n\nAtt,\n{name}\nAnalista de Dados Sênior",
            ],
            "developer": [
                "Assunto: Rotação de Credenciais Produção — Checklist Pré-deploy\n\nTime,\n\nAssegurem que as seguintes credenciais sejam rotacionadas antes do release v3.2.0:\n\nSenha do banco: {password}\nChave API (prod): {api_key}\nAWS Access Key: {aws_key}\nGitHub PAT: {ghp}\n\nO JWT signing secret também precisa ser regenerado:\n{jwt}\n\nCópia para: {email}",
            ],
            "sysadmin": [
                "Assunto: Auditoria de Infraestrutura — Inventário de Credenciais\n\nAtenção SOC,\n\nAs seguintes credenciais foram descobertas durante a varredura trimestral:\n\nAWS Access Key: {aws_key}\nAPI Gateway Key: {api_key}\nSenha do túnel SSH: {password}\nJWT signing key: {jwt}\n\n{pii}\n\nTodos os itens devem ser rotacionados em 24 horas.\n\nAtt,\n{name}\nAdministrador de Sistemas Sênior",
            ],
        },
        "neutral": {
            "regular": [
                "Oi, preciso atualizar meus dados:\n\nNome: {name}\nE-mail: {email}\nTelefone: {phone}\nCPF: {cpf}\n\nObrigado!",
                "Boa tarde, meu cartão é {card} e não tá passando. Meu CPF é {cpf}. Pode verificar?",
                "Tô tentando preencher um formulário e pede meu CPF. Coloquei {cpf} mas dá erro. O que pode ser?",
            ],
            "student": [
                "Pro trabalho de segurança da informação, tô coletando exemplos de PII:\n\n{pii}\n\nFalta algum tipo que seria comum em vazamentos reais?",
                "Pra o projeto de data science, preciso testar uma regex que pega CPFs como {cpf} e cartões como {card}. Pode me ajudar?",
            ],
            "business": [
                "Oi equipe,\n\nSegue a info atualizada do cliente Henderson:\n\nContato: {name}\nE-mail: {email}\nTelefone: {phone}\nCNPJ: {cnpj}\n\n{pii}\n\nFavor atualizar no CRM.",
                "O novo fornecedor mandou os dados bancários:\n\nTitular: {name}\nCartão: {card}\nCNPJ: {cnpj}\n\nAvisa se precisa de mais algo pro cadastro.",
            ],
            "techsavvy": [
                "Tava lendo sobre vazamentos de dados e testei minha extensão do navegador. Digitei no campo de teste:\n\nCPF: {cpf}\nCartão: {card}\nE-mail: {email}\nChave API: {api_key}\n\nA extensão pegou todos?",
            ],
            "analyst": [
                "Rodando verificações de compliance no dataset novo. Registros que acionaram alertas de DLP:\n\n{pii}\n\nPreciso verificar se os padrões de regex estão corretos antes de colocar em produção.",
            ],
            "developer": [
                "Achei isso nos logs de staging enquanto debugava:\n\napi_key: {api_key}\naws_key: {aws_key}\ndb_password: {password}\nuser_email: {email}\n\nAbri um ticket pra adicionar log scrubbing.\n\nTambém alguém hardcodou um JWT: {jwt}",
            ],
            "sysadmin": [
                "Verificando os configs depois da migração:\n\n/etc/app/.env\nDB_PASSWORD={password}\nAPI_KEY={api_key}\nAWS_ACCESS_KEY_ID={aws_key}\nSMTP_USER={email}\n\nIsso precisa ir pro Vault.",
            ],
        },
        "informal": {
            "regular": [
                "e aí, meu cpf é {cpf} e meu email é {email}\n\npreciso trocar meus dados lá no cadastro, pode me ajudar?",
                "mano colei minha senha {password} num chat público sem querer kkk\n\nmeu email tb tava lá: {email}\n\ne agora??",
                "oi vc pode conferir se meu cartão tá certo? {card}\n\nmeu cpf: {cpf}\nemail: {email}\n\ntá dando erro na hora de pagar",
            ],
            "student": [
                "kkkk pro meu trabalho preciso achar PII em texto. exemplos:\n\n{pii}\n\nisso basta ou preciso de mais tipos??",
                "mano me ajuda com a regex do trabalho, dados de teste:\n{cpf}\n{cpf}\n{card}\n\npreciso entregar amanhã",
            ],
            "business": [
                "oi o cliente mandou o cpf ({cpf}) e cartão ({card}) por email sem criptografia... devo me preocupar?\n\ntambém mandou o cnpj: {cnpj}",
                "ei o {name} mandou os dados pro contrato:\nemail: {email}\nfone: {phone}\n{pii}\n\natualiza lá pf",
            ],
            "techsavvy": [
                "tô testando aquele scanner de PII novo\n\ncolei: CPF {cpf}, cartão {card}, email {email}\n\nsó pegou o email 😤 achei fraco",
                "fiz um scriptizinho e achei isso num paste público:\n\n{pii}\n\nserá que é real? o cartão passa no luhn...",
            ],
            "analyst": [
                "ei o lote novo tem uns registros suspeitos:\n\n{pii}\n\nprovavelmente dados de teste mas marca mesmo assim\n\ntambém quem colocou uma api key real ({api_key}) no jupyter precisa de uma conversa kk",
            ],
            "developer": [
                "mano alguém subiu secrets reais pra main:\n\napi_key={api_key}\naws={aws_key}\nsenha={password}\n\nrollback vindo aí 🙃",
                "galera o .env tá no repo:\n\nDB_PASS=\"{password}\"\nSTRIPE_KEY=\"{api_key}\"\nJWT_SECRET=\"{jwt}\"\n\n🤦 quem aprovou esse PR?",
            ],
            "sysadmin": [
                "o relatório do pentest saiu e... pois é\n\nacharam no /tmp/debug.log:\n{pii}\n\ntambém {aws_key} tava num comentário de crontab. aff",
                "kk alguém colocou a senha do banco de prod num post-it: {password}\n\ne a chave AWS ({aws_key}) tava numa mensagem do slack do mês passado\n\nrotacionando TUDO agora",
            ],
        },
    }

    # ── Spanish ──────────────────────────────────────────────────────

    _T["es"] = {
        "formal": {
            "regular": [
                "Estimado servicio de atención,\n\nSolicito la actualización de mis datos personales:\n\nNombre completo: {name}\nDNI: {dni}\nCorreo electrónico: {email}\nTeléfono: {phone}\n\nQuedo a la espera de su confirmación.\n\nAtentamente,\n{name}",
                "A quien corresponda,\n\nDeseo presentar la siguiente información personal con fines de verificación:\n\n{pii}\n\nGracias por su asistencia.",
                "Buenas tardes,\n\nNecesito ayuda para actualizar mis datos de facturación:\n\nTarjeta: {card}\nDirección de facturación: {address}\nCorreo registrado: {email}\n\nPor favor confirmen la recepción.",
            ],
            "student": [
                "Asunto: Recopilación de Datos — Verificación de Cumplimiento de Privacidad\n\nProfesor/a,\n\nComo parte de mi tesis sobre detección de PII, he recopilado el siguiente conjunto de datos:\n\n{pii}\n\n¿Podría verificar si estos patrones están correctamente clasificados bajo el RGPD?\n\nRespetuosamente,\n{name}",
                "Estimada Secretaría Académica,\n\nAdjunto mi documentación actualizada:\n\nEstudiante: {name}\nDNI: {dni}\nCorreo: {email}\nTeléfono: {phone}\n\nGracias.",
            ],
            "business": [
                "Asunto: Auditoría Trimestral — Extracto de Datos de Empleados\n\nEquipo,\n\nA continuación el extracto de datos requerido para la revisión trimestral:\n\nEmpleado: {name}\nDNI: {dni}\nCUIT: {cuit}\nCorreo corporativo: {email}\nTeléfono directo: {phone}\n\n{pii}\n\nPor favor asegúrense de manejar todos los registros según la política de retención de datos.\n\nSaludos,\n{name}\nDirector/a de Cumplimiento",
            ],
            "techsavvy": [
                "Hola,\n\nEstoy probando una herramienta de detección de PII y me gustaría verificar si detecta estos patrones:\n\nDNI: {dni}\nTarjeta de crédito: {card}\nClave API: {api_key}\nCorreo: {email}\n\n¿Puede confirmar si los cuatro tipos son detectados y enmascarados correctamente?\n\nGracias,\n{name}",
            ],
            "analyst": [
                "Asunto: Inventario de Datos Sensibles — Prevención de Pérdida de Datos\n\nEquipo,\n\nDurante el barrido de DLP se identificaron los siguientes patrones sensibles:\n\n{pii}\n\nCada elemento debe clasificarse según la taxonomía del RGPD y añadirse al registro de riesgos.\n\nAcción requerida: confirmar cobertura de enmascaramiento antes del viernes.\n\nSaludos,\n{name}\nAnalista de Datos Senior",
            ],
            "developer": [
                "Asunto: Rotación de Credenciales — Checklist Pre-despliegue\n\nEquipo,\n\nAsegúrense de rotar las siguientes credenciales antes del release v3.2.0:\n\nContraseña de base de datos: {password}\nClave API (prod): {api_key}\nAWS Access Key: {aws_key}\nGitHub PAT: {ghp}\n\nEl JWT signing secret también debe regenerarse:\n{jwt}\n\nCopia para: {email}",
            ],
            "sysadmin": [
                "Asunto: Auditoría de Infraestructura — Inventario de Credenciales\n\nAtención Centro de Operaciones de Seguridad,\n\nLas siguientes credenciales fueron descubiertas durante el barrido infraestructural:\n\nAWS Access Key: {aws_key}\nAPI Gateway Key: {api_key}\nContraseña del túnel SSH: {password}\nJWT signing key: {jwt}\n\n{pii}\n\nTodos los elementos deben rotarse en 24 horas.\n\nSaludos,\n{name}\nAdministrador de Sistemas Senior",
            ],
        },
        "neutral": {
            "regular": [
                "Hola, necesito actualizar mis datos:\n\nNombre: {name}\nCorreo: {email}\nTeléfono: {phone}\nDNI: {dni}\n\n¡Gracias!",
                "Hola, ¿puedes verificar si mi tarjeta está bien? {card}\n\nMi DNI es {dni} y mi correo {email}.",
                "Estoy intentando llenar un formulario y pide mi DNI. Puse {dni} pero da error. ¿Qué pasa?",
            ],
            "student": [
                "Para mi clase de ciberseguridad, estoy recopilando ejemplos de PII:\n\n{pii}\n\n¿Falta algún tipo que sería común en filtraciones reales?",
                "Para el proyecto necesito probar una regex que atrape DNIs como {dni} y tarjetas como {card}. ¿Me ayudas?",
            ],
            "business": [
                "Hola equipo,\n\nAquí está la info actualizada del cliente:\n\nContacto: {name}\nCorreo: {email}\nTeléfono: {phone}\nCUIT: {cuit}\n\n{pii}\n\nPor favor actualicen el CRM.",
            ],
            "techsavvy": [
                "Estaba leyendo sobre filtraciones de datos y probé mi extensión del navegador. Escribí en el campo de prueba:\n\nDNI: {dni}\nTarjeta: {card}\nCorreo: {email}\nClave API: {api_key}\n\n¿La extensión los detectó todos?",
            ],
            "analyst": [
                "Ejecutando verificaciones de cumplimiento en el nuevo dataset. Registros que activaron alertas DLP:\n\n{pii}\n\nNecesito verificar que los patrones regex son correctos antes de pasar a producción.",
            ],
            "developer": [
                "Encontré esto en los logs de staging:\n\napi_key: {api_key}\naws_key: {aws_key}\ndb_password: {password}\nuser_email: {email}\n\nAbrí un ticket para agregar sanitización de logs.\n\nTambién alguien hardcodeó un JWT: {jwt}",
            ],
            "sysadmin": [
                "Revisando los archivos de configuración después de la migración:\n\n/etc/app/.env\nDB_PASSWORD={password}\nAPI_KEY={api_key}\nAWS_ACCESS_KEY_ID={aws_key}\nSMTP_USER={email}\n\nEstos deberían ir a Vault.",
            ],
        },
        "informal": {
            "regular": [
                "hola mi dni es {dni} y mi correo {email}\n\nnecesito cambiar mis datos, me puedes ayudar?",
                "jaja pegué mi contraseña {password} en un chat público sin querer\n\nmi correo también estaba ahí: {email}\n\n¿qué hago??",
                "oye puedes checar si mi tarjeta está bien? {card}\n\nmi dni: {dni}\nemail: {email}\n\nme da error al pagar",
            ],
            "student": [
                "jaja para la tarea necesito encontrar PII en texto. ejemplos:\n\n{pii}\n\n¿es suficiente o necesito más tipos??",
                "oye ayúdame con la regex de la tarea, datos de prueba:\n{dni}\n{cuit}\n{card}\n\ntengo que entregar mañana",
            ],
            "business": [
                "oye el cliente mandó su dni ({dni}) y tarjeta ({card}) por email sin cifrar... ¿debería preocuparme?\n\ntambién mandó el cuit: {cuit}",
            ],
            "techsavvy": [
                "estoy probando ese nuevo scanner de PII\n\npegué: DNI {dni}, tarjeta {card}, correo {email}\n\nsolo pilló el correo 😤 bastante flojo",
            ],
            "analyst": [
                "oye el lote nuevo tiene registros sospechosos:\n\n{pii}\n\nprobablemente datos de prueba pero márcalos por si acaso\n\ntambién quien puso una api key real ({api_key}) en un notebook necesita una charla jaja",
            ],
            "developer": [
                "tío alguien subió secrets reales a main:\n\napi_key={api_key}\naws={aws_key}\npassword={password}\n\nrollback viniendo 🙃",
                "chicos el .env está en el repo:\n\nDB_PASS=\"{password}\"\nSTRIPE_KEY=\"{api_key}\"\nJWT_SECRET=\"{jwt}\"\n\n🤦 ¿quién aprobó ese PR?",
            ],
            "sysadmin": [
                "pues el informe del pentest salió y... bueno\n\nencontraron en /tmp/debug.log:\n{pii}\n\ntambién {aws_key} estaba en un comentario de crontab. madre mía",
            ],
        },
    }

    # ── Chinese ──────────────────────────────────────────────────────

    _T["zh"] = {
        "formal": {
            "regular": [
                "尊敬的客服团队，\n\n我想更新我的账户信息，具体如下：\n\n姓名：{name}\n身份证号：{chinese_id}\n邮箱：{email}\n电话：{phone}\n\n请确认收到此请求。\n\n此致敬礼，\n{name}",
                "您好，\n\n我需要更新我的支付信息：\n\n信用卡：{card}\n账单地址：{address}\n注册邮箱：{email}\n\n请处理此变更并发送确认邮件。",
            ],
            "student": [
                "教授您好，\n\n以下是我论文中关于PII检测的示例数据集：\n\n{pii}\n\n请问这些模式是否符合《个人信息保护法》的分类标准？\n\n此致敬礼，\n{name}",
            ],
            "business": [
                "主题：季度合规审计——员工数据提取\n\n团队，\n\n以下是季度合规审查所需的员工数据：\n\n员工：{name}\n身份证号：{chinese_id}\n公司邮箱：{email}\n电话：{phone}\n\n{pii}\n\n请确保所有记录按照数据保护政策处理。\n\n此致，\n{name}\n合规总监",
            ],
            "techsavvy": [
                "您好，\n\n我正在测试一个PII检测工具，想验证它是否能捕获以下模式：\n\n身份证号：{chinese_id}\n信用卡：{card}\nAPI密钥：{api_key}\n邮箱：{email}\n\n能否确认这四种类型都被成功检测和脱敏？\n\n谢谢，\n{name}",
            ],
            "analyst": [
                "主题：敏感数据清单——数据防泄漏\n\n团队，\n\nDLP审计中发现以下敏感模式：\n\n{pii}\n\n每个项目需按《个人信息保护法》分类并加入风险登记。\n\n要求：周五前确认脱敏覆盖率。\n\n致敬，\n{name}\n高级数据分析师",
            ],
            "developer": [
                "主题：生产凭证轮换——上线前检查清单\n\n团队，\n\n请确保v3.2.0发布前完成以下凭证轮换：\n\n数据库密码：{password}\nAPI密钥（生产）：{api_key}\nAWS访问密钥：{aws_key}\nGitHub PAT：{ghp}\n\nJWT签名密钥也需要重新生成：\n{jwt}\n\n抄送：{email}",
            ],
            "sysadmin": [
                "主题：基础设施审计——凭证清单\n\n安全运营中心注意，\n\n季度扫描发现以下凭证：\n\nAWS访问密钥：{aws_key}\nAPI网关密钥：{api_key}\nSSH隧道密码：{password}\nJWT签名密钥：{jwt}\n\n{pii}\n\n所有项目必须在24小时内轮换。\n\n致敬，\n{name}\n高级系统管理员",
            ],
        },
        "neutral": {
            "regular": [
                "你好，我需要更新信息：\n\n姓名：{name}\n邮箱：{email}\n电话：{phone}\n身份证：{chinese_id}\n\n谢谢！",
                "你好，能帮我查一下这个卡号对不对？{card}\n\n我的身份证是{chinese_id}，邮箱是{email}。",
            ],
            "student": [
                "网络安全课的作业，我在收集PII示例：\n\n{pii}\n\n还有什么常见的遗漏类型吗？",
            ],
            "business": [
                "团队，\n\n这是客户的最新信息：\n\n联系人：{name}\n邮箱：{email}\n电话：{phone}\n身份证号：{chinese_id}\n\n{pii}\n\n请更新CRM。",
            ],
            "techsavvy": [
                "我在测试一个PII检测工具，输入了以下内容：\n\n身份证：{chinese_id}\n信用卡：{card}\n邮箱：{email}\nAPI密钥：{api_key}\n\n它全部检测到了吗？",
            ],
            "analyst": [
                "在新数据集上运行合规检查。触发DLP警报的记录：\n\n{pii}\n\n需要在推送到生产环境之前验证regex模式是否正确。",
            ],
            "developer": [
                "调试时在staging日志中发现这些：\n\napi_key: {api_key}\naws_key: {aws_key}\ndb_password: {password}\nuser_email: {email}\n\n已提交工单添加日志清理。\n\n另外有人硬编码了JWT：{jwt}",
            ],
            "sysadmin": [
                "迁移后检查配置文件：\n\n/etc/app/.env\nDB_PASSWORD={password}\nAPI_KEY={api_key}\nAWS_ACCESS_KEY_ID={aws_key}\nSMTP_USER={email}\n\n这些应该移到Vault。",
            ],
        },
        "informal": {
            "regular": [
                "喂我的身份证号是{chinese_id}，邮箱{email}\n\n帮我改一下资料呗",
                "我不小心把密码{password}发到群里了\n\n邮箱也在里面：{email}\n\n怎么办啊😱",
                "帮我看看卡号对不对？{card}\n\n身份证：{chinese_id}\n邮箱：{email}\n\n付款一直报错",
            ],
            "student": [
                "哈哈作业要找PII，我找了这些：\n\n{pii}\n\n够了吗还需要更多类型？",
                "帮我看看这个正则能不能抓到身份证号？测试数据：\n{chinese_id}\n{card}\n\n明天要交了😅",
            ],
            "business": [
                "那个客户直接把身份证号（{chinese_id}）和银行卡 ({card}) 发明文邮件了...要紧吗？",
            ],
            "techsavvy": [
                "在试那个新的PII扫描器\n\n贴了：身份证{chinese_id}、信用卡{card}、邮箱{email}\n\n只检测到邮箱😤太弱了",
            ],
            "analyst": [
                "新数据有几条可疑记录：\n\n{pii}\n\n大概是测试数据但还是标记一下\n\n另外谁把真的api key ({api_key}) 放jupyter notebook里了需要聊聊哈哈",
            ],
            "developer": [
                "兄弟有人把真密钥推到main了：\n\napi_key={api_key}\naws={aws_key}\npassword={password}\n\n回滚中🙃",
                "环境文件居然在仓库里：\n\nDB_PASS=\"{password}\"\nSTRIPE_KEY=\"{api_key}\"\nJWT_SECRET=\"{jwt}\"\n\n🤦谁批准的PR",
            ],
            "sysadmin": [
                "渗透测试报告出来了……\n\n在/tmp/debug.log发现：\n{pii}\n\n还有{aws_key}在crontab注释里 服了",
            ],
        },
    }


_init_templates()
build_composed_templates(_T)

LANGUAGES = ["en", "pt-br", "es", "zh"]
FORMALITIES = ["formal", "neutral", "informal"]
ROLES = [
    "regular", "student", "business", "techsavvy", "analyst", "developer", "sysadmin",
    *COMPOSED_ROLES,
]
LENGTHS = ["short", "medium", "long"]

# length target word counts
_LEN_TARGETS: dict[str, tuple[int, int]] = {
    "short": (15, 80),
    "medium": (80, 250),
    "long": (250, 1200),
}

# How many PII items to embed per length
_PII_COUNT: dict[str, tuple[int, int]] = {
    "short": (1, 3),
    "medium": (3, 7),
    "long": (6, 14),
}


def _fill_template(template: str, lang: str, n_pii: int) -> str:
    """Replace placeholders with generated data."""
    pii_items = _pii(lang, n_pii)
    pii_block = "\n".join(f"{lbl}: {val}" for lbl, val in pii_items)

    replacements: dict[str, str] = {
        "{pii}": pii_block,
        "{name}": name_gen(lang),
        "{email}": email_gen(lang),
        "{phone}": phone_gen(lang),
        "{address}": address_gen(lang),
        "{card}": credit_card_gen(),
        "{password}": password_gen(lang),
        "{api_key}": api_key_gen(),
        "{aws_key}": aws_key_gen(),
        "{ghp}": ghp_gen(),
        "{jwt}": jwt_gen(),
        "{ssn}": ssn_gen(),
        "{ein}": ein_gen(),
        "{cpf}": cpf_gen(),
        "{cnpj}": cnpj_gen(),
        "{rg}": rg_gen(),
        "{cep}": cep_gen(),
        "{dni}": dni_gen(),
        "{nie}": nie_gen(),
        "{cuit}": cuit_gen(),
        "{ruc}": ruc_gen(),
        "{chinese_id}": chinese_id_gen(),
    }

    result = template
    for placeholder, value in replacements.items():
        # Replace each occurrence with a fresh value
        while placeholder in result:
            result = result.replace(placeholder, value, 1)
            # Regenerate for the next occurrence
            if placeholder == "{pii}":
                value = "\n".join(f"{lbl}: {val}" for lbl, val in _pii(lang, n_pii))
            elif placeholder == "{name}":
                value = name_gen(lang)
            elif placeholder == "{email}":
                value = email_gen(lang)
            elif placeholder == "{phone}":
                value = phone_gen(lang)
            elif placeholder == "{card}":
                value = credit_card_gen()
            elif placeholder == "{ssn}":
                value = ssn_gen()
            elif placeholder == "{cpf}":
                value = cpf_gen()
            elif placeholder == "{dni}":
                value = dni_gen()
            elif placeholder == "{api_key}":
                value = api_key_gen()
            elif placeholder == "{aws_key}":
                value = aws_key_gen()
            elif placeholder == "{jwt}":
                value = jwt_gen()

    return result


def _adjust_length(text: str, target: str) -> str:
    """Trim or pad text to approximate the target length class."""
    lo, hi = _LEN_TARGETS[target]
    words = text.split()
    current = len(words)

    if current > hi:
        # Trim to roughly within range
        return " ".join(words[:hi])
    if current < lo and target != "short":
        # For medium/long, repeat filler to approach target
        filler = text
        while len(text.split()) < lo:
            text = text + "\n\n" + filler
        return " ".join(text.split()[:hi])
    return text


@dataclass
class PromptDoc:
    file_name: str
    language: str
    formality: str
    role: str
    length: str
    word_count: int
    pii_count: int


def generate_prompt_corpus(
    output_dir: Path,
    docs_per_combo: int = 5,
) -> dict[str, Any]:
    """Generate the prompt-style mock corpus."""
    all_docs: list[PromptDoc] = []
    stats: dict[str, int] = {}

    for lang in LANGUAGES:
        for formality in FORMALITIES:
            for role in ROLES:
                templates = _T.get(lang, {}).get(formality, {}).get(role, [])
                if not templates:
                    continue

                for length in LENGTHS:
                    combo_dir = output_dir / lang / formality / role / length
                    combo_dir.mkdir(parents=True, exist_ok=True)

                    lo_pii, hi_pii = _PII_COUNT[length]

                    for i in range(docs_per_combo):
                        tmpl = random.choice(templates)
                        n_pii = random.randint(lo_pii, hi_pii)
                        text = _fill_template(tmpl, lang, n_pii)
                        text = _adjust_length(text, length)

                        fname = f"prompt-{i+1:03d}.txt"
                        (combo_dir / fname).write_text(text, encoding="utf-8")

                        # Count PII-ish patterns
                        pii_count = (
                            len(re.findall(r"\b\d{3}[.\-]\d{3}[.\-]\d{3}-\d{2}\b", text))
                            + len(re.findall(r"\b\d{3}-\d{2}-\d{4}\b", text))
                            + len(re.findall(r"\b\d{17}[\dXx]\b", text))
                            + len(re.findall(
                                r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
                                text, re.I,
                            ))
                            + len(re.findall(r"\beyJ[A-Za-z0-9_-]+\.", text))
                            + len(re.findall(r"\bsk[-_]", text))
                            + len(re.findall(r"\bAKIA[A-Z0-9]{16}\b", text))
                            + len(re.findall(r"\bghp_[A-Za-z0-9]{36}\b", text))
                        )

                        rel_path = f"{lang}/{formality}/{role}/{length}/{fname}"
                        all_docs.append(PromptDoc(
                            file_name=rel_path,
                            language=lang,
                            formality=formality,
                            role=role,
                            length=length,
                            word_count=len(text.split()),
                            pii_count=pii_count,
                        ))

                        key = f"{lang}/{formality}/{role}/{length}"
                        stats[key] = stats.get(key, 0) + 1

    # Write manifests
    csv_path = output_dir / "prompt-corpus-manifest.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "file_name","language","formality","role","length","word_count","pii_count",
        ])
        w.writeheader()
        for doc in all_docs:
            w.writerow(asdict(doc))

    json_path = output_dir / "prompt-corpus-manifest.json"
    with json_path.open("w", encoding="utf-8") as f:
        json.dump({
            "generated_at": "2026-03-29",
            "total_documents": len(all_docs),
            "dimensions": {
                "languages": LANGUAGES,
                "formalities": FORMALITIES,
                "roles": ROLES,
                "lengths": LENGTHS,
            },
            "statistics": stats,
            "documents": [asdict(doc) for doc in all_docs],
        }, f, indent=2, ensure_ascii=False)

    return {
        "total": len(all_docs),
        "combos": len(stats),
        "stats": stats,
    }


def main() -> None:
    import sys

    output_dir = Path(__file__).parent.parent.parent / ".tmp" / "input-mocks" / "prompts"
    docs_per_combo = int(sys.argv[1]) if len(sys.argv) > 1 else 5

    combos = len(LANGUAGES) * len(FORMALITIES) * len(ROLES) * len(LENGTHS)
    print(f"Output: {output_dir}")
    print(f"Docs per combo: {docs_per_combo}")
    print(f"Combos: {combos}")
    print(f"Expected total: ~{combos * docs_per_combo}")
    print()

    result = generate_prompt_corpus(output_dir, docs_per_combo)

    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"Total documents: {result['total']}")
    print(f"Unique combos with templates: {result['combos']}")
    print("\nBreakdown:")
    for key in sorted(result["stats"]):
        print(f"  {key}: {result['stats'][key]}")
    print("\nManifests created:")
    print("  - prompt-corpus-manifest.csv")
    print("  - prompt-corpus-manifest.json")


if __name__ == "__main__":
    main()
