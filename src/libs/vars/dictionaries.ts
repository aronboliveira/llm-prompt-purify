export const MAIN_DICT = Object.freeze({
  common: Object.freeze({
    email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/,
    url: /\b(https?:\/\/[^\s/$.?#].[^\s]*)\b/gi,
    urn: /\burn:[a-z0-9][a-z0-9-]{1,31}:[^\s]+\b/gi,
    phone: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    creditCard: /\b(?:\d[ -]*?){13,16}\b/,
    envVar: /\b[A-Z][A-Z0-9_]{2,}(?:_KEY|_SECRET|_TOKEN|_URL)?\b/,
    apiKey: /\b[A-Za-z0-9]{20,}\b/,
    token:
      /\b(?:password|secret|token)\s*[:=]\s*['"]?[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}\b/gi,
    business:
      /\b(?:company\s*(?:ID|number)|registration\s*number)\s*[:=]\s*[A-Z0-9\-]{4,}\b/gi,
    cpf: /\b\d{3}[.\-]?\d{3}[.\-]?\d{3}[\-]?\d{2}\b/g,
  }),
  pt: Object.freeze({
    cpfLabel: /\b(?:[Cc][Pp][Ff])\s*[:=-]?/gi,
    cpnjLabel: /\b(?:cnpj)\s*[:=-]?/gi,
    emailLabel: /\b(?:email|e[-\s]?mail|correio eletr[oô]nico)\s*[:=-]?/gi,
    phoneLabel: /\b(?:telefone|tel|celular)\s*[:=-]?/gi,
    addressLabel: /\b(?:end[eê]re[çc]o)\s*[:=-]\s*.+/gi,
    fullNameLabel: /\b(?:nome completo|nome)\s*[:=-]/gi,
    secondNameLabel: /\b(?:sobrenome)\s*[:=-]\s*([A-ZÀ-Ÿ][a-zà-ÿ]+)\b/gi,
    companyLabel: /\b(?:empresa|raz[ãa]o social)\s*[:=-]+\b/i,
  }),
  en: Object.freeze({}),
  es: Object.freeze({}),
  de: Object.freeze({}),
  hb: Object.freeze({}),
  ja: Object.freeze({}),
  ko: Object.freeze({}),
  zh: Object.freeze({}),
  ru: Object.freeze({}),
  fr: Object.freeze({}),
  it: Object.freeze({}),
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
