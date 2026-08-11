import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 120

const BASE_URL = process.env.AGENT_API_BASE_URL ?? "http://10.69.93.86:8058"
const API_KEY = process.env.AGENT_API_KEY ?? ""
const DEFAULT_AGENT_ID = process.env.AGENT_ID ?? ""

/**
 * POST /api/chat
 *
 * BFF proxy that forwards the user message to the Agent API
 * and streams the SSE response back to the browser.
 *
 * Body JSON:
 *   { message: string, session_id?: string, agent_id?: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message, session_id, agent_id } = body as {
    message: string
    session_id?: string
    agent_id?: string
  }

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const targetAgent = agent_id || DEFAULT_AGENT_ID

  // Build the form-data payload for the Agent API
  const form = new FormData()
  form.append("message", message)
  form.append("stream", "true")
  form.append("thinking_enabled", "true")
  if (session_id) {
    form.append("session_id", session_id)
  }

  // Call the Agent API
  const upstreamUrl = `${BASE_URL}/api/v1/agents/${targetAgent}/runs`

  let upstreamRes: Response
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "X-User-ID": "kscc-user",
      },
      body: form,
    })
  } catch (err) {
    console.error("[/api/chat] upstream fetch error:", err)
    return new Response(
      JSON.stringify({ error: "Failed to connect to Agent API" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!upstreamRes.ok) {
    const text = await upstreamRes.text()
    console.error("[/api/chat] upstream error:", upstreamRes.status, text)
    return new Response(
      JSON.stringify({
        error: `Agent API returned ${upstreamRes.status}`,
        detail: text,
      }),
      {
        status: upstreamRes.status,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  // Stream the SSE response through verbatim
  const contentType = upstreamRes.headers.get("content-type") ?? "text/event-stream"

  return new Response(upstreamRes.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
