import type { Config, Context } from "@netlify/functions";

export default async function handler(
  _request: Request,
  _context: Context
): Promise<Response> {
  return new Response(
    JSON.stringify({ status: "ok", service: "feedback-api" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export const config: Config = {
  path: "/api/health",
};
