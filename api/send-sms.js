export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { phoneNumber, message } = req.body

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "Phone number and message are required" })
  }

  const SAKARI_CONFIG = {
    clientId: "d0b4b322-c2a8-47d6-bf1e-0971a4637898",
    clientSecret: "3c03851e-f69d-49c4-b513-08c1a5de1a74",
    accountId: "68bc01c993977d9a2bb58e97",
    baseUrl: "https://api.sakari.io",
  }

  try {
    // Get OAuth2 token
    console.log("Getting OAuth2 token...")
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
      return res.status(401).json({
        error: "Authentication failed",
        details: errorText,
      })
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
        to: phoneNumber,
        message: message,
        type: "text",
      }),
    })

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text()
      console.error("SMS request failed:", errorText)
      return res.status(smsResponse.status).json({
        error: "SMS sending failed",
        details: errorText,
      })
    }

    const smsResult = await smsResponse.json()
    console.log("SMS sent successfully:", smsResult)

    return res.status(200).json({
      success: true,
      message: "SMS sent successfully",
      data: smsResult,
    })
  } catch (error) {
    console.error("Server error:", error)
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    })
  }
}
