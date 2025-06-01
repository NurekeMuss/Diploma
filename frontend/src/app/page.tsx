/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Rocket,
  Zap,
  Trophy,
  Crown,
} from "lucide-react"

export default function Home() {
  const { isLoggedIn, userProfile, fetchUserProfile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
      if (!isLoggedIn) {
        router.push("/auth/login")
        return
      }
      if (!userProfile) {
        setIsLoading(true)
        fetchUserProfile().finally(() => setIsLoading(false))
      }
    }, [isLoggedIn, userProfile])

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] text-transparent bg-clip-text">
          Dashboard
        </h1>

        <div className="flex gap-4 items-center">
          {(isLoggedIn && userProfile) || localStorage.getItem("token") ? (
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-sm px-3"
              onClick={() => router.push("/profile")}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] flex items-center justify-center text-white font-bold text-xs">
                {userProfile?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <span>{userProfile?.name.split(" ")[0]}</span>
            </Button>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <Card className="w-full bg-white shadow-lg border-[#FF6392]/20">
        <CardHeader className="bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] text-primary-foreground rounded-t-lg">
          <CardTitle className="text-2xl flex items-center">
            <Crown className="mr-2 h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription className="text-white/90">
            Follow these instructions to make the most of our platform
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-foreground">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Welcome to Your Dashboard</h3>
            <p>This is your central hub for managing all your activities. Here's how to get started:</p>

            <div className="grid gap-4 mt-6">
              <Step
                icon={<Rocket className="h-4 w-4" />}
                title="Create an account"
                description="Click the Register button above to create a new account."
              />
              <Step
                icon={<Zap className="h-4 w-4" />}
                title="Log in to your account"
                description="Use the Login button to access your dashboard."
              />
              <Step
                icon={<Sparkles className="h-4 w-4" />}
                title="Explore the sidebar"
                description="Use the navigation menu on the left to access different sections of the application."
              />
              <Step
                icon={<Trophy className="h-4 w-4" />}
                title="Complete your profile"
                description="Visit the Profile section to update your information."
              />
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-[#FF6392]/10">
              <p className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-2 text-[#FF8A5B]" />
                Need help? Contact our support team through the Help section in the sidebar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Step({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] text-white font-bold">
        {icon}
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
