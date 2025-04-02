export const MAIN_DICT = Object.freeze({
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
  }),
  pt: Object.freeze({
    CPF_LABEL: /\b(?:[Cc][Pp][Ff])\s*[:=-]?\s*/gi,
    CPNJ_LABEL: /\b(?:cnpj)\s*[:=-]?\s*/gi,
    RG_LABEL: /\b(?:rg)\s*[:=-]?\s*/gi,
    EMAIL_LABEL: /\b(?:email|e[-\s]?mail|correio eletr[oô]nico)\s*[:=-]?\s*/gi,
    PHONE_LABEL: /\b(?:telefone|tel|celular)\s*[:=-]?\s*/gi,
    ADDRESS_LABEL: /\b(?:end[eê]re[çc]o)\s*[:=-]\s*/gi,
    FULL_NAME_LABEL: /\b(?:nome completo|nome)\s*[:=-]\s*/gi,
    LAST_NAME_LABEL: /\b(?:sobrenome)\s*[:=-]\s*/gi,
    COMPANY_LABEL: /\b(?:empresa|raz[ãa]o social)\s*[:=-]\s*/gi,
  }),
  en: Object.freeze({
    EMAIL_LABEL: /\b(?:email)\s*[:=-]\s*/gi,
    PHONE_LABEL: /\b(?:phone|tel)\s*[:=-]\s*/gi,
    ADDRESS_LABEL: /\b(?:address)\s*[:=-]\s*/gi,
    FULL_NAME_LABEL: /\b(?:full name|name)\s*[:=-]\s*/gi,
    LAST_NAME_LABEL: /\b(?:last name|surname)\s*[:=-]\s*/gi,
    COMPANY_LABEL: /\b(?:company|business)\s*[:=-]\s*/gi,
  }),
  es: Object.freeze({
    EMAIL_LABEL: /\b(?:correo electr[oó]nico|email)\s*[:=-]\s*/gi,
    PHONE_LABEL: /\b(?:tel[eé]fono|m[oó]vil|celular)\s*[:=-]\s*/gi,
    ADDRESS_LABEL: /\b(?:direcci[oó]n)\s*[:=-]\s*/gi,
    FULL_NAME_LABEL: /\b(?:nombre completo|nombre)\s*[:=-]\s*/gi,
    LAST_NAME_LABEL: /\b(?:apellido|apellidos)\s*[:=-]\s*/gi,
    COMPANY_LABEL: /\b(?:empresa|raz[oó]n social)\s*[:=-]\s*/gi,
  }),
  de: Object.freeze({
    EMAIL_LABEL: /\b(?:E[-\s]?Mail|Email)\s*[:=-]\s*/gi,
    PHONE_LABEL: /\b(?:Telefon|Mobil|Handy)\s*[:=-]\s*/gi,
    ADDRESS_LABEL: /\b(?:Adresse)\s*[:=-]\s*/gi,
    FULL_NAME_LABEL: /\b(?:Name|Vollst[aä]ndiger Name)\s*[:=-]\s*/gi,
    LAST_NAME_LABEL: /\b(?:Nachname|Familienname)\s*[:=-]\s*/gi,
    COMPANY_LABEL: /\b(?:Firma|Unternehmen|Firmenname)\s*[:=-]\s*/gi,
  }),
  hb: Object.freeze({
    EMAIL_LABEL: /(?:אימייל|דוא״ל)\s*[：:＝\-]*\s*/gi,
    PHONE_LABEL: /(?:טלפון|נייד)\s*[：:＝\-]*\s*/gi,
    ADDRESS_LABEL: /(?:כתובת)\s*[：:＝\-]*\s*/gi,
    FULL_NAME_LABEL: /(?:שם מלא|שם)\s*[：:＝\-]*\s*/gi,
    LAST_NAME_LABEL: /(?:שם משפחה)\s*[：:＝\-]*\s*/gi,
    COMPANY_LABEL: /(?:חברה)\s*[：:＝\-]*\s*/gi,
  }),
  ja: Object.freeze({
    EMAIL_REGEX_JA: /(?:メール(?:アドレス)?|Eメール|電子メール)\s*[：:＝]\s*/gi,
    PHONE_REGEX_JA: /(?:電話番号|電話|携帯電話|携帯)\s*[：:＝]\s*/gi,
    ADDRESS_REGEX_JA: /(?:住所)\s*[：:＝]\s*/gi,
    FULL_NAME_REGEX_JA: /(?:氏名|名前)\s*[：:＝]\s*/gi,
    COMPANY_REGEX_JA: /(?:会社名|企業名)\s*[：:＝]\s*/gi,
    MYNUMBER_REGEX_JA: /(?:マイナンバー|個人番号)\s*[：:＝]\s*/gi,
    BIRTHDATE_REGEX_JA: /(?:生年月日)\s*[：:＝]\s*/gi,
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
});

export const PATTERNS = Object.freeze({
  SYMBOLS: (g: boolean = false) =>
    g
      ? /[\u2000-\u206F\u20A0-\u20CF\u2100-\u214F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2500-\u257F\u2600-\u26FF\u2700-\u27BF\u2900-\u297F\u2B00-\u2BFF\u3000-\u303F\uFE30-\uFE4F\uFF00-\uFFEF]/g
      : /[\u2000-\u206F\u20A0-\u20CF\u2100-\u214F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2500-\u257F\u2600-\u26FF\u2700-\u27BF\u2900-\u297F\u2B00-\u2BFF\u3000-\u303F\uFE30-\uFE4F\uFF00-\uFFEF]/,
  LOWERCASE_ACCENTED: (g: boolean = false) =>
    g ? /[a-záàâäãéèêëíìîïóòôöõúùûüçñ]/g : /[a-záàâäãéèêëíìîïóòôöõúùûüçñ]/,
  UPPERCASE_ACCENTED: (g: boolean = false) =>
    g ? /[A-ZÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑ]/g : /[A-ZÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑ]/,
  LATINIZED_CHARS: (g: boolean = false) =>
    g
      ? /[a-záàâäãéèêëíìîïóòôöõúùûüçñA-ZÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑ]/g
      : /[a-záàâäãéèêëíìîïóòôöõúùûüçñA-ZÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑ]/,
  NUMBERS: (g: boolean = false) => (g ? /[0-9]/g : /[0-9]/),
  JAPANESE: (g: boolean = false) =>
    g ? /[\u3040-\u309F]/g : /[\u3040-\u309F]/,
  HANGUL: (g: boolean = false) => (g ? /[\uAC00-\uD7AF]/g : /[\uAC00-\uD7AF]/),
  HAN: (g: boolean = false) =>
    g ? /[\u4E00-\u9FFF\u3400-\u4DBF]/g : /[\u4E00-\u9FFF\u3400-\u4DBF]/,
  ARABIC: (g: boolean = false) =>
    g
      ? /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g
      : /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/,
  CYRILIC: (g: boolean = false) => (g ? /[\u0400-\u04FF]/g : /[\u0400-\u04FF]/),
  getRandomChar: (startHex: number, endHex: number) =>
    String.fromCharCode(
      Math.floor(Math.random() * (endHex - startHex + 1) + startHex)
    ),
  getRandomSymbol: (originalStr: string) => {
    const symbolRanges = [
      [0x2000, 0x206f],
      [0x2100, 0x214f],
      [0x2190, 0x21ff],
      [0x2200, 0x22ff],
      [0x2300, 0x23ff],
      [0x2500, 0x257f],
      [0x2600, 0x26ff],
      [0x2700, 0x27bf],
      [0x2900, 0x297f],
      [0x2b00, 0x2bff],
      [0x3000, 0x303f],
      [0xfe30, 0xfe4f],
      [0xff00, 0xffef],
    ];
    const validSymbols = [];
    for (const [start, end] of symbolRanges) {
      for (let code = start; code <= end; code++) {
        const char = String.fromCharCode(code);
        if (!/@\/\.[\u20A0-\u20CF]/.test(char) && !originalStr.includes(char)) {
          validSymbols.push(char);
        }
      }
    }
    return validSymbols.length > 0
      ? validSymbols[Math.floor(Math.random() * validSymbols.length)]
      : "*";
  },
});
