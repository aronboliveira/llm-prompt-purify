/**
 * [DEV] API Rate Limit Test — Teste de limitação de taxa na API
 *
 * Objetivo: Verificar se o rate limiter está configurado corretamente
 * em todos os endpoints críticos (feedback, mask-safety).
 *
 * Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
 */
"use strict";

const APP_URL = process.env.APP_URL || "http://127.0.0.1:5147";

/**
 * Sends N rapid requests to an endpoint and counts status codes.
 * @param {string} url
 * @param {object} options
 * @param {number} options.count - Number of requests to send
 * @param {string} options.method - HTTP method
 * @param {object|null} options.body - Request body (JSON)
 * @returns {Promise<{ total: number; statusCodes: Record<number, number>; rateLimited: number }>}
 */
async function testRateLimit(
  url,
  { count = 10, method = "POST", body = null } = {},
) {
  const statusCodes = {};
  let rateLimited = 0;

  const requests = Array.from({ length: count }, async () => {
    try {
      const opts = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) opts.body = JSON.stringify(body);

      const res = await fetch(url, opts);
      const code = res.status;
      statusCodes[code] = (statusCodes[code] || 0) + 1;
      if (code === 429) rateLimited++;
      return code;
    } catch {
      statusCodes[0] = (statusCodes[0] || 0) + 1;
      return 0;
    }
  });

  await Promise.all(requests);
  return { total: count, statusCodes, rateLimited };
}

/**
 * Tests the feedback endpoint rate limiter (expected: 5/min per IP).
 */
async function testFeedbackRateLimit() {
  const feedbackBody = {
    category: "bug",
    email: "ratelimit@test.local",
    message: "Rate limit test message",
    name: "Rate Tester",
    rating: 3,
    subject: "Rate limit probe",
    wantsReply: false,
  };

  return testRateLimit(`${APP_URL}/api/feedback`, {
    count: 10,
    body: feedbackBody,
  });
}

/**
 * Tests the mask-safety endpoint (no rate limit expected currently).
 */
async function testMaskSafetyRateLimit() {
  const validationBody = {
    candidates: [{ candidateValue: "[MASKED_001]", ruleId: "ssn" }],
  };

  return testRateLimit(`${APP_URL}/api/mask-safety/validate`, {
    count: 10,
    body: validationBody,
  });
}

async function main() {
  console.log(`[DEV] API Rate Limit Test — targeting ${APP_URL}`);

  console.log("\n--- /api/feedback (5/min rate limit) ---");
  const feedback = await testFeedbackRateLimit();
  console.log(`  Status codes: ${JSON.stringify(feedback.statusCodes)}`);
  if (feedback.rateLimited > 0) {
    console.log(
      `  ✓ Rate limiter active: ${feedback.rateLimited}/${feedback.total} blocked`,
    );
  } else {
    console.warn("  ⚠ Rate limiter NOT triggered after 10 rapid requests!");
  }

  console.log("\n--- /api/mask-safety/validate ---");
  const maskSafety = await testMaskSafetyRateLimit();
  console.log(`  Status codes: ${JSON.stringify(maskSafety.statusCodes)}`);

  return { feedback, maskSafety };
}

if (require.main === module) {
  main();
}

module.exports = {
  testRateLimit,
  testFeedbackRateLimit,
  testMaskSafetyRateLimit,
  main,
};
