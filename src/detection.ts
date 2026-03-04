/**
 * LLM Prompt Purifier - Detection Engine
 * @version 1.3.0
 */

import { PATTERNS } from "./constants";
import type { Detection } from "./types";

/** Detect sensitive data in text */
export const detectSensitiveData = (text: string): Detection[] => {
  const results: Detection[] = [];
  const seen = new Set<string>();
  const entries = Object.entries(PATTERNS);

  for (let i = 0, len = entries.length; i < len; i++) {
    const [key, { regex, label, mask }] = entries[i];
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const value = match[0];
      const posKey = `${match.index}:${value}`;

      if (!seen.has(posKey)) {
        seen.add(posKey);
        results.push({
          type: key,
          label,
          mask,
          value,
          start: match.index,
          end: match.index + value.length,
        });
      }
    }
  }

  return results.sort((a, b) => a.start - b.start);
};

/** Generate mask suggestions for a detection */
export const generateMasks = (detection: Detection): string[] => {
  const { type, value, mask } = detection;
  const suggestions: string[] = [mask];

  switch (type) {
    case "EMAIL": {
      const [local, domain] = value.split("@");
      if (local && domain) {
        suggestions.push(`[EMAIL:${domain}]`, `${local[0]}***@${domain}`);
      }
      break;
    }
    case "PHONE": {
      const digits = value.replace(/\D/g, "");
      if (digits.length >= 4) {
        suggestions.push(`[PHONE:XXX-XXX-${digits.slice(-4)}]`);
      }
      break;
    }
    case "CREDIT_CARD":
      suggestions.push(`[CARD:****-****-****-${value.slice(-4)}]`);
      break;
    case "CPF":
    case "DNI":
    case "SSN":
      suggestions.push(`[${type}:***${value.slice(-3)}]`);
      break;
    case "IPV4":
      suggestions.push("[IP:xxx.xxx.xxx.xxx]", "[INTERNAL_IP]");
      break;
  }

  return suggestions;
};
