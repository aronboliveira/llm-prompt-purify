import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { ProductHeaderComponent } from "./product-header.component";

describe("ProductHeaderComponent", () => {
  let component: ProductHeaderComponent;
  let fixture: ComponentFixture<ProductHeaderComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductHeaderComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    // Set required inputs
    fixture.componentRef.setInput("title", "Default Title");
    fixture.componentRef.setInput("tagline", "Default Tagline");
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should display the title", () => {
    fixture.componentRef.setInput("title", "Test Title");
    fixture.detectChanges();

    const titleEl = element.querySelector(".product-header__title");
    expect(titleEl?.textContent).toContain("Test Title");
  });

  it("should display the tagline", () => {
    fixture.componentRef.setInput("tagline", "Test Tagline");
    fixture.detectChanges();

    const taglineEl = element.querySelector(".product-header__tagline");
    expect(taglineEl?.textContent).toBe("Test Tagline");
  });

  it("should display default icon emoji", () => {
    fixture.detectChanges();

    const titleEl = element.querySelector(".product-header__title");
    expect(titleEl?.textContent).toContain("🛡️");
  });

  it("should display custom icon when provided", () => {
    fixture.componentRef.setInput("icon", "🔒");
    fixture.detectChanges();

    const titleEl = element.querySelector(".product-header__title");
    expect(titleEl?.textContent).toContain("🔒");
  });

  it("should render the github link with correct attributes", () => {
    fixture.detectChanges();

    const githubLink = element.querySelector(".product-header__github") as HTMLAnchorElement;
    expect(githubLink).toBeTruthy();
    expect(githubLink.href).toBe("https://github.com/aronboliveira/llm-prompt-purify");
    expect(githubLink.getAttribute("target")).toBe("_blank");
    expect(githubLink.getAttribute("rel")).toContain("noreferrer");
    expect(githubLink.getAttribute("rel")).toContain("noopener");
    expect(githubLink.getAttribute("rel")).toContain("external");
    expect(githubLink.querySelector("svg")).toBeTruthy();
  });
});
