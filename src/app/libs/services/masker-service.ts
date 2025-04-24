import Swal from "sweetalert2";
import { MaskMatch } from "../../../definitions/helpers";
export class MaskerService {
  #matchesDict = new Map<string, MaskMatch>();
  #inputSelector: string;
  #outputSelector: string;
  constructor(
    masks: Array<string>,
    _inputSelector: string,
    _outputSelector: string
  ) {
    this.#matchesDict;
  }
}
