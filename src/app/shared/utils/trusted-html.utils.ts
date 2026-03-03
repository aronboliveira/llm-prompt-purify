import type { SafeHtml } from "@angular/platform-browser";
import { DomSanitizer } from "@angular/platform-browser";

export function createTrustedHtmlMap<T extends Record<string, string>>(
  sanitizer: DomSanitizer,
  htmlMap: T
): Readonly<Record<keyof T, SafeHtml>> {
  const entries = Object.entries(htmlMap).map(([key, value]) => {
    return [key, sanitizer.bypassSecurityTrustHtml(value)] as const;
  });

  return Object.freeze(Object.fromEntries(entries) as Record<keyof T, SafeHtml>);
}
