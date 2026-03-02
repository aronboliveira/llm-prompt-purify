# Project Purpose and Scope

## Inferred purpose

`LLM Prompt Purify` is intended to be a client-side privacy layer for people who write prompts for hosted LLMs. The core promise is:

- inspect a prompt locally in the browser
- detect sensitive data before the user sends it to an external AI service
- generate masks so the user can share a safer version of the prompt
- support multiple languages and, eventually, direct usage on LLM websites through the Chromium extension

## What is actually implemented today

- An Angular web UI centered on one large prompt textarea and a scan button.
- A large multilingual regex dictionary in `src/app/libs/vars/dictionaries.ts`.
- A modal table that proposes mask values and lets the user manually keep, remove, or regenerate them.
- A Chromium extension content script in `chromium-extension/app/content.js`.
- Session storage for the current prompt and generated masks.

## Current product reality

The repo already communicates a strong privacy product narrative, but the shipped behavior is closer to a prototype or rules-engine experiment than a finished prompt-sanitization product.

The most important gap is this: the project markets "protection" and "local filtering", but the current flow is still heavily manual and contains defects that can return or copy the original unmasked text.

## Product definition I would use going forward

If this project is to reduce user friction and failed results, its product definition should be narrowed to:

> "A deterministic local prompt sanitizer that produces a safe-to-copy masked prompt in one click, with optional review details."

That framing is tighter than the current README claims and matches the strongest part of the repo: local detection plus masking.
