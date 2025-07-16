"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

export function EmailVerification() {
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState("")
  const [countdown, setCountdown] = useState(0)
  const { user, sendEmailVerification, signOut } = useAuth()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleResendVerification = async () => {
    if (!user || countdown > 0) return

    setIsResending(true)
    try {
      await sendEmailVerification()
      setMessage("Verification email sent successfully!")
      setCountdown(60) // 60 second cooldown
    } catch (error) {
      console.error("Error sending verification email:", error)
      setMessage("Failed to send verification email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a verification link to <strong>{user?.email}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Please check your email and click the verification link to activate your account.
          </AlertDescription>
        </Alert>

        {message && (
          <Alert variant={message.includes("successfully") ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleResendVerification}
            disabled={isResending || countdown > 0}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? "animate-spin" : ""}`} />
            {countdown > 0 ? `Resend in ${countdown}s` : isResending ? "Sending..." : "Resend Verification Email"}
          </Button>

          <Button onClick={handleSignOut} variant="ghost" className="w-full">
            Sign in with different account
          </Button>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Didn't receive the email? Check your spam folder or try resending.</p>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to home
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
