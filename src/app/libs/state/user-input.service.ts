import { Injectable } from "@angular/core";
import { BehaviorSubject, distinctUntilChanged } from "rxjs";
@Injectable({ providedIn: "root" })
export class UserInputSerivce {
  #userInput = new BehaviorSubject<string>("");
  userInput$ = this.#userInput.asObservable().pipe(distinctUntilChanged());
  setObsUserInput(v: string): void {
    this.#userInput.next(v);
  }
  get userInput(): string {
    return this.#userInput.value;
  }
}
