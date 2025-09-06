import { type NextRequest, NextResponse } from "next/server"

const SAKARI_CONFIG = {
  clientId: "d0b4b322-c2a8-47d6-bf1e-0971a4637898",
  clientSecret: "3c03851e-f69d-49c4-b513-08c1a5de1a74",
  accountId: "68bc01c993977d9a2bb58e97",
  baseUrl: "https://api.sakari.io",
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 })
    }

    console.log("Getting OAuth2 token for Sakari API...")

    // Get OAuth2 token
    const tokenResponse = await fetch(`${SAKARI_CONFIG.baseUrl}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: SAKARI_CONFIG.clientId,
        client_secret: SAKARI_CONFIG.clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token request failed:", errorText)
      return NextResponse.json({ error: "Authentication failed", details: errorText }, { status: 401 })
    }

    const tokenData = await tokenResponse.json()
    console.log("Token acquired successfully")

    // Send SMS
    const smsEndpoint = `${SAKARI_CONFIG.baseUrl}/v1/accounts/${SAKARI_CONFIG.accountId}/messages`
    console.log("Sending SMS to:", phoneNumber)

    const smsResponse = await fetch(smsEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contacts: [
          {
            mobile: {
              number: phoneNumber,
            },
          },
        ],
        template: message,
      }),
    })

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text()
      console.error("SMS request failed:", errorText)
      return NextResponse.json({ error: "SMS sending failed", details: errorText }, { status: smsResponse.status })
    }

    const smsResult = await smsResponse.json()
    console.log("SMS sent successfully:", smsResult)

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
      data: smsResult,
    })
  } catch (error) {
    console.error("Server error:", error)
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
