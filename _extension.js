javascript: (() => {
  let shouldShowMinimalAlert = false,
    isDestroyed = false,
    hidingAcc = 0;
  const MAIN_DICT = Object.freeze({
      common: Object.freeze({
        EMAIL: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
        SSN: /\b\d{3}-\d{2}-\d{4}\b/,
        URL: /\b(https?:\/\/[^\s/$.?#].[^\s]*)\b/gi,
        URN: /\burn:[a-z0-9][a-z0-9-]{1,31}:[^\s]+\b/gi,
        PHONE: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
        CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/,
        ENV_VAR: /\b[A-Z][A-Z0-9_]{2,}(?:_KEY|_SECRET|_TOKEN|_URL)?\b/,
        API_KEY: /\b[A-Za-z0-9]{20,}\b/,
        TOKEN:
          /\b(?:password|secret|token)\s*[:=]\s*['"]?[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}\b/gi,
        BUSINESS:
          /\b(?:company\s*(?:ID|number)|registration\s*number)\s*[:=]\s*[A-Z0-9\-]{4,}\b/gi,
        CPF: /\b\d{3}[.\-]?\d{3}[.\-]?\d{3}[\-]?\d{2}\b/g,
        UUID: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
        MAC_ADDRESS: /\b(?:[0-9A-F]{2}[:-]){5}(?:[0-9A-F]{2})\b/g,
        SENSITIVE_PATH:
          /\b(?:\/api\/v\d\/|\/admin\/)(?:users|keys|credentials)\b/gi,
        JWT: /\b(?:eyJ[A-Za-z0-9-_=]+\.){2}[A-Za-z0-9-_=]+\b/gi,
        PRIVATE_KEY: /\b-----BEGIN\s(?:RSA|EC|OPENSSH)\sPRIVATE KEY-----\b/gi,
        AWS_KEYS: /\b(AWS|AKIA|ASIA)[A-Z0-9]{16,}\b/gi,
        BANK_ACCOUNT: /\b(?:\d{8,18}|[A-Z]{2}\d{2}\s?(?:\d{4}\s?){3,5})\b/gi,
        IBAN: /\b[A-Z]{2}\d{2}[\s\-]?(?:[A-Z0-9]{4}[\s\-]?){2,7}[A-Z0-9]{1,4}\b/gi,
        SWIFT_CODE: /\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/gi,
        TAX_ID: /\b(?:tax\s*id|vat\s*number)\s*[:=]\s*[A-Z0-9\-]{6,12}\b/gi,
        // COORDINATES:
        //   /-?\d{1,3}(?:\.\d+)?[°º]?\s*[NS]?\s*,?\s*-?\d{1,3}(?:\.\d+)?[°º]?\s*[EW]?/gi,
        BITCOIN_ADDRESS: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/gi,
        ETHEREUM_ADDRESS: /\b0x[a-fA-F0-9]{40}\b/gi,
        CRYPTO_PRIVATE_KEY: /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/gi,
        VIN: /\b[A-HJ-NPR-Z0-9]{17}\b/gi,
        LICENSE_PLATE: /\b[A-Z]{1,3}\s?-\s?[A-Z0-9]{1,4}\b/gi,
        SOFTWARE_KEY: /\b[A-Z0-9]{4}(?:-?[A-Z0-9]{4}){3,}\b/gi,
        PRODUCT_KEY: /\b(?:\d{3}-){4}\d{3}\b/gi,
        HEALTHCHECK: /\b(?:health|status|ping)\b/gi,
        AUTH: /\b(?:auth|login|oauth2?|token)\b/gi,
        EXPIRY_DATE:
          /\b(?:exp|valid)\s*[:-]?\s*(?:\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/gi,
        CONNECTION_STRING:
          /\b(?:postgres(?:ql)?|mysql|mariadb|sqlite|mssql|oracle|cockroachdb|mongodb|redis|cassandra|cosmosdb|dynamodb|firestore|rethinkdb|couchdb|influxdb|riak|neo4j|arangodb|elasticsearch|bigtable|spanner|firebase|supabase|grpc|graphql):\/\/[^\s]+\b/gi,
        ENDPOINT_SECRETS:
          /\b(?:api|auth|config|secrets)\/(?:[a-z0-9-]+\.(?:key|token|pem|cer|pgp|env|secret)|(?:staging|prod)\.config\.(?:json|yml))\b/gi,
        MEDICAL_RECORD:
          /\b(?:MRN|PID|NHI|HCN|[A-Z]{3}-\d{2}-\d{4})-?[\dA-Z]{8,12}\b/gi,
        BIOMETRIC_HASH:
          /\b(?:[a-f0-9]{64}|\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53})\b/gi,
        LARAVEL:
          /\b(?:api\/v\d+\/|oauth\/authorize|sanctum\/csrf-cookie|horizon\/dashboard|nova-api\/)\b/gi,
        SPRING_BOOT:
          /\b(?:actuator\/health|v\d+\/api\/|oauth2\/authorization\/|springfox\/swagger|hateoas\/.*_links)\b/gi,
        DJANGO:
          /\b(?:api\/\w+\/v\d+\/|graphql\/|admin\/login\/|rest-auth\/|dj-rest-auth\/)\b/gi,
        EXPRESS:
          /\b(?:api\/v\d+\/\w+|middleware\/auth|static\/uploads|socket\.io\/)\b/gi,
        SWAGGER:
          /\b(?:(?:swagger|openapi)(?:-ui)?\/|\/swagger-ui\/|\/redoc\/|\/apidocs\/)\b/gi,
        GRAPHQL:
          /\b(?:graphql(?:\/playground|\/voyager)?|\/gql\/|\/_introspection|\/schema\.(?:graphql|json))\b/gi,
        AWS_SECRET_KEY:
          /\baws[_-]secret[_-]access[_-]key\s*[:=]\s*[A-Za-z0-9\/+=]{40}\b/gi,
        GITHUB_PAT: /\bgh[pous]_[A-Za-z0-9]{36,}\b/gi,
        GITLAB_PAT: /\bglpat-[A-Za-z0-9]{20}\b/gi,
        SLACK_TOKEN: /\bxox[baprs]-[A-Za-z0-9-]{10,48}\b/gi,
        SLACK_WEBHOOK:
          /\bhttps:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8}\/B[A-Z0-9]{8}\/[A-Za-z0-9]{24}\b/gi,
        DISCORD_WEBHOOK:
          /\bhttps:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{68}\b/gi,
        STRIPE_SECRET_KEY: /\bsk_(?:live|test)_[A-Za-z0-9]{24}\b/gi,
        S3_URL:
          /\bhttps?:\/\/[A-Za-z0-9.-]+\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com\/[^\s]+/gi,
        AZURE_BLOB_URL:
          /\bhttps?:\/\/[A-Za-z0-9-]+\.blob\.core\.windows\.net\/[A-Za-z0-9/_\-\.]+/gi,
        GCS_URL:
          /\bhttps?:\/\/storage.googleapis.com\/[A-Za-z0-9._\-]+\/[^\s]+\b/gi,
        PEM_CERT_HEADER: /\b-----BEGIN\s(?:RSA|EC|DSA)?\s?CERTIFICATE-----\b/gi,
        PGP_PRIVATE_BLOCK: /\b-----BEGIN PGP PRIVATE KEY BLOCK-----\b/gi,
        K8S_SECRET_MANIFEST: /apiVersion:\s*v1\s+kind:\s*Secret\b/i,
        IPV4_ADDRESS:
          /\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.|$)){4}\b/g,
        PAYPAL_BEARER: /\baccess_token\$production\$[A-Za-z0-9._-]{50,}\b/gi,
        IPV6_ADDRESS:
          /\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b|(?:[A-F0-9]{1,4}:){1,7}:|:(?::[A-F0-9]{1,4}){1,7}\b/gi,
        IPV4_CIDR:
          /\b(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}\/(?:3[0-2]|[12]?\d)\b/gi,
        IPV6_CIDR: /\b[a-f0-9:]+\/(?:12[0-8]|1[01]\d|[6-9]\d|\d{1,2})\b/gi,
        MAC_ADDRESS_CISCO: /\b[0-9A-F]{4}\.[0-9A-F]{4}\.[0-9A-F]{4}\b/gi,
        EUI64: /\b(?:[0-9A-F]{2}[:-]){7}[0-9A-F]{2}\b/gi,
        BSSID: /\b(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}\b/gi,
        IMEI: /\b\d{15}\b/,
        MEID: /\b[A-F0-9]{14}\b/gi,
        ICCID: /\b89\d{18}\d?\b/gi,
        PCI_ID: /\b[0-9A-F]{4}:[0-9A-F]{4}\b/gi,
        USB_ID: /\b0x[0-9A-F]{4}:\s*0x[0-9A-F]{4}\b/gi,
        SERIAL_NUMBER: /\b(?:S\/?N|Serial|\bSN)[:#]?\s*[A-Z0-9\-]{6,}\b/gi,
        AS_NUMBER: /\bAS\d{1,7}\b/gi,
        GOOGLE_API_KEY: /\bAIza[0-9A-Za-z\-_]{35}\b/gi,
        FIREBASE_API_KEY: /\bAAA[a-zA-Z0-9_-]{7}:[A-Za-z0-9_-]{140,}\b/gi,
        SENDGRID_API_KEY: /\bSG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}\b/gi,
        MAILGUN_API_KEY: /\bkey-[0-9a-z]{32}\b/gi,
        TWILIO_SID: /\bAC[a-f0-9]{32}\b/gi,
        TWILIO_API_KEY: /\bSK[a-f0-9]{32}\b/gi,
        FACEBOOK_TOKEN: /\bEAAC[A-Za-z0-9]{30,}\b/gi,
        HEROKU_API_KEY: /\bheroku[a-z0-9]{32}\b/gi,
        DIGITALOCEAN_PAT: /\bdop_v1_[a-f0-9]{64}\b/gi,
        ALGOLIA_API_KEY: /\b(?:ALGOLIA|algolia)[\w\-]*_[a-f0-9]{32}\b/gi,
        CLOUDFLARE_TOKEN: /\bCF-[A-Za-z0-9_\-]{37,40}\b/gi,
        STRIPE_PUBLISHABLE_KEY: /\bpk_(?:live|test)_[A-Za-z0-9]{24}\b/gi,
        KUBE_BEARER_TOKEN: /\btoken:\s*[A-Za-z0-9\.\-_]{20,}\b/i,
        ENCRYPTED_PRIV_KEY_HDR: /\b-----BEGIN ENCRYPTED PRIVATE KEY-----\b/gi,
        CERT_REQ_HEADER: /\b-----BEGIN CERTIFICATE REQUEST-----\b/gi,
        BLUETOOTH_MAC: /\b(?:[0-9A-F]{2}:){5}[0-9A-F]{2}\b/gi,
        WIFI_WPA_PSK:
          /\b(?:psk=|wpa_passphrase\s+)(["']?)[A-Za-z0-9!@#$%^&*()_+\-=]{8,63}\1/gi,
        BTLE_UUID:
          /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
        R2_URL:
          /\bhttps?:\/\/[A-Za-z0-9.-]+\.r2\.cloudflarestorage\.com\/[^\s]+\b/gi,
        DO_SPACES_URL:
          /\bhttps?:\/\/[A-Za-z0-9.-]+\.digitaloceanspaces\.com\/[^\s]+\b/gi,
        MINIO_URL: /\bhttps?:\/\/[A-Za-z0-9.-]+\/minio\/[^\s]+\b/gi,
      }),
      pt: Object.freeze({
        CPF_LABEL: /\b(?:[Cc][Pp][Ff])\s*[:=-]?\s*/gi,
        CPNJ_LABEL: /\b(?:cnpj)\s*[:=-]?\s*/gi,
        RG_LABEL: /\b(?:rg)\s*[:=-]?\s*/gi,
        EMAIL_LABEL:
          /\b(?:email|e[-\s]?mail|correio eletr[oô]nico)\s*[:=-]?\s*/gi,
        PHONE_LABEL: /\b(?:telefone|tel|celular)\s*[:=-]?\s*/gi,
        ADDRESS_LABEL: /\b(?:end[eê]re[çc]o)\s*[:=-]\s*/gi,
        FULL_NAME_LABEL: /\b(?:nome completo|nome)\s*[:=-]\s*/gi,
        LAST_NAME_LABEL: /\b(?:sobrenome)\s*[:=-]\s*/gi,
        COMPANY_LABEL: /\b(?:empresa|raz[ãa]o social)\s*[:=-]\s*/gi,
        PIS: /\b\d{3}\.\d{5}\.\d{2}-\d\b/g,
        CNH: /\b(?:cnh|registro\s* nacional)\s*[:=]\s*\d{11}\b/gi,
        TWITTER_HANDLE: /\B@[a-zA-Z0-9_]{1,15}\b/gi,
        LINKEDIN_PROFILE: /\blinkedin\.com\/in\/[a-zA-Z0-9-]+\b/gi,
        CNPJ: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
        CEP: /\b\d{5}-?\d{3}\b/g,
        CNS: /\b\d{3}\s?\d{4}\s?\d{4}\s?\d{4}\b/g,
        TITULO_ELEITOR: /\b\d{12}\b/g,
        RG: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9Xx]\b/g,
        DOB_LABEL_PT: /(?:data\s*de\s*nascimento)\s*[:=-]?\s*/gi,
        GENDER_LABEL_PT: /(?:sexo|g[eê]nero)\s*[:=-]?\s*/gi,
        PROCESSO_CNJ: /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g,
        PROCESSO_LABEL_PT:
          /\b(?:processo(?:\s*n[ºo°])?|n[ºo°]\s*do\s*processo)\s*[:=-]?\s*/gi,

        NFE_CHAVE: /\b\d{44}\b/g,
        NFE_LABEL:
          /\b(?:chave\s*de\s*acesso|nota\s*fiscal|nfe\s*key)\s*[:=-]?\s*/gi,

        IE_LABEL: /\b(?:inscri[çc][ãa]o\s*estadual|IE)\s*[:=-]?\s*/gi,
        IM_LABEL: /\b(?:inscri[çc][ãa]o\s*municipal|IM)\s*[:=-]?\s*/gi,
        CNAE_LABEL: /\b(?:cnae)\s*[:=-]?\s*/gi,

        PROTOCOLO_LABEL_PT:
          /\b(?:protocolo|num(?:ero)?\s*de\s*protocolo)\s*[:=-]?\s*/gi,
        ALVARA_LABEL_PT: /\b(?:alvar[aá])\s*[:=-]?\s*/gi,
        MATRICULA_LABEL_PT:
          /\b(?:matr[íi]cula|registro\s*im[óo]vel)\s*[:=-]?\s*/gi,
      }),
      en: Object.freeze({
        FIRST_NAME_LABEL: /\bfirst\s+name\s*[:=-]\s*([A-Z][a-z]+)\b/i,
        FULL_NAME_LABEL: /\b(?:full name|name)\s*[:=-]\s*/gi,
        LAST_NAME_LABEL: /\b(?:last name|surname)\s*[:=-]\s*/gi,
        EMAIL_LABEL: /\b(?:email)\s*[:=-]\s*/gi,
        PHONE_LABEL: /\b(?:phone|tel)\s*[:=-]\s*/gi,
        ADDRESS_LABEL: /\b(?:address)\s*[:=-]\s*/gi,
        COMPANY_LABEL:
          /\b(?:company(?:\s+name)?|organization|business)\s*[:=-]\s*([A-Z][A-Za-z0-9\s&.,-]+)\b/i,
        AGE_LABEL: /\bage\s*[:=-]\s*(\d{1,3})\b/i,
        PASSPORT:
          /\b(?:passport\s*(?:no|number)?)\s*[:=]\s*[A-Z0-9<]{6,12}\b/gi,
        DRIVER_LICENSE:
          /\b(?:driver'?s?\s*lic(?:ense)?|DL)\s*[:=]\s*[A-Z0-9\-]{6,14}\b/gi,
        HEALTH_ID:
          /\b(?:health\s*ID|patient\s*ID|medicare)\s*[:=]\s*[A-Z0-9\-]{8,}\b/gi,
        FULL_ADDRESS: /\b\d{1,5}\s+[A-Za-z]+\s+(?:St|Ave|Rd|Plaza)\b/gi,
        STUDENT_ID: /\b(?:STU|ID)-\d{6,10}\b/gi,
        EMPLOYEE_ID: /\bEMP-[A-Z0-9]{8}\b/gi,
        PAYROLL_NUMBER: /\bPY-\d{4}-\d{4}\b/gi,
        INVOICE_NUMBER: /\bINV-\d{4}-\d{4}\b/gi,
        LEGAL_CASE: /\bCASE-\d{4}-[A-Z]{3}\b/gi,
        NHS_NUMBER: /\b\d{3}\s?\d{3}\s?\d{4}\b/gi,
        CANADA_SIN: /\b\d{3}[ -]?\d{3}[ -]?\d{3}\b/gi,
        UK_NINO:
          /\b(?!BG)(?!GB)(?!NK)(?!KN)(?!TN)(?!NT)(?!ZZ)[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/gi,
        SSN_LABEL: /\b(?:ssn|social\s*security\s*number)\s*[:=-]\s*/gi,
        DOB_LABEL: /\b(?:date\s*of\s*birth|dob)\s*[:=-]\s*/gi,
        ZIP_CODE: /\b\d{5}(?:-\d{4})?\b/g,
        ROUTING_NUMBER: /\b\d{9}\b/g,
        CREDIT_CARD_LABEL: /\b(?:credit\s*card\s*(?:no|number)?)\s*[:=-]\s*/gi,
        PASSPORT_LABEL_GENERIC: /\b(?:passport\s*(?:no|number)?)\s*[:=-]\s*/gi,
        DOB_ISO: /\b\d{4}-\d{2}-\d{2}\b/g,
        EIN: /\b\d{2}-\d{7}\b/g,
        EIN_LABEL: /\b(?:ein|employer\s*identification\s*number)\s*[:=-]?\s*/gi,

        CASE_NO_VALUE: /\b\d{1,2}:\d{2}-[a-z]{2}-\d{4,5}\b/gi,
        CASE_LABEL_EN:
          /\b(?:case\s*(?:no|number|#)|docket\s*(?:no|number|#))\s*[:=-]?\s*/gi,

        PO_NUMBER: /\bPO[-\s]?\d{5,10}\b/gi,
        PO_LABEL: /\b(?:purchase\s*order|PO)\s*[:=-]?\s*/gi,

        CONTRACT_NUMBER: /\bCNTR[-\s]?\d{6,10}\b/gi,
        CONTRACT_LABEL_EN: /\b(?:contract\s*(?:no|number))\s*[:=-]?\s*/gi,

        EU_VAT: /\b[A-Z]{2}[A-Za-z0-9]{8,12}\b/gi,
        VAT_LABEL: /\b(?:vat\s*(?:no|number))\s*[:=-]?\s*/gi,
      }),
      es: Object.freeze({
        EMAIL_LABEL: /\b(?:correo electr[oó]nico|email)\s*[:=-]\s*/gi,
        PHONE_LABEL: /\b(?:tel[eé]fono|m[oó]vil|celular)\s*[:=-]\s*/gi,
        ADDRESS_LABEL: /\b(?:direcci[oó]n)\s*[:=-]\s*/gi,
        FULL_NAME_LABEL: /\b(?:nombre completo|nombre)\s*[:=-]\s*/gi,
        LAST_NAME_LABEL: /\b(?:apellido|apellidos)\s*[:=-]\s*/gi,
        COMPANY_LABEL: /\b(?:empresa|raz[oó]n social)\s*[:=-]\s*/gi,
        CIF: /\b[A-Z][0-9]{7}[0-9A-J]\b/gi,
        NIE: /\b[XZY]\d{7}[A-Z]\b/gi,
        CONFIDENTIAL:
          /\b(?:confidential|proprietary)\s*[:-]?\s*['"]?[A-Za-z0-9!@#$%^&*()]+\b/gi,
        DNI: /\b\d{8}[A-Z]\b/gi,
        NIF: /\b[0-9KLMXYZ]\d{7}[A-Z]\b/gi,
        CURP_MX: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/gi,
        RFC_MX: /\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b/gi,
        RUT_CL: /\b\d{7,8}-[0-9Kk]\b/gi,
        DNI_LABEL: /(?:dni|nif)\s*[:=-]\s*/gi,
        CURP_LABEL: /(?:curp|rfc)\s*[:=-]\s*/gi,
        FECHA_NAC_LABEL: /(?:fecha\s*de\s*nacimiento)\s*[:=-]\s*/gi,
        GENERO_LABEL_ES: /(?:g[eé]nero|sexo)\s*[:=-]\s*/gi,
        CUIT_AR: /\b\d{2}-\d{8}-\d\b/g,
        CUIT_LABEL: /\b(?:cuit)\s*[:=-]?\s*/gi,

        NIT_CO: /\b\d{3}\.?\d{3}\.?\d{3}-?\d\b/gi,
        NIT_LABEL: /\b(?:nit)\s*[:=-]?\s*/gi,

        EXPEDIENTE_ES: /\b\d{4,7}\/\d{4}\b/gi,
        EXPEDIENTE_LABEL_ES: /\b(?:expediente|exp)\s*[:=-]?\s*/gi,

        FACTURA_LABEL_ES:
          /\b(?:factura|n[úu]mero\s*de\s*factura)\s*[:=-]?\s*/gi,

        CONTRATO_NUM_ES: /\b\d{6,10}(?:-\d{2})?\b/gi,
        CONTRATO_LABEL_ES:
          /\b(?:contrato|n[úu]mero\s*de\s*contrato)\s*[:=-]?\s*/gi,
      }),
      de: Object.freeze({
        EMAIL_LABEL: /\b(?:E[-\s]?Mail|Email)\s*[:=-]\s*/gi,
        PHONE_LABEL: /\b(?:Telefon|Mobil|Handy)\s*[:=-]\s*/gi,
        ADDRESS_LABEL: /\b(?:Adresse)\s*[:=-]\s*/gi,
        FULL_NAME_LABEL: /\b(?:Name|Vollst[aä]ndiger Name)\s*[:=-]\s*/gi,
        LAST_NAME_LABEL: /\b(?:Nachname|Familienname)\s*[:=-]\s*/gi,
        COMPANY_LABEL: /\b(?:Firma|Unternehmen|Firmenname)\s*[:=-]\s*/gi,
        PERSONALAUSWEIS: /\b\d{9}\b/gi,
      }),
      hb: Object.freeze({
        EMAIL_LABEL: /(?:אימייל|דוא״ל)\s*[：:＝\-]*\s*/gi,
        PHONE_LABEL: /(?:טלפון|נייד)\s*[：:＝\-]*\s*/gi,
        ADDRESS_LABEL: /(?:כתובת)\s*[：:＝\-]*\s*/gi,
        FULL_NAME_LABEL: /(?:שם מלא|שם)\s*[：:＝\-]*\s*/gi,
        LAST_NAME_LABEL: /(?:שם משפחה)\s*[：:＝\-]*\s*/gi,
        COMPANY_LABEL: /(?:חברה)\s*[：:＝\-]*\s*/gi,
      }),
      in: Object.freeze({
        AADHAAR: /\b\d{4}\s?\d{4}\s?\d{4}\b/gi,
        PAN: /\b[A-Z]{5}\d{4}[A-Z]\b/gi,
        IFSC: /\b[A-Z]{4}0[A-Z0-9]{6}\b/gi,
        AADHAAR_LABEL: /\b(?:aadhaar\s*(?:no|number|id))+\s*[:=-]\s*/gi,
        AADHAAR_LABEL_HD: /(?:आधार\s*संख्या\s*[：:＝\-]*\s*)/gi,
        PAN_LABEL: /\b(?:pan\s*(?:card|number))+\s*[:=-]\s*/gi,
        PINCODE_LABEL: /(?:पिन\s*कोड\s*[：:＝\-]*\s*)/gi,
        IFSC_LABEL: /(?:आईएफएससी\s*कोड?\s*[：:＝\-]*\s*)/gi,
        VOTER_ID: /[A-Z]{3}\d{7}/g,
        VOTER_LABEL: /(?:मतदाता\s*पहचान\s*पत्र\s*[：:＝\-]*\s*)/gi,
      }),
      ja: Object.freeze({
        EMAIL_REGEX_JA:
          /(?:メール(?:アドレス)?|Eメール|電子メール)\s*[：:＝]\s*/gi,
        PHONE_REGEX_JA: /(?:電話番号|電話|携帯電話|携帯)\s*[：:＝]\s*/gi,
        ADDRESS_REGEX_JA: /(?:住所)\s*[：:＝]\s*/gi,
        FULL_NAME_REGEX_JA: /(?:氏名|名前)\s*[：:＝]\s*/gi,
        COMPANY_REGEX_JA: /(?:会社名|企業名)\s*[：:＝]\s*/gi,
        MYNUMBER_REGEX_JA: /(?:マイナンバー|個人番号)\s*[：:＝]\s*/gi,
        BIRTHDATE_REGEX_JA: /(?:生年月日)\s*[：:＝]\s*/gi,
        PASSPORT_JA: /(?:旅券番号|パスポート)\s*[：:＝]\s*[A-Z0-9]{6,12}/gi,
      }),
      ko: Object.freeze({
        EMAIL_LABEL: /(?:이메일)\s*[：:＝\-]*\s*/gi,
        PHONE_LABEL: /(?:전화|휴대폰)\s*[：:＝\-]*\s*/gi,
        ADDRESS_LABEL: /(?:주소)\s*[：:＝\-]*\s*/gi,
        FULL_NAME_LABEL: /(?:이름)\s*[：:＝\-]*\s*/gi,
        LAST_NAME_LABEL: /(?:성)\s*[：:＝\-]*\s*/gi,
        COMPANY_LABEL: /(?:회사)\s*[：:＝\-]*\s*/gi,
      }),
      zh: Object.freeze({
        ID_CARD_ZH: /(?:身份证|身份證)\s*[：:＝]\s*[\dX]{17,18}/gi,
        EMAIL_LABEL: /(?:电子邮件|邮箱)\s*[：:＝\-]*\s*/gi,
        PHONE_LABEL: /(?:电话)\s*[：:＝\-]*\s*/gi,
        ADDRESS_LABEL: /(?:地址)\s*[：:＝\-]*\s*/gi,
        FULL_NAME_LABEL: /(?:姓名)\s*[：:＝\-]*\s*/gi,
        LAST_NAME_LABEL: /(?:姓)\s*[：:＝\-]*\s*/gi,
        COMPANY_LABEL: /(?:公司)\s*[：:＝\-]*\s*/gi,
      }),
      ru: Object.freeze({
        EMAIL_LABEL: /(?:электронная почта|email)\s*[:\-＝]*\s*/gi,
        PHONE_LABEL: /(?:телефон)\s*[:\-＝]*\s*/gi,
        ADDRESS_LABEL: /(?:адрес)\s*[:\-＝]*\s*/gi,
        FULL_NAME_LABEL: /(?:ФИО|имя)\s*[:\-＝]*\s*/gi,
        LAST_NAME_LABEL: /(?:фамилия)\s*[:\-＝]*\s*/gi,
        COMPANY_LABEL: /(?:компания|организация)\s*[:\-＝]*\s*/gi,
      }),
      fr: Object.freeze({
        SECURITE_SOCIALE:
          /\bnum[eé]ro\s*de\s*s[eé]curit[eé]\s*sociale\s*[:=]\s*\d{15}\b/gi,
        EMAIL_LABEL: /(?:e[-\s]?mail|courriel)\s*[:\-＝]*\s*/gi,
        PHONE_LABEL: /(?:t[eé]l[eé]phone|portable)\s*[:\-＝]*\s*/gi,
        ADDRESS_LABEL: /(?:adresse)\s*[:\-＝]*\s*/gi,
        FULL_NAME_LABEL: /(?:nom complet|nom)\s*[:\-＝]*\s*/gi,
        LAST_NAME_LABEL: /(?:nom de famille)\s*[:\-＝]*\s*/gi,
        COMPANY_LABEL: /(?:entreprise|soci[eé]t[eé])\s*[:\-＝]*\s*/gi,
      }),
      it: Object.freeze({
        EMAIL_LABEL: /(?:email)\s*[:\-＝]*\s*/gi,
        PHONE_LABEL: /(?:telefono|cellulare)\s*[:\-＝]*\s*/gi,
        ADDRESS_LABEL: /(?:indirizzo)\s*[:\-＝]*\s*/gi,
        FULL_NAME_LABEL: /(?:nome completo|nome)\s*[:\-＝]*\s*/gi,
        LAST_NAME_LABEL: /(?:cognome)\s*[:\-＝]*\s*/gi,
        COMPANY_LABEL: /(?:azienda|societ[aà])\s*[:\-＝]*\s*/gi,
      }),
    }),
    promptAltIdf = "prompt-security-alert",
    styleIdf = "simple-alert-styles",
    styleCls = "show",
    alertCls = "simple-floating-alert",
    marginFlag = "data-adjusting-margin",
    positionFlag = "data-positioning-alert",
    updateFlag = "data-listening-update",
    gpsPrompt = "prompt-textarea",
    dsPrompt = "chat-input",
    claudeFb = ".ProseMirror",
    inputElement =
      document.getElementById(gpsPrompt) ||
      document.getElementById(dsPrompt) ||
      document.querySelector(claudeFb),
    alerterWindow = document.getElementById(promptAltIdf);
  let marginItv;
  class SimpleFloatingAlert {
    constructor(inputElement, idSuffix = promptAltIdf) {
      this.input = inputElement;
      this.alert = null;
      this.showCls = styleCls;
      this.idf = idSuffix;
      this.isCurrentlyShowing = false;
      this._updatePosition = this._updatePosition.bind(this);
      this.updateMargin = this.updateMargin.bind(this);
      this.injectCSS();
      this.createAlert();
      if (this.input.getAttribute(updateFlag) !== "true") {
        window.addEventListener("scroll", this._updatePosition, {
          passive: true,
        });
        window.addEventListener("resize", this._updatePosition, {
          passive: true,
        });
        this.input.setAttribute(updateFlag, "true");
      }
      let parent = this.input.parentElement;
      while (
        parent &&
        parent !== document.body &&
        parent.getAttribute(updateFlag) !== "true"
      ) {
        parent.addEventListener("scroll", this._updatePosition, {
          passive: true,
        });
        parent.setAttribute(updateFlag, "true");
        parent = parent.parentElement;
      }
      if (this.input.getAttribute(positionFlag) !== "true") {
        setInterval(this._updatePosition, 1000);
        this.input.setAttribute(positionFlag, "true");
      }
    }
    injectCSS() {
      if (document.getElementById(styleIdf)) return;
      const style = document.createElement("style");
      style.id = styleIdf;
      style.textContent = `
				.${alertCls} {
					position: fixed;
					background-color: #dc3545;
					color: white;
					padding: 8px 12px;
					border-radius: 6px;
					font-size: 14px;
					z-index: 10000;
					display: none;
					box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: transform 0.33s ease-in-out, opacity 0.5s ease-in-out, margin-left 0.33s ease-in-out;
				}
				.${alertCls}.${styleCls} {
					display: block;
				}
				.${alertCls}::after {
					content: '';
					position: absolute;
					bottom: -6px;
					left: 20px;
					width: 0;
					height: 0;
					border-left: 6px solid transparent;
					border-right: 6px solid transparent;
					border-top: 6px solid #dc3545;
				}
        .${alertCls}:hover {
					opacity: 1 !important;
				}
			`;
      document.head.appendChild(style);
    }
    createAlert() {
      try {
        marginItv && clearInterval(marginItv);
      } catch (e) {
        // fail silently
      }
      const el = document.getElementById(this.idf);
      if (el?.isConnected) return;
      this.alert = document.createElement("div");
      this.alert.id = this.idf;
      this.alert.className = alertCls;
      document.body.appendChild(this.alert);
    }
    updateMargin() {
      if (!this.alert || !this.input) return;
      const style = window.getComputedStyle(this.alert),
        current = parseFloat(style.marginLeft) || 0,
        target = shouldShowMinimalAlert ? this.input.clientWidth * 0.25 : 0;
      if (Math.abs(current - target) > 0.5)
        this.alert.style.marginLeft = `${target}px`;
    }
    show(message) {
      if (this.isCurrentlyShowing) {
        if (!shouldShowMinimalAlert) {
          const scl = "scale(1)",
            cmpStl = getComputedStyle(this.alert);
          if (!cmpStl.transform.includes(scl))
            this.alert.style.transform = "scale(1)";
          if (
            cmpStl.opacity !== "1" &&
            !ev.currentTarget.getAttribute(timingFlag) === "true"
          )
            this.alert.style.opacity = "1";
        }
        return;
      }
      this.isCurrentlyShowing = true;
      if (!(this.alert instanceof HTMLElement && this.alert.isConnected))
        this.alert = document.getElementById(promptAltIdf);
      if (this.alert?.isConnected) {
        try {
          const msgContainer = document.createElement("span"),
            msgCtCls = "prompt-alert-label-message";
          msgContainer.classList.add(msgCtCls);
          this.alert.appendChild(msgContainer);
          const msgEl = document.createElement("em");
          msgEl.textContent = message;
          msgContainer.appendChild(msgEl);
          const msgApplyBtn = document.createElement("span"),
            applyBtnCls = "prompt-alert-apply-btn";
          msgApplyBtn.title = window.navigator.language.startsWith("pt-")
            ? "Clique aqui para aplicar as máscaras"
            : "Click here to apply masks";
          msgApplyBtn.classList.add(applyBtnCls);
          msgApplyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-repeat" viewBox="0 0 16 16">
            <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z"/>
          </svg>`;
          msgContainer.appendChild(msgApplyBtn);
          try {
            const firstRule = `.${msgCtCls} {
              display: flex;
              align-items: center;
              gap: 0.2rem;
              transform: translateY(-2px);
            }`,
              secondRule = `.${msgCtCls} .${applyBtnCls} {
              display: flex;
              align-items: center;
              transform: scale(0.6) translateY(2px);f
              transition: all 0.2s ease-in-out;
            }`,
              thirdRule = `.${msgCtCls} .${applyBtnCls}:hover {
              padding: 0.33rem;
              filter: brightness(2);
              font-weight: bold;
              border: outset #737373b0 1px;
              border-bottom-width: 2px;
              transform: scale(0.8) translateY(0);
              border-radius: 0.15rem;
              margin-left: 0.1rem;
            }`,
              rules = [firstRule, secondRule, thirdRule];
            const btnStlId = "buttonApplyStylesheet";
            let sheet = document.getElementById(btnStlId);
            if (!sheet) {
              const btnStl = document.createElement("style");
              btnStl.innerHTML = rules.join("\n");
              btnStl.id = btnStlId;
              document.body?.prepend(btnStl);
            }
          } catch (e) {
            // fail silently
          }
        } catch (e) {
          const appendedEls = Array.from(
            alerterWindow.querySelectorAll("*")
          ).filter(e => e && e.classList.contains(dmCls));
          for (const e of appendedEls) e?.remove();
          this.alert.innerText = message;
        }
        this.alert.classList.add(this.showCls);
        if (this.alert.getAttribute(marginFlag) !== "true") {
          marginItv = setInterval(() => {
            if (!(this.alert instanceof HTMLElement && this.alert.isConnected))
              this.alert = document.getElementById(promptAltIdf);
            if (!this.alert?.isConnected) return;
            if (!(this.input instanceof HTMLElement || this.input?.isConnected))
              this.input =
                document.getElementById(gpsPrompt) ||
                document.getElementById(dsPrompt) ||
                document.querySelector(claudeFb);
            if (
              !(
                this.input instanceof HTMLElement &&
                this.input.isConnected &&
                this.input.clientWidth
              )
            )
              return;
            this.updateMargin();
          }, 100);
          this.alert.setAttribute(marginFlag, "true");
        }
      }
      if (!(this.input instanceof HTMLElement && this.input.isConnected))
        this.input =
          document.getElementById(gpsPrompt) ||
          document.getElementById(dsPrompt) ||
          document.querySelector(claudeFb);
      if (this.input?.isConnected && !shouldShowMinimalAlert) {
        this.input.style.borderColor = "#dc3545";
        this.input.style.color = "red";
      } else this._fadeInput();
      this._updatePosition();
      if (!this.alert?.isConnected) return;
      if (!shouldShowMinimalAlert) {
        this.alert.style.transform = "scale(1)";
        this.alert.style.opacity = "1";
        setTimeout(() => {
          this._fadeAlert(true);
          this._fadeInput(true);
        }, 1000);
      } else this._fadeAlert();
    }
    hide() {
      this._fadeAlert();
      this._fadeInput();
    }
    destroy() {
      if (!this.alert?.isConnected) return;
      this.alert.classList.remove(this.showCls);
      if (!(this.alert instanceof HTMLElement && this.alert.isConnected))
        this.alert = document.getElementById(promptAltIdf);
      if (this.alert?.isConnected) {
        this.alert.style.transform = "scale(0)";
        this.alert.style.opacity = "0";
      }
      this._fadeInput();
      this.isCurrentlyShowing = false;
    }
    _fadeAlert(soft = false) {
      if (!(this.alert instanceof HTMLElement && this.alert.isConnected))
        this.alert = document.getElementById(promptAltIdf);
      if (this.alert?.isConnected) {
        if (!soft) this.alert.style.transform = "scale(0.1)";
        if (!soft) this.alert.style.opacity = "0.33";
        else this.alert.style.opacity = "0.5";
      }
    }
    _fadeInput(soft = false) {
      if (!(this.input instanceof HTMLElement && this.input.isConnected))
        this.input =
          document.getElementById(gpsPrompt) ||
          document.getElementById(dsPrompt) ||
          document.querySelector(claudeFb);
      if (this.input?.isConnected) {
        this.input.style.borderColor = "";
        this.input.style.color = "#fff";
        if (!soft && this.alert) this.updateMargin();
      }
    }
    _updatePosition() {
      console.log("updating...");
      if (!(this.alert instanceof HTMLElement && this.alert.isConnected))
        this.alert = document.getElementById(promptAltIdf);
      if (!this.alert?.isConnected) return;
      if (getComputedStyle(this.alert).opacity === "0")
        this.isCurrentlyShowing = false;
      console.log(this.isCurrentlyShowing);
      if (!this.isCurrentlyShowing) return;
      if (!(this.input instanceof HTMLElement && this.input.isConnected))
        this.input =
          document.getElementById(gpsPrompt) ||
          document.getElementById(dsPrompt) ||
          document.querySelector(claudeFb);
      if (!this.input?.isConnected) return;
      console.log(this.input);
      console.log(this.alert);
      console.log("procceding with update...");
      const rect = this.input.getBoundingClientRect();
      this.alert.style.left = rect.left + "px";
      this.alert.style.top = rect.top - 50 + "px";
      this.alert.style.width = rect.width + "px";
    }
  }
  const alerter = new SimpleFloatingAlert(inputElement);
  if (alerterWindow) {
    alerterWindow.setAttribute("role", "alert");
    alerterWindow.setAttribute("aria-live", "assertive");
  }
  setInterval(() => {
    try {
      const e =
        document.getElementById(gpsPrompt) ||
        document.getElementById(dsPrompt) ||
        document.querySelector(claudeFb);
      if (
        !(
          e instanceof HTMLInputElement ||
          e instanceof HTMLTextAreaElement ||
          (e instanceof HTMLElement && e.contentEditable === "true")
        )
      )
        return;
      const txt =
          e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement
            ? e.value
            : e.innerText,
        dictEntries = Object.entries(MAIN_DICT).filter(Boolean),
        results = [];
      for (let w = 0; w < txt.length; w++)
        for (let i = 0; i < dictEntries.length; i++) {
          const localDicts = dictEntries[i];
          for (let j = 0; j < Object.values(localDicts).length; j++) {
            const exps = Object.entries(localDicts[1]);
            for (let k = 0; k < exps.length; k++) {
              const exp = exps[k][1],
                key = exps[k][0],
                res = exp.exec(txt);
              if (
                exp instanceof RegExp &&
                res &&
                !results.some(r => res.index === r.foundIn)
              ) {
                results.push({
                  k: key,
                  e: exp,
                  v: res[0],
                  foundIn: res.index,
                  endsIn: res.index + res[0].length,
                });
              } else if (
                typeof exp === "string" &&
                res &&
                txt[w].trim().toLowerCase() === exp &&
                !results.some(r => res.index === r.foundIn)
              ) {
                results.push({
                  k: key,
                  e: exp,
                  v: res[0],
                  foundIn: res.index,
                  endsIn: res.index + res[0].length,
                });
              }
            }
          }
        }
      const hasLeak = results.length !== 0;
      if (hasLeak) {
        isDestroyed = false;
        hidingAcc = 0;
        alerter.show(
          window.navigator.language.startsWith === "pt"
            ? `${results.length} vazamento${
                results.length > 1 ? "s" : ""
              } de segurança na sua entrada!`
            : `${results.length} security leak${
                results.length > 1 ? "s" : ""
              } detected in your input!`
        );
        for (let r = 0; r < results.length; r++) {
          const childs = e.querySelectorAll("*");
          let collectedHTML = "";
          for (const c of childs) {
            const html = c.outerHTML,
              index = html.indexOf(results[r].foundIn);
            if (index !== -1) {
              collectedHTML += html.slice(0, index);
              break;
            }
          }
          const total =
            (collectedHTML.match(/</g) || []).length +
            (collectedHTML.match(/<\/?([a-zA-Z0-9\-]+)>?/g) || []).reduce(
              (sum, tag) => sum + tag.replace(/<\/?|\/?>/g, "").length,
              0
            ) +
            (collectedHTML.match(/\//g) || []).length +
            (collectedHTML.match(/>/g) || []).length;
          console.log("foundIn:", results[r].foundIn);
          console.log("endsIn:", results[r].endsIn + total);
          bearer = childs.find(c => c.innerText.includes(results[r].foundIn));
          if (bearer) {
            // Optional: handle logic for found bearer
          }
        }
        const dmCls = "dismiss",
          dmFlag = "data-listening-click",
          alrtFlag = "data-listening-click",
          alerterWindow = document.getElementById(promptAltIdf);
        if (alerterWindow) {
          let dm = alerterWindow.querySelector(`.${dmCls}`);
          if (!dm) {
            const dmBtn = document.createElement("button");
            dmBtn.classList.add(dmCls);
            dmBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
              </svg>`;
            dmBtn.style.display = "inline";
            dmBtn.style.background = "transparent";
            alerterWindow.appendChild(dmBtn);
            if (
              dmBtn.parentElement instanceof HTMLElement &&
              dmBtn.parentElement.isConnected
            ) {
              dmBtn.parentElement.style.display = "flex";
              dmBtn.parentElement.style.justifyContent = "space-between";
            }
          }
          dm = alerterWindow.querySelector(`.${dmCls}`);
          if (dm) {
            if (dm.getAttribute(dmFlag) !== "true") {
              dm.addEventListener("click", () => {
                const alerterWindow = document.getElementById(promptAltIdf),
                  input =
                    document.getElementById(gpsPrompt) ||
                    document.getElementById(dsPrompt) ||
                    document.querySelector(claudeFb);
                if (alerterWindow) {
                  for (const { k, v } of [
                    { k: "transform", v: "scale(0.1)" },
                    { k: "opacity", v: "0.33" },
                    {
                      k: "marginLeft",
                      v: `${input?.clientWidth * 0.25 || 0}px`,
                    },
                  ]) {
                    if (
                      !Object.getOwnPropertyDescriptor(
                        alerterWindow.style[k]
                      ) ||
                      Object.getOwnPropertyDescriptor(alerterWindow.style[k])
                        .configurable
                    )
                      alerterWindow.style[k] = v;
                  }
                  setTimeout(() => {
                    if (!alerterWindow) return;
                    const cmpTfm = getComputedStyle(alerterWindow).transform;
                    if (
                      cmpTfm.slice(
                        cmpTfm.indexOf("(") + 1 ?? 0,
                        cmpTfm.indexOf(",")
                      ) !== "1"
                    )
                      shouldShowMinimalAlert = true;
                  }, 50);
                }
              });
              dm.setAttribute(dmFlag, "true");
            }
            dm.setAttribute("aria-label", "Hide prompt security leak alert");
            dm.setAttribute("aria-controls", promptAltIdf);
          }
          if (alerterWindow.getAttribute(alrtFlag) !== "true") {
            alerterWindow.addEventListener("click", ev => {
              if (!shouldShowMinimalAlert || !ev?.currentTarget) return;
              const scl = "scale(1)",
                timingFlag = "data-timing";
              for (const { k, v } of [
                { k: "transform", v: scl },
                { k: "opacity", v: "1" },
                { k: "marginLeft", v: "0" },
              ])
                ev.currentTarget.style[k] = v;
              const targ = ev.currentTarget;
              setTimeout(() => {
                if (!alerterWindow) return;
                const cmpTfm = getComputedStyle(alerterWindow).transform;
                if (
                  cmpTfm.slice(
                    cmpTfm.indexOf("(") + 1 ?? 0,
                    cmpTfm.indexOf(",")
                  ) === "1"
                ) {
                  shouldShowMinimalAlert = false;
                  if (!targ) return;
                  targ.style.marginLeft = "0";
                }
              }, 500);
              if (ev.currentTarget.getAttribute(timingFlag) === "true") return;
              setTimeout(() => {
                const alerterWindow = document.getElementById(promptAltIdf);
                if (alerterWindow instanceof HTMLElement) return;
                alerterWindow.style.opacity = "0.5";
                alerterWindow.setAttribute(timingFlag, "false");
              }, 2000);
              ev.currentTarget.setAttribute(timingFlag, "true");
            });
            alerterWindow.setAttribute(alrtFlag, "true");
          }
        }
      } else {
        const MAX_HIDE_PASSES = 10;
        if (!alerter) return;
        const win = document.getElementById(promptAltIdf);
        const opacity = win ? parseFloat(getComputedStyle(win).opacity) : 0;
        if (opacity > 0) hidingAcc++;
        if (hidingAcc > MAX_HIDE_PASSES) {
          alerter.destroy();
          if (!win || parseFloat(getComputedStyle(win).opacity) === 0)
            hidingAcc = 0;
          isDestroyed = true;
        } else !isDestroyed && alerter.hide();
      }
    } catch (e) {
      // fail silently
    }
  }, 250);
})();
