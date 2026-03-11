import { ChangeDetectionStrategy, Component, input,
  ViewEncapsulation
} from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-product-header",
  standalone: true,
  styleUrl: "./product-header.component.scss",
  templateUrl: "./product-header.component.html",
  encapsulation: ViewEncapsulation.None
})
export class ProductHeaderComponent {
  readonly title = input.required<string>();
  readonly tagline = input.required<string>();
  readonly icon = input<string>("🛡️");
}
