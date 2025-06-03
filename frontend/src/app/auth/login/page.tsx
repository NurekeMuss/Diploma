"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Mail, Lock, LogIn, CheckCircle, RefreshCw, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      errors.password = "Password is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleResendVerification = async () => {
    setIsResendingEmail(true)
    setResendMessage(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendMessage("Verification email sent successfully! Please check your inbox.")
      } else {
        setResendMessage(data.detail || "Failed to send verification email")
      }
    } catch (err) {
      setResendMessage("Failed to send verification email. Please try again.")
    } finally {
      setIsResendingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setShowVerificationPrompt(false)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.password)

      if (result.success) {
        // Успешный логин - перенаправляем на главную
        router.push("/")
      } else {
        // Проверяем, является ли ошибка связанной с верификацией
        if (result.error?.includes("verify your email") || result.error?.includes("verification")) {
          setShowVerificationPrompt(true)
          setError(null)
        } else {
          setError(result.error || "Login failed")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Если нужно показать экран верификации
  if (showVerificationPrompt) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-[#FF6392]/20">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Email Verification Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">Please verify your email address before logging in.</p>
                <p className="text-sm text-muted-foreground">We sent a verification link to:</p>
                <p className="font-medium text-[#FF6392]">{formData.email}</p>
              </div>

              {resendMessage && (
                <Alert
                  className={
                    resendMessage.includes("successfully") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }
                >
                  <CheckCircle
                    className={`h-4 w-4 ${resendMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}
                  />
                  <AlertDescription
                    className={resendMessage.includes("successfully") ? "text-green-800" : "text-red-800"}
                  >
                    {resendMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  disabled={isResendingEmail}
                  className="w-full bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] hover:from-[#FF6392]/90 hover:to-[#FF8A5B]/90"
                >
                  {isResendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={() => setShowVerificationPrompt(false)} className="w-full">
                  Back to Login
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Check your spam folder if you don't see the email.</p>
                <p className="mt-2">
                  Need help?{" "}
                  <Link href="/support" className="text-[#FF6392] hover:underline">
                    Contact Support
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] text-transparent bg-clip-text">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card className="shadow-lg border-[#FF6392]/20">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={validationErrors.email ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {validationErrors.email && <p className="text-sm text-red-500">{validationErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={validationErrors.password ? "border-red-500 pr-10" : "pr-10"}
                    disabled={isLoading}
                  />
                  {formData.password && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  )}
                </div>
                {validationErrors.password && <p className="text-sm text-red-500">{validationErrors.password}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] hover:from-[#FF6392]/90 hover:to-[#FF8A5B]/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Create one
                </Link>
              </div>

              <div className="text-center">
                <Link href="/" className="text-sm text-muted-foreground hover:underline">
                  Back to Dashboard
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
