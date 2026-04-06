/**
 * [GREEN HAT] Cookie Stealer — Beginner-level script
 *
 * Objetivo: Demonstrar como cookies sem flags HttpOnly podem ser lidos
 * pelo JavaScript do navegador ou por scripts automatizados.
 *
 * Alvo: APP_URL ou http://127.0.0.1:4200 (frontend Angular)
 */
"use strict";

const APP_URL = process.env.APP_URL || "http://127.0.0.1:4200";

/**
 * Simulates reading cookies from the DOM — in a real browser, document.cookie
 * would expose any cookie missing the HttpOnly flag.
 * @param {string} cookieHeader - Raw Set-Cookie header value
 * @returns {{ name: string; value: string; httpOnly: boolean; secure: boolean }[]}
 */
function parseCookies(cookieHeader) {
  if (!cookieHeader) return [];
  const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  return cookies.map(raw => {
    const [pair, ...flags] = raw.split(";").map(s => s.trim());
    const [name, ...rest] = pair.split("=");
    const flagsLower = flags.map(f => f.toLowerCase());
    return {
      name: name.trim(),
      value: rest.join("=").trim(),
      httpOnly: flagsLower.some(f => f === "httponly"),
      secure: flagsLower.some(f => f === "secure"),
    };
  });
}

/**
 * Checks if any cookie is exposed (missing HttpOnly).
 * @param {{ httpOnly: boolean; name: string }[]} cookies
 * @returns {{ exposed: boolean; exposedNames: string[] }}
 */
function checkExposedCookies(cookies) {
  const exposedNames = cookies.filter(c => !c.httpOnly).map(c => c.name);
  return { exposed: exposedNames.length > 0, exposedNames };
}

async function main() {
  console.log(`[GREEN HAT] Cookie Stealer — targeting ${APP_URL}`);
  try {
    const res = await fetch(`${APP_URL}/api/health`);
    const setCookie = res.headers.get("set-cookie");
    const cookies = parseCookies(setCookie);
    const result = checkExposedCookies(cookies);

    if (result.exposed) {
      console.warn(
        `⚠ EXPOSED cookies (no HttpOnly): ${result.exposedNames.join(", ")}`,
      );
    } else if (cookies.length === 0) {
      console.log("✓ No cookies set by the server.");
    } else {
      console.log("✓ All cookies have HttpOnly flag.");
    }
    return result;
  } catch (err) {
    console.error(`✗ Connection failed: ${err.message}`);
    return { exposed: false, exposedNames: [], error: err.message };
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseCookies, checkExposedCookies, main };
