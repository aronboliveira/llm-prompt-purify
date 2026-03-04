"use strict";
(() => {
  // src/constants.ts
  var CONFIG = Object.freeze({
    SCAN_INTERVAL_MS: 800,
    FADE_DELAY_MS: 2500,
    MAX_PROMPT_LENGTH: 5e3,
    MAX_DETECTIONS_PREVIEW: 5,
    DEBOUNCE_MS: 300,
    TOAST_ID: "llm-purify-toast-root",
    SUGGESTIONS_ID: "llm-purify-suggestions-root",
    HINT_ID: "llm-purify-hint-root",
    QUICKBAR_ID: "llm-purify-quickbar-root"
  });
  var PATTERNS = Object.freeze({
    // Common patterns (language-agnostic)
    EMAIL: {
      regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      label: "Email",
      mask: "[EMAIL]"
    },
    PHONE: {
      regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      label: "Phone",
      mask: "[PHONE]"
    },
    SSN: { regex: /\b\d{3}-\d{2}-\d{4}\b/g, label: "SSN", mask: "[SSN]" },
    CREDIT_CARD: {
      regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
      label: "Credit Card",
      mask: "[CARD-XXXX]"
    },
    // API Keys & Secrets
    API_KEY: {
      regex: /\b(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?\b/gi,
      label: "API Key",
      mask: "[API_KEY]"
    },
    AWS_KEY: {
      regex: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,
      label: "AWS Key",
      mask: "[AWS_KEY]"
    },
    AWS_SECRET: {
      regex: /\baws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*[A-Za-z0-9/+=]{40}\b/gi,
      label: "AWS Secret",
      mask: "[AWS_SECRET]"
    },
    GITHUB_PAT: {
      regex: /\bgh[pous]_[A-Za-z0-9]{36,}\b/g,
      label: "GitHub Token",
      mask: "[GITHUB_TOKEN]"
    },
    GITLAB_PAT: {
      regex: /\bglpat-[A-Za-z0-9]{20}\b/g,
      label: "GitLab Token",
      mask: "[GITLAB_TOKEN]"
    },
    SLACK_TOKEN: {
      regex: /\bxox[baprs]-[A-Za-z0-9-]{10,48}\b/g,
      label: "Slack Token",
      mask: "[SLACK_TOKEN]"
    },
    STRIPE_KEY: {
      regex: /\b[sr]k_(?:live|test)_[A-Za-z0-9]{24,}\b/g,
      label: "Stripe Key",
      mask: "[STRIPE_KEY]"
    },
    GOOGLE_API: {
      regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
      label: "Google API Key",
      mask: "[GOOGLE_API_KEY]"
    },
    SENDGRID_KEY: {
      regex: /\bSG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}\b/g,
      label: "SendGrid Key",
      mask: "[SENDGRID_KEY]"
    },
    TWILIO_SID: {
      regex: /\bAC[a-f0-9]{32}\b/g,
      label: "Twilio SID",
      mask: "[TWILIO_SID]"
    },
    OPENAI_KEY: {
      regex: /\bsk-[A-Za-z0-9]{48}\b/g,
      label: "OpenAI Key",
      mask: "[OPENAI_KEY]"
    },
    ANTHROPIC_KEY: {
      regex: /\bsk-ant-[A-Za-z0-9\-]{40,}\b/g,
      label: "Anthropic Key",
      mask: "[ANTHROPIC_KEY]"
    },
    // Crypto & Security
    JWT: {
      regex: /\beyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]+\b/g,
      label: "JWT Token",
      mask: "[JWT]"
    },
    PRIVATE_KEY: {
      regex: /-----BEGIN\s(?:RSA|EC|OPENSSH|DSA)?\s?PRIVATE KEY-----/gi,
      label: "Private Key",
      mask: "[PRIVATE_KEY]"
    },
    PEM_CERT: {
      regex: /-----BEGIN\sCERTIFICATE-----/gi,
      label: "Certificate",
      mask: "[CERTIFICATE]"
    },
    BITCOIN_ADDR: {
      regex: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/g,
      label: "Bitcoin Address",
      mask: "[BTC_ADDR]"
    },
    ETH_ADDR: {
      regex: /\b0x[a-fA-F0-9]{40}\b/g,
      label: "Ethereum Address",
      mask: "[ETH_ADDR]"
    },
    // Personal Identifiers
    UUID: {
      regex: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      label: "UUID",
      mask: "[UUID]"
    },
    MAC_ADDR: {
      regex: /\b(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}\b/gi,
      label: "MAC Address",
      mask: "[MAC_ADDR]"
    },
    IPV4: {
      regex: /\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b/g,
      label: "IP Address",
      mask: "[IP_ADDR]"
    },
    // Brazil
    CPF: {
      regex: /\b\d{3}[.\-]?\d{3}[.\-]?\d{3}[\-]?\d{2}\b/g,
      label: "CPF",
      mask: "[CPF]"
    },
    CNPJ: {
      regex: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
      label: "CNPJ",
      mask: "[CNPJ]"
    },
    // Spain/Latin America
    DNI: { regex: /\b\d{8}[A-Z]\b/gi, label: "DNI", mask: "[DNI]" },
    NIE: { regex: /\b[XYZ]\d{7}[A-Z]\b/gi, label: "NIE", mask: "[NIE]" },
    CURP_MX: {
      regex: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/g,
      label: "CURP",
      mask: "[CURP]"
    },
    // Banking
    IBAN: {
      regex: /\b[A-Z]{2}\d{2}[\s\-]?(?:[A-Z0-9]{4}[\s\-]?){2,7}[A-Z0-9]{1,4}\b/gi,
      label: "IBAN",
      mask: "[IBAN]"
    },
    SWIFT: {
      regex: /\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
      label: "SWIFT Code",
      mask: "[SWIFT]"
    },
    // URLs with credentials
    URL_WITH_CREDS: {
      regex: /\b(?:https?|ftp):\/\/[^:]+:[^@]+@[^\s]+\b/gi,
      label: "URL with Credentials",
      mask: "[URL_REDACTED]"
    },
    // Connection strings
    CONNECTION_STRING: {
      regex: /\b(?:mongodb|postgres|mysql|redis):\/\/[^\s]+:[^\s]+@[^\s]+\b/gi,
      label: "Connection String",
      mask: "[DB_CONNECTION]"
    },
    // Passwords in context
    PASSWORD_CONTEXT: {
      regex: /\b(?:password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]{6,}['"]?\b/gi,
      label: "Password",
      mask: "[PASSWORD]"
    }
  });
  var INPUT_SELECTORS = Object.freeze([
    // ChatGPT / OpenAI
    "#prompt-textarea",
    '[data-testid="prompt-textarea"]',
    'form textarea[tabindex="0"]',
    // Claude / Anthropic
    '.ProseMirror[contenteditable="true"]',
    '[data-placeholder="How can Claude help you today?"]',
    // DeepSeek
    "#chat-input",
    '[data-testid="chat-input"]',
    // Gemini / Bard
    'rich-textarea[aria-label*="Enter a prompt"]',
    '[aria-label*="Enter a prompt"] textarea',
    'textarea[aria-label*="prompt"]',
    // Copilot / Bing
    "#searchbox",
    'textarea[id*="copilot"]',
    "cib-serp textarea",
    // Perplexity
    'textarea[placeholder*="Ask anything"]',
    'textarea[placeholder*="ask anything"]',
    // Poe
    'textarea[class*="ChatInput"]',
    '[class*="ChatMessageInputContainer"] textarea',
    // HuggingFace Chat
    'textarea[placeholder*="Ask"]',
    // Mistral
    '[data-testid="chat-input-textarea"]',
    // You.com
    'textarea[placeholder*="Ask me anything"]',
    // Character.AI
    'textarea[placeholder*="Message"]',
    // Grok / x.AI
    'textarea[placeholder*="Ask anything"]',
    '[data-testid="tweetTextarea_0"]',
    // Inflection Pi
    'textarea[placeholder*="Talk with Pi"]',
    // Cohere Coral
    'textarea[placeholder*="message"]',
    // Generic fallbacks
    '[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"][data-lexical-editor="true"]',
    'textarea[aria-label*="chat"]',
    'textarea[aria-label*="Chat"]',
    'textarea[aria-label*="message"]',
    'textarea[aria-label*="Message"]',
    '[data-placeholder*="message"]',
    '[data-placeholder*="Message"]'
  ]);
  var ICONS = Object.freeze({
    warning: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
    close: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>',
    eye: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>',
    copy: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    check: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    shield: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    x: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  });

  // src/utils.ts
  var $ = (sel, ctx = document) => ctx.querySelector(sel);
  var hashString = (str) => {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i) | 0;
    }
    return hash;
  };
  var debounce = (fn, delay) => {
    let timer = null;
    const debounced = (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn(...args);
      }, delay);
    };
    debounced.cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    return debounced;
  };
  var escapeHtml = (() => {
    const el = document.createElement("span");
    return (text) => {
      el.textContent = text;
      return el.innerHTML;
    };
  })();
  var isVisible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
  };
  var createElement = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === void 0) continue;
      if (k === "className" && typeof v === "string") el.className = v;
      else if (k === "dataset" && typeof v === "object")
        Object.assign(el.dataset, v);
      else if ((k.startsWith("aria") || k.startsWith("data-")) && typeof v === "string") {
        el.setAttribute(k.replace(/([A-Z])/g, "-$1").toLowerCase(), v);
      } else if ((k === "textContent" || k === "innerHTML") && typeof v === "string") {
        el[k] = v;
      } else if (typeof v === "string") el.setAttribute(k, v);
    }
    children.forEach((c) => {
      if (c)
        el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  };
  var getInputText = (el) => {
    if (!el) return "";
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return el.value || "";
    }
    return el.innerText || el.textContent || "";
  };

  // src/detection.ts
  var detectSensitiveData = (text) => {
    const results = [];
    const seen = /* @__PURE__ */ new Set();
    const entries = Object.entries(PATTERNS);
    for (let i = 0, len = entries.length; i < len; i++) {
      const [key, { regex, label, mask }] = entries[i];
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const value = match[0];
        const posKey = `${match.index}:${value}`;
        if (!seen.has(posKey)) {
          seen.add(posKey);
          results.push({
            type: key,
            label,
            mask,
            value,
            start: match.index,
            end: match.index + value.length
          });
        }
      }
    }
    return results.sort((a, b) => a.start - b.start);
  };
  var generateMasks = (detection) => {
    const { type, value, mask } = detection;
    const suggestions = [mask];
    switch (type) {
      case "EMAIL": {
        const [local, domain] = value.split("@");
        if (local && domain) {
          suggestions.push(`[EMAIL:${domain}]`, `${local[0]}***@${domain}`);
        }
        break;
      }
      case "PHONE": {
        const digits = value.replace(/\D/g, "");
        if (digits.length >= 4) {
          suggestions.push(`[PHONE:XXX-XXX-${digits.slice(-4)}]`);
        }
        break;
      }
      case "CREDIT_CARD":
        suggestions.push(`[CARD:****-****-****-${value.slice(-4)}]`);
        break;
      case "CPF":
      case "DNI":
      case "SSN":
        suggestions.push(`[${type}:***${value.slice(-3)}]`);
        break;
      case "IPV4":
        suggestions.push("[IP:xxx.xxx.xxx.xxx]", "[INTERNAL_IP]");
        break;
    }
    return suggestions;
  };

  // src/content.ts
  if (window.__LLM_PURIFY_LOADED__) {
    throw new Error("LLM Purify already loaded");
  }
  window.__LLM_PURIFY_LOADED__ = true;
  var state = {
    toastEl: null,
    suggestionsEl: null,
    hintEl: null,
    quickbarEl: null,
    lastText: "",
    lastTextHash: 0,
    detections: [],
    isSubtle: false,
    fadeTimeout: null,
    inputRef: null,
    observer: null,
    scanIntervalId: null,
    abortController: null
  };
  var createToast = () => {
    if (state.toastEl) return state.toastEl;
    const toast = createElement("aside", {
      id: CONFIG.TOAST_ID,
      className: "llm-purify-toast",
      role: "alertdialog",
      "aria-live": "polite",
      "aria-atomic": "true",
      "aria-labelledby": "llm-purify-toast-title",
      "aria-describedby": "llm-purify-toast-desc",
      "aria-hidden": "true",
      tabindex: "-1"
    });
    toast.innerHTML = `
    <header class="llm-purify-toast-header">
      <h2 id="llm-purify-toast-title" class="llm-purify-toast-title">
        ${ICONS.warning}
        <span>Sensitive Data Detected</span>
      </h2>
      <button type="button" class="llm-purify-toast-close" aria-label="Dismiss notification" data-action="close">
        ${ICONS.close}
      </button>
    </header>
    <div id="llm-purify-toast-desc" class="llm-purify-toast-body">
      <p class="llm-purify-toast-message">
        Your prompt contains <strong class="llm-purify-detected-count" aria-live="polite">0</strong> sensitive item(s) that may be exposed.
      </p>
      <ul class="llm-purify-detected-preview" role="list" aria-label="Detected sensitive data types"></ul>
    </div>
    <footer class="llm-purify-toast-actions">
      <button type="button" class="llm-purify-btn llm-purify-btn-primary" data-action="masks" aria-expanded="false" aria-controls="${CONFIG.SUGGESTIONS_ID}">
        ${ICONS.eye}
        <span>View Masks</span>
      </button>
      <button type="button" class="llm-purify-btn llm-purify-btn-ghost" data-action="dismiss">
        Dismiss
      </button>
    </footer>
  `;
    toast.addEventListener("click", handleToastClick, { passive: true });
    toast.addEventListener("keydown", handleToastKeydown);
    document.body.appendChild(toast);
    state.toastEl = toast;
    return toast;
  };
  var createSuggestionsPanel = () => {
    if (state.suggestionsEl) return state.suggestionsEl;
    const panel = createElement("section", {
      id: CONFIG.SUGGESTIONS_ID,
      className: "llm-purify-suggestions",
      role: "dialog",
      "aria-labelledby": "llm-purify-suggestions-title",
      "aria-hidden": "true",
      "aria-modal": "false",
      tabindex: "-1"
    });
    panel.innerHTML = `
    <header class="llm-purify-suggestions-header">
      <h3 id="llm-purify-suggestions-title" class="llm-purify-suggestions-title">Suggested Masks</h3>
      <button type="button" class="llm-purify-toast-close" aria-label="Close suggestions panel" data-action="close-suggestions">
        ${ICONS.close}
      </button>
    </header>
    <div class="llm-purify-suggestions-list" role="list" aria-label="List of mask suggestions"></div>
  `;
    panel.addEventListener("click", handleSuggestionsClick, { passive: false });
    panel.addEventListener("keydown", handleSuggestionsKeydown);
    document.body.appendChild(panel);
    state.suggestionsEl = panel;
    return panel;
  };
  var createHintBar = () => {
    if (state.hintEl) return state.hintEl;
    const hint = createElement("div", {
      id: CONFIG.HINT_ID,
      className: "llm-purify-hint",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true"
    });
    hint.innerHTML = `
    <span class="llm-purify-hint-icon">${ICONS.warning}</span>
    <span class="llm-purify-hint-text">Sensitive data</span>
    <span class="llm-purify-hint-count">0</span>
    <span class="llm-purify-hint-keys">
      <kbd class="llm-purify-key llm-purify-key-accept">Tab</kbd>
      <span class="llm-purify-key-action">view</span>
      <kbd class="llm-purify-key llm-purify-key-reject">Esc</kbd>
      <span class="llm-purify-key-action">hide</span>
    </span>
  `;
    document.body.appendChild(hint);
    state.hintEl = hint;
    return hint;
  };
  var createQuickbar = () => {
    if (state.quickbarEl) return state.quickbarEl;
    const bar = createElement("div", {
      id: CONFIG.QUICKBAR_ID,
      className: "llm-purify-quickbar",
      role: "toolbar",
      "aria-label": "Quick actions for detected sensitive data"
    });
    bar.innerHTML = `
    <button type="button" class="llm-purify-qb-btn llm-purify-qb-accept" data-action="qb-accept" title="Accept: Apply all masks">
      ${ICONS.shield}
      <span>Mask All</span>
      <kbd class="llm-purify-qb-key">Tab</kbd>
    </button>
    <button type="button" class="llm-purify-qb-btn llm-purify-qb-view" data-action="qb-view" title="View masks">
      ${ICONS.eye}
      <span>View</span>
      <kbd class="llm-purify-qb-key">V</kbd>
    </button>
    <button type="button" class="llm-purify-qb-btn llm-purify-qb-reject" data-action="qb-reject" title="Dismiss warning">
      ${ICONS.x}
      <span>Ignore</span>
      <kbd class="llm-purify-qb-key">Esc</kbd>
    </button>
  `;
    bar.addEventListener("click", handleQuickbarClick, { passive: true });
    document.body.appendChild(bar);
    state.quickbarEl = bar;
    return bar;
  };
  function handleToastClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "close" || action === "dismiss") hideToast();
    else if (action === "masks") toggleSuggestions();
  }
  function handleToastKeydown(e) {
    if (e.key === "Escape") hideToast();
  }
  function handleSuggestionsClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    e.preventDefault();
    const action = btn.dataset.action;
    if (action === "close-suggestions") {
      hideSuggestions();
    } else if (action === "copy") {
      const mask = btn.dataset.mask;
      if (!mask) return;
      navigator.clipboard.writeText(mask).then(() => {
        btn.innerHTML = `${ICONS.check}<span>Copied!</span>`;
        btn.setAttribute("aria-label", "Copied to clipboard");
        setTimeout(() => {
          btn.innerHTML = `${ICONS.copy}<span>Copy</span>`;
          btn.setAttribute("aria-label", "Copy mask to clipboard");
        }, 1500);
      }).catch(() => {
        btn.textContent = "Failed";
      });
    }
  }
  function handleSuggestionsKeydown(e) {
    if (e.key === "Escape") hideSuggestions();
  }
  function handleQuickbarClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "qb-accept") applyAllMasks();
    else if (action === "qb-view") showSuggestions();
    else if (action === "qb-reject") dismissAll();
  }
  function applyAllMasks() {
    const input = state.inputRef?.deref();
    if (!input || state.detections.length === 0) return;
    let text = getInputText(input);
    const sorted = [...state.detections].sort((a, b) => b.start - a.start);
    sorted.forEach((d) => {
      text = text.slice(0, d.start) + d.mask + text.slice(d.end);
    });
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.value = text;
      input.dispatchEvent(
        new InputEvent("input", { bubbles: true, inputType: "insertText" })
      );
    } else if (input.isContentEditable) {
      input.textContent = text;
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    state.detections = [];
    state.lastText = text;
    state.lastTextHash = hashString(text);
    dismissAll();
    requestAnimationFrame(() => input.focus());
  }
  function dismissAll() {
    hideToast();
    hideHint();
    hideQuickbar();
  }
  function showToast(detections) {
    const toast = createToast();
    const countEl = toast.querySelector(".llm-purify-detected-count");
    if (countEl) countEl.textContent = String(detections.length);
    const preview = toast.querySelector(".llm-purify-detected-preview");
    if (preview) {
      const frag = document.createDocumentFragment();
      detections.slice(0, CONFIG.MAX_DETECTIONS_PREVIEW).forEach((d) => {
        const li = createElement("li", {
          className: "llm-purify-detected-tag",
          title: d.value,
          role: "listitem"
        });
        li.textContent = d.label;
        frag.appendChild(li);
      });
      if (detections.length > CONFIG.MAX_DETECTIONS_PREVIEW) {
        const more = createElement("li", {
          className: "llm-purify-detected-tag llm-purify-tag-more",
          role: "listitem"
        });
        more.textContent = `+${detections.length - CONFIG.MAX_DETECTIONS_PREVIEW} more`;
        frag.appendChild(more);
      }
      preview.replaceChildren(frag);
    }
    requestAnimationFrame(() => {
      toast.classList.add("show");
      toast.classList.remove("subtle");
      toast.setAttribute("aria-hidden", "false");
      toast.classList.add("pulse");
      setTimeout(() => toast.classList.remove("pulse"), 600);
    });
    showHint(detections.length);
    showQuickbar();
    state.isSubtle = false;
    if (state.fadeTimeout) clearTimeout(state.fadeTimeout);
    state.fadeTimeout = setTimeout(() => {
      if (toast.classList.contains("show")) {
        toast.classList.add("subtle");
        state.isSubtle = true;
      }
    }, CONFIG.FADE_DELAY_MS);
  }
  function hideToast() {
    if (!state.toastEl) return;
    state.toastEl.classList.remove("show", "subtle");
    state.toastEl.setAttribute("aria-hidden", "true");
    hideSuggestions();
    if (state.fadeTimeout) {
      clearTimeout(state.fadeTimeout);
      state.fadeTimeout = null;
    }
  }
  function showSuggestions() {
    const panel = createSuggestionsPanel();
    const list = panel.querySelector(".llm-purify-suggestions-list");
    if (!list) return;
    const frag = document.createDocumentFragment();
    state.detections.forEach((detection, idx) => {
      const masks = generateMasks(detection);
      const item = createElement("article", {
        className: "llm-purify-suggestion-item",
        role: "listitem",
        "aria-labelledby": `mask-type-${idx}`
      });
      const truncatedValue = detection.value.length > 30 ? `${detection.value.slice(0, 30)}...` : detection.value;
      item.innerHTML = `
      <div id="mask-type-${idx}" class="llm-purify-suggestion-type">${escapeHtml(detection.label)}</div>
      <div class="llm-purify-suggestion-original" aria-label="Original value">${escapeHtml(truncatedValue)}</div>
      <span class="llm-purify-suggestion-arrow" aria-hidden="true">\u2193</span>
      ${masks.map(
        (m, mi) => `
        <div class="llm-purify-suggestion-masked" aria-label="Suggested mask ${mi + 1}">${escapeHtml(m)}</div>
        <button type="button" class="llm-purify-copy-btn" data-action="copy" data-mask="${escapeHtml(m)}" aria-label="Copy mask to clipboard">
          ${ICONS.copy}<span>Copy</span>
        </button>
      `
      ).join("")}
    `;
      frag.appendChild(item);
    });
    list.replaceChildren(frag);
    requestAnimationFrame(() => {
      panel.classList.add("show");
      panel.setAttribute("aria-hidden", "false");
      const masksBtn = state.toastEl?.querySelector('[data-action="masks"]');
      if (masksBtn) masksBtn.setAttribute("aria-expanded", "true");
      panel.focus();
    });
  }
  function hideSuggestions() {
    if (!state.suggestionsEl) return;
    state.suggestionsEl.classList.remove("show");
    state.suggestionsEl.setAttribute("aria-hidden", "true");
    const masksBtn = state.toastEl?.querySelector('[data-action="masks"]');
    if (masksBtn) masksBtn.setAttribute("aria-expanded", "false");
  }
  function toggleSuggestions() {
    if (state.suggestionsEl?.classList.contains("show")) hideSuggestions();
    else showSuggestions();
  }
  function showHint(count) {
    const hint = createHintBar();
    const countEl = hint.querySelector(".llm-purify-hint-count");
    if (countEl) countEl.textContent = String(count);
    requestAnimationFrame(() => hint.classList.add("show"));
  }
  function hideHint() {
    state.hintEl?.classList.remove("show");
  }
  function showQuickbar() {
    const bar = createQuickbar();
    const input = state.inputRef?.deref();
    if (input) {
      const rect = input.getBoundingClientRect();
      bar.style.bottom = `${window.innerHeight - rect.top + 8}px`;
      bar.style.right = "16px";
    } else {
      bar.style.bottom = "100px";
      bar.style.right = "16px";
    }
    requestAnimationFrame(() => bar.classList.add("show"));
  }
  function hideQuickbar() {
    state.quickbarEl?.classList.remove("show");
  }
  function findInputElement() {
    for (let i = 0, len = INPUT_SELECTORS.length; i < len; i++) {
      const el = $(INPUT_SELECTORS[i]);
      if (el && isVisible(el) && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable)) {
        return el;
      }
    }
    return null;
  }
  function scanInput() {
    let input = state.inputRef?.deref();
    if (!input || !document.body.contains(input)) {
      input = findInputElement();
      state.inputRef = input ? new WeakRef(input) : null;
    }
    if (!input) return;
    const text = getInputText(input);
    const textHash = hashString(text);
    if (textHash === state.lastTextHash && text === state.lastText) return;
    if (text.length < 3) {
      if (state.detections.length > 0) {
        state.detections = [];
        hideToast();
      }
      state.lastText = text;
      state.lastTextHash = textHash;
      return;
    }
    state.lastText = text;
    state.lastTextHash = textHash;
    if (text.length > CONFIG.MAX_PROMPT_LENGTH) return;
    const detections = detectSensitiveData(text);
    state.detections = detections;
    if (detections.length > 0) {
      showToast(detections);
    } else {
      hideToast();
    }
  }
  var debouncedScan = debounce(scanInput, CONFIG.DEBOUNCE_MS);
  function init() {
    state.abortController = new AbortController();
    const { signal } = state.abortController;
    state.scanIntervalId = setInterval(scanInput, CONFIG.SCAN_INTERVAL_MS);
    document.addEventListener(
      "input",
      (e) => {
        const target = e.target;
        if (!target) return;
        for (let i = 0, len = INPUT_SELECTORS.length; i < len; i++) {
          if (target.matches?.(INPUT_SELECTORS[i])) {
            debouncedScan();
            return;
          }
        }
      },
      { capture: true, passive: true, signal }
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.altKey && e.shiftKey && e.key === "P") {
          e.preventDefault();
          if (state.toastEl?.classList.contains("show")) {
            dismissAll();
          } else if (state.detections.length > 0) {
            showToast(state.detections);
          }
          return;
        }
        if (state.hintEl?.classList.contains("show") && state.detections.length > 0) {
          const activeEl = document.activeElement;
          const isInputFocused = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable);
          if (e.key === "Tab" && isInputFocused && !e.shiftKey) {
            e.preventDefault();
            applyAllMasks();
            return;
          }
          if ((e.key === "v" || e.key === "V") && isInputFocused && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            showSuggestions();
            return;
          }
          if (e.key === "Escape") {
            dismissAll();
            return;
          }
        }
      },
      { signal }
    );
    state.observer = new MutationObserver(() => {
      const currentInput = state.inputRef?.deref();
      if (!currentInput || !document.body.contains(currentInput)) {
        state.inputRef = null;
        debouncedScan();
      }
    });
    state.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          if (state.scanIntervalId) {
            clearInterval(state.scanIntervalId);
            state.scanIntervalId = null;
          }
        } else {
          if (!state.scanIntervalId) {
            state.scanIntervalId = setInterval(
              scanInput,
              CONFIG.SCAN_INTERVAL_MS
            );
          }
        }
      },
      { signal }
    );
    console.info(
      "[LLM Prompt Purifier] v1.3.0 loaded - Tab=Mask, Esc=Dismiss, V=View, Alt+Shift+P=Toggle"
    );
  }
  function cleanup() {
    state.abortController?.abort();
    state.observer?.disconnect();
    if (state.scanIntervalId) clearInterval(state.scanIntervalId);
    if (state.fadeTimeout) clearTimeout(state.fadeTimeout);
    debouncedScan.cancel();
    state.toastEl?.remove();
    state.suggestionsEl?.remove();
    state.hintEl?.remove();
    state.quickbarEl?.remove();
    delete window.__LLM_PURIFY_LOADED__;
  }
  window.__LLM_PURIFY_CLEANUP__ = cleanup;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    requestAnimationFrame(init);
  }
})();
/**
 * LLM Prompt Purifier - Content Script Entry Point
 * Detects sensitive data in LLM chat prompts and suggests safe masks
 * @version 1.3.0
 * @license MIT
 */
//# sourceMappingURL=content.js.map
