import type { DetectionRule } from "../declarations/masking.types";
import { deepFreeze } from "@shared/utils/deep-freeze.utils";
import {
  EN_US_FIRST_NAMES,
  EN_US_LAST_NAMES,
  ES_FIRST_NAMES,
  ES_LAST_NAMES,
  IN_FIRST_NAMES,
  IN_LAST_NAMES,
  NAME_CONTEXT_PREFIXES,
  PT_BR_FIRST_NAMES,
  PT_BR_LAST_NAMES,
  PT_PT_FIRST_NAMES,
  PT_PT_LAST_NAMES,
  RU_FIRST_NAMES,
  RU_LAST_NAMES,
  ZH_CN_FIRST_NAMES,
  ZH_CN_LAST_NAMES,
} from "./name-dictionaries.constants";
import {
  BR_CEP_LABEL_FLAGS,
  BR_CNH_LABEL_FLAGS,
  BR_PIS_PASEP_LABEL_FLAGS,
  BR_RG_LABEL_FLAGS,
  BR_VOTER_LABEL_FLAGS,
  CN_RESIDENT_ID_LABEL_FLAGS,
  ES_DNI_LABEL_FLAGS,
  ES_NIE_LABEL_FLAGS,
  IN_AADHAAR_LABEL_FLAGS,
  IN_GSTIN_LABEL_FLAGS,
  IN_PAN_LABEL_FLAGS,
  INCIDENT_ID_LABEL_FLAGS,
  LATAM_CEDULA_LABEL_FLAGS,
  LATAM_DNI_LABEL_FLAGS,
  LATAM_RUC_LABEL_FLAGS,
  NEXT_FIELD_BOUNDARY,
  NUMERIC_SECRET_ASSIGNMENT_FLAGS,
  PT_NIF_LABEL_FLAGS,
  PT_NISS_LABEL_FLAGS,
  RU_INN_LABEL_FLAGS,
  RU_SNILS_LABEL_FLAGS,
  SECRET_ASSIGNMENT_FLAGS,
  SHARED_ADDRESS_LABEL_FLAGS,
  SHARED_IP_LABEL_FLAGS,
  SHARED_NAME_LABEL_FLAGS,
  SHARED_PASSPORT_LABEL_FLAGS,
  SHARED_PHONE_LABEL_FLAGS,
  US_EIN_LABEL_FLAGS,
} from "./mask-flag-dictionaries.constants";
import {
  isValidArgentineCuit,
  isLikelyBrazilianStateId,
  isValidChineseResidentId,
  isValidColombianNit,
  isLikelyCreditCard,
  looksLikeCnpjStructural,
  looksLikeCpfStructural,
  looksLikeCardNumberSequence,
  looksLikePeruvianRucStructural,
  looksLikeUsaSsnStructural,
  isLikelyIban,
  isLikelyPhoneNumber,
  isValidChileanRut,
  isValidCnpj,
  isValidCpf,
  isValidIndianAadhaar,
  isValidPeruvianRuc,
  isValidPortugueseNif,
  isValidRussianInn,
  isValidRussianSnils,
  isValidSpanishDni,
  isValidSpanishNie,
  looksLikeBrazilianVoterId,
  looksLikeLatamNationalId,
  looksLikeLatamTaxId,
  looksLikeStructuredAddress,
  looksLikeStructuredName,
  looksSecretLike,
  looksLikeConfigSecret,
  detectObfuscationTags,
  looksLikeFuzzyAddress,
} from "../utils/mask-validation.utils";

// ─── Anti-bypass separator character classes ────────────────────────────────
// Used in contextual fallback patterns to handle separator-stuffing attacks.
// Covers: dot variants (. · 。 ．), dash variants (- – — _ =), slash (/ \ ⁄ ⧸),
// and optional surrounding whitespace. {1,3} allows repeated separators.
// Reserved for future `new RegExp()` constructed patterns:
const _DOT_LIKE = String.raw`[.·。．]`,
  _DASH_LIKE = String.raw`[-\u2013\u2014_=~*#]`,
  _SLASH_LIKE = String.raw`[/\\\u2044\u29F8]`;
void [_DOT_LIKE, _DASH_LIKE, _SLASH_LIKE];

// ─── PII field-boundary negative lookahead ──────────────────────────────────
// NEXT_FIELD_BOUNDARY now imported from mask-flag-dictionaries.constants.ts

/**
 * Address value pattern that stops at the next PII field label boundary.
 * Prevents labeled-address from swallowing subsequent SSN/phone/email etc.
 * on single-line inputs where multiple fields are concatenated.
 */
const LABELED_ADDRESS_VALUE = String.raw`(?:(?!\s+(?:${NEXT_FIELD_BOUNDARY})\s*[:=-])[^\n\r]){6,200}`;
import { buildConfigSecretAssignmentPattern, createDelimitedLabelValuePattern } from "../utils/mask-pattern.utils";

/**
 * Well-known webserver, firewall, cloud-provider, and platform config keys
 * whose values must always be masked regardless of pattern or entropy.
 *
 * These are hard-matched by the `hardcoded-config-secret` rule (priority 122)
 * to catch standardized .env keys that the keyword-based fallback rules
 * might miss (e.g., short/dummy values, unusual delimiter spacing, etc.).
 *
 * Format: each entry must match the FULL exact key name (anchored by
 * word boundaries or line start). Entries are regex-escaped automatically.
 */
const HARDCODED_CONFIG_SECRET_KEYS: readonly string[] = Object.freeze([
  // ── Framework / Application ──
  String.raw`APP[_]?(?:KEY|SECRET|TOKEN)`,
  String.raw`APP[_-]?ENCRYPTION[_-]?KEY`,
  String.raw`APP[_-]?(?:PASS(?:WORD)?|PWD)`,

  // ── Generic Database ──
  String.raw`(?:DB|DATABASE)[-_]?(?:PASS(?:WORD)?|PWD|URL|HOST|PORT|USER(?:NAME)?|DATABASE|NAME|CONNECTION)`,
  // ── PostgreSQL ──
  String.raw`(?:POSTGRES|POSTGRESQL|PSQL|PGSQL|PG)[-_]?(?:PASS(?:WORD)?|PWD|DB|DATABASE|USER|HOST|PORT|URL|ROOT[_]?PASS(?:WORD)?)`,
  // ── MySQL / MariaDB ──
  String.raw`(?:MYSQL|MARIADB|MARIA|MYSQLDB)[-_]?(?:PASS(?:WORD)?|PWD|DB|DATABASE|USER|HOST|PORT|URL|ROOT[_]?PASS(?:WORD)?)`,
  // ── MongoDB ──
  String.raw`(?:MONGO|MONGODB|MONGOOSE)[-_]?(?:PASS(?:WORD)?|PWD|DB|DATABASE|USER|HOST|PORT|URL|URI)`,
  // ── SQLite / SQL Server / Oracle ──
  String.raw`(?:SQLITE|SQLITE3|SQLSERVER|MSSQL|MSSQLSERVER|ORACLE|ORACLEDB)[-_]?(?:PASS(?:WORD)?|PWD|DB|DATABASE|USER|HOST|PORT|URL)`,
  // ── Redis / Cache ──
  String.raw`REDIS[_]?(?:PASS(?:WORD)?|PWD|URL|HOST|PORT|DB|AUTH)`,
  String.raw`(?:MEMCACHED|MEMCACHE)[-_]?(?:PASS(?:WORD)?|PWD|HOST|PORT|USER(?:NAME)?|SERVERS)`,
  String.raw`CACHE[_]?PASS(?:WORD)?`,
  // ── Other Databases ──
  String.raw`(?:CASSANDRA|COUCHDB|COUCHBASE|DYNAMODB|ELASTICSEARCH|ELASTIC|INFLUXDB|INFLUX|NEO4J|CLICKHOUSE|SNOWFLAKE|COCKROACHDB|TIDB|FIRESTORE|REALTIME[_]?DB|SUPABASE)[-_]?(?:PASS(?:WORD)?|PWD|DB|DATABASE|USER|HOST|PORT|URL|URI|KEY|SECRET|TOKEN|AUTH|ENDPOINT)`,

  // ── Mail / SMTP ──
  String.raw`(?:MAIL|SMTP|EMAIL|MAILER|SES|POSTFIX|SENDMAIL|EXIM)[-_]?(?:PASS(?:WORD)?|PWD|USER(?:NAME)?|HOST|PORT|DRIVER|ENCRYPTION|FROM[_]?ADDRESS|FROM[_]?NAME)`,
  // ── AWS ──
  String.raw`AWS[_]?(?:ACCESS[_-]?KEY[_-]?ID|SECRET[_-]?ACCESS[_-]?KEY|SESSION[_-]?TOKEN)`,
  String.raw`AWS[_]?ACCOUNT[_-]?ID`,
  String.raw`AWS[_]?(?:DEFAULT[_-]?REGION|BUCKET|ENDPOINT|REGION)`,
  String.raw`AWS[_]?(?:KMS|KEY[_-]?MANAGEMENT)[-_]?(?:KEY|SECRET|TOKEN)`,
  String.raw`AWS[_]?(?:RDS|DYNAMODB|ELASTICACHE|OPENSEARCH|ELASTICSEARCH)[-_]?(?:PASS(?:WORD)?|PWD|USER|HOST|PORT|URL|ENDPOINT)`,
  String.raw`AWS[_]?(?:S3|GLACIER|EFS|FSX|STORAGE[_]?GATEWAY)[-_]?(?:ACCESS[_-]?KEY|SECRET|KEY|BUCKET)`,
  String.raw`AWS[_]?(?:EKS|ECS|ECR|LAMBDA|CLOUDFRONT|ROUTE[_]?53|IAM|COGNITO|SNS|SQS|KINESIS|ATHENA|GLUE|EMR|REDSHIFT|QUICKSIGHT)[-_]?(?:KEY|SECRET|TOKEN|PASS(?:WORD)?|CREDENTIALS)`,

  // ── Google Cloud / GCP / Firebase ──
  String.raw`(?:GOOGLE|GCLOUD|GCP)[-_]?(?:KEY|SECRET|TOKEN|CREDENTIALS|APPLICATION[_]?CREDENTIALS|SERVICE[_]?ACCOUNT)`,
  String.raw`GCP[_]?(?:PROJECT|REGION|ZONE)`,
  String.raw`FIREBASE[_]?(?:API[_]?KEY|AUTH[_]?DOMAIN|PROJECT[_]?ID|DATABASE[_]?URL|STORAGE[_]?BUCKET|MESSAGING[_]?SENDER[_]?ID|APP[_]?ID|MEASUREMENT[_]?ID|PRIVATE[_]?KEY|CLIENT[_]?EMAIL|TOKEN[_]?URI)`,
  String.raw`(?:GOOGLE|GCP)[-_]?(?:CLOUD[_]?SQL|BIGQUERY|CLOUD[_]?STORAGE|CLOUD[_]?FUNCTIONS|CLOUD[_]?RUN|GKE|CLOUD[_]?KMS|SECRET[_]?MANAGER|PUBSUB|DATASTORE|SPANNER|FIRESTORE)[-_]?(?:KEY|SECRET|TOKEN|PASS(?:WORD)?|CREDENTIALS|CONNECTION)`,

  // ── Azure ──
  String.raw`AZURE[_]?(?:KEY|SECRET|TOKEN|CONNECTION[_-]?STRING|CLIENT[_-]?ID|TENANT[_-]?ID|SUBSCRIPTION[_-]?ID)`,
  String.raw`AZURE[_]?(?:STORAGE|BLOB|QUEUE|TABLE|FILE|COSMOS|SQL|AKS|KEY[_]?VAULT|FUNCTIONS|APP[_]?SERVICE|DEVOPS|ACTIVE[_]?DIRECTORY)[-_]?(?:KEY|SECRET|TOKEN|PASS(?:WORD)?|CONNECTION[_-]?STRING|ENDPOINT|CREDENTIALS)`,

  // ── Cloud Platforms / Hosting ──
  String.raw`(?:DIGITALOCEAN|DO)[-_]?(?:ACCESS[_-]?KEY|SECRET[_-]?KEY|TOKEN|API[_-]?TOKEN|SPACES[_]?(?:KEY|SECRET))`,
  String.raw`(?:CLOUDFLARE|CF)[-_]?(?:API[_-]?KEY|API[_-]?TOKEN|SECRET|ZONE[_-]?ID|ACCOUNT[_-]?ID|EMAIL|ORIGIN[_]?CA[_]?KEY|TUNNEL[_-]?TOKEN|R2[_]?(?:ACCESS[_-]?KEY|SECRET|TOKEN))`,
  String.raw`(?:LINODE|AKAMAI|FASTLY)[-_]?(?:API[_-]?KEY|TOKEN|SECRET|ACCESS[_-]?KEY)`,
  String.raw`(?:VULTR|OVH|HETZNER|SCALEWAY|UPCLOUD|ALIBABA[_]?CLOUD|ALIYUN|TENCENT[_]?CLOUD|HUAWEI[_]?CLOUD)[-_]?(?:KEY|SECRET|TOKEN|PASS(?:WORD)?|ACCESS[_-]?KEY)`,
  String.raw`(?:NETLIFY|VERCEL|RAILWAY|HEROKU|RENDER|FLY|RENDER|KINSTA|PANTHEON|PLATFORM[_]?SH)[-_]?(?:API[_-]?KEY|TOKEN|SECRET|AUTH[_-]?TOKEN|ACCESS[_-]?TOKEN|SITE[_-]?ID|PROJECT[_-]?ID|TEAM[_-]?ID|BUILD[_-]?HOOK|DEPLOY[_-]?HOOK)`,

  // ── CI / CD ──
  String.raw`(?:GITHUB|GH)[-_]?(?:TOKEN|SECRET|PAT|CLIENT[_-]?ID|CLIENT[_-]?SECRET|APP[_-]?ID|INSTALLATION[_-]?ID|WEBHOOK[_-]?SECRET|DEPLOY[_-]?KEY|ACTIONS[_-]?TOKEN)`,
  String.raw`(?:GITLAB|BITBUCKET|AZURE[_]?DEVOPS)[-_]?(?:TOKEN|SECRET|PASS(?:WORD)?|ACCESS[_-]?TOKEN|PIPELINE[_-]?TOKEN|REGISTRY[_-]?PASS(?:WORD)?)`,
  String.raw`(?:CIRCLECI|TRAVIS|JENKINS|BAMBOO|TEAMCITY|DRONE[_]?CI|ARGOCD|SPINNAKER|BUILDKITE|CODECOV|COVERALLS)[-_]?(?:TOKEN|SECRET|KEY|PASS(?:WORD)?|API[_-]?KEY)`,

  // ── Secret / Config Management ──
  String.raw`(?:VAULT|HASHICORP[_]?VAULT)[-_]?(?:TOKEN|ADDR|ADDRESS|SECRET|KEY|ROLE[_]?ID|SECRET[_]?ID|APPROLE[_]?ROLE[_]?ID|APPROLE[_]?SECRET[_]?ID)`,
  String.raw`(?:DOPPLER|INFISICAL|ONBOARD|SECRETHUB|ENVKEY)[-_]?(?:TOKEN|SERVICE[_-]?TOKEN|PROJECT|CONFIG)`,
  String.raw`(?:ANSIBLE|CHEF|PUPPET|TERRAFORM|PULUMI)[-_]?(?:VAULT[_-]?PASS(?:WORD)?|SECRET|TOKEN|KEY)`,
  String.raw`(?:PKI|CA|CERTIFICATE|CERT)[-_]?(?:KEY|PASS(?:WORD)?|SECRET|PRIVATE[_-]?KEY|PUBLIC[_-]?KEY|CRT|PEM|P12|PFX)`,

  // ── Message Queues / Streaming ──
  String.raw`(?:RABBITMQ|AMQP|KAFKA|SQS|SNS|NATS|NATS[_]?IO|NATS[_]?SERVER|ACTIVEMQ|ZEROMQ|MQTT|MOSQUITTO)[-_]?(?:PASS(?:WORD)?|PWD|USER(?:NAME)?|HOST|PORT|URL|URI|KEY|SECRET|TOKEN|CONNECTION)`,

  // ── Search / Analytics ──
  String.raw`(?:ELASTIC|ELASTICSEARCH|OPENSEARCH|SOLR|MEILISEARCH|TYPESENSE|ALGOLIA)[-_]?(?:PASS(?:WORD)?|PWD|USER(?:NAME)?|HOST|PORT|URL|API[_-]?KEY|SECRET|TOKEN|CLOUD[_]?ID)`,
  String.raw`(?:GRAFANA|PROMETHEUS|LOKI|TEMPO|MIMIR)[-_]?(?:PASS(?:WORD)?|PWD|USER(?:NAME)?|API[_-]?KEY|TOKEN|SECRET|URL)`,
  String.raw`(?:DATADOG|NEW[_-]?RELIC|SENTRY|BUGSNAG|ROLLBAR|AIRBRAKE|APPDYNAMICS|DYNATRACE)[-_]?(?:API[_-]?KEY|TOKEN|SECRET|DSN|AUTH[_-]?TOKEN|LICENSE[_-]?KEY)`,

  // ── Notification / Communication ──
  String.raw`(?:TWILIO|SENDGRID|MAILGUN|MAILCHIMP|SENDINBLUE|BREVO|POSTMARK|SPARKPOST|MAILJET)[-_]?(?:API[_-]?KEY|SECRET|TOKEN|AUTH[_-]?TOKEN|SID|USER(?:NAME)?|PASS(?:WORD)?)`,
  String.raw`(?:SLACK|DISCORD|TELEGRAM|MATTERMOST|ROCKET[_]?CHAT|MATRIX|WHATSAPP|SIGNAL)[-_]?(?:TOKEN|WEBHOOK|SECRET|SIGNING[_-]?SECRET|API[_-]?KEY|BOT[_-]?TOKEN)`,
  String.raw`(?:ONESIGNAL|PUSHER|ABLY|PUSHY|FIREBASE[_]?CLOUD[_]?MESSAGING|FCM)[-_]?(?:API[_-]?KEY|TOKEN|SECRET|APP[_]?ID|REST[_]?API[_]?KEY|KEY[_]?ID|INSTANCE[_]?ID|SENDER[_]?ID)`,

  // ── Payments / Billing ──
  String.raw`(?:STRIPE|PAYPAL|BRAINTREE|SQUARE|ADYEN|KLARNA|PAYSTACK|FLUTTERWAVE|RAZORPAY|MOLLIE|LEMON[_]?SQUEEZY|PADDLE|CHARGEBEE|RECURLY|PLAID)[-_]?(?:KEY|SECRET|TOKEN|CLIENT[_-]?ID|WEBHOOK[_-]?SECRET|SIGNING[_-]?SECRET|PUBLISHABLE[_-]?KEY|API[_-]?KEY|MERCHANT[_-]?ID|ENDPOINT[_-]?SECRET)`,

  // ── Authentication / OAuth / SSO ──
  String.raw`(?:JWT|AUTH|OAUTH|OIDC|SAML|OPENID|LDAP|SSO)[-_]?(?:SECRET|KEY|TOKEN|CLIENT[_-]?ID|CLIENT[_-]?SECRET|ISSUER|AUDIENCE)`,
  String.raw`(?:CLIENT|OAUTH)[-_]?SECRET`,
  String.raw`(?:SESSION|COOKIE|CSRF)[-_]?(?:SECRET|KEY|TOKEN|DOMAIN)`,
  String.raw`ENCRYPTION[_]?KEY`,
  String.raw`SIGNING[_]?KEY`,
  String.raw`(?:PASSPORT|AUTH0|OKTA|KEYCLOAK|CLERK|KINDE|WORKOS|AUTHENTIK|AUTHELIA)[-_]?(?:SECRET|KEY|TOKEN|CLIENT[_-]?ID|CLIENT[_-]?SECRET|DOMAIN|ISSUER)`,

  // ── API / Integration keys ──
  String.raw`(?:API|REST|GRAPHQL|GRPC|OPENAPI|SWAGGER)[-_]?(?:KEY|SECRET|TOKEN|ENDPOINT|GATEWAY[_]?(?:KEY|TOKEN))`,
  String.raw`(?:GITHUB|GH|GITLAB|BITBUCKET|AZURE[_]?DEVOPS|CODEBERG|GITEA|GITEA)[-_]?(?:TOKEN|KEY|SECRET|CLIENT[_-]?ID|CLIENT[_-]?SECRET|PASS(?:WORD)?)`,
  String.raw`(?:NPM|YARN|PNPM|BUN)[-_]?(?:TOKEN|AUTH[_-]?TOKEN|REGISTRY|PUBLISH[_-]?TOKEN)`,
  String.raw`(?:DOCKER[_]?HUB|QUAY|HARBOR|ECR|GCR|ACR|GITHUB[_]?CONTAINER[_]?REGISTRY|DOCKER[_]?REGISTRY)[-_]?(?:PASS(?:WORD)?|TOKEN|SECRET|USER(?:NAME)?|REGISTRY)`,

  // ── Docker / Container / Kubernetes ──
  String.raw`(?:DOCKER|K8S|KUBERNETES|KUBE|RANCHER|OPENSHIFT|NOMAD)[-_]?(?:PASS(?:WORD)?|PWD|SECRET|TOKEN|KEY|CONFIG|CONTEXT|CLUSTER)`,
  String.raw`(?:REGISTRY|CONTAINER[_]?REGISTRY)[-_]?(?:PASS(?:WORD)?|SECRET|TOKEN|USER(?:NAME)?)`,
  String.raw`(?:HELM|ISTIO|LINKERD|CONSUL|ETCD|VAULT|ARGOCD|FLUX)[-_]?(?:TOKEN|SECRET|KEY|PASS(?:WORD)?)`,
  String.raw`(?:KUBECONFIG|KUBE[_]?CONFIG|KUBECTL|KC)[-_]?(?:TOKEN|KEY|SECRET)?`,

  // ── Monitoring / Observability ──
  String.raw`(?:LOGGLY|PAPERTRAIL|ELASTIC|ELASTICSEARCH|SPLUNK|SUMOLOGIC|HONEYCOMB|LIGHTSTEP)[-_]?(?:KEY|TOKEN|SECRET|API[_-]?KEY|AUTH[_-]?TOKEN)`,
  String.raw`(?:OPEN[_]?TELEMETRY|OTEL|JAEGER|ZIPKIN)[-_]?(?:TOKEN|KEY|SECRET|ENDPOINT)`,

  // ── Network / Firewall / VPN ──
  String.raw`(?:SSH|SSL|TLS|CERT|OPENVPN|WIREGUARD|IPSEC|TAILSCALE|ZEROTIER|HEADSCALE)[-_]?(?:KEY|PRIVATE[_-]?KEY|PASS(?:WORD)?|SECRET|TOKEN|AUTH[_-]?KEY|PRE[_]?SHARED[_-]?KEY|PSK)`,
  String.raw`(?:NGINX|NGX|HTTPD|APACHE|APACHE2|TRAEFIK|HAPROXY|CADDY|TOMCAT|JBOSS|WILDFLY|ENVOY|LIGHTTPD|LITESPEED)[-_]?(?:PASS(?:WORD)?|SECRET|KEY|TOKEN|AUTH|BASIC[_]?AUTH|API[_-]?KEY)`,
  String.raw`(?:PFSENSE|OPNSENSE|UFW|IPTABLES|NPFTABLES|FIREWALL|FIREWALLD|SELINUX|APPARMOR)[-_]?(?:PASS(?:WORD)?|SECRET|KEY|TOKEN|AUTH)`,

  // ── DNS / Domain ──
  String.raw`(?:CLOUDFLARE|ROUTE[_]?53|GODADDY|NAMECHEAP|DYNU|DUCKDNS|NO[_]?IP|AFRAID|FREEDNS|HE[_]?NET)[-_]?(?:API[_-]?KEY|TOKEN|SECRET|PASS(?:WORD)?|USER(?:NAME)?|UPDATE[_-]?KEY|ZONE[_-]?KEY)`,

  // ── Custom app secrets (this project's own keys) ──
  String.raw`FEEDBACK[_]?RETRY[_]?SECRET`,
  String.raw`BACKEND[_]?PORT`,
]);

export const MASKING_RULES: readonly DetectionRule[] = deepFreeze([
  // ─── Hardcoded webserver/firewall/cloud config secret keys ──────────────────
  // Well-known KEY=VALUE patterns that must ALWAYS mask their values.
  // These are highest-priority to catch standardized config keys before
  // the pattern-based rules can false-negative on them.

  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "hardcoded-config-secret",
    label: "Hardcoded config secret key",
    locale: "shared",
    allowEmptyValue: true,
    patternFactory: () =>
      new RegExp(
        // Matches KEY=VALUE where KEY is a well-known config secret name.
        // Uses word/line boundaries to avoid partial matches inside longer keys.
        String.raw`(?:^|[\s;{}])(?:` +
        HARDCODED_CONFIG_SECRET_KEYS.join("|") +
        String.raw`)\s*[:=][\t ]*["']?(\S*)["']?(?:$|[\s;{}])`,
        "gimu",
      ),
    priority: 122,
    validator: looksLikeConfigSecret,
    valueGroup: 1,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "high",
    id: "email-address",
    label: "Email address",
    locale: "shared",
    patternFactory: () => /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
    priority: 120,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "jwt-token",
    label: "JWT token",
    locale: "shared",
    patternFactory: () =>
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\b/gu,
    priority: 130,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "openai-style-key",
    label: "API key",
    locale: "shared",
    patternFactory: () =>
      /\b(?:sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9_-]{20,})\b/gu,
    priority: 130,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "twilio-account-sid",
    label: "Twilio account SID",
    locale: "shared",
    patternFactory: () => /\bAC[a-f0-9]{32}\b/giu,
    priority: 124,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "sendgrid-api-key",
    label: "SendGrid API key",
    locale: "shared",
    patternFactory: () => /\bSG\.[A-Za-z0-9_-]{20,}\b/g,
    priority: 124,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "mailgun-api-key",
    label: "Mailgun API key",
    locale: "shared",
    patternFactory: () => /\bkey-[A-Za-z0-9]{20,}\b/g,
    priority: 124,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "firebase-api-key",
    label: "Firebase API key",
    locale: "shared",
    patternFactory: () => /\bAIza[0-9A-Za-z_-]{30,}\b/g,
    priority: 124,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "azure-account-key",
    label: "Azure account key",
    locale: "shared",
    patternFactory: () => /\bAccountKey\s*=\s*([A-Za-z0-9+/=]{8,})\b/giu,
    priority: 124,
    valueGroup: 1,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "aws-access-key",
    label: "AWS access key",
    locale: "shared",
    patternFactory: () => /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    priority: 125,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "aws-secret-key",
    label: "AWS secret access key",
    locale: "shared",
    patternFactory: () =>
      /\baws[_-]?secret[_-]?access[_-]?key\b\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/giu,
    priority: 126,
    valueGroup: 1,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "github-pat",
    label: "GitHub token",
    locale: "shared",
    patternFactory: () => /\bgh[pousr]_[A-Za-z0-9]{20,}\b/gu,
    priority: 126,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "slack-webhook",
    label: "Slack webhook",
    locale: "shared",
    patternFactory: () =>
      /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[A-Za-z0-9]{20,}/gu,
    priority: 126,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "numeric-secret-assignment",
    label: "Numeric credential assignment",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        NUMERIC_SECRET_ASSIGNMENT_FLAGS,
        String.raw`\d{3,}`,
        { delimiterPattern: String.raw`[:=]+`, quoteWrapped: true },
      ),
    priority: 120,
    valueGroup: 1,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "keyed-secret-assignment",
    label: "Credential key assignment",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SECRET_ASSIGNMENT_FLAGS,
        String.raw`[^\s"';]{8,}`,
        { delimiterPattern: String.raw`=`, quoteWrapped: true },
      ),
    priority: 119,
    validator: looksSecretLike,
    valueGroup: 1,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "secret-assignment",
    label: "Credential assignment",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SECRET_ASSIGNMENT_FLAGS,
        String.raw`[^\s"';]{8,}`,
        { delimiterPattern: String.raw`[:=]`, quoteWrapped: true },
      ),
    priority: 118,
    validator: looksSecretLike,
    valueGroup: 1,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "bearer-token",
    label: "Bearer token",
    locale: "shared",
    patternFactory: () => /\bBearer\s+([A-Za-z0-9\-._~+/]+=*)/gu,
    priority: 117,
    validator: looksSecretLike,
    valueGroup: 1,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "credit-card",
    label: "Credit card number",
    locale: "shared",
    patternFactory: () => /\b(?:\d[ -]?){13,19}\b/g,
    priority: 114,
    validator: isLikelyCreditCard,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "labeled-card-number",
    label: "Labeled card number",
    locale: "shared",
    patternFactory: () =>
      /\b(?:card(?:\s+number)?|credit\s+card|debit\s+card|payment(?:\s+card)?|n[uú]mero(?:\s+de)?\s+tarjeta|tarjeta(?:\s+de\s+cr[eé]dito)?|n[uú]mero(?:\s+do)?\s+cart[aã]o|cart[aã]o(?:\s+de\s+cr[eé]dito)?)\b[^\n\r\d]{0,80}((?:\d[ -]?){13,19})\b/giu,
    priority: 113,
    validator: looksLikeCardNumberSequence,
    valueGroup: 1,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "iban",
    label: "IBAN",
    locale: "shared",
    patternFactory: () => /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gu,
    priority: 108,
    validator: isLikelyIban,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "us-ssn",
    label: "US Social Security number",
    locale: "en-US",
    patternFactory: () =>
      /\b\d{3}[\-\u2013\u2014]{1,3}\d{2}[\-\u2013\u2014]{1,3}\d{4}\b/g,
    priority: 116,
    tagFactory: detectObfuscationTags,
    validator: isValidUsaSsn,
  },
  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "medium",
    id: "us-ssn-labeled-loose",
    label: "US SSN (labeled)",
    locale: "en-US",
    patternFactory: () =>
      /\b(?:ssn|social\s+security(?:\s+(?:number|num|no\.?|#))?|ss\s*#)\b[^\n\r\d]{0,16}(\d{3}[\-\u2013\u2014\s]{0,3}\d{2}[\-\u2013\u2014\s]{0,3}\d{4})\b/giu,
    priority: 107,
    tagFactory: detectObfuscationTags,
    validator: looksLikeUsaSsnStructural,
    valueGroup: 1,
  },
  {
    category: "personal",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "medium",
    id: "us-phone",
    label: "US phone number",
    locale: "en-US",
    patternFactory: () =>
      /(?:\+1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    priority: 86,
    validator: isLikelyPhoneNumber,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cpf",
    label: "CPF",
    locale: "pt-BR",
    patternFactory: () => /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
    priority: 122,
    validator: isValidCpf,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "medium",
    id: "cpf-labeled-loose",
    label: "CPF (labeled)",
    locale: "pt-BR",
    patternFactory: () =>
      /\b(?:cpf|meu\s+cpf|cpf\s+do\s+cliente|n[uú]mero\s+do\s+cpf|cadastro\s+cpf|cpf\s+pessoal|cpf\s+fiscal|identifica[çc][ãa]o\s+cpf|contribuinte\s+cpf|cpf\s+registrado|cpf\s+do\s+titular|n[uú]mero\s+de\s+cpf)\b[^\n\r\d]{0,16}(\d{3}[.·。．]{0,3}\d{3}[.·。．]{0,3}\d{3}[\-\u2013\u2014_=~]{0,3}\d{2})\b/giu,
    priority: 109,
    tagFactory: detectObfuscationTags,
    validator: looksLikeCpfStructural,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cnpj",
    label: "CNPJ",
    locale: "pt-BR",
    patternFactory: () => /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
    priority: 122,
    validator: isValidCnpj,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "medium",
    id: "cnpj-labeled-loose",
    label: "CNPJ (labeled)",
    locale: "pt-BR",
    patternFactory: () =>
      /\b(?:cnpj|cnpj\s+da\s+empresa|registro\s+cnpj|empresa\s+cnpj|cnpj\s+matriz|cnpj\s+mei|filial\s+cnpj|contribuinte\s+cnpj|cnpj\s+filial)\b[^\n\r\d]{0,16}(\d{2}[.·。．]{0,3}\d{3}[.·。．]{0,3}\d{3}[/\\\u2044\u29F8]{0,3}\d{4}[\-\u2013\u2014_=~]{0,3}\d{2})\b/giu,
    priority: 109,
    tagFactory: detectObfuscationTags,
    validator: looksLikeCnpjStructural,
    valueGroup: 1,
  },
  {
    category: "personal",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "medium",
    id: "br-phone",
    label: "Brazil phone number",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:\+55\s{0,3})?(?:\(?\d{2}\)?\s{0,3})?9?\d{4}[\s-]{0,3}\d{4}\b/g,
    priority: 84,
    validator: isLikelyPhoneNumber,
  },
  {
    category: "location",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cep-labeled",
    label: "CEP",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        BR_CEP_LABEL_FLAGS,
        String.raw`\d{5}-?\d{3}`,
      ),
    priority: 109,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cnh-labeled",
    label: "CNH",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(BR_CNH_LABEL_FLAGS, String.raw`\d{11}`),
    priority: 110,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "pis-pasep-labeled",
    label: "PIS/PASEP",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        BR_PIS_PASEP_LABEL_FLAGS,
        String.raw`\d{3}\.?\d{5}\.?\d{2}-?\d|\d{11}`,
      ),
    priority: 111,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "rg-labeled",
    label: "RG",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        BR_RG_LABEL_FLAGS,
        String.raw`[0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx]`,
      ),
    priority: 111,
    validator: isLikelyBrazilianStateId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "medium",
    id: "titulo-eleitor-labeled",
    label: "Titulo de eleitor",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        BR_VOTER_LABEL_FLAGS,
        String.raw`(?:\d[\s.-]*){12}`,
      ),
    priority: 100,
    validator: looksLikeBrazilianVoterId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["cl", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "chile-rut",
    label: "Chilean RUT",
    locale: "es-LatAm",
    patternFactory: () => /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]\b/gu,
    priority: 121,
    validator: isValidChileanRut,
  },
  {
    category: "identifier",
    countryProfileIds: ["cl", "latam-es"],
    coverage: "country",
    confidence: "medium",
    id: "chile-rut-labeled",
    label: "Chilean RUT (labeled)",
    locale: "es-LatAm",
    patternFactory: () =>
      /\b(?:rut|rut\s+chileno|rut\s+empresa|n[uú]mero\s+rut|identificaci[oó]n\s+rut)\b[^\n\r\d]{0,12}(\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk])\b/giu,
    priority: 109,
    validator: isValidChileanRut,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["mx", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "curp",
    label: "CURP",
    locale: "es-LatAm",
    patternFactory: () => /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/g,
    priority: 120,
  },
  {
    category: "identifier",
    countryProfileIds: ["mx", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "rfc",
    label: "RFC",
    locale: "es-LatAm",
    patternFactory: () => /\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b/giu,
    priority: 114,
  },
  {
    category: "identifier",
    countryProfileIds: ["ar", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "cuit",
    label: "CUIT",
    locale: "es-LatAm",
    patternFactory: () => /\b\d{2}-\d{8}-\d\b/g,
    priority: 116,
    validator: isValidArgentineCuit,
  },
  {
    category: "identifier",
    countryProfileIds: ["ar", "latam-es"],
    coverage: "country",
    confidence: "medium",
    id: "cuit-labeled-loose",
    label: "CUIT (labeled)",
    locale: "es-LatAm",
    patternFactory: () =>
      /\b(?:cuit|mi\s+cuit|cuit\s+empresa|empresa\s+cuit|cuit\s+personal|n[uú]mero\s+cuit)\b[^\n\r\d]{0,12}(\d{2}-?\d{8}-?\d)\b/giu,
    priority: 109,
    validator: isValidArgentineCuit,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["co", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "nit",
    label: "NIT",
    locale: "es-LatAm",
    patternFactory: () => /\b\d{3}\.?\d{3}\.?\d{3}-?\d\b/g,
    priority: 112,
    validator: isValidColombianNit,
  },
  {
    category: "identifier",
    countryProfileIds: ["co", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "cedula-labeled",
    label: "Cedula",
    locale: "es-LatAm",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        LATAM_CEDULA_LABEL_FLAGS,
        String.raw`\d{6,12}`,
      ),
    priority: 115,
    validator: looksLikeLatamNationalId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["ar", "latam-es", "pe"],
    coverage: "country",
    confidence: "high",
    id: "dni-labeled",
    label: "DNI",
    locale: "es-LatAm",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        LATAM_DNI_LABEL_FLAGS,
        String.raw`\d{7,8}`,
      ),
    priority: 110,
    validator: looksLikeLatamNationalId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["latam-es", "pe"],
    coverage: "country",
    confidence: "high",
    id: "ruc-labeled",
    label: "RUC",
    locale: "es-LatAm",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        LATAM_RUC_LABEL_FLAGS,
        String.raw`\d{11,13}`,
      ),
    priority: 110,
    validator: isValidPeruvianRuc,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["latam-es", "pe"],
    coverage: "country",
    confidence: "medium",
    id: "ruc-labeled-loose",
    label: "RUC (labeled, structural)",
    locale: "es-LatAm",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        LATAM_RUC_LABEL_FLAGS,
        String.raw`\d{11,13}`,
      ),
    priority: 104,
    tagFactory: detectObfuscationTags,
    validator: looksLikePeruvianRucStructural,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["pt"],
    coverage: "country",
    confidence: "high",
    id: "pt-nif-labeled",
    label: "NIF",
    locale: "pt-PT",
    patternFactory: () =>
      createDelimitedLabelValuePattern(PT_NIF_LABEL_FLAGS, String.raw`\d{9}`),
    priority: 112,
    validator: isValidPortugueseNif,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["pt"],
    coverage: "country",
    confidence: "medium",
    id: "pt-niss-labeled",
    label: "NISS",
    locale: "pt-PT",
    patternFactory: () =>
      createDelimitedLabelValuePattern(PT_NISS_LABEL_FLAGS, String.raw`\d{11}`),
    priority: 102,
    validator: looksLikeLatamTaxId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es"],
    coverage: "country",
    confidence: "high",
    id: "es-dni-labeled",
    label: "Spanish DNI",
    locale: "es-ES",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        ES_DNI_LABEL_FLAGS,
        String.raw`\d{8}[A-Z]`,
      ),
    priority: 114,
    validator: isValidSpanishDni,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-nie-labeled",
    label: "Spanish NIE",
    locale: "es-ES",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        ES_NIE_LABEL_FLAGS,
        String.raw`[XYZ]\d{7}[A-Z]`,
      ),
    priority: 113,
    validator: isValidSpanishNie,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["cn"],
    coverage: "country",
    confidence: "high",
    id: "cn-resident-id-labeled",
    label: "Chinese resident ID",
    locale: "zh-CN",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        CN_RESIDENT_ID_LABEL_FLAGS,
        String.raw`\d{17}[\dXx]`,
      ),
    priority: 114,
    validator: isValidChineseResidentId,
    valueGroup: 1,
  },
  {
    category: "personal",
    countryProfileIds: ["cn"],
    coverage: "country",
    confidence: "medium",
    id: "cn-phone",
    label: "China phone number",
    locale: "zh-CN",
    patternFactory: () => /(?:\+?86[\s-]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}\b/g,
    priority: 99,
    validator: isLikelyPhoneNumber,
  },
  {
    category: "identifier",
    countryProfileIds: ["ru"],
    coverage: "country",
    confidence: "high",
    id: "ru-inn-labeled",
    label: "Russian INN",
    locale: "ru-RU",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        RU_INN_LABEL_FLAGS,
        String.raw`\d{12}|\d{10}`,
      ),
    priority: 112,
    validator: isValidRussianInn,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["ru"],
    coverage: "country",
    confidence: "high",
    id: "ru-snils-labeled",
    label: "Russian SNILS",
    locale: "ru-RU",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        RU_SNILS_LABEL_FLAGS,
        String.raw`\d{3}-?\d{3}-?\d{3}\s?\d{2}`,
      ),
    priority: 112,
    validator: isValidRussianSnils,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["in"],
    coverage: "country",
    confidence: "high",
    id: "in-aadhaar-labeled",
    label: "Aadhaar",
    locale: "en-IN",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        IN_AADHAAR_LABEL_FLAGS,
        String.raw`\d{4}\s?\d{4}\s?\d{4}`,
      ),
    priority: 112,
    validator: isValidIndianAadhaar,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["in"],
    coverage: "country",
    confidence: "high",
    id: "in-pan-labeled",
    label: "PAN",
    locale: "en-IN",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        IN_PAN_LABEL_FLAGS,
        String.raw`[A-Z]{5}\d{4}[A-Z]`,
      ),
    priority: 111,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["in"],
    coverage: "country",
    confidence: "high",
    id: "in-gstin-labeled",
    label: "GSTIN",
    locale: "en-IN",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        IN_GSTIN_LABEL_FLAGS,
        String.raw`\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9][Zz][A-Z0-9]`,
      ),
    priority: 110,
    valueGroup: 1,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "labeled-phone",
    label: "Labeled phone number",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_PHONE_LABEL_FLAGS,
        String.raw`\+?[0-9()\s.-]{8,20}\d`,
      ),
    priority: 96,
    validator: isLikelyPhoneNumber,
    valueGroup: 1,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "labeled-name",
    label: "Labeled full name",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_NAME_LABEL_FLAGS,
        String.raw`[^\n\r,;]{3,80}`,
      ),
    priority: 44,
    validator: looksLikeStructuredName,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "labeled-address",
    label: "Labeled address",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_ADDRESS_LABEL_FLAGS,
        LABELED_ADDRESS_VALUE,
      ),
    priority: 95,
    validator: looksLikeStructuredAddress,
    valueGroup: 1,
  },

  // ─── Standalone Street Address Detection ─────────────────────────────────────
  // These rules catch addresses by their structural patterns (street keyword +
  // number) even when no label keyword precedes them.

  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "standalone-address-pt",
    label: "Standalone Brazilian/Portuguese address",
    locale: "pt-BR",
    patternFactory: () =>
      /\b((?:Rua|Avenida|Av\.|Travessa|Estrada|Rodovia|Alameda|Praça|Largo|Logradouro|Viaduto|Beco|Viela|Passagem|Servidão|Acesso|Marginal|Ladeira|Morro|Caminho|Ponte|Passarela|Elevado|Calçadão|Rotatória|Contorno|Túnel|Escadaria|Anel|Trevo|Picada|Ramal|Variante|Paralela|Vereda|Subida|Descida|Rampa|Balão|Entroncamento|Desvio|Trincheira|Córrego|Ribeirão)\s+[\p{L}\p{N}][\p{L}\p{N}\s'.]{2,50},?\s*\d{1,6}(?:\s*[,/]\s*(?:Apartamento|Apto|Apt\.?|Bloco|Bl\.?|Sala|Conj\.?|Conjunto|Lote|Casa|Andar|Cobertura|Fundos|Frente|Sobreloja|Edifício|Torre|Pavilhão|Galpão)\s*\d{1,5})?)/giu,
    priority: 90,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "standalone-address-es",
    label: "Standalone Spanish address",
    locale: "es-LatAm",
    patternFactory: () =>
      /\b((?:Calle|Cl\.|Avenida|Av\.|Carrera|Cra\.|Boulevard|Blvd\.|Paseo|Vía|Camino|Colonia|Callejón|Pasaje|Sendero|Vereda|Glorieta|Rotonda|Ronda|Travesía|Costanera|Malecón|Explanada|Jirón|Jr\.|Prolongación|Diagonal|Transversal|Calzada|Circuito|Cerrada|Privada|Andador|Periférico|Libramiento|Senda|Autopista|Autovía|Circunvalación|Alameda|Plazuela|Plazoleta)\s+[\p{L}\p{N}][\p{L}\p{N}\s'.]{2,50},?\s*\d{1,6}(?:\s*[,/]\s*(?:Piso|Depto\.?|Departamento|Local|Oficina|Suite|Apt[oe]?\.?|Int\.?|Interior|Lote|Casa|Manzana|Parcela|#)\s*\d{1,5})?)/giu,
    priority: 90,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "standalone-address-en",
    label: "Standalone English address",
    locale: "en-US",
    patternFactory: () =>
      /\b(\d{1,6}\s+(?:(?:N|S|E|W|NE|NW|SE|SW|North|South|East|West)\s+)?(?:[A-Z][\w'.]+\s+){1,4}(?:Street|St\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Road|Rd\.?|Lane|Ln\.?|Court|Ct\.?|Place|Pl\.?|Way|Circle|Cir\.?|Terrace|Ter\.?|Trail|Trl\.?|Parkway|Pkwy\.?|Highway|Hwy\.?|Alley|Aly\.?|Path|Walk|Row|Crescent|Cres\.?|Close|Mews|Gardens|Grove|Grv\.?|Heath|Rise|Vale|Dell|Croft|Square|Sq\.?|Plaza|Promenade|Esplanade|Bypass|Overpass|Underpass|Pike|Turnpike|Crossing|Xing|Point|Pt\.?|Bend|Cove|Landing|Trace|Ridge|Knoll|Meadow|Hollow)(?:\s*[,#]\s*(?:Apt\.?|Apartment|Suite|Ste\.?|Unit|Floor|Fl\.?|Room|Rm\.?|Building|Bldg\.?|Tower|Wing)\s*[\w-]{1,10})?)/giu,
    priority: 90,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "standalone-address-zh",
    label: "Standalone Chinese address",
    locale: "zh-CN",
    patternFactory: () =>
      /([\u4e00-\u9fff]{2,8}(?:省|市|区|县|镇|乡|村|路|街|道|巷|弄|号|楼|栋|单元|室|幢)[\u4e00-\u9fff\d]{1,30}(?:(?:省|市|区|县|镇|乡|村|路|街|道|巷|弄|号|楼|栋|单元|室|幢)[\u4e00-\u9fff\d]{0,20}){1,6})/gu,
    priority: 90,
    valueGroup: 1,
  },

  // ─── Fuzzy / Obfuscated Address Detection ────────────────────────────────────
  // Catches addresses whose keywords are misspelled (typos) or bloated with
  // separator characters between letters (e.g. "trave--sa", "a.v.e.n.i.d.a").
  // A broad structural regex captures candidates; the validator normalises
  // tokens (strips separators, diacritics) and fuzzy-matches against the full
  // keyword dictionary using Levenshtein edit distance.

  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "fuzzy-address-keyword-first",
    label: "Fuzzy address (keyword-first structure)",
    locale: "shared",
    patternFactory: () =>
      /\b([\p{L}](?:[\p{L}]|[-–—_.·。．=~*#/\\]{1,3}[\p{L}]){2,20}\.?\s+[\p{L}][\p{L}\s'.-]{1,45}[,\s]+\d{1,6}(?:\s*[,/]\s*[\p{L}\s.]{2,20}\s*\d{0,5})?)/giu,
    priority: 82,
    validator: looksLikeFuzzyAddress,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "fuzzy-address-number-first",
    label: "Fuzzy address (number-first structure)",
    locale: "shared",
    patternFactory: () =>
      /\b(\d{1,6}\s+(?:[\p{L}][\p{L}'.\s-]{1,35}\s+){0,3}[\p{L}](?:[\p{L}]|[-–—_.·。．=~*#/\\]{1,3}[\p{L}]){2,20}\.?(?:\s*[,#]\s*[\p{L}\s.]{2,15}\s*[\w-]{1,10})?)/giu,
    priority: 82,
    validator: looksLikeFuzzyAddress,
    valueGroup: 1,
  },

  // ─── Postal Code Detection ───────────────────────────────────────────────────

  {
    category: "location",
    countryProfileIds: ["us"],
    coverage: "global",
    confidence: "medium",
    id: "us-zip-code",
    label: "US ZIP code",
    locale: "en-US",
    patternFactory: () =>
      /\b(?:zip(?:\s*code)?|postal\s*code)\s*[:=-]?\s*(\d{5}(?:-\d{4})?)\b/giu,
    priority: 88,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "postal-code-generic",
    label: "Labeled postal code (generic)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:postal\s*code|código\s*postal|código\s*de\s*area|code\s*postal|postleitzahl|邮编|邮政编码|PLZ)\s*[:=-]?\s*(\d{4,8}(?:[- ]\d{3,4})?)\b/giu,
    priority: 88,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "labeled-passport",
    label: "Passport number",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_PASSPORT_LABEL_FLAGS,
        String.raw`[A-Z0-9<]{6,12}`,
      ),
    priority: 92,
    valueGroup: 1,
  },

  // ─── JSON/YAML/TOML Context-Aware Rules ──────────────────────────────────────
  // These rules target sensitive values in structured data formats where word
  // boundaries (\b) fail because quotes/colons are adjacent to digits.

  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "credit-card-json",
    label: "Credit card in JSON/structured data",
    locale: "shared",
    patternFactory: () =>
      /(?:["'](?:credit[-_]?card|card[-_]?(?:num(?:ber)?)?|cc[-_]?(?:num(?:ber)?)?|payment[-_]?card|n[uú]mero[-_]?(?:do[-_]?)?cart[aã]o|tarjeta)["']\s*[:=]\s*["'])(\d{13,19})(?=["'])/giu,
    priority: 115,
    validator: looksLikeCardNumberSequence,
    valueGroup: 1,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "credit-card-quoted",
    label: "Quoted credit card number",
    locale: "shared",
    patternFactory: () => /(?<=["'])(\d{13,19})(?=["'])/g,
    priority: 112,
    validator: isLikelyCreditCard,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "global",
    confidence: "high",
    id: "us-ssn-json",
    label: "US SSN in JSON/structured data",
    locale: "en-US",
    patternFactory: () =>
      /(?:["'](?:ssn|social[-_]?(?:security)?[-_]?(?:num(?:ber)?)?)[-_]?\d*["']\s*[:=]\s*["'])(\d{3}[-\s]?\d{2}[-\s]?\d{4})(?=["'])/giu,
    priority: 113,
    validator: isValidUsaSsn,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "global",
    confidence: "high",
    id: "us-ssn-quoted",
    label: "Quoted US SSN",
    locale: "en-US",
    patternFactory: () => /(?<=["'])(\d{3}-\d{2}-\d{4})(?=["'])/g,
    priority: 110,
    validator: isValidUsaSsn,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cpf-json",
    label: "Brazilian CPF in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cpf["']\s*[:=]\s*["'])(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})(?=["'])/giu,
    priority: 114,
    validator: isValidCpf,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cpf-quoted",
    label: "Quoted Brazilian CPF",
    locale: "pt-BR",
    patternFactory: () => /(?<=["'])(\d{3}\.\d{3}\.\d{3}-\d{2})(?=["'])/g,
    priority: 111,
    validator: isValidCpf,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cnpj-json",
    label: "Brazilian CNPJ in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cnpj["']\s*[:=]\s*["'])(\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-.\s]?\d{2})(?=["'])/giu,
    priority: 114,
    validator: isValidCnpj,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["cn"],
    coverage: "country",
    confidence: "high",
    id: "cn-resident-id-json",
    label: "Chinese Resident ID in JSON/structured data",
    locale: "zh-CN",
    patternFactory: () =>
      /(?:["'](?:身份证号?|id[-_]?(?:card)?[-_]?(?:num(?:ber)?)?|居民身份证|sfz)["']\s*[:=]\s*["'])(\d{17}[\dXx])(?=["'])/giu,
    priority: 114,
    validator: isValidChineseResidentId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["cn"],
    coverage: "country",
    confidence: "high",
    id: "cn-resident-id-quoted",
    label: "Quoted Chinese Resident ID",
    locale: "zh-CN",
    patternFactory: () => /(?<=["'])(\d{17}[\dXx])(?=["'])/g,
    priority: 111,
    validator: isValidChineseResidentId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cn-resident-id",
    label: "Chinese resident ID (standalone)",
    locale: "zh-CN",
    patternFactory: () => /\b(\d{17}[\dXx])\b/gu,
    priority: 108,
    validator: isValidChineseResidentId,
    valueGroup: 1,
  },

  // ─── Numeric Separator-Aware Rules ───────────────────────────────────────────
  // IP addresses, dates, and other values with dots, dashes, or underscores

  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "ipv4-address",
    label: "IPv4 address",
    locale: "shared",
    patternFactory: () =>
      /\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})\b/g,
    priority: 85,
    validator: isValidIpv4,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "ipv4-quoted",
    label: "Quoted IPv4 address",
    locale: "shared",
    patternFactory: () =>
      /(?<=["'])((?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2}))(?=["'])/g,
    priority: 86,
    validator: isValidIpv4,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "date-iso",
    label: "ISO date format",
    locale: "shared",
    patternFactory: () =>
      /\b(19|20)\d{2}[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/g,
    priority: 75,
    validator: isValidIsoDate,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "date-dmy",
    label: "Date DD/MM/YYYY or DD-MM-YYYY",
    locale: "shared",
    patternFactory: () =>
      /\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](19|20)\d{2}\b/g,
    priority: 74,
    validator: isValidDmyDate,
  },

  // ─── US EIN (Employer Identification Number) ─────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "medium",
    id: "us-ein",
    label: "US EIN",
    locale: "en-US",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        US_EIN_LABEL_FLAGS,
        String.raw`\d{2}-\d{7}`,
        { delimiterPattern: String.raw`[:=]`, quoteWrapped: true },
      ),
    priority: 90,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "high",
    id: "us-ein-json",
    label: "US EIN in JSON/structured data",
    locale: "en-US",
    patternFactory: () =>
      /(?:["'](?:ein|employer[-_]?(?:id(?:entification)?)?[-_]?(?:num(?:ber)?)?|fein|federal[-_]?tax[-_]?id|tax[-_]?id(?:entification)?[-_]?(?:num(?:ber)?)?)[-_]?\d*["']\s*[:=]\s*["'])(\d{2}-\d{7})(?=["'])/giu,
    priority: 113,
    valueGroup: 1,
  },

  // ─── Spanish DNI / NIE in JSON ───────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-dni-json",
    label: "Spanish DNI in JSON/structured data",
    locale: "es-ES",
    patternFactory: () =>
      /(?:["'](?:dni|documento[-_]?(?:nacional[-_]?)?(?:de[-_]?)?identidad|cedula[-_]?(?:de[-_]?)?identidad)[-_]?\d*["']\s*[:=]\s*["'])(\d{8}[A-Z])(?=["'])/giu,
    priority: 114,
    validator: isValidSpanishDni,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-nie-json",
    label: "Spanish NIE in JSON/structured data",
    locale: "es-ES",
    patternFactory: () =>
      /(?:["'](?:nie|n[uú]mero[-_]?(?:de[-_]?)?identidad[-_]?(?:de[-_]?)?extranjero|identidad[-_]?(?:de[-_]?)?extranjero)[-_]?\d*["']\s*[:=]\s*["'])([XYZ]\d{7}[A-Z])(?=["'])/giu,
    priority: 114,
    validator: isValidSpanishNie,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-dni-quoted",
    label: "Quoted Spanish DNI",
    locale: "es-ES",
    patternFactory: () => /(?<=["'])(\d{8}[A-Z])(?=["'])/g,
    priority: 110,
    validator: isValidSpanishDni,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-nie-quoted",
    label: "Quoted Spanish NIE",
    locale: "es-ES",
    patternFactory: () => /(?<=["'])([XYZ]\d{7}[A-Z])(?=["'])/g,
    priority: 110,
    validator: isValidSpanishNie,
    valueGroup: 1,
  },

  // ─── Peruvian RUC in JSON ────────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "ruc-json",
    label: "Peruvian RUC in JSON/structured data",
    locale: "es-LatAm",
    patternFactory: () =>
      /(?:["'](?:ruc|ruc[-_]?pe|registro[-_]?(?:unico[-_]?)?contribuyente)[-_]?\d*["']\s*[:=]\s*["'])(\d{11})(?=["'])/giu,
    priority: 114,
    validator: isValidPeruvianRuc,
    valueGroup: 1,
  },

  // ─── Chilean RUT in JSON ─────────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["cl", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "chile-rut-json",
    label: "Chilean RUT in JSON/structured data",
    locale: "es-LatAm",
    patternFactory: () =>
      /(?:["'](?:rut|rut[-_]?cl|rol[-_]?(?:unico[-_]?)?tributario)[-_]?\d*["']\s*[:=]\s*["'])(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])(?=["'])/giu,
    priority: 114,
    validator: isValidChileanRut,
    valueGroup: 1,
  },

  // ─── SSN JSON with numbered suffixes ─────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "high",
    id: "us-ssn-json-suffixed",
    label: "US SSN in JSON with numbered key suffix",
    locale: "en-US",
    patternFactory: () =>
      /(?:["'](?:ssn|social[-_]?(?:security)?[-_]?(?:num(?:ber)?)?)[-_]?\d+["']\s*[:=]\s*["'])(\d{3}[-\s]?\d{2}[-\s]?\d{4})(?=["'])/giu,
    priority: 114,
    validator: isValidUsaSsn,
    valueGroup: 1,
  },

  // ─── CPF / CNPJ JSON with numbered suffixes ─────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cpf-json-suffixed",
    label: "Brazilian CPF in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cpf[-_]?\d+["']\s*[:=]\s*["'])(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})(?=["'])/giu,
    priority: 114,
    validator: isValidCpf,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cnpj-json-suffixed",
    label: "Brazilian CNPJ in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cnpj[-_]?\d+["']\s*[:=]\s*["'])(\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-.\s]?\d{2})(?=["'])/giu,
    priority: 114,
    validator: isValidCnpj,
    valueGroup: 1,
  },

  // ─── PIS/PASEP JSON ──────────────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "pis-json",
    label: "Brazilian PIS/PASEP in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["'](?:pis|pasep|nis)["']\s*[:=]\s*["'])(\d{3}\.?\d{5}\.?\d{2}-?\d)(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "pis-json-suffixed",
    label: "Brazilian PIS/PASEP in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["'](?:pis|pasep|nis)[-_]?\d+["']\s*[:=]\s*["'])(\d{3}\.?\d{5}\.?\d{2}-?\d)(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },

  // ─── RG JSON ─────────────────────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "rg-json",
    label: "Brazilian RG in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']rg["']\s*[:=]\s*["'])([0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx])(?=["'])/giu,
    priority: 114,
    validator: isLikelyBrazilianStateId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "rg-json-suffixed",
    label: "Brazilian RG in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']rg[-_]?\d+["']\s*[:=]\s*["'])([0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx])(?=["'])/giu,
    priority: 114,
    validator: isLikelyBrazilianStateId,
    valueGroup: 1,
  },

  // ─── CEP JSON ────────────────────────────────────────────────────────────────

  {
    category: "location",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cep-json",
    label: "Brazilian CEP in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cep["']\s*[:=]\s*["'])(\d{5}-?\d{3})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },
  {
    category: "location",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cep-json-suffixed",
    label: "Brazilian CEP in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cep[-_]?\d+["']\s*[:=]\s*["'])(\d{5}-?\d{3})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },

  // ─── Título de Eleitor JSON ──────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "titulo-eleitor-json",
    label: "Brazilian Título de Eleitor in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']titulo[-_]?(?:de[-_]?)?eleitor(?:al)?["']\s*[:=]\s*["'])((?:\d[\s.-]*){12})(?=["'])/giu,
    priority: 114,
    validator: looksLikeBrazilianVoterId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "titulo-eleitor-json-suffixed",
    label: "Brazilian Título de Eleitor in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']titulo[-_]?(?:de[-_]?)?eleitor(?:al)?[-_]?\d+["']\s*[:=]\s*["'])((?:\d[\s.-]*){12})(?=["'])/giu,
    priority: 114,
    validator: looksLikeBrazilianVoterId,
    valueGroup: 1,
  },

  // ─── IBAN JSON ───────────────────────────────────────────────────────────────

  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "iban-json",
    label: "IBAN in JSON/structured data",
    locale: "shared",
    patternFactory: () =>
      /(?:["']iban["']\s*[:=]\s*["'])([A-Z]{2}\d{2}[A-Z0-9]{11,30})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "iban-json-suffixed",
    label: "IBAN in JSON with numbered key suffix",
    locale: "shared",
    patternFactory: () =>
      /(?:["']iban[-_]?\d+["']\s*[:=]\s*["'])([A-Z]{2}\d{2}[A-Z0-9]{11,30})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },

  // ─── Phone JSON ──────────────────────────────────────────────────────────────

  {
    category: "personal",
    coverage: "global",
    confidence: "high",
    id: "phone-json",
    label: "Phone number in JSON/structured data",
    locale: "shared",
    patternFactory: () =>
      /(?:["'](?:telefone|phone|cel(?:ular)?|mobile|fone|tel)["']\s*[:=]\s*["'])((?:\+?\d{1,3}\s?)?\(?\d{2,3}\)?\s?\d{4,5}[\s-]?\d{4})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "high",
    id: "phone-json-suffixed",
    label: "Phone number in JSON with numbered key suffix",
    locale: "shared",
    patternFactory: () =>
      /(?:["'](?:telefone|phone|cel(?:ular)?|mobile|fone|tel)[-_]?\d+["']\s*[:=]\s*["'])((?:\+?\d{1,3}\s?)?\(?\d{2,3}\)?\s?\d{4,5}[\s-]?\d{4})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },

  // ─── Generic URL Detection ───────────────────────────────────────────────────

  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "generic-url",
    label: "URL with potential sensitive data",
    locale: "shared",
    patternFactory: () => /\bhttps?:\/\/[^\s"'<>]{10,200}/giu,
    priority: 80,
    validator: looksLikeUrlWithSensitiveData,
  },

  // ─── Labeled IPv4 Address ────────────────────────────────────────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "labeled-ip-address",
    label: "Labeled IP address",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_IP_LABEL_FLAGS,
        String.raw`(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})`,
        { delimiterPattern: String.raw`[:=]`, quoteWrapped: true },
      ),
    priority: 88,
    validator: isValidIpv4,
    valueGroup: 1,
  },

  // ─── JSON-context Secrets with suffixed keys ─────────────────────────────────
  // Catches "password_admin": "value", "contraseña_1": "value" etc.

  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "json-secret-suffixed",
    label: "JSON secret with suffixed key",
    locale: "shared",
    patternFactory: () =>
      /(?:["'](?:password|contraseña|contrasena|senha|secret|api[-_]?key|token|private[-_]?key|access[-_]?key|master[-_]?password|admin[-_]?password|root[-_]?password|db[-_]?password|database[-_]?password|encryption[-_]?key|client[-_]?secret|auth[-_]?token|clave|chave[-_]?secreta|chave[-_]?api|密码|秘密|密钥|令牌|凭证|пароль|секрет|ключ|токен|पासवर्ड|सीक्रेट|गुप्त|टोकन)[-_\w]*["']\s*[:=]\s*["'])([^\s"']{8,})(?=["'])/giu,
    priority: 116,
    validator: looksSecretLike,
    valueGroup: 1,
  },

  // ─── Config-file secret assignments (.env, .yaml, .toml, docker-compose, etc.) ───
  // Matches KEY=VALUE patterns where KEY contains secret-related words with
  // underscore/hyphen/dot prefixes (e.g. SMTP_PASSWORD, db-secret, app.token).
  // More lenient validator than the label-based rules above — catches simple
  // passwords, connection strings, and empty values common in config files.

  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "config-secret-assignment",
    label: "Config-file secret assignment",
    locale: "shared",
    allowEmptyValue: true,
    patternFactory: () =>
      buildConfigSecretAssignmentPattern(SECRET_ASSIGNMENT_FLAGS),
    priority: 115,
    validator: looksLikeConfigSecret,
    valueGroup: 1,
  },

  // ─── IPv6 Address ────────────────────────────────────────────────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "ipv6-address",
    label: "IPv6 address",
    locale: "shared",
    patternFactory: () =>
      /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{0,4}\b/g,
    priority: 84,
    validator: isValidIpv6,
  },

  // ─── Filesystem Paths ────────────────────────────────────────────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "unix-filesystem-path",
    label: "Unix filesystem path",
    locale: "shared",
    patternFactory: () => /(?:\/[\w.-]+){3,}/g,
    priority: 60,
    validator: looksLikeSensitivePath,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "windows-filesystem-path",
    label: "Windows filesystem path",
    locale: "shared",
    patternFactory: () => /[A-Z]:\\(?:[\w.-]+\\){2,}[\w.-]*/gi,
    priority: 60,
  },
  // ─── Incident ID Patterns ───────────────────────────────────────────────────
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "incident-id-labeled",
    label: "Incident ID",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        INCIDENT_ID_LABEL_FLAGS,
        String.raw`(?:INC|INCIDENT|CASE|TICKET|REQ|SR|CHG|PRB)?[#-]?\d{4,12}`,
      ),
    priority: 95,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "incident-id-format",
    label: "Incident ID format",
    locale: "shared",
    patternFactory: () =>
      /\b(?:INC|INCIDENT|CASE|TICKET|REQ|SR|CHG|PRB)[#-]?\d{4,12}\b/giu,
    priority: 90,
  },
  // ─── Timestamp Patterns (conditional on advancedPrefs.maskTimestamps) ───────
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "timestamp-iso8601",
    label: "ISO 8601 timestamp",
    locale: "shared",
    patternFactory: () =>
      /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})?\b/g,
    priority: 50,
    validator: isValidIsoDate,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "timestamp-datetime",
    label: "Date/time value",
    locale: "shared",
    patternFactory: () =>
      /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?\b/g,
    priority: 45,
  },

  // ─── Git Hash Patterns (conditional on advancedPrefs.maskGitHashes) ─────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "git-hash-full",
    label: "Full git commit SHA-1",
    locale: "shared",
    patternFactory: () => /\b[0-9a-f]{40}\b/g,
    priority: 60,
    validator: isLikelyGitHash,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "git-hash-short",
    label: "Short git commit hash",
    locale: "shared",
    patternFactory: () => /\b[0-9a-f]{7,12}\b/g,
    priority: 40,
    validator: isLikelyShortGitHash,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "git-hash-labeled",
    label: "Labeled git commit hash",
    locale: "shared",
    patternFactory: () =>
      /\b(?:commit|sha|rev(?:ision)?|hash|ref)\s*[:=\-]?\s*([0-9a-f]{7,40})\b/gi,
    priority: 85,
    valueGroup: 1,
  },

  // ─── Network Port Patterns (conditional on advancedPrefs.maskNetworkPorts) ──

  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "network-port-labeled",
    label: "Labeled network port",
    locale: "shared",
    patternFactory: () => /\b(?:port|porta|puerto)\s*[:=\-#]?\s*(\d{1,5})\b/gi,
    priority: 80,
    validator: isValidPort,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "network-port-host",
    label: "Host:port notation",
    locale: "shared",
    patternFactory: () => /(?:[\w.-]+):(\d{1,5})(?=\s|$|[,;)\]}"'])/g,
    priority: 55,
    validator: isValidPort,
    valueGroup: 1,
  },

  // ─── Global labeled variants (keyword-gated, zero FP risk) ──────────────────

  // ─── Name Detection Rules (conditional on advancedPrefs.maskNames) ──────────

  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "name-standalone-en",
    label: "Person name (EN)",
    locale: "en-US",
    patternFactory: () => STANDALONE_NAME_PATTERN,
    priority: 35,
    validator: isLikelyPersonName_EN,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "name-standalone-pt-br",
    label: "Person name (PT-BR)",
    locale: "pt-BR",
    patternFactory: () => STANDALONE_NAME_PATTERN,
    priority: 35,
    validator: isLikelyPersonName_PT_BR,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "name-standalone-pt-pt",
    label: "Person name (PT-PT)",
    locale: "pt-PT",
    patternFactory: () => STANDALONE_NAME_PATTERN,
    priority: 35,
    validator: isLikelyPersonName_PT_PT,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "name-standalone-es",
    label: "Person name (ES)",
    locale: "es-ES",
    patternFactory: () => STANDALONE_NAME_PATTERN,
    priority: 35,
    validator: isLikelyPersonName_ES,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "name-standalone-zh",
    label: "Person name (ZH)",
    locale: "zh-CN",
    patternFactory: () => STANDALONE_NAME_PATTERN_ZH,
    priority: 35,
    validator: isLikelyPersonName_ZH,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "name-standalone-ru",
    label: "Person name (RU)",
    locale: "ru-RU",
    patternFactory: () => STANDALONE_NAME_PATTERN,
    priority: 35,
    validator: isLikelyPersonName_RU,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "name-standalone-in",
    label: "Person name (IN)",
    locale: "en-IN",
    patternFactory: () => STANDALONE_NAME_PATTERN,
    priority: 35,
    validator: isLikelyPersonName_IN,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "name-contextual",
    label: "Person name (contextual)",
    locale: "shared",
    patternFactory: () => CONTEXTUAL_NAME_PATTERN,
    priority: 38,
    validator: looksLikeStructuredName,
    valueGroup: 1,
  },

  // ─── Global labeled variants (keyword-gated, zero FP risk) ──────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cpf-global-labeled",
    label: "CPF (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:cpf|cadastro\s+de?\s+pessoa)\b[^\n\r\d]{0,12}(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/giu,
    priority: 109,
    validator: isValidCpf,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cnpj-global-labeled",
    label: "CNPJ (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:cnpj|cadastro\s+nacional)\b[^\n\r\d]{0,12}(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/giu,
    priority: 109,
    validator: isValidCnpj,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cuit-global-labeled",
    label: "Argentine CUIT (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:cuit|cuil|clave\s+[uú]nica)\b[^\n\r\d]{0,12}(\d{2}-?\d{8}-?\d)\b/giu,
    priority: 109,
    validator: isValidArgentineCuit,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "rut-global-labeled",
    label: "Chilean RUT (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:rut|n[uú]mero\s+rut)\b[^\n\r\d]{0,12}(\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk])\b/giu,
    priority: 109,
    validator: isValidChileanRut,
    valueGroup: 1,
  },

  // ─── Global labeled rules (keyword-gated, any locale) ──────────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "rg-global-labeled",
    label: "Brazilian RG (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:rg|registro\s+geral|carteira\s+de\s+identidade)\b[^\n\r\d]{0,12}([0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx])\b/giu,
    priority: 109,
    validator: isLikelyBrazilianStateId,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "high",
    id: "cep-global-labeled",
    label: "Brazilian CEP (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:cep|c[oó]digo\s+postal)\b[^\n\r\d]{0,12}(\d{5}-?\d{3})\b/giu,
    priority: 109,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "ein-global-labeled",
    label: "US EIN (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:ein|employer\s+id(?:entification)?(?:\s+number)?|fein|federal\s+tax\s+id)\b[^\n\r\d]{0,12}(\d{2}-\d{7})\b/giu,
    priority: 109,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "ruc-global-labeled",
    label: "Peruvian RUC (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:ruc|registro\s+[uú]nico\s+(?:de\s+)?contribuyentes?)\b[^\n\r\d]{0,12}(\d{11,13})\b/giu,
    priority: 109,
    validator: isValidPeruvianRuc,
    valueGroup: 1,
  },

  // ─── Contextual Mid-Paragraph Address Detection ────────────────────────────
  // Catches addresses introduced by contextual prepositions or verbs in
  // informal text, e.g. "I live at 42 Oak Street" or "mora na Rua Augusta 123"

  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "contextual-address-en",
    label: "Contextual English address (mid-paragraph)",
    locale: "en-US",
    patternFactory: () =>
      /(?:lives?\s+(?:at|on|in)|living\s+(?:at|on|in)|located\s+(?:at|on|in)|resides?\s+(?:at|on|in)|moved?\s+to|address\s+(?:is|at)|come\s+to|go\s+to|send\s+(?:it\s+)?to|ship\s+(?:it\s+)?to|deliver\s+to|meet\s+(?:me\s+)?at|pick\s*(?:me\s*)?up\s+at|stay(?:ing)?\s+at|(?:i'?m|we'?re|they'?re|she'?s|he'?s)\s+at)\s+((?:\d{1,6}\s+)?(?:[A-Z][\w'.]+\s+){1,5}(?:Street|St\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Road|Rd\.?|Lane|Ln\.?|Court|Ct\.?|Place|Pl\.?|Way|Circle|Cir\.?|Terrace|Ter\.?|Trail|Trl\.?|Parkway|Pkwy\.?|Highway|Hwy\.?|Alley|Aly\.?|Path|Walk|Row|Crescent|Cres\.?|Close|Mews|Gardens|Grove|Grv\.?|Square|Sq\.?|Plaza)(?:[,\s]+\d{1,6})?(?:\s*[,#]\s*(?:Apt\.?|Apartment|Suite|Ste\.?|Unit|Floor|Fl\.?|Room|Rm\.?)\s*[\w-]{1,10})?)/giu,
    priority: 92,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "contextual-address-pt",
    label: "Contextual Portuguese address (mid-paragraph)",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:mora(?:r|va|ndo)?\s+(?:na?|em)|morad[ao]\s+(?:na?|em)|fica\s+(?:na?|em)|endere[cç]o\s+[eé]\s*|localizado?\s+(?:na?|em)|entrega\s+(?:na?|em|para)|envi[ae]\s+(?:para|pra)|mand[ae]\s+(?:para|pra)|v[aá]\s+(?:para|pra|at[eé])|est[aáo](?:mos)?\s+(?:na?|em))\s+((?:Rua|Avenida|Av\.?|Travessa|Estrada|Rodovia|Alameda|Praça|Largo|Logradouro|Viaduto|Beco|Viela|Ladeira|Caminho)\s+[\p{L}\p{N}][\p{L}\p{N}\s'.]{2,50},?\s*\d{1,6}(?:\s*[,/]\s*(?:Apto|Apt\.?|Bloco|Bl\.?|Sala|Conj\.?|Lote|Casa|Andar)\s*\d{1,5})?)/giu,
    priority: 92,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "contextual-address-es",
    label: "Contextual Spanish address (mid-paragraph)",
    locale: "es-LatAm",
    patternFactory: () =>
      /(?:viv[eio]\s+en|ubica(?:do?|ci[oó]n)\s+en|direc+i[oó]n\s+(?:es|en)\s*|queda\s+en|est[aáo](?:mos)?\s+en|env[ií]a\s+a|mand[ae]\s+a|entreg[ae]\s+en|ven\s+a|llega\s+a)\s+((?:Calle|Cl\.?|Avenida|Av\.?|Carrera|Cra\.?|Boulevard|Blvd\.?|Paseo|Vía|Camino|Colonia|Callejón|Jirón|Jr\.?)\s+[\p{L}\p{N}][\p{L}\p{N}\s'.]{2,50},?\s*\d{1,6}(?:\s*[,/]\s*(?:Piso|Depto\.?|Departamento|Local|Oficina|Suite|Apt[oe]?\.?|Int\.?|Casa)\s*\d{1,5})?)/giu,
    priority: 92,
    valueGroup: 1,
  },

  // ─── Natural Language Date Detection ──────────────────────────────────────
  // Catches dates expressed in written form: "March 15, 1990", "15 de março",
  // "born on 03/15/1990", etc.

  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "date-natural-en",
    label: "Natural language date (English)",
    locale: "en-US",
    patternFactory: () =>
      /\b((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b/gi,
    priority: 84,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "date-natural-en-dmy",
    label: "Natural language date (English, day-first)",
    locale: "en-US",
    patternFactory: () =>
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?,?\s+\d{4})\b/gi,
    priority: 84,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "date-natural-pt",
    label: "Natural language date (Portuguese)",
    locale: "pt-BR",
    patternFactory: () =>
      /\b(\d{1,2}\s+de\s+(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+\d{4})?)\b/giu,
    priority: 84,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "date-natural-es",
    label: "Natural language date (Spanish)",
    locale: "es-LatAm",
    patternFactory: () =>
      /\b(\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de[l]?\s+\d{4})?)\b/giu,
    priority: 84,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "date-labeled",
    label: "Labeled date of birth / birthday",
    locale: "shared",
    patternFactory: () =>
      /\b(?:birth\s*(?:day|date)|date\s+of\s+birth|d\.?o\.?b\.?|nascimento|data\s+de\s+nascimento|fecha\s+de\s+nacimiento|cumpleaños|aniversário|生日|出生日期)\s*[:=\-]?\s*(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}|\d{4}[/.\-]\d{1,2}[/.\-]\d{1,2}|\p{L}+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+(?:de\s+)?\p{L}+(?:\s+(?:de\s+)?\d{4})?)/giu,
    priority: 85,
    valueGroup: 1,
  },
]);

/**
 * Validator for IPv4 addresses
 */
function isValidIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Validator for ISO date format (YYYY-MM-DD)
 */
function isValidIsoDate(value: string): boolean {
  const normalized = value.replace(/[/.]/g, "-");
  const date = new Date(normalized);
  return !isNaN(date.getTime());
}

/**
 * Validator for DMY date format (DD/MM/YYYY or DD-MM-YYYY)
 */
function isValidDmyDate(value: string): boolean {
  const parts = value.split(/[-/.]/);
  if (parts.length !== 3) return false;
  const [day, month, year] = parts.map(p => parseInt(p, 10));
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  return true;
}

/**
 * Validator for US SSN
 * NOTE: area >= 900 was historically rejected (pre-2011 geographic allocation).
 * Since June 2011 the SSA uses full randomization; 9xx area codes are valid.
 * A PII masker must mask on appearance, not policy — removed the 9xx gate.
 */
function isValidUsaSsn(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 9) return false;
  const area = parseInt(digits.slice(0, 3), 10);
  if (area === 0 || area === 666) return false;
  const group = parseInt(digits.slice(3, 5), 10);
  if (group === 0) return false;
  const serial = parseInt(digits.slice(5), 10);
  if (serial === 0) return false;
  return true;
}

/**
 * Validator for generic URLs — only flag URLs containing sensitive data indicators.
 */
const URL_SENSITIVE_PARAMS =
  /[?&](token|key|secret|password|api[_-]?key|access[_-]?token|auth|session[_-]?id|credential)=/i;
const URL_BASIC_AUTH = /:\/\/[^@/\s]+:[^@/\s]+@/;

function looksLikeUrlWithSensitiveData(value: string): boolean {
  return URL_SENSITIVE_PARAMS.test(value) || URL_BASIC_AUTH.test(value);
}

/**
 * Validator for Unix filesystem paths — exclude known-safe prefixes.
 */
const SAFE_PATH_PREFIXES =
  /^\/(?:usr|var|etc|opt|bin|sbin|lib|proc|sys|dev|tmp|run|boot|node_modules|\.npm)\//;

function looksLikeSensitivePath(value: string): boolean {
  return !SAFE_PATH_PREFIXES.test(value);
}

/**
 * Validator for IPv6 addresses — reject known non-IPv6 patterns.
 */
function isValidIpv6(value: string): boolean {
  const groups = value.split(":");
  if (groups.length < 3 || groups.length > 8) return false;
  return groups.every(g => g.length <= 4);
}

/**
 * Validator for full 40-char git hashes — reject all-zero or all-same-char.
 */
function isLikelyGitHash(value: string): boolean {
  if (/^(.)\1+$/.test(value)) return false;
  if (value === "0".repeat(40)) return false;
  return true;
}

/**
 * Validator for short git hashes — must contain at least one digit AND
 * at least one letter to avoid matching pure numbers or hex color codes.
 */
function isLikelyShortGitHash(value: string): boolean {
  return /\d/.test(value) && /[a-f]/i.test(value);
}

/**
 * Validator for network port numbers — must be 1..65535.
 */
function isValidPort(value: string): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= 1 && num <= 65535;
}

// ─── Standalone Name Detection ──────────────────────────────────────────────

/**
 * Matches 2–5 capitalized words separated by whitespace (standard Latin names).
 * Each word starts with an uppercase letter followed by lowercase or accented chars.
 */
const STANDALONE_NAME_PATTERN =
  /\b((?:\p{Lu}\p{Ll}{1,20})\s+(?:\p{Lu}\p{Ll}{1,20})(?:\s+\p{Lu}\p{Ll}{1,20}){0,3})\b/gu;

/**
 * Matches 2–3 word pinyin names (first letter may not always be capitalized).
 * More lenient for ZH transliterations.
 */
const STANDALONE_NAME_PATTERN_ZH =
  /\b([A-Z]\w{1,8}\s+[A-Z]\w{1,8}(?:\s+[A-Z]\w{1,8})?)\b/g;

/**
 * Context-driven name pattern: a preceding keyword (like "Dear", "Prezado",
 * "Sr.") followed by a capitalized word sequence.
 */
const CONTEXTUAL_NAME_PATTERN = new RegExp(
  `(?:^|[\\s,;:])(?:${NAME_CONTEXT_PREFIXES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s+(\\p{Lu}\\p{Ll}{1,20}(?:\\s+\\p{Lu}\\p{Ll}{1,20}){0,4})(?=[\\s,;:.!?]|$)`,
  "giu",
);

/**
 * Common English words that look like names but aren't.
 * Prevents false positives for phrases like "New York", "San Francisco", etc.
 */
const NAME_FALSE_POSITIVES = new Set([
  "the",
  "this",
  "that",
  "these",
  "those",
  "with",
  "from",
  "will",
  "have",
  "been",
  "being",
  "just",
  "more",
  "some",
  "what",
  "when",
  "where",
  "which",
  "about",
  "also",
  "only",
  "very",
  "much",
  "such",
  "like",
  "than",
  "new",
  "old",
  "san",
  "santa",
  "saint",
  "los",
  "las",
  "del",
  "von",
  "van",
  "mac",
  "port",
]);

/**
 * Returns true if the value looks like a person name and at least one part
 * is found in the given locale dictionaries.
 */
function isLikelyPersonNameForLocale(
  value: string,
  firstNames: ReadonlySet<string>,
  lastNames: ReadonlySet<string>,
): boolean {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 5) return false;
  if (value.length < 4 || value.length > 80) return false;

  // Reject if any part is a common false-positive word
  if (parts.some(p => NAME_FALSE_POSITIVES.has(p.toLowerCase()))) return false;

  const lowerParts = parts.map(p => p.toLowerCase());

  // At least one part must be in the dictionary
  const hasFirst = lowerParts.some(p => firstNames.has(p));
  const hasLast = lowerParts.some(p => lastNames.has(p));

  return hasFirst || hasLast;
}

function isLikelyPersonName_EN(value: string): boolean {
  return isLikelyPersonNameForLocale(
    value,
    EN_US_FIRST_NAMES,
    EN_US_LAST_NAMES,
  );
}

function isLikelyPersonName_PT_BR(value: string): boolean {
  return isLikelyPersonNameForLocale(
    value,
    PT_BR_FIRST_NAMES,
    PT_BR_LAST_NAMES,
  );
}

function isLikelyPersonName_PT_PT(value: string): boolean {
  return isLikelyPersonNameForLocale(
    value,
    PT_PT_FIRST_NAMES,
    PT_PT_LAST_NAMES,
  );
}

function isLikelyPersonName_ES(value: string): boolean {
  return isLikelyPersonNameForLocale(value, ES_FIRST_NAMES, ES_LAST_NAMES);
}

function isLikelyPersonName_ZH(value: string): boolean {
  return isLikelyPersonNameForLocale(
    value,
    ZH_CN_FIRST_NAMES,
    ZH_CN_LAST_NAMES,
  );
}

function isLikelyPersonName_RU(value: string): boolean {
  return isLikelyPersonNameForLocale(value, RU_FIRST_NAMES, RU_LAST_NAMES);
}

function isLikelyPersonName_IN(value: string): boolean {
  return isLikelyPersonNameForLocale(value, IN_FIRST_NAMES, IN_LAST_NAMES);
}
