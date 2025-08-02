import { type NextRequest, NextResponse } from "next/server"
import Cookies from "js-cookie"

export async function POST(req: NextRequest) {
  try {
    const { transcript, originalText } = await req.json();
    console.log("Received transcript:", transcript);
    console.log("Received original text:", originalText);
    
    // This will connect to your FastAPI backend for speech analysis
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/speech/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("access_token")}`
      },
      body: JSON.stringify({
        transcript,
        original_text: originalText,
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
