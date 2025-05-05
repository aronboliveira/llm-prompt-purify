import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  ViewChild,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
@Component({
  selector: "app-prompt-table",
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: "./prompt-table.component.html",
  styleUrl: "./prompt-table.component.scss",
})
export class PromptTableComponent implements AfterViewInit {
  @ViewChild("content") content: ElementRef<HTMLElement> | null = null;
  constructor(
    public dialogRef: MatDialogRef<PromptTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { text: string; prompt: string }
  ) {}
  ngAfterViewInit(): void {
    if (typeof window === "undefined") return;
    const content =
      this.content?.nativeElement ||
      document.getElementById("promptTableContent");
    if (!content) return;
    const container = content.closest(".mat-mdc-dialog-container.mdc-dialog");
    if (!container) return;
    container.querySelectorAll("hr").forEach((hr, i, arr) => {
      for (const { k, v } of [
        { k: "border", v: "#7171712e 1px solid" },
        { k: "width", v: "90%" },
        { k: "margin-right", v: "12%" },
        { k: "text-align", v: "center" },
        { k: "margin-inline", v: "auto" },
        { k: "opacity", v: "0.8" },
      ])
        hr.style[k as any] = v;
      if (i === arr.length - 1) {
        for (const { k, v } of [
          { k: "marginBlock", v: "1rem" },
          { k: "transform", v: "translateX(-2.5%)" },
        ])
          hr.style[k as any] = v;
      }
    });
    setTimeout(() => {
      const tb = content.querySelector("table");
      if (tb) {
        for (const { k, v } of [
          { k: "width", v: "100%" },
          { k: "padding", v: "0 1.5rem 0 0" },
        ])
          (tb.style as any)[k] = v;
        [
          ...Array.from(tb.getElementsByTagName("th")),
          ...Array.from(tb.getElementsByTagName("td")),
        ].forEach(c => {
          for (const { k, v } of [{ k: "textAlign", v: "center" }])
            (c as any)[k] = v;
        });
      }
    }, 500);
  }
}
