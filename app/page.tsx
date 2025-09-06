"use client"

import type React from "react"

import { useState, useEffect } from "react"

// Phone number validation regex patterns
const phonePatterns = {
  "+1": /^[2-9]\d{2}[2-9]\d{2}\d{4}$/, // US/Canada
  "+44": /^[1-9]\d{8,9}$/, // UK
  "+33": /^[1-9]\d{8}$/, // France
  "+49": /^[1-9]\d{10,11}$/, // Germany
  "+91": /^[6-9]\d{9}$/, // India
  "+86": /^1[3-9]\d{9}$/, // China
  "+81": /^[7-9]\d{9}$/, // Japan
  "+61": /^[2-478]\d{8}$/, // Australia
  default: /^\d{7,15}$/, // Generic international
} as const

export default function SMSMailer() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message: string } | null>(null)

  // Auto-detect country code based on phone number input
  const autoDetectCountry = (input: string) => {
    const cleanInput = input.replace(/\D/g, "")

    if (cleanInput.startsWith("1") && cleanInput.length >= 4) {
      setCountryCode("+1")
    } else if (cleanInput.startsWith("44") && cleanInput.length >= 6) {
      setCountryCode("+44")
    } else if (cleanInput.startsWith("33") && cleanInput.length >= 6) {
      setCountryCode("+33")
    } else if (cleanInput.startsWith("49") && cleanInput.length >= 6) {
      setCountryCode("+49")
    } else if (cleanInput.startsWith("91") && cleanInput.length >= 6) {
      setCountryCode("+91")
    }
  }

  // Validate phone number
  const validatePhone = (phone: string, country: string) => {
    const cleanPhone = phone.replace(/\D/g, "")

    if (!cleanPhone) {
      setPhoneValidation(null)
      return false
    }

    const pattern = phonePatterns[country as keyof typeof phonePatterns] || phonePatterns.default
    const isValid = pattern.test(cleanPhone)

    setPhoneValidation({
      isValid,
      message: isValid ? `✓ Valid ${country} number` : `✗ Invalid ${country} number format`,
    })

    return isValid
  }

  // Handle phone input change
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value)
    autoDetectCountry(value)
    validatePhone(value, countryCode)
  }

  // Handle country code change
  const handleCountryChange = (country: string) => {
    setCountryCode(country)
    validatePhone(phoneNumber, country)
  }

  // Send SMS
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePhone(phoneNumber, countryCode)) {
      setStatus({ message: "Please enter a valid phone number", type: "error" })
      return
    }

    if (!message.trim()) {
      setStatus({ message: "Please enter a message", type: "error" })
      return
    }

    setIsLoading(true)
    setStatus(null)

    try {
      const fullPhoneNumber = countryCode + phoneNumber.replace(/\D/g, "")

      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          message: message.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setStatus({ message: `✅ SMS sent successfully to ${fullPhoneNumber}!`, type: "success" })

      // Reset form
      setPhoneNumber("")
      setMessage("")
      setPhoneValidation(null)
    } catch (error) {
      console.error("SMS sending failed:", error)
      setStatus({
        message: `❌ Failed to send SMS: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-hide success messages
  useEffect(() => {
    if (status?.type === "success") {
      const timer = setTimeout(() => setStatus(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const charCount = message.length
  const maxLength = 1600

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📱 SMS Mailer</h1>
          <p className="text-gray-600">Send SMS messages via Sakari.io API</p>
        </div>

        <div className="mb-5 p-3 rounded-lg text-center bg-green-50 text-green-700 border border-green-200">
          ✅ Ready to send SMS via Sakari API
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex gap-3">
              <select
                value={countryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="flex-shrink-0 w-28 px-3 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                aria-label="Country code"
              >
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+39">🇮🇹 +39</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+86">🇨🇳 +86</option>
                <option value="+81">🇯🇵 +81</option>
                <option value="+61">🇦🇺 +61</option>
              </select>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Enter phone number"
                required
                className="flex-1 px-3 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            {phoneValidation && (
              <div className={`text-xs mt-1 ${phoneValidation.isValid ? "text-green-600" : "text-red-600"}`}>
                {phoneValidation.message}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              required
              maxLength={maxLength}
              rows={4}
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-vertical"
            />
            <div
              className={`text-xs text-right mt-1 ${
                charCount > maxLength * 0.9
                  ? "text-red-500"
                  : charCount > maxLength * 0.8
                    ? "text-yellow-500"
                    : "text-gray-500"
              }`}
            >
              {charCount} / {maxLength} characters
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              "Send SMS"
            )}
          </button>
        </form>

        {status && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
            role="alert"
          >
            {status.message}
          </div>
        )}
      </div>
    </div>
  )
}
