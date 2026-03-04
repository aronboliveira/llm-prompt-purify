/// <reference types="cypress" />

describe("LLM Prompt Purify - Detection", () => {
  beforeEach(() => {
    cy.visit("/chatgpt.html");
    cy.injectContentScript();
  });

  it("detects email addresses in prompt input", () => {
    cy.setPromptText("My email is test@example.com please help");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects phone numbers", () => {
    cy.setPromptText("Call me at 555-123-4567 or (555) 987-6543");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects credit card numbers", () => {
    // Use a valid-looking credit card format
    cy.setPromptText("My card number is 4111111111111111");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects SSN patterns", () => {
    cy.setPromptText("SSN: 123-45-6789");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects API keys", () => {
    cy.setPromptText(
      "Using API key: sk-abc123def456ghi789jkl012mno345pqr678stu901vwx234",
    );
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });
});

describe("LLM Prompt Purify - UI Interactions", () => {
  beforeEach(() => {
    cy.visit("/chatgpt.html");
    cy.injectContentScript();
  });

  it("shows toast notification on detection", () => {
    cy.setPromptText("Email: user@test.com");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
    cy.get(".llm-purify-detected-count").should("exist");
  });

  it("can dismiss toast notification", () => {
    cy.setPromptText("Phone: 123-456-7890");
    cy.waitForExtensionUI();
    cy.get('[data-action="dismiss"]').click();
    // After dismissing, toast should be hidden
    cy.get("#llm-purify-toast-root").should("have.attr", "aria-hidden", "true");
  });

  it("can view mask suggestions", () => {
    cy.setPromptText("Email: user@test.com");
    cy.waitForExtensionUI();
    cy.get('[data-action="masks"]').click();
    cy.get("#llm-purify-suggestions-root").should("be.visible");
  });
});

describe("LLM Prompt Purify - Claude Interface", () => {
  beforeEach(() => {
    cy.visit("/claude.html");
    cy.injectContentScript();
  });

  it("works with contenteditable inputs", () => {
    cy.setPromptText("AWS key: AKIAIOSFODNN7EXAMPLE");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects multiple sensitive data types", () => {
    cy.setPromptText("Email: a@b.com, Phone: 555-123-4567, SSN: 111-22-3333");
    cy.waitForExtensionUI();
    cy.get(".llm-purify-detected-count")
      .invoke("text")
      .then(text => {
        expect(parseInt(text) || 0).to.be.at.least(2);
      });
  });
});

describe("LLM Prompt Purify - Edge Cases", () => {
  beforeEach(() => {
    cy.visit("/chatgpt.html");
    cy.injectContentScript();
  });

  it("no toast for clean text", () => {
    cy.setPromptText("Hello, how are you today?");
    // Wait for extension to process
    cy.wait(2000);
    // When no sensitive data detected, toast should either not exist or have aria-hidden
    cy.get("body").then($body => {
      if ($body.find("#llm-purify-toast-root").length > 0) {
        cy.get("#llm-purify-toast-root").should(
          "have.attr",
          "aria-hidden",
          "true",
        );
      }
      // If element doesn't exist, test passes (no toast = correct behavior)
    });
  });
});
