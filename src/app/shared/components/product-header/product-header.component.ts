import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-product-header",
  standalone: true,
  styleUrl: "./product-header.component.scss",
  templateUrl: "./product-header.component.html",
})
export class ProductHeaderComponent {
  readonly title = input.required<string>();
  readonly tagline = input.required<string>();
  readonly icon = input<string>("🛡️");
}
