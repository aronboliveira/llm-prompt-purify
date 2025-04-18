import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
@Injectable({ providedIn: "root" })
export class UserInputSerivce {
  #userInput = new BehaviorSubject<string>("");
  userInput$ = this.#userInput.asObservable();
  setObsUserInput(v: string): void {
    this.#userInput.next(v);
  }
}
