import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>

        <div className="flex gap-4">
          <Link href="/auth/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Register</Button>
          </Link>
        </div>
      </div>

      <Card className="w-full bg-white shadow-lg border-[#B4BEC9]/20">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="text-2xl">Getting Started</CardTitle>
          <CardDescription className="text-white/90">
            Follow these instructions to make the most of our platform
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-foreground">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Welcome to Your Dashboard</h3>
            <p>This is your central hub for managing all your activities. Here's how to get started:</p>

            <div className="grid gap-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-primary font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Create an account</h4>
                  <p className="text-sm text-muted-foreground">
                    Click the Register button above to create a new account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-primary font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Log in to your account</h4>
                  <p className="text-sm text-muted-foreground">Use the Login button to access your dashboard.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-primary font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Explore the sidebar</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the navigation menu on the left to access different sections of the application.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-primary font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Complete your profile</h4>
                  <p className="text-sm text-muted-foreground">Visit the Profile section to update your information.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-accent rounded-lg">
              <p className="text-sm font-medium">
                Need help? Contact our support team through the Help section in the sidebar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

