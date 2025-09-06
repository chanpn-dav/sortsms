import { type NextRequest, NextResponse } from "next/server"

// TextBelt API configuration - industry standard SMS service
const TEXTBELT_CONFIG = {
  baseUrl: "https://textbelt.com",
  apiKey: "9548f4a2075436f69d87e52c51333f53ac10fe35noqHoHIzMbg7feNgqRkSm2aie",
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumbers, message, fromName, sendingSpeed, isBulk } = await request.json()

    if ((!phoneNumbers && !isBulk) || !message) {
      return NextResponse.json({ error: "Phone numbers and message are required" }, { status: 400 })
    }

    // Handle bulk sending
    if (isBulk && Array.isArray(phoneNumbers)) {
      const results = []
      const delay = sendingSpeed === "fast" ? 100 : sendingSpeed === "medium" ? 500 : 1000

      for (let i = 0; i < phoneNumbers.length; i++) {
        const phoneNumber = phoneNumbers[i]

        // Add delay between sends based on speed setting
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        try {
          const cleanPhone = phoneNumber.replace(/\D/g, "")
          if (cleanPhone.length < 10) {
            results.push({ phone: phoneNumber, success: false, error: "Invalid phone number" })
            continue
          }

          const finalMessage = fromName ? `From ${fromName}: ${message}` : message

          const response = await fetch(`${TEXTBELT_CONFIG.baseUrl}/text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phone: phoneNumber,
              message: finalMessage,
              key: TEXTBELT_CONFIG.apiKey,
            }),
          })

          const result = await response.json()

          if (response.ok && result.success) {
            results.push({
              phone: phoneNumber,
              success: true,
              textId: result.textId,
              quotaRemaining: result.quotaRemaining,
            })
          } else {
            results.push({
              phone: phoneNumber,
              success: false,
              error: result.error || "Unknown error",
            })
          }
        } catch (error) {
          results.push({
            phone: phoneNumber,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      const successCount = results.filter((r) => r.success).length
      return NextResponse.json({
        success: true,
        message: `Bulk SMS completed: ${successCount}/${phoneNumbers.length} sent successfully`,
        results: results,
        summary: {
          total: phoneNumbers.length,
          successful: successCount,
          failed: phoneNumbers.length - successCount,
        },
      })
    }

    // Handle single SMS (legacy support)
    const phoneNumber = Array.isArray(phoneNumbers) ? phoneNumbers[0] : phoneNumbers
    const cleanPhone = phoneNumber.replace(/\D/g, "")
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    const finalMessage = fromName ? `From ${fromName}: ${message}` : message

    console.log("[v0] Sending SMS via TextBelt to:", phoneNumber)

    const response = await fetch(`${TEXTBELT_CONFIG.baseUrl}/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phoneNumber,
        message: finalMessage,
        key: TEXTBELT_CONFIG.apiKey,
      }),
    })

    const result = await response.json()
    console.log("[v0] TextBelt response:", result)

    if (!response.ok || !result.success) {
      return NextResponse.json(
        {
          error: "SMS sending failed",
          details: result.error || "Unknown error",
        },
        { status: response.status || 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully via TextBelt",
      data: {
        textId: result.textId,
        quotaRemaining: result.quotaRemaining,
      },
    })
  } catch (error) {
    console.error("[v0] TextBelt API error:", error)
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
