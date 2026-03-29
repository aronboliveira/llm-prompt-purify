"""Role-specific scenario templates for the prompt corpus generator.

Provides body templates for 21 additional professional roles that handle
sensitive data and may use LLM prompting in their workflows.

Templates are composed with formality wrappers at generation time.
"""

from __future__ import annotations

import random
import re

# ═══════════════════════════════════════════════════════════════════════
# Formality wrappers (greetings / closings)
# ═══════════════════════════════════════════════════════════════════════

_OPENERS: dict[str, dict[str, list[str]]] = {
    "en": {
        "formal": [
            "Dear Colleague,\n\n",
            "To the appropriate department,\n\n",
            "Good afternoon,\n\n",
            "Dear Team,\n\n",
        ],
        "neutral": [
            "Hi,\n\n",
            "Hey,\n\n",
            "Hello,\n\n",
            "",
        ],
        "informal": [
            "hey ",
            "yo ",
            "ok so ",
            "so ",
            "",
        ],
    },
    "pt-br": {
        "formal": [
            "Prezado(a),\n\n",
            "Ao setor competente,\n\n",
            "Boa tarde,\n\n",
            "Prezada equipe,\n\n",
        ],
        "neutral": [
            "Oi,\n\n",
            "Olá,\n\n",
            "Bom dia,\n\n",
            "",
        ],
        "informal": [
            "e aí ",
            "oi ",
            "mano ",
            "então ",
            "",
        ],
    },
    "es": {
        "formal": [
            "Estimado/a,\n\n",
            "Al departamento correspondiente,\n\n",
            "Buenas tardes,\n\n",
            "Estimado equipo,\n\n",
        ],
        "neutral": [
            "Hola,\n\n",
            "Buenos días,\n\n",
            "Hola equipo,\n\n",
            "",
        ],
        "informal": [
            "oye ",
            "hola ",
            "bueno ",
            "entonces ",
            "",
        ],
    },
    "zh": {
        "formal": [
            "尊敬的同事，\n\n",
            "敬启者，\n\n",
            "尊敬的团队，\n\n",
            "",
        ],
        "neutral": [
            "你好，\n\n",
            "大家好，\n\n",
            "嗨，\n\n",
            "",
        ],
        "informal": [
            "喂 ",
            "嘿 ",
            "行 ",
            "",
        ],
    },
}

_CLOSERS: dict[str, dict[str, list[str]]] = {
    "en": {
        "formal": [
            "\n\nRegards,\n{name}",
            "\n\nBest regards,\n{name}",
            "\n\nRespectfully,\n{name}",
        ],
        "neutral": [
            "\n\nThanks!",
            "\n\nThanks,\n{name}",
            "\n\nLet me know.",
        ],
        "informal": [
            "\n\nlmk",
            "\n\nthanks!",
            "",
            "\n\nhelp pls 😅",
        ],
    },
    "pt-br": {
        "formal": [
            "\n\nAtenciosamente,\n{name}",
            "\n\nAtt,\n{name}",
            "\n\nRespeitosamente,\n{name}",
        ],
        "neutral": [
            "\n\nObrigado(a)!",
            "\n\nAbraço,\n{name}",
            "\n\nValeu!",
        ],
        "informal": [
            "\n\nfalou!",
            "\n\nvaleu!",
            "",
            "\n\ntmj",
        ],
    },
    "es": {
        "formal": [
            "\n\nAtentamente,\n{name}",
            "\n\nSaludos,\n{name}",
            "\n\nRespetuosamente,\n{name}",
        ],
        "neutral": [
            "\n\n¡Gracias!",
            "\n\nSaludos,\n{name}",
            "\n\nAvísame.",
        ],
        "informal": [
            "\n\ngracias!",
            "\n\nsuerte!",
            "",
            "\n\navisame",
        ],
    },
    "zh": {
        "formal": [
            "\n\n此致敬礼，\n{name}",
            "\n\n顺颂商祺，\n{name}",
            "\n\n敬请批示，\n{name}",
        ],
        "neutral": [
            "\n\n谢谢！",
            "\n\n谢谢，\n{name}",
            "\n\n请告知。",
        ],
        "informal": [
            "\n\n谢啦！",
            "\n\n拜拜",
            "",
            "\n\n帮帮忙😅",
        ],
    },
}


# ═══════════════════════════════════════════════════════════════════════
# Extended role list
# ═══════════════════════════════════════════════════════════════════════

COMPOSED_ROLES = [
    "lawyer",
    "doctor",
    "nurse",
    "accountant",
    "hr",
    "recruiter",
    "secretary",
    "teacher",
    "pharmacist",
    "insurance_agent",
    "banker",
    "realtor",
    "social_worker",
    "researcher",
    "therapist",
    "journalist",
    "government",
    "customer_support",
    "marketing",
    "paralegal",
    "tax_preparer",
]


# ═══════════════════════════════════════════════════════════════════════
# Role scenario bodies per language
# ═══════════════════════════════════════════════════════════════════════
#
# Each role has 3 body templates per language.
# Bodies are written in standard register; informality is applied via
# wrappers and a light post-processing pass.

_ROLE_BODIES: dict[str, dict[str, list[str]]] = {
    # ── Law ───────────────────────────────────────────────────────────
    "lawyer": {
        "en": [
            "I need to review the following client file for the upcoming trial:\n\nClient: {name}\nSSN: {ssn}\nEmail: {email}\nPhone: {phone}\n\n{pii}\n\nPlease redact non-relevant PII before sharing with opposing counsel.",
            "Preparing the settlement agreement. Party details:\n\nPlaintiff: {name}, SSN: {ssn}, Address: {address}\nDefendant: {name}, Email: {email}\nPayment: {card}\n\nAll exhibits with PII must be filed under seal.",
            "New client intake — create the matter file:\n\nName: {name}\nAddress: {address}\nSSN: {ssn}\nPhone: {phone}\nEmail: {email}\n\n{pii}\n\nConflict check completed, no issues found.",
        ],
        "pt-br": [
            "Preciso revisar o dossiê do cliente para a audiência:\n\nCliente: {name}\nCPF: {cpf}\nRG: {rg}\nE-mail: {email}\nTelefone: {phone}\n\n{pii}\n\nFavor redigir PII não relevante antes de compartilhar com a parte contrária.",
            "Preparando o acordo de conciliação. Dados das partes:\n\nAutor: {name}, CPF: {cpf}\nRéu: {name}, E-mail: {email}\nCartão: {card}\n\nAnexos com PII devem ser protocolados em sigilo.",
            "Nova admissão de cliente — criar pasta do processo:\n\nNome: {name}\nEndereço: {address}\nCPF: {cpf}\nTelefone: {phone}\nE-mail: {email}\n\n{pii}",
        ],
        "es": [
            "Necesito revisar el expediente del cliente para el juicio:\n\nCliente: {name}\nDNI: {dni}\nCorreo: {email}\nTeléfono: {phone}\n\n{pii}\n\nRedactar la información no relevante antes de compartir con la contraparte.",
            "Preparando el acuerdo de conciliación. Datos de las partes:\n\nDemandante: {name}, DNI: {dni}\nDemandado: {name}, Correo: {email}\nTarjeta: {card}\n\nDocumentos con PII archivados bajo secreto.",
            "Nueva admisión de cliente — crear expediente:\n\nNombre: {name}\nDirección: {address}\nDNI: {dni}\nTeléfono: {phone}\nCorreo: {email}\n\n{pii}",
        ],
        "zh": [
            "我需要审查以下客户档案以备开庭：\n\n客户：{name}\n身份证号：{chinese_id}\n邮箱：{email}\n电话：{phone}\n\n{pii}\n\n请在与对方律师共享前删去不相关个人信息。",
            "正在准备和解协议。当事人信息：\n\n原告：{name}，身份证：{chinese_id}\n被告：{name}，邮箱：{email}\n银行卡：{card}\n\n含个人信息的证据必须保密提交。",
            "新客户接待——创建案件档案：\n\n姓名：{name}\n地址：{address}\n身份证号：{chinese_id}\n电话：{phone}\n邮箱：{email}\n\n{pii}",
        ],
    },
    # ── Healthcare ────────────────────────────────────────────────────
    "doctor": {
        "en": [
            "Referral letter for patient:\n\nPatient: {name}\nSSN: {ssn}\nDOB: 03/15/1985\nPhone: {phone}\nEmail: {email}\n\n{pii}\n\nDiagnosis: Type 2 Diabetes Mellitus. Requesting endocrinology consultation.",
            "Prescription note — please verify before dispensing:\n\nPatient: {name}\nSSN: {ssn}\nAddress: {address}\nAllergies: Penicillin\n\nRx: Metformin 500mg, 1 tab BID\n\nCC: {email}",
            "Discharge summary:\n\nPatient: {name}\nMRN: {ssn}\nAdmitted: 2026-03-20\nDischarged: 2026-03-28\n\nInsurance: Policy #{card}\nEmergency contact: {name}, {phone}\n\n{pii}\n\nFollow-up in 2 weeks.",
        ],
        "pt-br": [
            "Encaminhamento médico:\n\nPaciente: {name}\nCPF: {cpf}\nData de nascimento: 15/03/1985\nTelefone: {phone}\nE-mail: {email}\n\n{pii}\n\nDiagnóstico: Diabetes Mellitus tipo 2. Solicitando consulta com endocrinologista.",
            "Nota de prescrição — verificar antes de dispensar:\n\nPaciente: {name}\nCPF: {cpf}\nEndereço: {address}\nAlergias: Penicilina\n\nRx: Metformina 500mg, 1 comp 2x/dia\n\nCópia: {email}",
            "Resumo de alta:\n\nPaciente: {name}\nCPF: {cpf}\nInternação: 20/03/2026\nAlta: 28/03/2026\n\nConvênio: {card}\nContato de emergência: {name}, {phone}\n\n{pii}\n\nRetorno em 2 semanas.",
        ],
        "es": [
            "Carta de referencia del paciente:\n\nPaciente: {name}\nDNI: {dni}\nFecha de nacimiento: 15/03/1985\nTeléfono: {phone}\nCorreo: {email}\n\n{pii}\n\nDiagnóstico: Diabetes Mellitus tipo 2. Solicito consulta con endocrinología.",
            "Nota de prescripción — verificar antes de dispensar:\n\nPaciente: {name}\nDNI: {dni}\nDirección: {address}\nAlergias: Penicilina\n\nRx: Metformina 500mg, 1 comp cada 12h\n\nCopia: {email}",
            "Resumen de alta:\n\nPaciente: {name}\nDNI: {dni}\nIngreso: 20/03/2026\nAlta: 28/03/2026\n\nSeguro: {card}\nContacto emergencia: {name}, {phone}\n\n{pii}\n\nSeguimiento en 2 semanas.",
        ],
        "zh": [
            "转诊信：\n\n患者：{name}\n身份证号：{chinese_id}\n出生日期：1985-03-15\n电话：{phone}\n邮箱：{email}\n\n{pii}\n\n诊断：2型糖尿病。申请内分泌科会诊。",
            "处方——请在配药前核实：\n\n患者：{name}\n身份证号：{chinese_id}\n地址：{address}\n过敏：青霉素\n\nRx：二甲双胍500mg，每日2次\n\n抄送：{email}",
            "出院小结：\n\n患者：{name}\n身份证号：{chinese_id}\n入院：2026-03-20\n出院：2026-03-28\n\n保险：{card}\n紧急联系人：{name}，{phone}\n\n{pii}\n\n2周后复诊。",
        ],
    },
    "nurse": {
        "en": [
            "Patient intake form completed:\n\nName: {name}\nSSN: {ssn}\nPhone: {phone}\nEmergency contact: {name}, {phone}\nInsurance ID: {card}\nAddress: {address}\n\n{pii}\n\nVitals recorded at admission. Triaged to room 204.",
            "Shift handoff notes:\n\nRoom 204: {name} (SSN: {ssn})\n- IV antibiotics due at 1400\n- Family contact: {name}, {phone}\n- Allergies flagged: sulfa drugs\n- Email for discharge planning: {email}\n\n{pii}",
            "Medication administration record:\n\nPatient: {name}\nMRN: {ssn}\nPharmacy contact: {phone}\n\nAdministered: Insulin 10U SC at 0800\nWitness: {name}\n\n{pii}",
        ],
        "pt-br": [
            "Ficha de admissão preenchida:\n\nNome: {name}\nCPF: {cpf}\nTelefone: {phone}\nContato de emergência: {name}, {phone}\nConvênio: {card}\nEndereço: {address}\n\n{pii}\n\nSinais vitais registrados. Triagem para quarto 204.",
            "Passagem de plantão:\n\nQuarto 204: {name} (CPF: {cpf})\n- Antibiótico IV às 14h\n- Contato familiar: {name}, {phone}\n- Alergias: sulfonamidas\n- E-mail para alta: {email}\n\n{pii}",
            "Registro de administração de medicamentos:\n\nPaciente: {name}\nCPF: {cpf}\nContato farmácia: {phone}\n\nAdministrado: Insulina 10U SC às 08h\nTestemunha: {name}\n\n{pii}",
        ],
        "es": [
            "Formulario de ingreso completado:\n\nNombre: {name}\nDNI: {dni}\nTeléfono: {phone}\nContacto emergencia: {name}, {phone}\nSeguro: {card}\nDirección: {address}\n\n{pii}\n\nSignos vitales registrados. Triaje a habitación 204.",
            "Notas de cambio de turno:\n\nHabitación 204: {name} (DNI: {dni})\n- Antibiótico IV a las 14:00\n- Contacto familiar: {name}, {phone}\n- Alergias: sulfamidas\n- Correo para planificación de alta: {email}\n\n{pii}",
            "Registro de administración de medicamentos:\n\nPaciente: {name}\nDNI: {dni}\nContacto farmacia: {phone}\n\nAdministrado: Insulina 10U SC a las 08:00\nTestigo: {name}\n\n{pii}",
        ],
        "zh": [
            "入院登记表已填写：\n\n姓名：{name}\n身份证号：{chinese_id}\n电话：{phone}\n紧急联系人：{name}，{phone}\n保险号：{card}\n地址：{address}\n\n{pii}\n\n已记录入院生命体征。分诊至204号房。",
            "交接班记录：\n\n204房：{name}（身份证：{chinese_id}）\n- 14:00静脉注射抗生素\n- 家属联系：{name}，{phone}\n- 过敏：磺胺类药物\n- 出院联系邮箱：{email}\n\n{pii}",
            "给药记录：\n\n患者：{name}\n身份证号：{chinese_id}\n药房联系：{phone}\n\n已执行：胰岛素10U皮下注射08:00\n见证人：{name}\n\n{pii}",
        ],
    },
    # ── Finance ───────────────────────────────────────────────────────
    "accountant": {
        "en": [
            "Preparing Q4 tax filing for client:\n\nTaxpayer: {name}\nSSN: {ssn}\nEIN: {ein}\nEmail: {email}\nPhone: {phone}\n\n{pii}\n\nW-2 income: $87,500.00\nDeductions pending verification. Please review before submission.",
            "Payroll processing — March 2026:\n\nEmployee: {name}\nSSN: {ssn}\nDirect deposit: {card}\nEmail: {email}\n\n{pii}\n\nNet pay: $4,250.00. Process by 3/31.",
            "Client financial statement audit:\n\nBusiness: {name}\nEIN: {ein}\nAccount holder: {name}\nBank account: {card}\nAddress: {address}\n\n{pii}\n\nDiscrepancy noted in accounts receivable. Schedule follow-up.",
        ],
        "pt-br": [
            "Preparando declaração de IR do cliente:\n\nContribuinte: {name}\nCPF: {cpf}\nCNPJ: {cnpj}\nE-mail: {email}\nTelefone: {phone}\n\n{pii}\n\nRenda CLT: R$ 87.500,00\nDeduções pendentes de verificação.",
            "Processamento de folha — março 2026:\n\nColaborador: {name}\nCPF: {cpf}\nConta para depósito: {card}\nE-mail: {email}\n\n{pii}\n\nSalário líquido: R$ 4.250,00. Processar até 31/03.",
            "Auditoria de demonstrações financeiras:\n\nEmpresa: {name}\nCNPJ: {cnpj}\nTitular: {name}\nConta bancária: {card}\nEndereço: {address}\n\n{pii}\n\nDiscrepância em contas a receber. Agendar revisão.",
        ],
        "es": [
            "Preparando declaración fiscal del cliente:\n\nContribuyente: {name}\nDNI: {dni}\nCUIT: {cuit}\nCorreo: {email}\nTeléfono: {phone}\n\n{pii}\n\nIngreso gravable: €87.500,00\nDeducciones pendientes de verificación.",
            "Procesamiento de nómina — marzo 2026:\n\nEmpleado: {name}\nDNI: {dni}\nCuenta: {card}\nCorreo: {email}\n\n{pii}\n\nSalario neto: €4.250,00. Procesar antes del 31/03.",
            "Auditoría de estados financieros:\n\nEmpresa: {name}\nCUIT: {cuit}\nTitular: {name}\nCuenta bancaria: {card}\nDirección: {address}\n\n{pii}\n\nDiscrepancia en cuentas por cobrar.",
        ],
        "zh": [
            "准备客户季度纳税申报：\n\n纳税人：{name}\n身份证号：{chinese_id}\n邮箱：{email}\n电话：{phone}\n\n{pii}\n\n工资收入：¥87,500.00\n扣除项待核实。请在提交前审核。",
            "工资处理——2026年3月：\n\n员工：{name}\n身份证号：{chinese_id}\n银行卡：{card}\n邮箱：{email}\n\n{pii}\n\n实发工资：¥4,250.00。3月31日前处理。",
            "客户财务报表审计：\n\n公司：{name}\n账户持有人：{name}\n银行账号：{card}\n地址：{address}\n\n{pii}\n\n应收账款有差异。安排后续跟进。",
        ],
    },
    # ── Human Resources ──────────────────────────────────────────────
    "hr": {
        "en": [
            "New employee onboarding packet:\n\nFull name: {name}\nSSN: {ssn}\nEmail: {email}\nPhone: {phone}\nAddress: {address}\nEmergency contact: {name}, {phone}\n\n{pii}\n\nStart date: April 1, 2026. Please complete I-9 verification.",
            "Performance review — confidential:\n\nEmployee: {name}\nEmployee ID: {ssn}\nManager: {name}\nEmail: {email}\n\n{pii}\n\nRating: Meets Expectations. Salary adjustment: 3.5% effective Q2.",
            "Benefits enrollment update:\n\nEmployee: {name}\nSSN: {ssn}\nDependents:\n- Spouse: {name}, SSN: {ssn}\n- Child: {name}\n\nPlan: Family PPO\nPayment: {card}\nEmail: {email}\n\n{pii}",
        ],
        "pt-br": [
            "Pacote de admissão — novo colaborador:\n\nNome completo: {name}\nCPF: {cpf}\nRG: {rg}\nE-mail: {email}\nTelefone: {phone}\nEndereço: {address}\nContato emergência: {name}, {phone}\n\n{pii}\n\nData de início: 01/04/2026. Favor completar o eSocial.",
            "Avaliação de desempenho — confidencial:\n\nColaborador: {name}\nCPF: {cpf}\nGestor: {name}\nE-mail: {email}\n\n{pii}\n\nAvaliação: Atende expectativas. Reajuste salarial: 3,5% a partir do Q2.",
            "Atualização de benefícios:\n\nColaborador: {name}\nCPF: {cpf}\nDependentes:\n- Cônjuge: {name}, CPF: {cpf}\n- Filho(a): {name}\n\nPlano: Familiar\nCartão: {card}\nE-mail: {email}\n\n{pii}",
        ],
        "es": [
            "Paquete de incorporación — nuevo empleado:\n\nNombre: {name}\nDNI: {dni}\nCorreo: {email}\nTeléfono: {phone}\nDirección: {address}\nContacto emergencia: {name}, {phone}\n\n{pii}\n\nFecha de inicio: 1 de abril de 2026.",
            "Evaluación de desempeño — confidencial:\n\nEmpleado: {name}\nDNI: {dni}\nSupervisor: {name}\nCorreo: {email}\n\n{pii}\n\nCalificación: Cumple expectativas. Ajuste salarial: 3,5% a partir del Q2.",
            "Actualización de beneficios:\n\nEmpleado: {name}\nDNI: {dni}\nDependientes:\n- Cónyuge: {name}, DNI: {dni}\n- Hijo/a: {name}\n\nPlan: Familiar\nTarjeta: {card}\nCorreo: {email}\n\n{pii}",
        ],
        "zh": [
            "新员工入职材料：\n\n姓名：{name}\n身份证号：{chinese_id}\n邮箱：{email}\n电话：{phone}\n地址：{address}\n紧急联系人：{name}，{phone}\n\n{pii}\n\n入职日期：2026年4月1日。请完成社保登记。",
            "绩效评估——保密：\n\n员工：{name}\n身份证号：{chinese_id}\n主管：{name}\n邮箱：{email}\n\n{pii}\n\n评级：达标。薪资调整：Q2起上调3.5%。",
            "福利登记更新：\n\n员工：{name}\n身份证号：{chinese_id}\n家属：\n- 配偶：{name}，身份证：{chinese_id}\n- 子女：{name}\n\n方案：家庭版\n银行卡：{card}\n邮箱：{email}\n\n{pii}",
        ],
    },
    "recruiter": {
        "en": [
            "Candidate profile for the Senior Engineer role:\n\nName: {name}\nEmail: {email}\nPhone: {phone}\nCurrent salary: $125K\n\n{pii}\n\nInterviewed 3/25. Strong technical skills. Moving to final round.",
            "Background check request:\n\nCandidate: {name}\nSSN: {ssn}\nDOB: 1990-06-15\nAddress: {address}\nEmail: {email}\n\n{pii}\n\nPlease complete verification before the offer letter goes out.",
            "Offer letter preparation:\n\nCandidate: {name}\nEmail: {email}\nPhone: {phone}\nStart date: May 1, 2026\nSalary: $140,000\n\nDirect deposit setup: {card}\nSSN for payroll: {ssn}\n\n{pii}",
        ],
        "pt-br": [
            "Perfil do candidato para vaga de Engenheiro Sênior:\n\nNome: {name}\nE-mail: {email}\nTelefone: {phone}\nSalário atual: R$ 15.000\n\n{pii}\n\nEntrevistado em 25/03. Boas habilidades técnicas. Avançando para fase final.",
            "Solicitação de verificação de antecedentes:\n\nCandidato: {name}\nCPF: {cpf}\nData de nascimento: 15/06/1990\nEndereço: {address}\nE-mail: {email}\n\n{pii}\n\nFavor completar antes de enviar a proposta.",
            "Preparação de proposta:\n\nCandidato: {name}\nE-mail: {email}\nTelefone: {phone}\nInício: 01/05/2026\nSalário: R$ 18.000\n\nDados bancários: {card}\nCPF: {cpf}\n\n{pii}",
        ],
        "es": [
            "Perfil del candidato para Ingeniero Senior:\n\nNombre: {name}\nCorreo: {email}\nTeléfono: {phone}\nSalario actual: €45.000\n\n{pii}\n\nEntrevistado el 25/03. Buenas habilidades técnicas.",
            "Solicitud de verificación de antecedentes:\n\nCandidato: {name}\nDNI: {dni}\nDirección: {address}\nCorreo: {email}\n\n{pii}\n\nCompletar antes de enviar la oferta.",
            "Preparación de oferta:\n\nCandidato: {name}\nCorreo: {email}\nTeléfono: {phone}\nInicio: 01/05/2026\nSalario: €52.000\n\nDatos bancarios: {card}\nDNI: {dni}\n\n{pii}",
        ],
        "zh": [
            "高级工程师岗位候选人资料：\n\n姓名：{name}\n邮箱：{email}\n电话：{phone}\n当前薪资：¥25,000/月\n\n{pii}\n\n3/25面试完成。技术能力较强。进入最终轮。",
            "背景调查申请：\n\n候选人：{name}\n身份证号：{chinese_id}\n地址：{address}\n邮箱：{email}\n\n{pii}\n\n请在发出offer前完成核实。",
            "Offer准备：\n\n候选人：{name}\n邮箱：{email}\n电话：{phone}\n入职日期：2026年5月1日\n薪资：¥30,000/月\n\n银行卡：{card}\n身份证号：{chinese_id}\n\n{pii}",
        ],
    },
    # ── Administrative ───────────────────────────────────────────────
    "secretary": {
        "en": [
            "Meeting scheduled for Monday 3/30:\n\nAttendees:\n- {name}, {email}\n- {name}, {phone}\n- {name}, {email}\n\nRoom: Conference B\nDial-in: {phone}\n\nPlease send calendar invites to all participants.",
            "Travel booking for {name}:\n\nPassport: P12345678\nEmail: {email}\nPhone: {phone}\nCredit card for expenses: {card}\nHotel address: {address}\n\n{pii}\n\nFlight: JFK→LAX, 4/5, Delta DL402",
            "Expense report — March 2026:\n\nEmployee: {name}\nDepartment: Marketing\nCorporate card: {card}\nReimbursement to: {card}\nEmail: {email}\n\n{pii}\n\nTotal: $2,847.50. Manager approval needed.",
        ],
        "pt-br": [
            "Reunião agendada para segunda 30/03:\n\nParticipantes:\n- {name}, {email}\n- {name}, {phone}\n- {name}, {email}\n\nSala: Conferência B\nDiscagem: {phone}\n\nFavor enviar convites de calendário.",
            "Reserva de viagem para {name}:\n\nPassaporte: P12345678\nE-mail: {email}\nTelefone: {phone}\nCartão corporativo: {card}\nEndereço do hotel: {address}\n\n{pii}\n\nVoo: GRU→SSA, 05/04, LATAM LA3421",
            "Relatório de despesas — março 2026:\n\nColaborador: {name}\nDepartamento: Marketing\nCartão corporativo: {card}\nReembolso para: {card}\nE-mail: {email}\n\n{pii}\n\nTotal: R$ 2.847,50. Aprovação do gestor necessária.",
        ],
        "es": [
            "Reunión programada para el lunes 30/03:\n\nAsistentes:\n- {name}, {email}\n- {name}, {phone}\n- {name}, {email}\n\nSala: Conferencia B\nMarcación: {phone}\n\nEnviar invitaciones de calendario.",
            "Reserva de viaje para {name}:\n\nPasaporte: P12345678\nCorreo: {email}\nTeléfono: {phone}\nTarjeta corporativa: {card}\nDirección hotel: {address}\n\n{pii}\n\nVuelo: MAD→BCN, 05/04, Iberia IB1234",
            "Informe de gastos — marzo 2026:\n\nEmpleado: {name}\nDepartamento: Marketing\nTarjeta corporativa: {card}\nReembolso a: {card}\nCorreo: {email}\n\n{pii}\n\nTotal: €2.847,50.",
        ],
        "zh": [
            "周一3/30会议安排：\n\n参会人员：\n- {name}，{email}\n- {name}，{phone}\n- {name}，{email}\n\n会议室：B厅\n拨入号码：{phone}\n\n请发送日历邀请。",
            "为{name}预订差旅：\n\n护照号：P12345678\n邮箱：{email}\n电话：{phone}\n报销用卡：{card}\n酒店地址：{address}\n\n{pii}\n\n航班：PEK→SHA，4/5，CA1234",
            "报销单——2026年3月：\n\n员工：{name}\n部门：市场部\n公司卡：{card}\n报销至：{card}\n邮箱：{email}\n\n{pii}\n\n总计：¥2,847.50。需经理审批。",
        ],
    },
    # ── Education ────────────────────────────────────────────────────
    "teacher": {
        "en": [
            "Grade submission for Biology 101 — Spring 2026:\n\nStudent: {name}\nStudent ID: {ssn}\nEmail: {email}\nFinal grade: B+\n\nParent/guardian contact: {name}, {phone}, {email}\n\n{pii}\n\nPlease update the registrar system.",
            "Recommendation letter — confidential:\n\nStudent: {name}\nID: {ssn}\nGPA: 3.7\nEmail: {email}\nPhone: {phone}\n\n{pii}\n\nI recommend this student for the graduate program without reservation.",
            "Attendance concern notification:\n\nStudent: {name}\nParent: {name}\nParent email: {email}\nParent phone: {phone}\n\n{pii}\n\nThe student has missed 5 consecutive days. Requesting parent conference.",
        ],
        "pt-br": [
            "Lançamento de notas — Biologia 101, 1º semestre 2026:\n\nAluno(a): {name}\nRA: {cpf}\nE-mail: {email}\nNota final: 8,5\n\nContato responsável: {name}, {phone}, {email}\n\n{pii}\n\nFavor atualizar o sistema acadêmico.",
            "Carta de recomendação — confidencial:\n\nAluno(a): {name}\nCPF: {cpf}\nCR: 8,7\nE-mail: {email}\nTelefone: {phone}\n\n{pii}\n\nRecomendo este aluno para o programa de pós-graduação sem ressalvas.",
            "Notificação de frequência:\n\nAluno(a): {name}\nResponsável: {name}\nE-mail responsável: {email}\nTelefone: {phone}\n\n{pii}\n\nO aluno faltou 5 dias consecutivos. Solicitando reunião com responsável.",
        ],
        "es": [
            "Entrega de calificaciones — Biología 101, Primavera 2026:\n\nEstudiante: {name}\nDNI: {dni}\nCorreo: {email}\nNota final: 8,5\n\nContacto tutor: {name}, {phone}, {email}\n\n{pii}\n\nActualizar el sistema académico.",
            "Carta de recomendación — confidencial:\n\nEstudiante: {name}\nDNI: {dni}\nPromedio: 8,7\nCorreo: {email}\nTeléfono: {phone}\n\n{pii}\n\nRecomiendo a este estudiante para el programa de postgrado.",
            "Notificación de asistencia:\n\nEstudiante: {name}\nTutor: {name}\nCorreo tutor: {email}\nTeléfono: {phone}\n\n{pii}\n\nEl estudiante ha faltado 5 días consecutivos.",
        ],
        "zh": [
            "成绩提交——生物101，2026春季：\n\n学生：{name}\n身份证号：{chinese_id}\n邮箱：{email}\n期末成绩：85分\n\n家长联系方式：{name}，{phone}，{email}\n\n{pii}\n\n请更新教务系统。",
            "推荐信——保密：\n\n学生：{name}\n身份证号：{chinese_id}\nGPA：3.7\n邮箱：{email}\n电话：{phone}\n\n{pii}\n\n我毫无保留地推荐该生进入研究生项目。",
            "出勤异常通知：\n\n学生：{name}\n家长：{name}\n家长邮箱：{email}\n家长电话：{phone}\n\n{pii}\n\n该生已连续缺勤5天。请求家长面谈。",
        ],
    },
    # ── Pharmacy ──────────────────────────────────────────────────────
    "pharmacist": {
        "en": [
            "Prescription verification request:\n\nPatient: {name}\nSSN: {ssn}\nDOB: 1978-11-22\nPhone: {phone}\nInsurance ID: {card}\n\nRx: Oxycodone 10mg #30\nPrescriber: Dr. {name}, DEA# AB1234567\n\n{pii}\n\nCDMP compliance check required.",
            "Drug interaction alert:\n\nPatient: {name}\nEmail: {email}\nPhone: {phone}\nCurrent medications:\n- Warfarin 5mg\n- New Rx: Amoxicillin 500mg\n\nInsurance: {card}\n\n{pii}\n\nINR monitoring recommended. Notify prescriber.",
            "Controlled substance log entry:\n\nDate: 2026-03-29\nPatient: {name}\nSSN: {ssn}\nRx#: 7654321\nDrug: Adderall 20mg #60\nPharmacist: {name}\n\n{pii}\n\nState PDMP submission completed.",
        ],
        "pt-br": [
            "Verificação de receita:\n\nPaciente: {name}\nCPF: {cpf}\nData de nascimento: 22/11/1978\nTelefone: {phone}\nConvênio: {card}\n\nRx: Oxicodona 10mg #30\nPrescrito por: Dr(a). {name}\n\n{pii}\n\nVerificação SNGPC necessária.",
            "Alerta de interação medicamentosa:\n\nPaciente: {name}\nE-mail: {email}\nTelefone: {phone}\nMedicamentos atuais:\n- Varfarina 5mg\n- Nova receita: Amoxicilina 500mg\n\nConvênio: {card}\n\n{pii}\n\nMonitoramento de INR recomendado.",
            "Registro de medicamento controlado:\n\nData: 29/03/2026\nPaciente: {name}\nCPF: {cpf}\nReceita#: 7654321\nMedicamento: Ritalina 20mg #60\nFarmacêutico: {name}\n\n{pii}",
        ],
        "es": [
            "Solicitud de verificación de receta:\n\nPaciente: {name}\nDNI: {dni}\nFecha de nacimiento: 22/11/1978\nTeléfono: {phone}\nSeguro: {card}\n\nRx: Oxicodona 10mg #30\nPrescriptor: Dr(a). {name}\n\n{pii}",
            "Alerta de interacción medicamentosa:\n\nPaciente: {name}\nCorreo: {email}\nTeléfono: {phone}\nMedicamentos actuales:\n- Warfarina 5mg\n- Nueva receta: Amoxicilina 500mg\n\nSeguro: {card}\n\n{pii}",
            "Registro de sustancia controlada:\n\nFecha: 29/03/2026\nPaciente: {name}\nDNI: {dni}\nReceta#: 7654321\nMedicamento: Metilfenidato 20mg #60\nFarmacéutico: {name}\n\n{pii}",
        ],
        "zh": [
            "处方审核请求：\n\n患者：{name}\n身份证号：{chinese_id}\n出生日期：1978-11-22\n电话：{phone}\n保险号：{card}\n\n处方：奥施康定10mg #30\n处方医生：{name}\n\n{pii}",
            "药物相互作用警报：\n\n患者：{name}\n邮箱：{email}\n电话：{phone}\n当前用药：\n- 华法林5mg\n- 新处方：阿莫西林500mg\n\n保险：{card}\n\n{pii}\n\n建议监测INR。通知处方医生。",
            "管制药品登记：\n\n日期：2026-03-29\n患者：{name}\n身份证号：{chinese_id}\n处方号：7654321\n药品：利他林20mg #60\n药剂师：{name}\n\n{pii}",
        ],
    },
    # ── Insurance ────────────────────────────────────────────────────
    "insurance_agent": {
        "en": [
            "New claim submission:\n\nPolicyholder: {name}\nSSN: {ssn}\nPolicy#: AH-2026-7891\nEmail: {email}\nPhone: {phone}\nAddress: {address}\n\n{pii}\n\nIncident date: 2026-03-15\nEstimated damage: $12,500\nAdjuster assigned: {name}",
            "Underwriting assessment:\n\nApplicant: {name}\nSSN: {ssn}\nDOB: 1985-07-12\nOccupation: Software Engineer\nAnnual income: $130,000\nCredit score: 745\n\nPayment method: {card}\nEmail: {email}\n\n{pii}\n\nRisk class: Standard. Recommend approval.",
            "Policy renewal notice:\n\nInsured: {name}\nAddress: {address}\nPhone: {phone}\nEmail: {email}\n\n{pii}\n\nPremium: $245/month. Auto-pay: {card}\nRenewal date: 05/01/2026",
        ],
        "pt-br": [
            "Nova solicitação de sinistro:\n\nSegurado: {name}\nCPF: {cpf}\nApólice#: AH-2026-7891\nE-mail: {email}\nTelefone: {phone}\nEndereço: {address}\n\n{pii}\n\nData do sinistro: 15/03/2026\nDano estimado: R$ 12.500\nPerito designado: {name}",
            "Análise de subscrição:\n\nSolicitante: {name}\nCPF: {cpf}\nNascimento: 12/07/1985\nProfissão: Engenheiro de Software\nRenda anual: R$ 180.000\n\nPagamento: {card}\nE-mail: {email}\n\n{pii}\n\nClasse de risco: Padrão. Aprovação recomendada.",
            "Aviso de renovação:\n\nSegurado: {name}\nEndereço: {address}\nTelefone: {phone}\nE-mail: {email}\n\n{pii}\n\nPrêmio: R$ 245/mês. Débito automático: {card}\nRenovação: 01/05/2026",
        ],
        "es": [
            "Nueva solicitud de siniestro:\n\nAsegurado: {name}\nDNI: {dni}\nPóliza#: AH-2026-7891\nCorreo: {email}\nTeléfono: {phone}\nDirección: {address}\n\n{pii}\n\nFecha del incidente: 15/03/2026\nDaño estimado: €12.500\nPerito asignado: {name}",
            "Evaluación de suscripción:\n\nSolicitante: {name}\nDNI: {dni}\nNacimiento: 12/07/1985\nProfesión: Ingeniero de Software\nIngreso anual: €65.000\n\nMétodo de pago: {card}\nCorreo: {email}\n\n{pii}",
            "Aviso de renovación:\n\nAsegurado: {name}\nDirección: {address}\nTeléfono: {phone}\nCorreo: {email}\n\n{pii}\n\nPrima: €245/mes. Domiciliación: {card}\nRenovación: 01/05/2026",
        ],
        "zh": [
            "新保险理赔提交：\n\n投保人：{name}\n身份证号：{chinese_id}\n保单号：AH-2026-7891\n邮箱：{email}\n电话：{phone}\n地址：{address}\n\n{pii}\n\n事故日期：2026-03-15\n预估损失：¥12,500\n定损员：{name}",
            "承保评估：\n\n申请人：{name}\n身份证号：{chinese_id}\n出生：1985-07-12\n职业：软件工程师\n年收入：¥180,000\n\n付款方式：{card}\n邮箱：{email}\n\n{pii}\n\n风险等级：标准。建议批准。",
            "保单续期通知：\n\n被保人：{name}\n地址：{address}\n电话：{phone}\n邮箱：{email}\n\n{pii}\n\n保费：¥245/月。自动扣款：{card}\n续期日期：2026/05/01",
        ],
    },
    # ── Banking ──────────────────────────────────────────────────────
    "banker": {
        "en": [
            "New account opening:\n\nApplicant: {name}\nSSN: {ssn}\nEmail: {email}\nPhone: {phone}\nAddress: {address}\n\n{pii}\n\nAccount type: Checking\nInitial deposit: $5,000\nDebit card issued: {card}\n\nKYC verification completed.",
            "Loan application review:\n\nBorrower: {name}\nSSN: {ssn}\nEmployer: {name}\nAnnual income: $95,000\nCredit score: 720\nProperty address: {address}\n\nPayment account: {card}\nEmail: {email}\n\n{pii}\n\nLTV: 80%. Recommend conditional approval.",
            "Fraud investigation — wire transfer:\n\nAccount holder: {name}\nAccount#: {card}\nSSN: {ssn}\nEmail: {email}\n\n{pii}\n\nSuspicious wire: $15,000 to offshore account on 3/27.\nSAR filing required within 30 days.",
        ],
        "pt-br": [
            "Abertura de conta:\n\nSolicitante: {name}\nCPF: {cpf}\nE-mail: {email}\nTelefone: {phone}\nEndereço: {address}\n\n{pii}\n\nTipo: Conta corrente\nDepósito inicial: R$ 5.000\nCartão emitido: {card}\n\nKYC concluído.",
            "Análise de empréstimo:\n\nMutuário: {name}\nCPF: {cpf}\nEmpregador: {name}\nRenda anual: R$ 120.000\nScore: 720\nEndereço do imóvel: {address}\n\nConta pagamento: {card}\nE-mail: {email}\n\n{pii}",
            "Investigação de fraude — transferência:\n\nTitular: {name}\nConta: {card}\nCPF: {cpf}\nE-mail: {email}\n\n{pii}\n\nTransferência suspeita: R$ 15.000 para conta no exterior em 27/03.\nReportagem ao COAF necessária.",
        ],
        "es": [
            "Apertura de cuenta:\n\nSolicitante: {name}\nDNI: {dni}\nCorreo: {email}\nTeléfono: {phone}\nDirección: {address}\n\n{pii}\n\nTipo: Cuenta corriente\nDepósito inicial: €5.000\nTarjeta emitida: {card}\n\nVerificación KYC completada.",
            "Revisión de solicitud de préstamo:\n\nPrestatario: {name}\nDNI: {dni}\nEmpleador: {name}\nIngreso anual: €65.000\nPuntuación crediticia: 720\nDirección del inmueble: {address}\n\nCuenta de pago: {card}\nCorreo: {email}\n\n{pii}",
            "Investigación de fraude — transferencia:\n\nTitular: {name}\nCuenta: {card}\nDNI: {dni}\nCorreo: {email}\n\n{pii}\n\nTransferencia sospechosa: €15.000 a cuenta offshore el 27/03.\nReporte SAR requerido.",
        ],
        "zh": [
            "新开户：\n\n申请人：{name}\n身份证号：{chinese_id}\n邮箱：{email}\n电话：{phone}\n地址：{address}\n\n{pii}\n\n账户类型：活期\n首存：¥5,000\n借记卡号：{card}\n\nKYC验证完成。",
            "贷款申请审核：\n\n借款人：{name}\n身份证号：{chinese_id}\n雇主：{name}\n年收入：¥180,000\n信用评分：720\n房产地址：{address}\n\n还款账户：{card}\n邮箱：{email}\n\n{pii}",
            "欺诈调查——电汇：\n\n账户持有人：{name}\n卡号：{card}\n身份证号：{chinese_id}\n邮箱：{email}\n\n{pii}\n\n可疑电汇：3/27向境外账户汇款¥15,000。\n需在30天内提交可疑交易报告。",
        ],
    },
    # ── Real Estate ──────────────────────────────────────────────────
    "realtor": {
        "en": [
            "Closing documents — buyer information:\n\nBuyer: {name}\nSSN: {ssn}\nEmail: {email}\nPhone: {phone}\nAddress: {address}\n\n{pii}\n\nMortgage pre-approval: $450K\nLender: First National Bank\nPayment: {card}\n\nClosing date: 04/15/2026",
            "Rental application review:\n\nApplicant: {name}\nSSN: {ssn}\nMonthly income: $6,500\nEmployer: {name}\nEmail: {email}\nPhone: {phone}\n\n{pii}\n\nCredit check: Approved\nSecurity deposit: $2,400 via {card}",
            "Listing agreement — seller information:\n\nSeller: {name}\nProperty: {address}\nEmail: {email}\nPhone: {phone}\nSSN (for tax reporting): {ssn}\n\n{pii}\n\nListing price: $525,000\nCommission: 5%",
        ],
        "pt-br": [
            "Documentos de fechamento — informações do comprador:\n\nComprador: {name}\nCPF: {cpf}\nE-mail: {email}\nTelefone: {phone}\nEndereço: {address}\n\n{pii}\n\nPré-aprovação de financiamento: R$ 450.000\nPagamento: {card}\n\nData de escritura: 15/04/2026",
            "Análise de locação:\n\nInquilino: {name}\nCPF: {cpf}\nRenda mensal: R$ 8.000\nE-mail: {email}\nTelefone: {phone}\n\n{pii}\n\nAnálise de crédito: Aprovado\nCalção: R$ 3.600 via {card}",
            "Contrato de venda — dados do vendedor:\n\nVendedor: {name}\nImóvel: {address}\nE-mail: {email}\nTelefone: {phone}\nCPF: {cpf}\n\n{pii}\n\nPreço: R$ 525.000\nComissão: 5%",
        ],
        "es": [
            "Documentos de cierre — información del comprador:\n\nComprador: {name}\nDNI: {dni}\nCorreo: {email}\nTeléfono: {phone}\nDirección: {address}\n\n{pii}\n\nPre-aprobación hipotecaria: €250.000\nPago: {card}\n\nFecha de cierre: 15/04/2026",
            "Revisión de solicitud de alquiler:\n\nSolicitante: {name}\nDNI: {dni}\nIngreso mensual: €3.500\nCorreo: {email}\nTeléfono: {phone}\n\n{pii}\n\nValoración crediticia: Aprobado\nFianza: €2.400 via {card}",
            "Contrato de venta — datos del vendedor:\n\nVendedor: {name}\nPropiedad: {address}\nCorreo: {email}\nTeléfono: {phone}\nDNI: {dni}\n\n{pii}\n\nPrecio: €325.000\nComisión: 5%",
        ],
        "zh": [
            "过户文件——买方信息：\n\n买方：{name}\n身份证号：{chinese_id}\n邮箱：{email}\n电话：{phone}\n地址：{address}\n\n{pii}\n\n贷款预批：¥450万\n付款卡：{card}\n\n过户日期：2026/04/15",
            "租赁申请审核：\n\n申请人：{name}\n身份证号：{chinese_id}\n月收入：¥25,000\n邮箱：{email}\n电话：{phone}\n\n{pii}\n\n信用审核：通过\n押金：¥4,800 via {card}",
            "挂牌协议——卖方信息：\n\n卖方：{name}\n房产：{address}\n邮箱：{email}\n电话：{phone}\n身份证号：{chinese_id}\n\n{pii}\n\n挂牌价：¥525万\n佣金：2%",
        ],
    },
    # ── Social Services ──────────────────────────────────────────────
    "social_worker": {
        "en": [
            "Case file — family services:\n\nClient: {name}\nSSN: {ssn}\nAddress: {address}\nPhone: {phone}\nEmail: {email}\n\n{pii}\n\nHousehold: 2 adults, 3 children\nReferral source: School counselor\nCase opened: 03/15/2026",
            "Child welfare assessment:\n\nChild: {name}\nParent/Guardian: {name}\nSSN (guardian): {ssn}\nAddress: {address}\nPhone: {phone}\n\n{pii}\n\nSchool: Lincoln Elementary\nTeacher contact: {name}, {email}\n\nHome visit scheduled: 04/02/2026",
            "Court-ordered evaluation summary:\n\nSubject: {name}\nSSN: {ssn}\nAttorney: {name}, {email}\nPhone: {phone}\n\n{pii}\n\nRecommendation: Continued supervised visitation. Review in 90 days.",
        ],
        "pt-br": [
            "Ficha de atendimento — serviço social:\n\nAtendido: {name}\nCPF: {cpf}\nEndereço: {address}\nTelefone: {phone}\nE-mail: {email}\n\n{pii}\n\nComposição familiar: 2 adultos, 3 crianças\nEncaminhamento: Orientador escolar\nCaso aberto: 15/03/2026",
            "Avaliação de proteção infantil:\n\nCriança: {name}\nResponsável: {name}\nCPF (responsável): {cpf}\nEndereço: {address}\nTelefone: {phone}\n\n{pii}\n\nEscola: E.M. José Bonifácio\nProfessor(a): {name}, {email}\n\nVisita domiciliar: 02/04/2026",
            "Relatório de avaliação judicial:\n\nAvaliado: {name}\nCPF: {cpf}\nAdvogado: {name}, {email}\nTelefone: {phone}\n\n{pii}\n\nRecomendação: Manter visitação supervisionada. Revisão em 90 dias.",
        ],
        "es": [
            "Expediente — servicios sociales:\n\nCliente: {name}\nDNI: {dni}\nDirección: {address}\nTeléfono: {phone}\nCorreo: {email}\n\n{pii}\n\nHogar: 2 adultos, 3 niños\nFuente de referencia: Orientador escolar\nCaso abierto: 15/03/2026",
            "Evaluación de bienestar infantil:\n\nNiño/a: {name}\nTutor: {name}\nDNI (tutor): {dni}\nDirección: {address}\nTeléfono: {phone}\n\n{pii}\n\nEscuela: C.P. San José\nProfesor: {name}, {email}",
            "Informe de evaluación judicial:\n\nEvaluado: {name}\nDNI: {dni}\nAbogado: {name}, {email}\nTeléfono: {phone}\n\n{pii}",
        ],
        "zh": [
            "案例档案——社会服务：\n\n服务对象：{name}\n身份证号：{chinese_id}\n地址：{address}\n电话：{phone}\n邮箱：{email}\n\n{pii}\n\n家庭构成：2成人3儿童\n转介来源：学校辅导员\n立案日期：2026-03-15",
            "儿童福利评估：\n\n儿童：{name}\n监护人：{name}\n身份证号（监护人）：{chinese_id}\n地址：{address}\n电话：{phone}\n\n{pii}\n\n学校：北京市实验小学\n班主任：{name}，{email}",
            "法院委托评估报告：\n\n评估对象：{name}\n身份证号：{chinese_id}\n律师：{name}，{email}\n电话：{phone}\n\n{pii}\n\n建议：继续监护探视。90天后复审。",
        ],
    },
    # ── Research ─────────────────────────────────────────────────────
    "researcher": {
        "en": [
            "Clinical trial participant enrollment:\n\nParticipant: {name}\nSSN: {ssn}\nEmail: {email}\nPhone: {phone}\n\n{pii}\n\nTrial: NCT-2026-0127\nConsent form signed: Yes\nRandomization arm: Treatment B\n\nIRB approval: #2026-0042",
            "Survey data export — anonymization needed:\n\nRespondent ID: R-4827\nEmail: {email}\nAge: 34\nIncome bracket: $75-100K\n\n{pii}\n\nNote: email and SSN must be stripped before sharing with co-investigators.",
            "Research collaboration data sharing:\n\nPI: Dr. {name}\nInstitution email: {email}\n\nDataset contains:\n- 500 participant records\n- Fields: {pii}\n\nData use agreement (DUA) required before transfer.",
        ],
        "pt-br": [
            "Inscrição em ensaio clínico:\n\nParticipante: {name}\nCPF: {cpf}\nE-mail: {email}\nTelefone: {phone}\n\n{pii}\n\nEnsaio: NCT-2026-0127\nTCLE assinado: Sim\nBraço: Tratamento B\n\nAprovação CEP: #2026-0042",
            "Exportação de dados de pesquisa — anonimização necessária:\n\nID Respondente: R-4827\nE-mail: {email}\nIdade: 34\nFaixa de renda: R$ 8-12K\n\n{pii}\n\nNota: e-mail e CPF devem ser removidos antes de compartilhar.",
            "Compartilhamento de dados de pesquisa:\n\nPI: Dr(a). {name}\nE-mail institucional: {email}\n\nDataset contém:\n- 500 registros de participantes\n- Campos: {pii}\n\nAcordo de uso de dados necessário antes da transferência.",
        ],
        "es": [
            "Inscripción en ensayo clínico:\n\nParticipante: {name}\nDNI: {dni}\nCorreo: {email}\nTeléfono: {phone}\n\n{pii}\n\nEnsayo: NCT-2026-0127\nConsentimiento firmado: Sí\nBrazo: Tratamiento B\n\nAprobación CEIC: #2026-0042",
            "Exportación de datos — anonimización requerida:\n\nID Encuestado: R-4827\nCorreo: {email}\nEdad: 34\n\n{pii}\n\nNota: correo y DNI deben eliminarse antes de compartir.",
            "Colaboración de investigación:\n\nIP: Dr(a). {name}\nCorreo institucional: {email}\n\nDataset contiene:\n- 500 registros de participantes\n- Campos: {pii}\n\nAcuerdo de uso de datos requerido.",
        ],
        "zh": [
            "临床试验参与者登记：\n\n参与者：{name}\n身份证号：{chinese_id}\n邮箱：{email}\n电话：{phone}\n\n{pii}\n\n试验：NCT-2026-0127\n知情同意：已签\n随机分组：B组治疗\n\n伦理批准：#2026-0042",
            "调查数据导出——需脱敏：\n\n受访者ID：R-4827\n邮箱：{email}\n年龄：34\n\n{pii}\n\n注意：在与合作研究者共享前须删除邮箱和身份证号。",
            "科研数据共享：\n\nPI：{name}教授\n机构邮箱：{email}\n\n数据集包含：\n- 500条参与者记录\n- 字段：{pii}\n\n需签署数据使用协议后方可传输。",
        ],
    },
    # ── Mental Health ────────────────────────────────────────────────
    "therapist": {
        "en": [
            "Session notes — confidential:\n\nClient: {name}\nSSN: {ssn}\nDOB: 1992-04-18\nPhone: {phone}\nEmail: {email}\n\n{pii}\n\nSession#: 12\nDiagnosis: Generalized Anxiety Disorder (F41.1)\nProgress: Moderate improvement with CBT techniques.",
            "Treatment plan update:\n\nClient: {name}\nInsurance: {card}\nEmergency contact: {name}, {phone}\nEmail: {email}\n\n{pii}\n\nGoals:\n1. Reduce panic frequency from 3x/week to 1x/week\n2. Sleep improvement\n3. Return to work full-time by Q3",
            "Referral to psychiatry:\n\nPatient: {name}\nSSN: {ssn}\nCurrent therapist: {name}, {email}\nPhone: {phone}\n\n{pii}\n\nReason: Patient may benefit from pharmacological intervention alongside ongoing CBT.",
        ],
        "pt-br": [
            "Anotações de sessão — confidencial:\n\nPaciente: {name}\nCPF: {cpf}\nNascimento: 18/04/1992\nTelefone: {phone}\nE-mail: {email}\n\n{pii}\n\nSessão#: 12\nDiagnóstico: Transtorno de Ansiedade Generalizada (F41.1)\nProgresso: Melhora moderada com técnicas de TCC.",
            "Atualização do plano terapêutico:\n\nPaciente: {name}\nConvênio: {card}\nContato emergência: {name}, {phone}\nE-mail: {email}\n\n{pii}\n\nMetas:\n1. Reduzir crises de pânico de 3x/semana para 1x/semana\n2. Melhora do sono\n3. Retorno ao trabalho integral até Q3",
            "Encaminhamento para psiquiatria:\n\nPaciente: {name}\nCPF: {cpf}\nTerapeuta atual: {name}, {email}\nTelefone: {phone}\n\n{pii}\n\nMotivo: Paciente pode se beneficiar de intervenção farmacológica junto à TCC.",
        ],
        "es": [
            "Notas de sesión — confidencial:\n\nCliente: {name}\nDNI: {dni}\nNacimiento: 18/04/1992\nTeléfono: {phone}\nCorreo: {email}\n\n{pii}\n\nSesión#: 12\nDiagnóstico: Trastorno de Ansiedad Generalizada (F41.1)\nProgreso: Mejora moderada con técnicas de TCC.",
            "Actualización del plan terapéutico:\n\nCliente: {name}\nSeguro: {card}\nContacto emergencia: {name}, {phone}\nCorreo: {email}\n\n{pii}\n\nObjetivos:\n1. Reducir ataques de pánico de 3x/semana a 1x/semana\n2. Mejora del sueño\n3. Retorno al trabajo tiempo completo para Q3",
            "Derivación a psiquiatría:\n\nPaciente: {name}\nDNI: {dni}\nTerapeuta actual: {name}, {email}\nTeléfono: {phone}\n\n{pii}\n\nMotivo: Paciente podría beneficiarse de intervención farmacológica junto a TCC.",
        ],
        "zh": [
            "会谈记录——保密：\n\n来访者：{name}\n身份证号：{chinese_id}\n出生日期：1992-04-18\n电话：{phone}\n邮箱：{email}\n\n{pii}\n\n会谈次数：第12次\n诊断：广泛性焦虑障碍（F41.1）\n进展：CBT技术下有中度改善。",
            "治疗计划更新：\n\n来访者：{name}\n保险：{card}\n紧急联系人：{name}，{phone}\n邮箱：{email}\n\n{pii}\n\n目标：\n1. 恐慌发作从每周3次降至1次\n2. 改善睡眠\n3. Q3前恢复全职工作",
            "转介精神科：\n\n患者：{name}\n身份证号：{chinese_id}\n当前治疗师：{name}，{email}\n电话：{phone}\n\n{pii}\n\n原因：患者可能在CBT基础上受益于药物治疗。",
        ],
    },
    # ── Media ────────────────────────────────────────────────────────
    "journalist": {
        "en": [
            "Confidential source information — DO NOT SHARE:\n\nSource codename: Bluejay\nReal name: {name}\nPhone (burner): {phone}\nSecure email: {email}\n\n{pii}\n\nSource provided documents showing payments via card {card} to shell company.\nMeeting point: {address}",
            "Leaked document analysis:\n\nDocument obtained from whistleblower on 3/20/2026.\nContains the following PII of public officials:\n\n{pii}\n\nVerification: Cross-reference with public records.\nLegal review needed before publication.\n\nReporter: {name}, {email}",
            "Interview transcript (excerpt):\n\nInterviewee: {name}\nDate: 2026-03-28\nLocation: {address}\n\n\"...and the payment of $50,000 was made to the account, card ending in {card}. The email confirmation went to {email}. I have the receipts.\"\n\n{pii}",
        ],
        "pt-br": [
            "Informações de fonte confidencial — NÃO COMPARTILHAR:\n\nCodinome: Azulão\nNome real: {name}\nTelefone (descartável): {phone}\nE-mail seguro: {email}\n\n{pii}\n\nFonte forneceu documentos mostrando pagamentos via cartão {card} para empresa de fachada.\nPonto de encontro: {address}",
            "Análise de documento vazado:\n\nDocumento obtido de denunciante em 20/03/2026.\nContém os seguintes dados pessoais de funcionários públicos:\n\n{pii}\n\nVerificação: Cruzar com registros públicos.\nRevisão jurídica necessária antes da publicação.\n\nRepórter: {name}, {email}",
            "Transcrição de entrevista (trecho):\n\nEntrevistado: {name}\nData: 28/03/2026\nLocal: {address}\n\n\"...e o pagamento de R$ 50.000 foi feito para a conta, cartão {card}. A confirmação foi para {email}.\"\n\n{pii}",
        ],
        "es": [
            "Información de fuente confidencial — NO COMPARTIR:\n\nNombre clave: Azulejo\nNombre real: {name}\nTeléfono (desechable): {phone}\nCorreo seguro: {email}\n\n{pii}\n\nFuente proporcionó documentos mostrando pagos via tarjeta {card} a empresa fantasma.\nPunto de encuentro: {address}",
            "Análisis de documento filtrado:\n\nDocumento obtenido de informante el 20/03/2026.\nContiene los siguientes datos personales de funcionarios:\n\n{pii}\n\nVerificación: Cotejar con registros públicos.\nRevisión legal necesaria antes de publicación.\n\nReportero: {name}, {email}",
            "Transcripción de entrevista (extracto):\n\nEntrevistado: {name}\nFecha: 28/03/2026\nLugar: {address}\n\n\"...y el pago de €50.000 fue a la cuenta, tarjeta {card}. La confirmación fue a {email}.\"\n\n{pii}",
        ],
        "zh": [
            "机密线人信息——请勿分享：\n\n线人代号：蓝鸟\n真实姓名：{name}\n一次性电话：{phone}\n加密邮箱：{email}\n\n{pii}\n\n线人提供的文件显示通过{card}向空壳公司付款。\n会面地点：{address}",
            "泄露文件分析：\n\n2026年3月20日从举报人处获取。\n含有以下公职人员个人信息：\n\n{pii}\n\n核实：与公开记录交叉比对。\n发表前需法务审核。\n\n记者：{name}，{email}",
            "采访记录（节选）：\n\n受访者：{name}\n日期：2026-03-28\n地点：{address}\n\n\"……那笔5万元的款项打到了账户，卡号{card}。确认邮件发到了{email}。我有收据。\"\n\n{pii}",
        ],
    },
    # ── Government ───────────────────────────────────────────────────
    "government": {
        "en": [
            "Citizen service request:\n\nRequester: {name}\nSSN: {ssn}\nEmail: {email}\nPhone: {phone}\nAddress: {address}\n\n{pii}\n\nRequest type: Tax refund status inquiry\nFiling ID: TXR-2026-48271\n\nPlease process within 15 business days.",
            "Social Security determination:\n\nClaimant: {name}\nSSN: {ssn}\nDOB: 1960-08-23\nAddress: {address}\nPhone: {phone}\n\n{pii}\n\nDetermination: Approved for disability benefits\nMonthly benefit: $1,842\nEffective date: 04/01/2026",
            "Permit application:\n\nApplicant: {name}\nEIN: {ein}\nBusiness address: {address}\nContact: {email}, {phone}\n\n{pii}\n\nPermit type: Food service establishment\nInspection scheduled: 04/10/2026",
        ],
        "pt-br": [
            "Solicitação do cidadão:\n\nSolicitante: {name}\nCPF: {cpf}\nE-mail: {email}\nTelefone: {phone}\nEndereço: {address}\n\n{pii}\n\nTipo: Consulta de restituição de IR\nProtocolo: TXR-2026-48271\n\nFavor processar em até 15 dias úteis.",
            "Determinação previdenciária:\n\nRequerente: {name}\nCPF: {cpf}\nNascimento: 23/08/1960\nEndereço: {address}\nTelefone: {phone}\n\n{pii}\n\nDeterminação: Aprovado para auxílio-doença\nBenefício mensal: R$ 1.842\nVigência: 01/04/2026",
            "Solicitação de alvará:\n\nSolicitante: {name}\nCNPJ: {cnpj}\nEndereço comercial: {address}\nContato: {email}, {phone}\n\n{pii}\n\nTipo: Estabelecimento alimentício\nVistoria agendada: 10/04/2026",
        ],
        "es": [
            "Solicitud ciudadana:\n\nSolicitante: {name}\nDNI: {dni}\nCorreo: {email}\nTeléfono: {phone}\nDirección: {address}\n\n{pii}\n\nTipo: Consulta de devolución fiscal\nExpediente: TXR-2026-48271\n\nProcesar en 15 días hábiles.",
            "Determinación de seguridad social:\n\nSolicitante: {name}\nDNI: {dni}\nNacimiento: 23/08/1960\nDirección: {address}\nTeléfono: {phone}\n\n{pii}\n\nDeterminación: Aprobado para prestación por incapacidad\nBeneficio mensual: €1.842\nFecha efectiva: 01/04/2026",
            "Solicitud de licencia:\n\nSolicitante: {name}\nCUIT: {cuit}\nDirección comercial: {address}\nContacto: {email}, {phone}\n\n{pii}\n\nTipo: Establecimiento de alimentación\nInspección programada: 10/04/2026",
        ],
        "zh": [
            "公民服务请求：\n\n请求人：{name}\n身份证号：{chinese_id}\n邮箱：{email}\n电话：{phone}\n地址：{address}\n\n{pii}\n\n请求类型：退税状态查询\n受理编号：TXR-2026-48271\n\n请在15个工作日内处理。",
            "社保认定：\n\n申请人：{name}\n身份证号：{chinese_id}\n出生日期：1960-08-23\n地址：{address}\n电话：{phone}\n\n{pii}\n\n认定：批准残疾补助\n月度补助：¥1,842\n生效日期：2026/04/01",
            "许可申请：\n\n申请人：{name}\n身份证号：{chinese_id}\n经营地址：{address}\n联系方式：{email}，{phone}\n\n{pii}\n\n许可类型：餐饮经营\n检查日期：2026/04/10",
        ],
    },
    # ── Customer Support ─────────────────────────────────────────────
    "customer_support": {
        "en": [
            "Ticket#: CS-2026-4821\n\nCustomer: {name}\nEmail: {email}\nPhone: {phone}\n\n{pii}\n\nIssue: Unauthorized charge of $299.99 on card {card}\nRequested action: Dispute and refund\nPriority: High",
            "Account verification for password reset:\n\nCustomer: {name}\nEmail on file: {email}\nPhone: {phone}\nLast 4 of SSN: {ssn}\nBilling address: {address}\n\n{pii}\n\nVerification: Passed 3/3 questions. Password reset link sent.",
            "Shipping address update:\n\nCustomer: {name}\nOld address: {address}\nNew address: {address}\nEmail: {email}\nPayment: {card}\n\n{pii}\n\nUpdate applied. Confirmation sent.",
        ],
        "pt-br": [
            "Chamado#: CS-2026-4821\n\nCliente: {name}\nE-mail: {email}\nTelefone: {phone}\n\n{pii}\n\nProblema: Cobrança indevida de R$ 299,99 no cartão {card}\nAção solicitada: Contestação e reembolso\nPrioridade: Alta",
            "Verificação de conta para reset de senha:\n\nCliente: {name}\nE-mail cadastrado: {email}\nTelefone: {phone}\nCPF: {cpf}\nEndereço de cobrança: {address}\n\n{pii}\n\nVerificação: Aprovado 3/3 perguntas. Link de reset enviado.",
            "Atualização de endereço de entrega:\n\nCliente: {name}\nEndereço anterior: {address}\nNovo endereço: {address}\nE-mail: {email}\nCartão: {card}\n\n{pii}",
        ],
        "es": [
            "Ticket#: CS-2026-4821\n\nCliente: {name}\nCorreo: {email}\nTeléfono: {phone}\n\n{pii}\n\nProblema: Cargo no autorizado de €299,99 en tarjeta {card}\nAcción: Disputa y reembolso\nPrioridad: Alta",
            "Verificación de cuenta para restablecimiento:\n\nCliente: {name}\nCorreo: {email}\nTeléfono: {phone}\nDNI: {dni}\nDirección de facturación: {address}\n\n{pii}\n\nVerificación: Aprobada. Enlace enviado.",
            "Actualización de dirección de envío:\n\nCliente: {name}\nDirección anterior: {address}\nNueva dirección: {address}\nCorreo: {email}\nTarjeta: {card}\n\n{pii}",
        ],
        "zh": [
            "工单号：CS-2026-4821\n\n客户：{name}\n邮箱：{email}\n电话：{phone}\n\n{pii}\n\n问题：卡号{card}被未授权扣款¥299.99\n请求：争议处理和退款\n优先级：高",
            "账户验证——密码重置：\n\n客户：{name}\n注册邮箱：{email}\n电话：{phone}\n身份证号：{chinese_id}\n账单地址：{address}\n\n{pii}\n\n验证：通过3/3问题。密码重置链接已发送。",
            "收货地址更新：\n\n客户：{name}\n原地址：{address}\n新地址：{address}\n邮箱：{email}\n付款卡：{card}\n\n{pii}",
        ],
    },
    # ── Marketing ────────────────────────────────────────────────────
    "marketing": {
        "en": [
            "Customer segmentation export — Q1 2026:\n\nSegment: High-value returning customers\nSample records:\n\n1. {name}, {email}, last purchase: $520, card: {card}\n2. {name}, {email}, {phone}, address: {address}\n3. {name}, {email}\n\n{pii}\n\nTotal segment size: 12,450 records. Export for email campaign.",
            "Email campaign personalization data:\n\nRecipient: {name}\nEmail: {email}\nPhone: {phone}\nPurchase history: 15 orders\nPreferred category: Electronics\nLoyalty points: 8,750\n\n{pii}\n\nSubject line: \"20% off just for you!\"",
            "Lead scoring report:\n\nLead: {name}\nCompany: {name}\nEmail: {email}\nPhone: {phone}\n\n{pii}\n\nScore: 85/100 — Ready for sales handoff\nCRM note: Interested in enterprise plan, budget $50K+",
        ],
        "pt-br": [
            "Exportação de segmentação — Q1 2026:\n\nSegmento: Clientes recorrentes de alto valor\nRegistros de amostra:\n\n1. {name}, {email}, última compra: R$ 520, cartão: {card}\n2. {name}, {email}, {phone}, endereço: {address}\n3. {name}, {email}\n\n{pii}\n\nTotal do segmento: 12.450 registros. Para campanha de e-mail.",
            "Dados de personalização de campanha:\n\nDestinatário: {name}\nE-mail: {email}\nTelefone: {phone}\nHistórico: 15 pedidos\nCategoria preferida: Eletrônicos\nPontos: 8.750\n\n{pii}",
            "Relatório de lead scoring:\n\nLead: {name}\nEmpresa: {name}\nE-mail: {email}\nTelefone: {phone}\n\n{pii}\n\nPontuação: 85/100 — Pronto para vendas\nNota CRM: Interesse no plano enterprise, budget R$ 50K+",
        ],
        "es": [
            "Exportación de segmentación — Q1 2026:\n\nSegmento: Clientes recurrentes de alto valor\nRegistros de muestra:\n\n1. {name}, {email}, última compra: €520, tarjeta: {card}\n2. {name}, {email}, {phone}, dirección: {address}\n\n{pii}\n\nTotal: 12.450 registros. Para campaña de correo.",
            "Datos de personalización de campaña:\n\nDestinatario: {name}\nCorreo: {email}\nTeléfono: {phone}\nHistorial: 15 pedidos\nPuntos: 8.750\n\n{pii}",
            "Informe de lead scoring:\n\nLead: {name}\nEmpresa: {name}\nCorreo: {email}\nTeléfono: {phone}\n\n{pii}\n\nPuntuación: 85/100\nNota CRM: Interesado en plan enterprise, presupuesto €50K+",
        ],
        "zh": [
            "客户分群导出——2026 Q1：\n\n分群：高价值回头客\n样本记录：\n\n1. {name}，{email}，最近消费：¥520，卡号：{card}\n2. {name}，{email}，{phone}，地址：{address}\n\n{pii}\n\n总量：12,450条记录。用于邮件营销。",
            "邮件营销个性化数据：\n\n收件人：{name}\n邮箱：{email}\n电话：{phone}\n购买记录：15单\n偏好品类：电子产品\n积分：8,750\n\n{pii}",
            "线索评分报告：\n\n线索：{name}\n公司：{name}\n邮箱：{email}\n电话：{phone}\n\n{pii}\n\n评分：85/100——可交付销售\nCRM备注：对企业版感兴趣，预算¥50K+",
        ],
    },
    # ── Legal Support ────────────────────────────────────────────────
    "paralegal": {
        "en": [
            "Document review — litigation support:\n\nCase: Smith v. Johnson, No. 26-CV-1234\nReviewing documents batch 7 of 15\n\nDocuments contain the following PII:\n{pii}\n\nPrivilege log entries needed for items containing:\n- Client: {name}, SSN: {ssn}, Email: {email}\n- Opposing party: {name}, Phone: {phone}",
            "Client file preparation:\n\nClient: {name}\nSSN: {ssn}\nAddress: {address}\nEmail: {email}\nPhone: {phone}\n\n{pii}\n\nFiling deadline: 04/10/2026\nAll documents must be Bates-stamped.",
            "Evidence catalog:\n\nExhibit A: Bank statement — {name}, Acct: {card}\nExhibit B: Email from {email} dated 3/15\nExhibit C: Phone records for {phone}\nExhibit D: Tax return — SSN: {ssn}\n\n{pii}\n\nChain of custody verified. Ready for deposition.",
        ],
        "pt-br": [
            "Revisão de documentos — apoio ao litígio:\n\nCaso: Silva v. Santos, Proc. 26-CV-1234\nLote 7 de 15\n\nDocumentos contêm PII:\n{pii}\n\nRegistro de privilégio necessário para:\n- Cliente: {name}, CPF: {cpf}, E-mail: {email}\n- Parte contrária: {name}, Telefone: {phone}",
            "Preparação de pasta do cliente:\n\nCliente: {name}\nCPF: {cpf}\nEndereço: {address}\nE-mail: {email}\nTelefone: {phone}\n\n{pii}\n\nPrazo: 10/04/2026.",
            "Catálogo de provas:\n\nExibição A: Extrato bancário — {name}, Conta: {card}\nExibição B: E-mail de {email} de 15/03\nExibição C: Registros telefônicos de {phone}\nExibição D: Declaração de IR — CPF: {cpf}\n\n{pii}",
        ],
        "es": [
            "Revisión de documentos — apoyo litigioso:\n\nCaso: García v. Rodríguez, Exp. 26-CV-1234\nLote 7 de 15\n\nDocumentos contienen PII:\n{pii}\n\nRegistro de privilegio necesario para:\n- Cliente: {name}, DNI: {dni}, Correo: {email}\n- Contraparte: {name}, Teléfono: {phone}",
            "Preparación del expediente del cliente:\n\nCliente: {name}\nDNI: {dni}\nDirección: {address}\nCorreo: {email}\nTeléfono: {phone}\n\n{pii}",
            "Catálogo de pruebas:\n\nExhibición A: Estado de cuenta — {name}, Cuenta: {card}\nExhibición B: Correo de {email} del 15/03\nExhibición C: Registros telefónicos de {phone}\nExhibición D: Declaración — DNI: {dni}\n\n{pii}",
        ],
        "zh": [
            "文件审查——诉讼支持：\n\n案件：张 v. 王，案号26-CV-1234\n审查第7批（共15批）\n\n文件包含以下PII：\n{pii}\n\n特权日志需要记录：\n- 客户：{name}，身份证：{chinese_id}，邮箱：{email}\n- 对方当事人：{name}，电话：{phone}",
            "客户档案准备：\n\n客户：{name}\n身份证号：{chinese_id}\n地址：{address}\n邮箱：{email}\n电话：{phone}\n\n{pii}\n\n截止日期：2026/04/10。",
            "证据目录：\n\n证据A：银行对账单——{name}，卡号：{card}\n证据B：{email}发出的邮件（3/15）\n证据C：{phone}的通话记录\n证据D：纳税申报——身份证：{chinese_id}\n\n{pii}",
        ],
    },
    # ── Tax Preparation ──────────────────────────────────────────────
    "tax_preparer": {
        "en": [
            "Tax return preparation — 2025:\n\nTaxpayer: {name}\nSSN: {ssn}\nSpouse: {name}, SSN: {ssn}\nFiling status: Married filing jointly\nEmail: {email}\nPhone: {phone}\nAddress: {address}\n\n{pii}\n\nW-2 income: $125,000\nMortgage interest: $18,200\nEstimated refund: $3,450",
            "Business tax filing — Schedule C:\n\nBusiness owner: {name}\nSSN: {ssn}\nEIN: {ein}\nBusiness address: {address}\nEmail: {email}\n\n{pii}\n\nGross revenue: $340,000\nExpenses: $195,000\nNet profit: $145,000\nQuarterly estimates paid: $28,000",
            "Client document checklist:\n\nClient: {name}\nSSN: {ssn}\n\nReceived:\n☑ W-2 from employer\n☑ 1099-INT (bank: {card})\n☑ Mortgage statement ({address})\n☐ Dependent SSNs\n☐ Childcare receipts\n\nEmail: {email}\nPhone: {phone}\n\n{pii}",
        ],
        "pt-br": [
            "Declaração de IR — 2025:\n\nContribuinte: {name}\nCPF: {cpf}\nCônjuge: {name}, CPF: {cpf}\nE-mail: {email}\nTelefone: {phone}\nEndereço: {address}\n\n{pii}\n\nRenda CLT: R$ 125.000\nDespesas médicas: R$ 18.200\nRestituição estimada: R$ 3.450",
            "IRPJ — Simples Nacional:\n\nTitular: {name}\nCPF: {cpf}\nCNPJ: {cnpj}\nEndereço comercial: {address}\nE-mail: {email}\n\n{pii}\n\nFaturamento bruto: R$ 340.000\nDespesas: R$ 195.000\nLucro líquido: R$ 145.000",
            "Checklist de documentos:\n\nCliente: {name}\nCPF: {cpf}\n\nRecebido:\n☑ Informe de rendimentos\n☑ Informe bancário ({card})\n☑ Comprovante de endereço ({address})\n☐ CPFs dos dependentes\n☐ Recibos de creche\n\nE-mail: {email}\nTelefone: {phone}\n\n{pii}",
        ],
        "es": [
            "Declaración fiscal — 2025:\n\nContribuyente: {name}\nDNI: {dni}\nCónyuge: {name}, DNI: {dni}\nCorreo: {email}\nTeléfono: {phone}\nDirección: {address}\n\n{pii}\n\nIngreso laboral: €125.000\nIntereses hipotecarios: €18.200\nDevolución estimada: €3.450",
            "Declaración empresarial:\n\nTitular: {name}\nDNI: {dni}\nCUIT: {cuit}\nDirección comercial: {address}\nCorreo: {email}\n\n{pii}\n\nIngresos brutos: €340.000\nGastos: €195.000\nBeneficio neto: €145.000",
            "Checklist de documentos:\n\nCliente: {name}\nDNI: {dni}\n\nRecibido:\n☑ Certificado de retenciones\n☑ Extracto bancario ({card})\n☑ Recibo de hipoteca ({address})\n☐ DNIs de dependientes\n\nCorreo: {email}\nTeléfono: {phone}\n\n{pii}",
        ],
        "zh": [
            "纳税申报准备——2025年：\n\n纳税人：{name}\n身份证号：{chinese_id}\n配偶：{name}，身份证：{chinese_id}\n邮箱：{email}\n电话：{phone}\n地址：{address}\n\n{pii}\n\n工资收入：¥125,000\n房贷利息：¥18,200\n预计退税：¥3,450",
            "企业纳税——个体工商户：\n\n经营者：{name}\n身份证号：{chinese_id}\n经营地址：{address}\n邮箱：{email}\n\n{pii}\n\n营业总额：¥340,000\n成本费用：¥195,000\n净利润：¥145,000",
            "客户文件清单：\n\n客户：{name}\n身份证号：{chinese_id}\n\n已收到：\n☑ 工资单\n☑ 银行利息证明（{card}）\n☑ 房贷证明（{address}）\n☐ 配偶身份证复印件\n\n邮箱：{email}\n电话：{phone}\n\n{pii}",
        ],
    },
}


# ═══════════════════════════════════════════════════════════════════════
# Template composition
# ═══════════════════════════════════════════════════════════════════════


def _informalize(text: str, lang: str) -> str:
    """Light informalization of standard body text."""
    t = text
    if lang == "en":
        t = t.replace("Please ", "pls ").replace("please ", "pls ")
        t = t.replace("Kindly ", "").replace("kindly ", "")
        t = re.sub(r"(?<=\n)([A-Z])", lambda m: m.group(1).lower(), t, count=3)
    elif lang == "pt-br":
        t = t.replace("Favor ", "pf ").replace("favor ", "pf ")
        t = t.replace("Por favor ", "pf ").replace("por favor ", "pf ")
        t = t.replace("Gentileza ", "").replace("gentileza ", "")
    elif lang == "es":
        t = t.replace("Por favor ", "porfa ").replace("por favor ", "porfa ")
    # zh: minimal changes — casual tone set by wrappers
    return t


def build_composed_templates(template_bank: dict) -> None:
    """Populate *template_bank* with composed templates for extended roles.

    Parameters
    ----------
    template_bank:
        The ``_T`` dict from ``generate_prompt_corpus``.
    """
    langs = list(_OPENERS.keys())
    formalities = list(list(_OPENERS.values())[0].keys())

    for role in COMPOSED_ROLES:
        for lang in langs:
            bodies = _ROLE_BODIES.get(role, {}).get(lang, [])
            if not bodies:
                continue
            for formality in formalities:
                openers = _OPENERS[lang][formality]
                closers = _CLOSERS[lang][formality]
                templates: list[str] = []
                for body in bodies:
                    b = _informalize(body, lang) if formality == "informal" else body
                    t = random.choice(openers) + b + random.choice(closers)
                    templates.append(t)
                template_bank.setdefault(lang, {}).setdefault(formality, {})[role] = templates
