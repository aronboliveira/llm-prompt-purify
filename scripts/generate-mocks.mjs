#!/usr/bin/env node
/**
 * Generate mock HTML pages for testing
 * Creates test pages mimicking various LLM interfaces
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mocksDir = path.join(__dirname, "..", "src", "__tests__", "mocks");

const interfaces = [
  {
    name: "gemini",
    title: "Gemini Mock",
    bgColor: "#1e1e2e",
    accentColor: "#4285f4",
    inputType: "textarea",
  },
  {
    name: "copilot",
    title: "Copilot Mock",
    bgColor: "#1f1f1f",
    accentColor: "#0078d4",
    inputType: "textarea",
  },
  {
    name: "perplexity",
    title: "Perplexity Mock",
    bgColor: "#191a1f",
    accentColor: "#20b2aa",
    inputType: "contenteditable",
  },
];

function generateMockPage(config) {
  const isTextarea = config.inputType === "textarea";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      background: ${config.bgColor}; 
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
    .header h1 { 
      font-size: 1.2rem; 
      font-weight: 600; 
      color: ${config.accentColor}; 
    }
    .main { 
      flex: 1; 
      display: flex; 
      flex-direction: column; 
      max-width: 50rem; 
      margin: 0 auto; 
      padding: 1.5rem; 
      width: 100%; 
    }
    .messages { flex: 1; overflow-y: auto; }
    .message { padding: 1rem; margin-bottom: 0.5rem; border-radius: 0.75rem; }
    .message.assistant { background: rgba(255,255,255,0.05); }
    .input-container { 
      background: rgba(255,255,255,0.08); 
      border-radius: 1rem; 
      padding: 1rem; 
    }
    ${
      isTextarea
        ? `
    .prompt-input {
      width: 100%;
      min-height: 80px;
      background: transparent;
      border: none;
      color: #e2e2e2;
      font-size: 1rem;
      resize: none;
      outline: none;
      font-family: inherit;
    }
    .prompt-input::placeholder { color: rgba(255,255,255,0.4); }
    `
        : `
    .prompt-input {
      min-height: 80px;
      width: 100%;
      background: transparent;
      color: #e2e2e2;
      font-size: 1rem;
      outline: none;
      line-height: 1.6;
    }
    .prompt-input:empty::before { 
      content: attr(data-placeholder); 
      color: rgba(255,255,255,0.4); 
    }
    `
    }
    .send-btn { 
      background: ${config.accentColor}; 
      color: #fff; 
      border: none; 
      padding: 0.5rem 1rem; 
      border-radius: 0.5rem; 
      cursor: pointer; 
      margin-top: 0.5rem; 
    }
    .send-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <header class="header">
    <h1>${config.title}</h1>
    <span>Test Environment</span>
  </header>
  
  <main class="main">
    <div class="messages">
      <div class="message assistant">
        <p>Welcome! How can I assist you?</p>
      </div>
    </div>
    
    <div class="input-container">
      ${
        isTextarea
          ? `
      <textarea 
        id="prompt-input"
        class="prompt-input" 
        placeholder="Type your message..."
        data-testid="prompt-input"
        aria-label="Message input"
        rows="4"
      ></textarea>
      `
          : `
      <div 
        id="prompt-input"
        class="prompt-input" 
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        aria-label="Message input"
        data-placeholder="Type your message..."
        data-testid="prompt-input"
      ></div>
      `
      }
      <button class="send-btn" type="button">Send</button>
    </div>
  </main>

  <script>
    const input = document.getElementById('prompt-input');
    const isTextarea = ${isTextarea};
    
    window.setPromptText = function(text) {
      if (isTextarea) {
        input.value = text;
      } else {
        input.innerText = text;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    
    window.getPromptText = function() {
      return isTextarea ? input.value : input.innerText;
    };
    
    window.testPrompts = [
      'My credentials are user:password123',
      'JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Private key: MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKg...'
    ];
  </script>
</body>
</html>`;
}

// Ensure mocks directory exists
if (!fs.existsSync(mocksDir)) {
  fs.mkdirSync(mocksDir, { recursive: true });
}

// Generate mock pages
interfaces.forEach(config => {
  const filePath = path.join(mocksDir, `${config.name}.html`);
  const content = generateMockPage(config);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Generated: ${config.name}.html`);
});

console.log("\\nMock pages generated successfully!");
