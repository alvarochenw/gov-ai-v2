import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 120

const BASE_URL = process.env.WORKFLOW_API_BASE_URL ?? "https://kinsight.ksyun.com"
const API_KEY = process.env.AGENT_API_KEY ?? ""

/**
 * POST /api/chat/workflow
 *
 * BFF proxy that forwards the user message to the Kinsight Workflow API
 * and streams the SSE response back to the browser.
 *
 * Body JSON:
 *   { message?: string, app_id: string, document?: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message, app_id, document } = body as {
    message?: string
    app_id: string
    document?: string
  }

  if (!message?.trim() && !document) {
    return new Response(JSON.stringify({ error: "message or document is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!app_id) {
    return new Response(JSON.stringify({ error: "app_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Build the Workflow API inputs — include both query and document when provided
  const inputs: Record<string, string> = {}
  if (message?.trim()) inputs.query = message
  if (document) inputs.document = document

  const workflowPayload = {
    inputs,
    stream: true,
    stream_output: true,
  }

  const upstreamUrl = `${BASE_URL}/api/v1/kinsight-server/external/workflows/${app_id}/runs`

  let upstreamRes: Response
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "X-User-ID": "kscc-user",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowPayload),
    })
  } catch (err) {
    console.error("[/api/chat/workflow] upstream fetch error:", err)
    return new Response(
      JSON.stringify({ error: "Failed to connect to Workflow API" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!upstreamRes.ok) {
    const text = await upstreamRes.text()
    console.error("[/api/chat/workflow] upstream error:", upstreamRes.status, text)
    // Return the upstream error detail so the client can see it
    let detail = text
    try {
      const parsed = JSON.parse(text)
      detail = parsed.detail || parsed.message || text
    } catch { /* not JSON */ }
    return new Response(
      JSON.stringify({
        error: `Workflow API returned ${upstreamRes.status}`,
        detail,
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
