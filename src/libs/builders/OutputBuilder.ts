import JSZip from "jszip";
export class OutputBuilder {
  #text = "";
  #zip: JSZip;
  #compressionLevel: number = 6;
  constructor({
    _input,
    _compressionLevel,
  }: {
    _input: string;
    _compressionLevel: string;
  }) {
    const pn = Math.round(parseInt(_compressionLevel, 10));
    this.#text = _input;
    this.#zip = new JSZip();
    this.#compressionLevel = Number.isFinite(pn) ? Math.min(pn, 9) : 6;
  }
  public async exportCompressed(filename = "output.zip"): Promise<void> {
    this.#save(await this.#compressText(), filename);
  }
  async #compressText(filename = "output.txt"): Promise<Blob> {
    this.#zip.file(filename, this.#text);
    const blob = await this.#zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: this.#compressionLevel,
      },
    });
    return blob;
  }
  #save(blob: Blob, filename = "output.zip") {
    const a = document.createElement("a"),
      url = URL.createObjectURL(blob);
    a.id = new Date().getTime().toString();
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.append(a);
    setTimeout(() => a?.click(), 100);
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
