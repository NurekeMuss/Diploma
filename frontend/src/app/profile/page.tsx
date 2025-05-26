"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, FileText, Loader2, AlertCircle, LogOut, Save, Lock } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    phone: "",
    bio: "",
    new_password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isLoggedIn, userProfile, fetchUserProfile, updateProfile, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login")
      return
    }

    if (!userProfile) {
      setIsLoading(true)
      fetchUserProfile().finally(() => setIsLoading(false))
    } else {
      // Populate form with existing data
      setFormData({
        phone: userProfile.phone || "",
        bio: userProfile.bio || "",
        new_password: "",
      })
    }
  }, [isLoggedIn, userProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const result = await updateProfile({
        phone: formData.phone,
        bio: formData.bio,
        new_password: formData.new_password,
      })

      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        })
        // Clear password field after successful update
        setFormData((prev) => ({ ...prev, new_password: "" }))
      } else {
        setError(result.error || "Failed to update profile")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-6">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to view your profile information.</AlertDescription>
        </Alert>
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">Access Restricted</h3>
            <p className="text-muted-foreground mb-6">You need to be logged in to access your profile.</p>
            <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] text-transparent bg-clip-text">
            Profile
          </h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
            <h3 className="text-xl font-medium mb-2">Loading Profile</h3>
            <p className="text-muted-foreground">Please wait while we fetch your profile information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] text-transparent bg-clip-text">
          Profile
        </h1>
        <Button onClick={handleLogout} variant="outline" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Profile Information Card */}
      <Card className="shadow-md border-[#FF6392]/20">
        <CardHeader className="bg-card">
          <CardTitle className="flex items-center text-xl text-primary">
            <User className="mr-2 h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            {/* Profile Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="mb-4 h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] flex items-center justify-center text-white">
                <span className="text-4xl font-bold">
                  {userProfile?.name
                    ? userProfile.name
                        .split(" ")
                        .map((name: string) => name[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-center">{userProfile?.name || "User"}</h2>
              <p className="text-sm text-muted-foreground text-center">{userProfile?.email}</p>
            </div>

            {/* Profile Form */}
            <div className="space-y-6">
              <div className="grid gap-4">
                {/* Non-editable fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Name
                    </Label>
                    <Input value={userProfile?.name || ""} disabled className="bg-gray-50 dark:bg-gray-800" />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email
                    </Label>
                    <Input value={userProfile?.email || ""} disabled className="bg-gray-50 dark:bg-gray-800" />
                  </div>
                </div>

                {/* Editable fields */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    New Password (Optional)
                  </Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    placeholder="Enter new password to change it"
                    value={formData.new_password}
                    onChange={handleInputChange}
                  />
                  <p className="text-sm text-muted-foreground">Leave empty if you don't want to change your password</p>
                </div>
              </div>

              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] hover:from-[#FF6392]/90 hover:to-[#FF8A5B]/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
