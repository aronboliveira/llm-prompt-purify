/// <reference types="cypress" />

// Custom commands for LLM Prompt Purify extension testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Sets text in the prompt input and triggers input event
       */
      setPromptText(text: string): Chainable<void>;
      /**
       * Gets the current prompt text
       */
      getPromptText(): Chainable<string>;
      /**
       * Waits for extension UI elements to appear
       */
      waitForExtensionUI(): Chainable<void>;
      /**
       * Injects the content script for testing
       */
      injectContentScript(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("setPromptText", (text: string) => {
  cy.window().then(win => {
    if (typeof (win as any).setPromptText === "function") {
      (win as any).setPromptText(text);
    } else {
      // Fallback: find textarea or contenteditable
      cy.get(
        '[data-testid*="textarea"], [data-testid*="input"], [contenteditable="true"]',
      )
        .first()
        .then($el => {
          if ($el.is("textarea") || $el.is("input")) {
            cy.wrap($el).clear().type(text);
          } else {
            $el[0].innerText = text;
            $el[0].dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
    }
  });
});

Cypress.Commands.add("getPromptText", () => {
  return cy.window().then(win => {
    if (typeof (win as any).getPromptText === "function") {
      return (win as any).getPromptText();
    }
    return "";
  });
});

Cypress.Commands.add("waitForExtensionUI", () => {
  cy.get("#llm-purify-toast-root", { timeout: 5000 }).should("be.visible");
});

Cypress.Commands.add("injectContentScript", () => {
  cy.request("/extension/content.js").then(response => {
    cy.window().then(win => {
      const scriptEl = win.document.createElement("script");
      scriptEl.textContent = response.body;
      win.document.head.appendChild(scriptEl);
    });
  });
});

export {};
