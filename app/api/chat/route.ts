import { type NextRequest, NextResponse } from "next/server"
import Cookies from "js-cookie"

export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json()

    // This will connect to your FastAPI backend
  
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("access_token")}`
      },
      body: JSON.stringify({
        message,
        user_id: userId,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get AI response")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}
