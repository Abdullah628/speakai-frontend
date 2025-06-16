import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { transcript, originalText, userId } = await req.json()

    // This will connect to your FastAPI backend for speech analysis
    const response = await fetch(`${process.env.BACKEND_URL}/api/speech/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        original_text: originalText,
        user_id: userId,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to analyze speech")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Speech analysis API error:", error)
    return NextResponse.json({ error: "Failed to analyze speech" }, { status: 500 })
  }
}
