import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
@Injectable({ providedIn: "root" })
export class MaskStorageService {
  #storageKey = "maskDictionary";
  #masksSubject = new BehaviorSubject<Record<string, string>>({});
  mask$ = this.#masksSubject.asObservable();
  constructor() {
    this.#loadFromSessionStorage();
  }
  getMask(token: string): string | null {
    return this.#masksSubject.value[token] ?? null;
  }
  setMask(token: string, mask: string): boolean {
    if (token === mask) return false;
    const updated = { ...this.#masksSubject.value, [token]: mask };
    this.#masksSubject.next(updated);
    this.#saveToSessionStorage(updated);
    return true;
  }
  clearMask(token: string): void {
    const { [token]: _, ...remaining } = this.#masksSubject.value;
    this.#masksSubject.next(remaining);
    this.#saveToSessionStorage(remaining);
  }
  #loadFromSessionStorage(): void {
    try {
      if (!sessionStorage) return;
      try {
        const st = sessionStorage.getItem(this.#storageKey);
        this.#masksSubject.next(st ? JSON.parse(st) : {});
      } catch (e) {
        console.error(`Error retrieving Mask Dictionary from the Session Storage: 
					${(e as Error).name} — ${(e as Error).message}`);
      }
    } catch (e) {
      // Fail silently
    }
  }
  #saveToSessionStorage(masks: Record<string, string>): void {
    try {
      if (!sessionStorage) return;
      sessionStorage.setItem(this.#storageKey, JSON.stringify(masks));
    } catch (e) {
      console.error(
        `Error saving Masks to Session Storage: ${(e as Error).name} — ${
          (e as Error).message
        }`
      );
    }
  }
}
