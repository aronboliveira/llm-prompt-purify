#!/usr/bin/env python3
"""
Massive mock corpus generator for LLMPromptPurify.
Generates thousands of diverse test documents per language with varying:
- Message lengths (short, medium, long, mixed)
- Mask density (sparse, moderate, dense, extreme)
- Combination patterns (single-type, multi-type, interleaved)
- Real-world scenarios (audit logs, database configs, API responses, incident reports)
"""

import csv
import json
import random
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

random.seed(20260310)


@dataclass
class MockDocument:
    """Represents a generated mock document."""
    file_name: str
    category: str
    language: str
    length_class: str  # short | medium | long | mixed
    mask_density: str  # sparse | moderate | dense | extreme
    sensitive_count: int
    content: str


# ========================
# Brazilian Data Generators
# ========================

def cpf_generator() -> str:
    """Generate valid Brazilian CPF with proper check digits."""
    digits = [random.randint(0, 9) for _ in range(9)]
    d1 = sum((10 - i) * d for i, d in enumerate(digits)) % 11
    d1 = 0 if d1 < 2 else 11 - d1
    digits.append(d1)
    d2 = sum((11 - i) * d for i, d in enumerate(digits)) % 11
    d2 = 0 if d2 < 2 else 11 - d2
    digits.append(d2)
    return f"{digits[0]}{digits[1]}{digits[2]}.{digits[3]}{digits[4]}{digits[5]}.{digits[6]}{digits[7]}{digits[8]}-{digits[9]}{digits[10]}"


def cnpj_generator() -> str:
    """Generate valid Brazilian CNPJ."""
    digits = [random.randint(0, 9) for _ in range(12)]
    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    d1 = sum(w * d for w, d in zip(weights1, digits)) % 11
    d1 = 0 if d1 < 2 else 11 - d1
    digits.append(d1)
    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    d2 = sum(w * d for w, d in zip(weights2, digits)) % 11
    d2 = 0 if d2 < 2 else 11 - d2
    digits.append(d2)
    return f"{digits[0]}{digits[1]}.{digits[2]}{digits[3]}{digits[4]}.{digits[5]}{digits[6]}{digits[7]}/{digits[8]}{digits[9]}{digits[10]}{digits[11]}-{digits[12]}{digits[13]}"


def rg_br_generator() -> str:
    """Generate Brazilian RG."""
    return f"{random.randint(10,99)}.{random.randint(100,999)}.{random.randint(100,999)}-{random.choice('0123456789X')}"


def cep_generator() -> str:
    """Generate Brazilian CEP."""
    return f"{random.randint(10000,99999)}-{random.randint(100,999)}"


def pis_generator() -> str:
    """Generate Brazilian PIS/PASEP with correct verifier checksum."""
    first = random.randint(100, 999)
    middle = random.randint(10000, 99999)
    last_two = random.randint(10, 99)
    digits = [int(c) for c in f"{first:03d}{middle:05d}{last_two:02d}"]
    weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    total = sum(d * w for d, w in zip(digits, weights))
    remainder = 11 - (total % 11)
    verifier = 0 if remainder >= 10 else remainder
    return f"{first}.{middle:05d}.{last_two:02d}-{verifier}"


def titulo_eleitor_generator() -> str:
    """Generate Brazilian Título de Eleitor."""
    return f"{random.randint(1000,9999)} {random.randint(1000,9999)} {random.randint(1000,9999)}"


# ========================
# Chinese Data Generators
# ========================

def chinese_id_generator() -> str:
    """Generate valid Chinese resident ID with proper checksum."""
    province = random.choice(["110101", "310101", "440301", "500101", "330102"])
    birth = f"19{random.randint(70,99)}{random.randint(1,12):02d}{random.randint(1,28):02d}"
    seq = f"{random.randint(0,999):03d}"
    base = province + birth + seq
    
    weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    verifiers = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    checksum = sum(int(base[i]) * weights[i] for i in range(17)) % 11
    return base + verifiers[checksum]


def chinese_phone_generator() -> str:
    """Generate Chinese mobile phone number."""
    return f"1{random.choice([3,4,5,6,7,8,9])}{random.randint(0,9)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}"


# ========================
# Spanish/LatAm Generators
# ========================

def dni_es_generator() -> str:
    """Generate Spanish DNI with check letter."""
    letters = "TRWAGMYFPDXBNJZSQVHLCKE"
    num = random.randint(10000000, 99999999)
    return f"{num}{letters[num % 23]}"


def nie_es_generator() -> str:
    """Generate Spanish NIE."""
    letters = "TRWAGMYFPDXBNJZSQVHLCKE"
    prefix = random.choice(['X', 'Y', 'Z'])
    num = random.randint(1000000, 9999999)
    full_num = {'X': 0, 'Y': 1, 'Z': 2}[prefix] * 10000000 + num
    return f"{prefix}{num}{letters[full_num % 23]}"


def cuit_generator() -> str:
    """Generate Argentine CUIT with correct verifier checksum."""
    prefix = random.choice(["20", "23", "24", "27"])
    dni = random.randint(10000000, 45000000)
    digits = [int(c) for c in prefix + str(dni)]
    weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    total = sum(d * w for d, w in zip(digits, weights))
    remainder = 11 - (total % 11)
    verifier = 0 if remainder == 11 else 9 if remainder == 10 else remainder
    return f"{prefix}-{dni}-{verifier}"


def rut_cl_generator() -> str:
    """Generate Chilean RUT."""
    base = random.randint(5000000, 25000000)
    verifiers = "0123456789K"
    mult = [2, 3, 4, 5, 6, 7]
    sum_val = sum(int(d) * mult[i % 6] for i, d in enumerate(str(base)[::-1]))
    remainder = sum_val % 11
    check_idx = 11 - remainder if remainder > 0 else 0
    if check_idx >= len(verifiers):
        check_idx = 0
    check = verifiers[check_idx]
    return f"{base}-{check}"


def ruc_pe_generator() -> str:
    """Generate Peruvian RUC with valid checksum."""
    prefix = "20"
    base = f"{random.randint(10000000, 99999999)}"
    full_base = prefix + base
    weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    sum_val = sum(int(full_base[i]) * weights[i] for i in range(10))
    check_digit = 11 - (sum_val % 11)
    if check_digit == 10:
        check_digit = 0
    elif check_digit == 11:
        check_digit = 1
    return f"{full_base}{check_digit}"


def curp_generator() -> str:
    """Generate Mexican CURP."""
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return f"{letters[random.randint(0,25)]}{letters[random.randint(0,25)]}{letters[random.randint(0,25)]}{letters[random.randint(0,25)]}{random.randint(70,99)}{random.randint(1,12):02d}{random.randint(1,28):02d}{'H' if random.random() > 0.5 else 'M'}{letters[random.randint(0,25)]}{letters[random.randint(0,25)]}{letters[random.randint(0,25)]}{random.randint(0,9)}{random.randint(0,9)}"


# ========================
# US/Global Generators
# ========================

def ssn_generator() -> str:
    """Generate US SSN."""
    return f"{random.randint(100,899)}-{random.randint(10,99)}-{random.randint(1000,9999)}"


def ein_generator() -> str:
    """Generate US EIN."""
    return f"{random.randint(10,99)}-{random.randint(1000000,9999999)}"


def credit_card_generator() -> str:
    """Generate fake credit card number."""
    prefix = random.choice(["4", "51", "52", "53", "54", "55", "34", "37", "6011", "65"])
    if prefix in ["34", "37"]:
        length = 15
    else:
        length = 16
    base = prefix + "".join(str(random.randint(0, 9)) for _ in range(length - len(prefix) - 1))
    
    # Luhn checksum — double from rightmost of payload (position 1 in final number)
    digits = [int(d) for d in base]
    for i in range(len(digits) - 1, -1, -2):
        digits[i] *= 2
        if digits[i] > 9:
            digits[i] -= 9
    checksum = (10 - sum(digits) % 10) % 10
    return base + str(checksum)


def iban_generator(country: str = "BR") -> str:
    """Generate IBAN."""
    if country == "BR":
        return f"BR{random.randint(10,99)}{random.randint(0,9999):04d}{random.randint(0,9999):04d}{random.randint(0,9999):04d}{random.randint(0,9999):04d}{random.randint(0,9999):04d}{random.randint(0,9999):04d}{random.randint(0,9):01d}"
    elif country == "ES":
        return f"ES{random.randint(10,99)}{random.randint(0,9999):04d}{random.randint(0,9999):04d}{random.randint(0,9999):04d}{random.randint(0,999):03d}"
    else:
        return f"GB{random.randint(10,99)}BANK{random.randint(0,999999):06d}{random.randint(0,99999999):08d}"


def email_generator(lang: str) -> str:
    """Generate email address."""
    if lang == "pt-br":
        names = ["joao", "maria", "pedro", "ana", "carlos", "juliana", "rafael", "fernanda"]
        domains = ["gmail.com", "hotmail.com", "uol.com.br", "yahoo.com.br"]
    elif lang == "es":
        names = ["jose", "maria", "carlos", "ana", "miguel", "lucia", "david", "isabel"]
        domains = ["gmail.com", "hotmail.com", "yahoo.es", "correo.com"]
    elif lang == "zh":
        names = ["zhang", "wang", "li", "zhao", "chen", "liu", "yang", "huang"]
        domains = ["qq.com", "163.com", "126.com", "sina.com"]
    else:
        names = ["john", "jane", "mike", "sarah", "david", "emily", "chris", "lisa"]
        domains = ["gmail.com", "outlook.com", "yahoo.com", "protonmail.com"]
    
    return f"{random.choice(names)}.{random.choice(names)}{random.randint(1,999)}@{random.choice(domains)}"


def jwt_generator() -> str:
    """Generate fake JWT token."""
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    header = "eyJ" + "".join(random.choice(chars) for _ in range(random.randint(20, 40)))
    payload = "".join(random.choice(chars) for _ in range(random.randint(100, 200)))
    signature = "".join(random.choice(chars) for _ in range(random.randint(40, 60)))
    return f"{header}.{payload}.{signature}"


def api_key_generator() -> str:
    """Generate fake API key."""
    styles = [
        lambda: f"sk-{''.join(random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') for _ in range(48))}",
        lambda: f"sk_live_{''.join(random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') for _ in range(32))}",
        lambda: f"SG.{''.join(random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_') for _ in range(40))}",
        lambda: f"AIza{''.join(random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_') for _ in range(35))}",
    ]
    return random.choice(styles)()


def aws_key_generator() -> str:
    """Generate fake AWS access key."""
    return f"AKIA{''.join(random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') for _ in range(16))}"


def github_pat_generator() -> str:
    """Generate fake GitHub PAT."""
    return f"ghp_{''.join(random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') for _ in range(36))}"


def twilio_sid_generator() -> str:
    """Generate fake Twilio SID."""
    return f"AC{''.join(random.choice('abcdef0123456789') for _ in range(32))}"


def password_generator(lang: str) -> str:
    """Generate password string."""
    passwords = {
        "pt-br": ["Senha123!", "Admin@2024", "P@ssw0rd!", "Segredo#99", "Acesso$2024"],
        "es": ["Clave123!", "Admin@2024", "Contraseña1!", "Secreto#99", "Acceso$2024"],
        "zh": ["Password123!", "Admin@2024", "Mima#2024", "Secret$99", "Login@2024"],
        "en": ["Password123!", "Admin@2024", "Secret#99", "P@ssw0rd!", "Login$2024"],
    }
    return random.choice(passwords.get(lang, passwords["en"]))


def phone_generator(lang: str) -> str:
    """Generate phone number."""
    if lang == "pt-br":
        return f"({random.randint(11,99)}) {random.choice([9,8])}{random.randint(1000,9999)}-{random.randint(1000,9999)}"
    elif lang == "zh":
        return chinese_phone_generator()
    elif lang == "es":
        return f"+34 {random.randint(600,799)} {random.randint(100,999)} {random.randint(100,999)}"
    else:
        return f"+1-{random.randint(200,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}"


def address_generator(lang: str) -> str:
    """Generate address."""
    if lang == "pt-br":
        streets = ["Rua das Flores", "Av. Paulista", "Rua Augusta", "Praça da Sé", "Av. Ipiranga"]
        return f"{random.choice(streets)}, {random.randint(1,9999)}, {random.choice(['Apto', 'Sala'])} {random.randint(1,999)}"
    elif lang == "es":
        streets = ["Calle Mayor", "Av. de la Constitución", "Plaza España", "Paseo de Gracia", "Calle Real"]
        return f"{random.choice(streets)}, {random.randint(1,999)}, {random.choice(['Piso', 'Local'])} {random.randint(1,20)}"
    elif lang == "zh":
        streets = ["北京路", "上海街", "广州大道", "深圳路", "杭州西路"]
        return f"{random.choice(streets)}{random.randint(1,999)}号{random.randint(1,50)}楼{random.randint(101,2099)}室"
    else:
        streets = ["Main St", "Oak Ave", "Maple Dr", "Pine Rd", "Elm Blvd"]
        return f"{random.randint(1,9999)} {random.choice(streets)}, Apt {random.randint(1,999)}"


def name_generator(lang: str) -> str:
    """Generate full name."""
    if lang == "pt-br":
        first = random.choice(["João", "Maria", "Pedro", "Ana", "Carlos", "Juliana", "Rafael", "Fernanda", "Lucas", "Beatriz"])
        last = random.choice(["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes"])
    elif lang == "es":
        first = random.choice(["José", "María", "Carlos", "Ana", "Miguel", "Lucía", "David", "Isabel", "Antonio", "Carmen"])
        last = random.choice(["García", "Rodríguez", "Martínez", "López", "González", "Pérez", "Sánchez", "Ramírez", "Torres", "Flores"])
    elif lang == "zh":
        return random.choice(["张伟", "王芳", "李娜", "刘洋", "陈静", "杨磊", "黄敏", "赵强", "周杰", "吴超"])
    else:
        first = random.choice(["John", "Jane", "Michael", "Sarah", "David", "Emily", "Christopher", "Lisa", "Daniel", "Jennifer"])
        last = random.choice(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"])
    
    return f"{first} {last}"


# ========================
# Content Templates
# ========================

class ContentTemplate:
    """Base template for generating mock content."""
    
    @staticmethod
    def audit_log_short(lang: str, sensitive_items: list[tuple[str, Any]]) -> str:
        """Short audit log entry."""
        templates = {
            "pt-br": "Registro de auditoria #{id}\nData: 2024-{month:02d}-{day:02d}\n{items}\nStatus: Concluído",
            "es": "Registro de auditoría #{id}\nFecha: 2024-{month:02d}-{day:02d}\n{items}\nEstado: Completado",
            "zh": "审计记录 #{id}\n日期: 2024-{month:02d}-{day:02d}\n{items}\n状态: 已完成",
            "en": "Audit Record #{id}\nDate: 2024-{month:02d}-{day:02d}\n{items}\nStatus: Completed",
        }
        
        items_text = "\n".join(f"{label}: {value}" for label, value in sensitive_items)
        return templates[lang].format(
            id=random.randint(1000, 9999),
            month=random.randint(1, 12),
            day=random.randint(1, 28),
            items=items_text
        )
    
    @staticmethod
    def database_config_medium(lang: str, sensitive_items: list[tuple[str, Any]]) -> str:
        """Medium database configuration."""
        templates = {
            "pt-br": """# Configuração do Banco de Dados
# Ambiente: Produção
# Atualizado: 2024-{month:02d}

[database]
host = db.empresa.com.br
port = 5432
{items}

[cache]
redis_host = cache.empresa.com.br
redis_port = 6379

# Backup automático habilitado
# Logs em /var/log/db/
""",
            "es": """# Configuración de Base de Datos
# Entorno: Producción
# Actualizado: 2024-{month:02d}

[database]
host = db.empresa.com
port = 5432
{items}

[cache]
redis_host = cache.empresa.com
redis_port = 6379

# Respaldo automático habilitado
# Logs en /var/log/db/
""",
            "zh": """# 数据库配置
# 环境: 生产环境
# 更新: 2024-{month:02d}

[database]
host = db.company.cn
port = 5432
{items}

[cache]
redis_host = cache.company.cn
redis_port = 6379

# 自动备份已启用
# 日志位置 /var/log/db/
""",
            "en": """# Database Configuration
# Environment: Production
# Updated: 2024-{month:02d}

[database]
host = db.company.com
port = 5432
{items}

[cache]
redis_host = cache.company.com
redis_port = 6379

# Automatic backup enabled
# Logs in /var/log/db/
""",
        }
        
        items_text = "\n".join(f"{label} = {value}" for label, value in sensitive_items)
        return templates[lang].format(month=random.randint(1, 12), items=items_text)
    
    @staticmethod
    def incident_report_long(lang: str, sensitive_items_groups: list[list[tuple[str, Any]]]) -> str:
        """Long incident report with multiple sections."""
        templates = {
            "pt-br": """RELATÓRIO DE INCIDENTE DE SEGURANÇA
========================================

ID do Incidente: INC-2024-{id}
Data de Detecção: 2024-{month:02d}-{day:02d} às {hour:02d}:{minute:02d}
Severidade: {severity}
Analista Responsável: {analyst}

SUMÁRIO EXECUTIVO
-----------------
Um incidente de segurança foi detectado envolvendo acesso não autorizado aos sistemas
corporativos. Este relatório documenta os detalhes técnicos, dados comprometidos e
ações de remediação implementadas.

DADOS COMPROMETIDOS - SEÇÃO 1
-----------------------------
{section1}

CREDENCIAIS E TOKENS ENVOLVIDOS
-------------------------------
{section2}

INFORMAÇÕES DE USUÁRIOS AFETADOS
--------------------------------
{section3}

DETALHES TÉCNICOS
----------------
Origem do Ataque: {ip}
Vetor de Ataque: Phishing + Credential Stuffing
Sistemas Afetados: {systems} sistemas críticos

AÇÕES IMEDIATAS
--------------
1. Revogação de todas as credenciais comprometidas
2. Bloqueio de IPs maliciosos no firewall
3. Notificação aos usuários afetados
4. Auditoria completa dos logs de acesso
5. Implementação de autenticação multifator

OBSERVAÇÕES FINAIS
-----------------
Todos os dados sensíveis identificados neste relatório devem ser tratados como
confidenciais. Acesso restrito apenas a equipe de segurança e compliance.

Relatório gerado automaticamente pelo sistema de SIEM.
Data de Geração: 2024-{month:02d}-{day:02d}
""",
            "es": """INFORME DE INCIDENTE DE SEGURIDAD
==================================

ID del Incidente: INC-2024-{id}
Fecha de Detección: 2024-{month:02d}-{day:02d} a las {hour:02d}:{minute:02d}
Severidad: {severity}
Analista Responsable: {analyst}

RESUMEN EJECUTIVO
-----------------
Se detectó un incidente de seguridad que involucra acceso no autorizado a los sistemas
corporativos. Este informe documenta los detalles técnicos, datos comprometidos y
acciones de remediación implementadas.

DATOS COMPROMETIDOS - SECCIÓN 1
-------------------------------
{section1}

CREDENCIALES Y TOKENS INVOLUCRADOS
----------------------------------
{section2}

INFORMACIÓN DE USUARIOS AFECTADOS
---------------------------------
{section3}

DETALLES TÉCNICOS
-----------------
Origen del Ataque: {ip}
Vector de Ataque: Phishing + Credential Stuffing
Sistemas Afectados: {systems} sistemas críticos

ACCIONES INMEDIATAS
------------------
1. Revocación de todas las credenciales comprometidas
2. Bloqueo de IPs maliciosas en el firewall
3. Notificación a los usuarios afectados
4. Auditoría completa de los logs de acceso
5. Implementación de autenticación multifactor

OBSERVACIONES FINALES
---------------------
Todos los datos sensibles identificados en este informe deben tratarse como
confidenciales. Acceso restringido solo al equipo de seguridad y cumplimiento.

Informe generado automáticamente por el sistema SIEM.
Fecha de Generación: 2024-{month:02d}-{day:02d}
""",
            "zh": """安全事件报告
============

事件编号: INC-2024-{id}
检测日期: 2024-{month:02d}-{day:02d} {hour:02d}:{minute:02d}
严重程度: {severity}
负责分析师: {analyst}

执行摘要
--------
检测到涉及未经授权访问公司系统的安全事件。本报告记录了技术细节、
受损数据和实施的补救措施。

受损数据 - 第1节
----------------
{section1}

涉及的凭据和令牌
----------------
{section2}

受影响用户信息
--------------
{section3}

技术细节
--------
攻击来源: {ip}
攻击向量: 钓鱼 + 凭据填充
受影响系统: {systems}个关键系统

立即行动
--------
1. 撤销所有受损凭据
2. 在防火墙中阻止恶意IP
3. 通知受影响用户
4. 完整审计访问日志
5. 实施多因素身份验证

最终说明
--------
本报告中识别的所有敏感数据应被视为机密。仅限安全和合规团队访问。

报告由SIEM系统自动生成。
生成日期: 2024-{month:02d}-{day:02d}
""",
            "en": """SECURITY INCIDENT REPORT
=========================

Incident ID: INC-2024-{id}
Detection Date: 2024-{month:02d}-{day:02d} at {hour:02d}:{minute:02d}
Severity: {severity}
Responsible Analyst: {analyst}

EXECUTIVE SUMMARY
-----------------
A security incident was detected involving unauthorized access to corporate
systems. This report documents technical details, compromised data, and
implemented remediation actions.

COMPROMISED DATA - SECTION 1
----------------------------
{section1}

CREDENTIALS AND TOKENS INVOLVED
-------------------------------
{section2}

AFFECTED USER INFORMATION
-------------------------
{section3}

TECHNICAL DETAILS
-----------------
Attack Origin: {ip}
Attack Vector: Phishing + Credential Stuffing
Affected Systems: {systems} critical systems

IMMEDIATE ACTIONS
-----------------
1. Revocation of all compromised credentials
2. Blocking of malicious IPs in firewall
3. Notification to affected users
4. Complete audit of access logs
5. Implementation of multi-factor authentication

FINAL NOTES
-----------
All sensitive data identified in this report should be treated as confidential.
Access restricted to security and compliance team only.

Report automatically generated by SIEM system.
Generation Date: 2024-{month:02d}-{day:02d}
"""
        }
        
        section_texts = [
            "\n".join(f"{label}: {value}" for label, value in group)
            for group in sensitive_items_groups
        ]
        
        while len(section_texts) < 3:
            section_texts.append("(Nenhum dado adicional identificado)")
        
        return templates[lang].format(
            id=random.randint(1000, 9999),
            month=random.randint(1, 12),
            day=random.randint(1, 28),
            hour=random.randint(0, 23),
            minute=random.randint(0, 59),
            severity=random.choice(["CRÍTICA", "ALTA", "MÉDIA"]),
            analyst=name_generator(lang),
            ip=f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
            systems=random.randint(3, 15),
            section1=section_texts[0],
            section2=section_texts[1],
            section3=section_texts[2]
        )
    
    @staticmethod
    def api_response_mixed(lang: str, sensitive_items: list[tuple[str, Any]]) -> str:
        """Mixed API response with JSON structure."""
        items_dict = {label.lower().replace(" ", "_"): value for label, value in sensitive_items}
        
        return json.dumps({
            "status": "success",
            "timestamp": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}T{random.randint(0,23):02d}:{random.randint(0,59):02d}",
            "data": items_dict,
            "meta": {
                "request_id": f"req_{random.randint(100000,999999)}",
                "version": "2.1.0"
            }
        }, indent=2, ensure_ascii=False)


# ========================
# Document Generators by Language
# ========================

class BrazilianDocumentGenerator:
    """Generate Brazilian Portuguese mock documents."""
    
    @staticmethod
    def generate_sparse_short() -> str:
        """1-3 sensitive items, 50-200 words."""
        items = [
            ("CPF", cpf_generator()),
            ("E-mail", email_generator("pt-br")),
        ]
        return ContentTemplate.audit_log_short("pt-br", items)
    
    @staticmethod
    def generate_moderate_medium() -> str:
        """4-8 sensitive items, 200-500 words."""
        items = [
            ("database_user", "admin_producao"),
            ("senha_postgres", password_generator("pt-br")),
            ("admin_email", email_generator("pt-br")),
            ("chave_api", api_key_generator()),
            ("connection_string", f"postgresql://admin:{password_generator('pt-br')}@db.local:5432/main"),
        ]
        return ContentTemplate.database_config_medium("pt-br", items)
    
    @staticmethod
    def generate_dense_long() -> str:
        """10-20 sensitive items, 500-1500 words."""
        section1 = [
            ("CPF do Responsável", cpf_generator()),
            ("RG", rg_br_generator()),
            ("CNPJ da Empresa", cnpj_generator()),
            ("CEP", cep_generator()),
            ("Endereço", address_generator("pt-br")),
        ]
        section2 = [
            ("senha_master", password_generator("pt-br")),
            ("jwt_token", jwt_generator()),
            ("api_key_production", api_key_generator()),
            ("aws_access_key", aws_key_generator()),
            ("github_token", github_pat_generator()),
        ]
        section3 = [
            ("Nome do Paciente", name_generator("pt-br")),
            ("CPF", cpf_generator()),
            ("Telefone", phone_generator("pt-br")),
            ("E-mail", email_generator("pt-br")),
            ("Número do Cartão", credit_card_generator()),
            ("PIS/PASEP", pis_generator()),
        ]
        return ContentTemplate.incident_report_long("pt-br", [section1, section2, section3])
    
    @staticmethod
    def generate_extreme_mixed() -> str:
        """20+ sensitive items, mixed formats."""
        items = [
            ("cpf_1", cpf_generator()),
            ("cpf_2", cpf_generator()),
            ("cpf_3", cpf_generator()),
            ("cnpj", cnpj_generator()),
            ("rg", rg_br_generator()),
            ("cep", cep_generator()),
            ("pis", pis_generator()),
            ("titulo_eleitor", titulo_eleitor_generator()),
            ("email_1", email_generator("pt-br")),
            ("email_2", email_generator("pt-br")),
            ("telefone_1", phone_generator("pt-br")),
            ("telefone_2", phone_generator("pt-br")),
            ("senha_admin", password_generator("pt-br")),
            ("jwt_token", jwt_generator()),
            ("api_key", api_key_generator()),
            ("cartao_credito", credit_card_generator()),
            ("iban", iban_generator("BR")),
            ("aws_key", aws_key_generator()),
            ("github_pat", github_pat_generator()),
            ("twilio_sid", twilio_sid_generator()),
        ]
        return ContentTemplate.api_response_mixed("pt-br", items)


class SpanishDocumentGenerator:
    """Generate Spanish mock documents."""
    
    @staticmethod
    def generate_sparse_short() -> str:
        items = [
            ("DNI", dni_es_generator()),
            ("Correo electrónico", email_generator("es")),
        ]
        return ContentTemplate.audit_log_short("es", items)
    
    @staticmethod
    def generate_moderate_medium() -> str:
        items = [
            ("usuario_base_datos", "admin_produccion"),
            ("contraseña_postgres", password_generator("es")),
            ("correo_admin", email_generator("es")),
            ("clave_api", api_key_generator()),
            ("cadena_conexion", f"postgresql://admin:{password_generator('es')}@db.local:5432/main"),
        ]
        return ContentTemplate.database_config_medium("es", items)
    
    @staticmethod
    def generate_dense_long() -> str:
        section1 = [
            ("DNI del Responsable", dni_es_generator()),
            ("NIE", nie_es_generator()),
            ("CUIT", cuit_generator()),
            ("RUT", rut_cl_generator()),
            ("Dirección", address_generator("es")),
        ]
        section2 = [
            ("contraseña_maestra", password_generator("es")),
            ("token_jwt", jwt_generator()),
            ("clave_api_produccion", api_key_generator()),
            ("clave_acceso_aws", aws_key_generator()),
            ("token_github", github_pat_generator()),
        ]
        section3 = [
            ("Nombre del Empleado", name_generator("es")),
            ("CUIT", cuit_generator()),
            ("Teléfono", phone_generator("es")),
            ("Correo", email_generator("es")),
            ("Número de Tarjeta", credit_card_generator()),
            ("RUC", ruc_pe_generator()),
        ]
        return ContentTemplate.incident_report_long("es", [section1, section2, section3])
    
    @staticmethod
    def generate_extreme_mixed() -> str:
        items = [
            ("dni_1", dni_es_generator()),
            ("dni_2", dni_es_generator()),
            ("nie", nie_es_generator()),
            ("cuit_1", cuit_generator()),
            ("cuit_2", cuit_generator()),
            ("rut_cl", rut_cl_generator()),
            ("ruc_pe", ruc_pe_generator()),
            ("curp", curp_generator()),
            ("email_1", email_generator("es")),
            ("email_2", email_generator("es")),
            ("telefono_1", phone_generator("es")),
            ("telefono_2", phone_generator("es")),
            ("contraseña_admin", password_generator("es")),
            ("jwt_token", jwt_generator()),
            ("api_key", api_key_generator()),
            ("tarjeta_credito", credit_card_generator()),
            ("iban", iban_generator("ES")),
            ("aws_key", aws_key_generator()),
            ("github_pat", github_pat_generator()),
            ("twilio_sid", twilio_sid_generator()),
        ]
        return ContentTemplate.api_response_mixed("es", items)


class ChineseDocumentGenerator:
    """Generate Chinese mock documents."""
    
    @staticmethod
    def generate_sparse_short() -> str:
        items = [
            ("居民身份证号", chinese_id_generator()),
            ("电子邮箱", email_generator("zh")),
        ]
        return ContentTemplate.audit_log_short("zh", items)
    
    @staticmethod
    def generate_moderate_medium() -> str:
        items = [
            ("database_user", "admin_production"),
            ("postgres密码", password_generator("zh")),
            ("管理员邮箱", email_generator("zh")),
            ("api密钥", api_key_generator()),
            ("connection_string", f"postgresql://admin:{password_generator('zh')}@db.local:5432/main"),
        ]
        return ContentTemplate.database_config_medium("zh", items)
    
    @staticmethod
    def generate_dense_long() -> str:
        section1 = [
            ("负责人身份证", chinese_id_generator()),
            ("身份证号", chinese_id_generator()),
            ("联系电话", chinese_phone_generator()),
            ("地址", address_generator("zh")),
        ]
        section2 = [
            ("主密码", password_generator("zh")),
            ("jwt令牌", jwt_generator()),
            ("生产api密钥", api_key_generator()),
            ("aws访问密钥", aws_key_generator()),
            ("github令牌", github_pat_generator()),
        ]
        section3 = [
            ("患者姓名", name_generator("zh")),
            ("身份证号码", chinese_id_generator()),
            ("手机号码", chinese_phone_generator()),
            ("电子邮件", email_generator("zh")),
            ("信用卡号", credit_card_generator()),
        ]
        return ContentTemplate.incident_report_long("zh", [section1, section2, section3])
    
    @staticmethod
    def generate_extreme_mixed() -> str:
        items = [
            ("id_card_1", chinese_id_generator()),
            ("id_card_2", chinese_id_generator()),
            ("id_card_3", chinese_id_generator()),
            ("phone_1", chinese_phone_generator()),
            ("phone_2", chinese_phone_generator()),
            ("email_1", email_generator("zh")),
            ("email_2", email_generator("zh")),
            ("password_admin", password_generator("zh")),
            ("jwt_token", jwt_generator()),
            ("api_key", api_key_generator()),
            ("credit_card", credit_card_generator()),
            ("aws_key", aws_key_generator()),
            ("github_pat", github_pat_generator()),
            ("twilio_sid", twilio_sid_generator()),
        ]
        return ContentTemplate.api_response_mixed("zh", items)


class EnglishDocumentGenerator:
    """Generate English mock documents."""
    
    @staticmethod
    def generate_sparse_short() -> str:
        items = [
            ("SSN", ssn_generator()),
            ("Email", email_generator("en")),
        ]
        return ContentTemplate.audit_log_short("en", items)
    
    @staticmethod
    def generate_moderate_medium() -> str:
        items = [
            ("database_user", "admin_production"),
            ("postgres_password", password_generator("en")),
            ("admin_email", email_generator("en")),
            ("api_key", api_key_generator()),
            ("connection_string", f"postgresql://admin:{password_generator('en')}@db.local:5432/main"),
        ]
        return ContentTemplate.database_config_medium("en", items)
    
    @staticmethod
    def generate_dense_long() -> str:
        section1 = [
            ("Responsible SSN", ssn_generator()),
            ("EIN", ein_generator()),
            ("Address", address_generator("en")),
        ]
        section2 = [
            ("master_password", password_generator("en")),
            ("jwt_token", jwt_generator()),
            ("api_key_production", api_key_generator()),
            ("aws_access_key", aws_key_generator()),
            ("github_token", github_pat_generator()),
        ]
        section3 = [
            ("Patient Name", name_generator("en")),
            ("SSN", ssn_generator()),
            ("Phone", phone_generator("en")),
            ("Email", email_generator("en")),
            ("Credit Card Number", credit_card_generator()),
        ]
        return ContentTemplate.incident_report_long("en", [section1, section2, section3])
    
    @staticmethod
    def generate_extreme_mixed() -> str:
        items = [
            ("ssn_1", ssn_generator()),
            ("ssn_2", ssn_generator()),
            ("ssn_3", ssn_generator()),
            ("ein", ein_generator()),
            ("email_1", email_generator("en")),
            ("email_2", email_generator("en")),
            ("phone_1", phone_generator("en")),
            ("phone_2", phone_generator("en")),
            ("password_admin", password_generator("en")),
            ("jwt_token", jwt_generator()),
            ("api_key", api_key_generator()),
            ("credit_card", credit_card_generator()),
            ("iban", iban_generator("GB")),
            ("aws_key", aws_key_generator()),
            ("github_pat", github_pat_generator()),
            ("twilio_sid", twilio_sid_generator()),
        ]
        return ContentTemplate.api_response_mixed("en", items)


# ========================
# Main Generation Logic
# ========================

def generate_massive_corpus(output_dir: Path, docs_per_category: int = 250) -> dict[str, int]:
    """
    Generate massive mock corpus.
    
    Args:
        output_dir: Root directory for output
        docs_per_category: Number of documents per category per language
    
    Returns:
        Dictionary with statistics
    """
    stats = {"total": 0, "by_language": {}, "by_category": {}}
    
    generators_map = {
        "pt-br": BrazilianDocumentGenerator,
        "es": SpanishDocumentGenerator,
        "zh": ChineseDocumentGenerator,
        "en": EnglishDocumentGenerator,
    }
    
    categories = [
        ("sparse-short", "generate_sparse_short"),
        ("moderate-medium", "generate_moderate_medium"),
        ("dense-long", "generate_dense_long"),
        ("extreme-mixed", "generate_extreme_mixed"),
    ]
    
    all_documents = []
    
    for lang, generator_cls in generators_map.items():
        stats["by_language"][lang] = 0
        lang_dir = output_dir / lang
        
        for category_name, method_name in categories:
            category_dir = lang_dir / category_name
            category_dir.mkdir(parents=True, exist_ok=True)
            
            category_key = f"{lang}/{category_name}"
            stats["by_category"][category_key] = 0
            
            method = getattr(generator_cls, method_name)
            
            for i in range(docs_per_category):
                content = method()
                file_name = f"{category_name}-{i+1:04d}.txt"
                file_path = category_dir / file_name
                
                file_path.write_text(content, encoding="utf-8")
                
                # Count sensitive items
                sensitive_count = (
                    len(re.findall(r'\b\d{3}\.\d{3}\.\d{3}-\d{2}\b', content)) +  # CPF
                    len(re.findall(r'\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b', content)) +  # CNPJ
                    len(re.findall(r'\b\d{17}[\dXx]\b', content)) +  # Chinese ID
                    len(re.findall(r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b', content, re.I)) +  # Email
                    len(re.findall(r'\beyJ[A-Za-z0-9_-]+\.', content)) +  # JWT
                    len(re.findall(r'\bsk[-_]', content)) +  # API keys
                    len(re.findall(r'\bAKIA[A-Z0-9]{16}\b', content)) +  # AWS
                    len(re.findall(r'\bghp_[A-Za-z0-9]{36}\b', content)) +  # GitHub
                    len(re.findall(r'\bAC[a-f0-9]{32}\b', content, re.I)) +  # Twilio
                    len(re.findall(r'\b(?:\d[ -]?){13,19}\b', content))  # Credit card
                )
                
                doc = MockDocument(
                    file_name=f"{lang}/{category_name}/{file_name}",
                    category=category_name,
                    language=lang,
                    length_class=category_name.split("-")[1],
                    mask_density=category_name.split("-")[0],
                    sensitive_count=sensitive_count,
                    content=content[:200]  # First 200 chars for CSV
                )
                all_documents.append(doc)
                
                stats["total"] += 1
                stats["by_language"][lang] += 1
                stats["by_category"][category_key] += 1
    
    # Write CSV manifest
    csv_path = output_dir / "corpus-manifest.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as csvfile:
        fieldnames = ["file_name", "category", "language", "length_class", "mask_density", "sensitive_count", "content_preview"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for doc in all_documents:
            writer.writerow({
                "file_name": doc.file_name,
                "category": doc.category,
                "language": doc.language,
                "length_class": doc.length_class,
                "mask_density": doc.mask_density,
                "sensitive_count": doc.sensitive_count,
                "content_preview": doc.content.replace("\n", " ")[:150]
            })
    
    # Write JSON manifest
    json_path = output_dir / "corpus-manifest.json"
    with json_path.open("w", encoding="utf-8") as jsonfile:
        json.dump({
            "generated_at": "2024-03-10",
            "total_documents": stats["total"],
            "statistics": stats,
            "documents": [asdict(doc) for doc in all_documents]
        }, jsonfile, indent=2, ensure_ascii=False)
    
    return stats


def main():
    """Main entry point."""
    import sys
    
    output_dir = Path(__file__).parent.parent.parent / ".tmp" / "input-mocks"
    docs_per_category = int(sys.argv[1]) if len(sys.argv) > 1 else 250
    
    print(f"Generating massive corpus in: {output_dir}")
    print(f"Documents per category: {docs_per_category}")
    print(f"Total expected: {docs_per_category * 4 * 4} documents")
    print()
    
    stats = generate_massive_corpus(output_dir, docs_per_category)
    
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"Total documents: {stats['total']}")
    print("\nBy language:")
    for lang, count in stats["by_language"].items():
        print(f"  {lang}: {count}")
    print("\nBy category:")
    for category, count in sorted(stats["by_category"].items()):
        print(f"  {category}: {count}")
    print("\nManifests created:")
    print("  - corpus-manifest.csv")
    print("  - corpus-manifest.json")


if __name__ == "__main__":
    main()
