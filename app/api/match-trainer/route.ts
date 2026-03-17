import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ matches: [] }, { status: 503 })
  }

  let goals: Record<string, unknown>
  let trainers: unknown[]
  try {
    const body = await req.json()
    goals = body.goals ?? {}
    trainers = body.trainers ?? []
  } catch {
    return NextResponse.json({ matches: [] }, { status: 400 })
  }

  if (!Array.isArray(trainers) || trainers.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  const prompt = `You are a fitness trainer matching engine. A client has the following goals:
${JSON.stringify(goals, null, 2)}

Available trainers (JSON):
${JSON.stringify(trainers, null, 2)}

Return ONLY a valid JSON array of trainer IDs ranked by match quality, best first.
Include a short reason (max 12 words) for each match.
Format exactly like this (no markdown, no extra text):
[{"id": 1, "reason": "Specializes in weight loss and HIIT"}, ...]`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    )

    if (!res.ok) {
      console.error("Gemini match-trainer error:", await res.text())
      return NextResponse.json({ matches: [] }, { status: 502 })
    }

    const data = await res.json()
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"
    const clean = text.replace(/```json|```/g, "").trim()
    try {
      const matches = JSON.parse(clean)
      return NextResponse.json({ matches: Array.isArray(matches) ? matches : [] })
    } catch {
      return NextResponse.json({ matches: [] })
    }
  } catch (err) {
    console.error("match-trainer fetch error:", err)
    return NextResponse.json({ matches: [] }, { status: 502 })
  }
}
