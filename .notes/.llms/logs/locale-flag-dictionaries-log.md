# Locale Flag Dictionaries Expansion

Date: 2026-03-04

This pass moved a large portion of locale-sensitive label detection out of inline regex fragments and into explicit dictionary constants. The new dictionaries now hold the “flag” vocabulary that should trigger sensitive-value scanning for exact `label: value` / `label=value` patterns.

The main implementation pieces are:

- [mask-flag-dictionaries.constants.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/masking/constants/mask-flag-dictionaries.constants.ts)
- [mask-pattern.utils.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/masking/utils/mask-pattern.utils.ts)
- [masking-rules.constants.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/masking/constants/masking-rules.constants.ts)

Expanded dictionaries now cover:

- secret-assignment flags in English, PT-BR, PT-PT, and Spanish variants
- shared contact/address/passport labels
- PT-BR labels for CEP, CNH, PIS/PASEP, RG, and voter registration
- PT-PT labels for NIF and NISS
- ES-LatAm labels for cédula, DNI, and RUC
- ES-ES labels for DNI and NIE
- ZH-CN resident-ID labels including native-script forms
- RU-RU INN and SNILS labels including Cyrillic forms
- EN-IN Aadhaar, PAN, and GSTIN label variants

Validation after the change:

- `npm run test -- --runInBand`: 11 suites passed, 294 tests passed
- `npm run build`: passed
