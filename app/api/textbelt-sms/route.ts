import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message, apiKey } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 })
    }

    console.log("Sending SMS via TextBelt to:", phoneNumber)

    // Use 'textbelt' for one free SMS per day, or provide your own API key
    const key = apiKey || "textbelt"

    const response = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phoneNumber,
        message: message,
        key: key,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      console.error("TextBelt SMS failed:", result)
      return NextResponse.json(
        {
          error: "SMS sending failed",
          details: result.error || "Unknown error",
        },
        { status: response.status },
      )
    }

    console.log("SMS sent successfully via TextBelt:", result)

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully via TextBelt",
      data: result,
    })
  } catch (error) {
    console.error("TextBelt server error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
