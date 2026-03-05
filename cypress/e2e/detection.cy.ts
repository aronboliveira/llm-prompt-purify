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

// ---------------------------------------------------------------------------
// Provider-specific mocks — Gemini, Copilot, DeepSeek, Perplexity,
// HuggingFace, Poe, Grok
// ---------------------------------------------------------------------------

describe("LLM Prompt Purify - Gemini Interface", () => {
  beforeEach(() => {
    cy.visit("/gemini.html");
    cy.injectContentScript();
  });

  it("detects email via rich-textarea", () => {
    cy.setPromptText("Contact: maria.garcia@company.org");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects API keys via Gemini", () => {
    cy.setPromptText("My Google API key is AIzaSyD-example_key_1234567890abcde");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });
});

describe("LLM Prompt Purify - Copilot Interface", () => {
  beforeEach(() => {
    cy.visit("/copilot.html");
    cy.injectContentScript();
  });

  it("detects GitHub tokens via #searchbox", () => {
    cy.setPromptText("GitHub token: ghp_ABCdef1234567890abcdef1234567890ABCD");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects address data", () => {
    cy.setPromptText(
      "Send invoice to 789 Pine Street, Apt 4B, Seattle, WA 98101",
    );
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });
});

describe("LLM Prompt Purify - DeepSeek Interface", () => {
  beforeEach(() => {
    cy.visit("/deepseek.html");
    cy.injectContentScript();
  });

  it("detects passwords via #chat-input", () => {
    cy.setPromptText("Here is my database password: root_admin_P@ss2024!");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects SSN in DeepSeek", () => {
    cy.setPromptText("My social security number is 078-05-1120");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });
});

describe("LLM Prompt Purify - Perplexity Interface", () => {
  beforeEach(() => {
    cy.visit("/perplexity.html");
    cy.injectContentScript();
  });

  it("detects Stripe keys via Ask anything textarea", () => {
    cy.setPromptText(
      "My Stripe secret key is sk_live_abc123def456\x67hi789jkl012mno",
    );
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects patient IDs", () => {
    cy.setPromptText("Patient ID: 123-45-6789, diagnosed on 2024-01-15");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });
});

describe("LLM Prompt Purify - HuggingFace Interface", () => {
  beforeEach(() => {
    cy.visit("/huggingface.html");
    cy.injectContentScript();
  });

  it("detects HF tokens via Ask placeholder", () => {
    cy.setPromptText(
      "My HuggingFace token: hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789",
    );
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects medical data", () => {
    cy.setPromptText(
      "Patient John Smith, MRN: 12345678, DOB: 1990-06-15",
    );
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });
});

describe("LLM Prompt Purify - Poe Interface", () => {
  beforeEach(() => {
    cy.visit("/poe.html");
    cy.injectContentScript();
  });

  it("detects AWS secrets via ChatInput textarea", () => {
    cy.setPromptText(
      "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    );
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects credit cards in Poe", () => {
    cy.setPromptText("My credit card: 5555-5555-5555-4444 exp 12/26 CVV 123");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });
});

describe("LLM Prompt Purify - Grok Interface", () => {
  beforeEach(() => {
    cy.visit("/grok.html");
    cy.injectContentScript();
  });

  it("detects crypto wallets via Grok input", () => {
    cy.setPromptText(
      "My Bitcoin wallet: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    );
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });

  it("detects phone numbers in Grok", () => {
    cy.setPromptText("Call our office at (212) 555-0198, ext. 432");
    cy.waitForExtensionUI();
    cy.get("#llm-purify-toast-root").should("be.visible");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

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
