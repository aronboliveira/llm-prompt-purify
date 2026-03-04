import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HeroSectionComponent } from "./hero-section.component";
import { DomSanitizer } from "@angular/platform-browser";

describe("HeroSectionComponent", () => {
  let component: HeroSectionComponent;
  let fixture: ComponentFixture<HeroSectionComponent>;
  let element: HTMLElement;
  let sanitizer: DomSanitizer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroSectionComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    sanitizer = TestBed.inject(DomSanitizer);

    // Set required inputs
    fixture.componentRef.setInput("body", "Default body");
    fixture.componentRef.setInput(
      "noticeIcon",
      sanitizer.bypassSecurityTrustHtml("<svg></svg>"),
    );
    fixture.componentRef.setInput("noticeTitle", "Default Notice");
    fixture.componentRef.setInput("noticeBody", "Default notice body");
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should display the body text", () => {
    fixture.componentRef.setInput("body", "Test body content");
    fixture.detectChanges();

    const bodyEl = element.querySelector(".hero__body");
    expect(bodyEl?.textContent).toContain("Test body content");
  });

  it("should display notice panel with title and body", () => {
    fixture.componentRef.setInput("noticeTitle", "Privacy Notice");
    fixture.componentRef.setInput("noticeBody", "Your data stays local");
    fixture.detectChanges();

    const titleEl = element.querySelector(".hero__notice-title");
    const bodyEl = element.querySelector(".hero__notice-body");

    expect(titleEl?.textContent).toBe("Privacy Notice");
    expect(bodyEl?.textContent).toBe("Your data stays local");
  });

  it("should emit helpRequested when help button is clicked", () => {
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.helpRequested, "emit");

    const helpBtn = element.querySelector(".help-trigger") as HTMLButtonElement;
    helpBtn?.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it("should render notice icon", () => {
    const iconHtml = sanitizer.bypassSecurityTrustHtml(
      '<svg class="test-icon"></svg>',
    );
    fixture.componentRef.setInput("noticeIcon", iconHtml);
    fixture.detectChanges();

    const iconWrap = element.querySelector(".hero__notice-icon");
    expect(iconWrap).toBeTruthy();
  });
});
