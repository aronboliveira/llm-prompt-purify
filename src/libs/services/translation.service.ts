import { Injectable } from "@angular/core";
import { LabelKey, LangCode } from "../../definitions/helpers";
@Injectable({
  providedIn: "root",
})
export class TranslationService {
  private readonly supportedLangs: Record<LangCode, Record<LabelKey, string>> =
    Object.freeze({
      en: Object.freeze({
        copyOutput: "Copy output to clipboard",
        downloadOutput: "Download output as ZIP file",
        copied: "Copied to clipboard!",
        downloaded: "Download complete!",
      }),
      pt: Object.freeze({
        copyOutput: "Copiar saída para a área de transferência",
        downloadOutput: "Baixar saída como arquivo ZIP",
        copied: "Copiado para a área de transferência!",
        downloaded: "Download concluído!",
      }),
      de: Object.freeze({
        copyOutput: "Ausgabe in Zwischenablage kopieren",
        downloadOutput: "Ausgabe als ZIP-Datei herunterladen",
        copied: "In Zwischenablage kopiert!",
        downloaded: "Download abgeschlossen!",
      }),
      es: Object.freeze({
        copyOutput: "Copiar salida al portapapeles",
        downloadOutput: "Descargar salida como archivo ZIP",
        copied: "¡Copiado al portapapeles!",
        downloaded: "¡Descarga completa!",
      }),
      jp: Object.freeze({
        copyOutput: "出力をクリップボードにコピー",
        downloadOutput: "出力をZIPファイルとしてダウンロード",
        copied: "クリップボードにコピーしました！",
        downloaded: "ダウンロード完了！",
      }),
    });

  private currentLang: LangCode = "en";

  constructor() {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (this.isSupported(browserLang)) {
      this.currentLang = browserLang as LangCode;
    }
  }

  private isSupported(lang: string): lang is LangCode {
    return Object.keys(this.supportedLangs).includes(lang);
  }

  public setLanguage(lang: LangCode): void {
    if (this.isSupported(lang)) {
      this.currentLang = lang;
    }
  }

  public get currentLanguage(): LangCode {
    return this.currentLang;
  }

  public get availableLanguages(): LangCode[] {
    return Object.keys(this.supportedLangs) as LangCode[];
  }

  public t(key: LabelKey): string {
    return this.supportedLangs[this.currentLang][key] ?? key;
  }
}
