#!/usr/bin/env node
/**
 * Generate mock HTML pages for testing LLM Prompt Purify.
 *
 * Each mock uses the **real** DOM structure / selectors that the content
 * script's INPUT_SELECTORS array targets, so E2E and integration tests
 * exercise the exact same query logic that runs on the live sites.
 *
 * Hand-crafted mocks (chatgpt.html, claude.html) are maintained separately.
 * This script produces the remaining provider mocks.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mocksDir = path.join(__dirname, "..", "src", "__tests__", "mocks");

// ---------------------------------------------------------------------------
// Provider definitions — each entry mirrors the real page's input element(s)
// so the content script's INPUT_SELECTORS will match them.
// ---------------------------------------------------------------------------

const providers = [
  // ---- Gemini / Bard ----
  // Selectors: rich-textarea[aria-label*="Enter a prompt"], textarea[aria-label*="prompt"]
  {
    name: "gemini",
    title: "Gemini Mock",
    bgColor: "#1e1e2e",
    accent: "#4285f4",
    font: '"Google Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    greeting: "Hello! How can I help you today?",
    msgClass: "model",
    // The actual input DOM — raw HTML injected into .input-container
    inputHtml: `
      <rich-textarea aria-label="Enter a prompt here">
        <textarea
          class="prompt-area"
          placeholder="Enter a prompt here"
          aria-label="Enter a prompt here"
          rows="2"
        ></textarea>
      </rich-textarea>`,
    inputCss: `
    rich-textarea { display: block; width: 100%; }
    .prompt-area {
      width: 100%; min-height: 56px; background: transparent;
      border: none; color: #e2e2e2; font-size: 1rem;
      resize: none; outline: none; font-family: inherit;
    }
    .prompt-area::placeholder { color: rgba(255,255,255,0.4); }`,
    queryInput: "rich-textarea textarea",
    isTextarea: true,
    prompts: [
      "My Google API key is AIzaSyD-example_key_1234567890abcde",
      "Database URL: mongodb://admin:dbpass789@cluster0.mongodb.net/production",
      "My home address is 456 Oak Avenue, San Francisco, CA 94102",
      "Firebase token: ya29.a0ARrdaM_example-firebase-auth-token",
      "Contact: maria.garcia@company.org, backup phone: +1 (650) 555-0123",
    ],
  },

  // ---- Copilot / Bing ----
  // Selectors: #searchbox, textarea[id*="copilot"], cib-serp textarea
  // Live page also has: textarea#userInput[data-testid="composer-input"]
  {
    name: "copilot",
    title: "Copilot Mock",
    bgColor: "#1b1a1f",
    accent: "#0078d4",
    font: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    greeting: "Hi! I\u2019m Copilot. How can I help you today?",
    msgClass: "copilot",
    inputHtml: `
      <textarea
        id="searchbox"
        placeholder="Message Copilot"
        data-testid="composer-input"
        role="textbox"
        aria-label="Message Copilot"
        rows="2"
      ></textarea>`,
    inputCss: `
    #searchbox {
      flex: 1; min-height: 48px; background: transparent;
      border: none; color: #e2e2e2; font-size: 1rem;
      resize: none; outline: none; font-family: inherit;
    }
    #searchbox::placeholder { color: rgba(255,255,255,0.4); }`,
    queryInput: "#searchbox",
    isTextarea: true,
    prompts: [
      "My Azure subscription key is a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "SSH private key: -----BEGIN OPENSSH PRIVATE KEY-----\\nb3Blbn...",
      "Send invoice to 789 Pine Street, Apt 4B, Seattle, WA 98101",
      "GitHub token: ghp_ABCdef1234567890abcdef1234567890ABCD",
      "My passport number is AB1234567 and DOB is 03/15/1985",
    ],
  },

  // ---- Perplexity ----
  // Selectors: textarea[placeholder*="Ask anything"]
  {
    name: "perplexity",
    title: "Perplexity Mock",
    bgColor: "#191a1f",
    accent: "#20b2aa",
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    greeting: "Ask me anything \u2014 I\u2019ll search the web for you.",
    msgClass: "answer",
    inputHtml: `
      <textarea
        class="prompt-input"
        placeholder="Ask anything..."
        aria-label="Ask anything"
        rows="2"
      ></textarea>`,
    inputCss: `
    .prompt-input {
      flex: 1; min-height: 48px; background: transparent;
      border: none; color: #e2e2e2; font-size: 1rem;
      resize: none; outline: none; font-family: inherit;
    }
    .prompt-input::placeholder { color: rgba(255,255,255,0.4); }`,
    queryInput: 'textarea[placeholder*="Ask anything"]',
    isTextarea: true,
    prompts: [
      "What is the routing number for account 021000021 at JPMorgan?",
      "My Stripe secret key is sk_live_abc123def456\x67hi789jkl012mno",
      "Patient ID: 123-45-6789, diagnosed on 2024-01-15 with condition X",
      "Connect to redis://default:p4ssw0rd@redis-12345.us-east.aws:6379",
      "My drivers license number is D123-4567-8901 from California",
    ],
  },

  // ---- DeepSeek ----
  // Selectors: #chat-input, [data-testid="chat-input"]
  {
    name: "deepseek",
    title: "DeepSeek Mock",
    bgColor: "#0d1117",
    accent: "#4f9cf7",
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    greeting: "Hello! I\u2019m DeepSeek. How can I help you?",
    msgClass: "assistant",
    inputHtml: `
      <textarea
        id="chat-input"
        data-testid="chat-input"
        placeholder="Send a message..."
        aria-label="Send a message"
        rows="2"
      ></textarea>`,
    inputCss: `
    #chat-input {
      flex: 1; min-height: 48px; background: transparent;
      border: none; color: #e6edf3; font-size: 1rem;
      resize: none; outline: none; font-family: inherit;
    }
    #chat-input::placeholder { color: rgba(255,255,255,0.35); }`,
    queryInput: "#chat-input",
    isTextarea: true,
    prompts: [
      "Here is my database password: root_admin_P@ss2024!",
      "IBAN: DE89370400440532013000 for wire transfer",
      "My social security number is 078-05-1120",
      "Slack webhook: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
      "IP address of prod server: 192.168.1.100, SSH port 22",
    ],
  },

  // ---- HuggingFace Chat ----
  // Selectors: textarea[placeholder*="Ask"]
  // Live page: <textarea placeholder="Ask anything" rows="1">
  {
    name: "huggingface",
    title: "HuggingFace Chat Mock",
    bgColor: "#111827",
    accent: "#ff9d00",
    font: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    greeting: "Hi! I\u2019m a HuggingFace assistant. Ask me anything.",
    msgClass: "assistant",
    inputHtml: `
      <textarea
        class="chat-input"
        placeholder="Ask anything"
        aria-label="Ask anything"
        rows="1"
      ></textarea>`,
    inputCss: `
    .chat-input {
      flex: 1; min-height: 40px; background: transparent;
      border: none; color: #f3f4f6; font-size: 1rem;
      resize: none; outline: none; font-family: inherit;
    }
    .chat-input::placeholder { color: rgba(255,255,255,0.4); }`,
    queryInput: 'textarea[placeholder*="Ask"]',
    isTextarea: true,
    prompts: [
      "My HuggingFace token: hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789",
      "Encrypt with AES key: 2b7e151628aed2a6abf7158809cf4f3c",
      "Patient John Smith, MRN: 12345678, DOB: 1990-06-15, diagnosis: diabetes",
      "Twilio SID: AC1234567890abcdef1234567890abcde\x66, Auth: abcdef123456",
      "Passport: US E12345678, visa expiry 2025-12-01, nationality Brazilian",
    ],
  },

  // ---- Poe ----
  // Selectors: textarea[class*="ChatInput"], [class*="ChatMessageInputContainer"] textarea
  {
    name: "poe",
    title: "Poe Mock",
    bgColor: "#232136",
    accent: "#6c63ff",
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    greeting: "Hello! Choose a bot or start chatting.",
    msgClass: "bot",
    containerClass: "ChatMessageInputContainer",
    inputHtml: `
      <textarea
        class="ChatInput_textArea"
        placeholder="Talk to Assistant..."
        aria-label="Message"
        rows="2"
      ></textarea>`,
    inputCss: `
    .ChatInput_textArea {
      flex: 1; min-height: 48px; background: transparent;
      border: none; color: #e0def4; font-size: 1rem;
      resize: none; outline: none; font-family: inherit;
    }
    .ChatInput_textArea::placeholder { color: rgba(255,255,255,0.35); }`,
    queryInput: 'textarea[class*="ChatInput"]',
    isTextarea: true,
    prompts: [
      "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "My credit card: 5555-5555-5555-4444 exp 12/26 CVV 123",
      "MySQL: mysql://root:admin123@db.prod.internal:3306/users",
      "Please email the contract to ceo@acmecorp.com and legal@acmecorp.com",
      "Bearer token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkw...",
    ],
  },

  // ---- Grok / x.AI ----
  // Selectors: textarea[placeholder*="Ask anything"], [data-testid="tweetTextarea_0"]
  {
    name: "grok",
    title: "Grok Mock",
    bgColor: "#15202b",
    accent: "#1d9bf0",
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    greeting: "Hey there! I\u2019m Grok. Ask me anything.",
    msgClass: "grok",
    inputHtml: `
      <textarea
        class="grok-input"
        placeholder="Ask anything..."
        data-testid="tweetTextarea_0"
        aria-label="Ask anything"
        rows="2"
      ></textarea>`,
    inputCss: `
    .grok-input {
      flex: 1; min-height: 44px; background: transparent;
      border: none; color: #e7e9ea; font-size: 1rem;
      resize: none; outline: none; font-family: inherit;
    }
    .grok-input::placeholder { color: rgba(255,255,255,0.4); }`,
    queryInput: 'textarea[placeholder*="Ask anything"]',
    isTextarea: true,
    prompts: [
      "My Bitcoin wallet: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "Terraform state has aws_access_key_id = AKIAIOSFODNN7EXAMPLE",
      "Call our office at (212) 555-0198, ext. 432, ask for John Doe",
      "OpenAI API key: sk-proj-abc123def456ghi789jkl012mno345pqr678stu901",
      "My UK NI number is AB 12 34 56 C and NHS number is 943 476 5919",
    ],
  },
];

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function generateMockPage(cfg) {
  const containerClass = cfg.containerClass ?? "input-container";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cfg.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${cfg.font};
      background: ${cfg.bgColor};
      color: #e2e2e2;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { font-size: 1.2rem; font-weight: 600; color: ${cfg.accent}; }
    .main {
      flex: 1; display: flex; flex-direction: column;
      max-width: 50rem; margin: 0 auto; padding: 1.5rem; width: 100%;
    }
    .messages { flex: 1; overflow-y: auto; }
    .message { padding: 1rem; margin-bottom: 0.5rem; border-radius: 0.75rem; }
    .message.${cfg.msgClass} { background: rgba(255,255,255,0.05); }
    .${containerClass} {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 1.5rem;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
    }
    ${cfg.inputCss}
    .send-btn {
      background: ${cfg.accent}; color: #fff; border: none;
      width: 36px; height: 36px; border-radius: 50%;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .send-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <header class="header">
    <h1>${cfg.title}</h1>
    <span>Test Environment</span>
  </header>

  <main class="main">
    <div class="messages">
      <div class="message ${cfg.msgClass}">
        <p>${cfg.greeting}</p>
      </div>
    </div>

    <div class="${containerClass}">
      ${cfg.inputHtml}
      <button class="send-btn" type="button" aria-label="Send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </button>
    </div>
  </main>

  <script>
    const input = document.querySelector('${cfg.queryInput.replace(/'/g, "\\'")}');

    const testPrompts = ${JSON.stringify(cfg.prompts, null, 6)};

    window.testPrompts = testPrompts;
    window.setPromptText = function(text) {
      ${cfg.isTextarea ? "input.value = text;" : "input.innerText = text;"}
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    window.getPromptText = function() {
      return ${cfg.isTextarea ? "input.value" : "input.innerText"};
    };
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Generate files
// ---------------------------------------------------------------------------

if (!fs.existsSync(mocksDir)) {
  fs.mkdirSync(mocksDir, { recursive: true });
}

providers.forEach(cfg => {
  const filePath = path.join(mocksDir, `${cfg.name}.html`);
  fs.writeFileSync(filePath, generateMockPage(cfg), "utf-8");
  console.log(`Generated: ${cfg.name}.html`);
});

console.log(`\nDone — ${providers.length} mock pages generated.`);
console.log("Hand-crafted mocks (chatgpt.html, claude.html) are not overwritten.");
