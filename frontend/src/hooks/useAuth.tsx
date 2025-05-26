"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import axios from "axios"

const BASE_URL = "http://127.0.0.1:8000"

interface UserProfile {
  name: string
  email: string
  phone?: string | null
  bio?: string | null
  _id?: string
  id?: string
}

interface AuthContextType {
  isLoggedIn: boolean
  userEmail: string | null
  userId: string | null
  userProfile: UserProfile | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  fetchUserProfile: () => Promise<void>
  updateProfile: (data: { phone?: string; bio?: string; new_password?: string }) => Promise<{
    success: boolean
    error?: string
  }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const email = localStorage.getItem("userEmail")
    const id = localStorage.getItem("userId")

    if (token && email && id) {
      setIsLoggedIn(true)
      setUserEmail(email)
      setUserId(id)
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password,
      })

      console.log("Login response:", response.data)

      const token = response.data.token || response.data.access_token || response.data.jwt
      const userId =
        response.data.user_id ||
        response.data._id ||
        response.data.id ||
        response.data.user?.id ||
        response.data.user?._id

      if (response.status === 200 || response.status === 201) {
        if (token) {
          localStorage.setItem("token", token)
        }
        localStorage.setItem("userEmail", email)
        if (userId) {
          localStorage.setItem("userId", userId.toString())
        }

        setIsLoggedIn(true)
        setUserEmail(email)
        setUserId(userId?.toString() || null)

        if (response.data.user) {
          setUserProfile(response.data.user)
        }

        return { success: true }
      }

      return { success: false, error: "Invalid response from server" }
    } catch (error) {
      console.error("Login error:", error)
      if (axios.isAxiosError(error) && error.response) {
        return { success: false, error: error.response.data?.error || error.response.data?.detail || "Login failed" }
      }
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        full_name: name,
        email,
        password,
      })

      console.log("Register response:", response.data)

      const token = response.data.token || response.data.access_token || response.data.jwt
      const userId =
        response.data.user_id ||
        response.data._id ||
        response.data.id ||
        response.data.user?.id ||
        response.data.user?._id

      if (response.status === 200 || response.status === 201) {
        if (token) {
          localStorage.setItem("token", token)
        }
        localStorage.setItem("userEmail", email)
        if (userId) {
          localStorage.setItem("userId", userId.toString())
        }

        setIsLoggedIn(true)
        setUserEmail(email)
        setUserId(userId?.toString() || null)

        if (response.data.user) {
          setUserProfile(response.data.user)
        } else {
          setUserProfile({
            name: name,
            email: email,
            phone: null,
            bio: null,
            _id: userId?.toString(),
          })
        }

        return { success: true }
      }

      return { success: false, error: "Registration failed" }
    } catch (error) {
      console.error("Register error:", error)
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || error.response.data?.detail || "Registration failed",
        }
      }
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userId")
    setIsLoggedIn(false)
    setUserEmail(null)
    setUserId(null)
    setUserProfile(null)
  }

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setUserProfile(response.data)
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout()
      }
    }
  }

  const updateProfile = async (data: { phone?: string; bio?: string; new_password?: string }): Promise<{
    success: boolean
    error?: string
  }> => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        return { success: false, error: "No authentication token found" }
      }

      // Filter out empty values
      const updateData: any = {}
      if (data.phone !== undefined && data.phone.trim() !== "") {
        updateData.phone = data.phone.trim()
      }
      if (data.bio !== undefined && data.bio.trim() !== "") {
        updateData.bio = data.bio.trim()
      }
      if (data.new_password !== undefined && data.new_password.trim() !== "") {
        updateData.new_password = data.new_password.trim()
      }

      const response = await axios.put(`${BASE_URL}/auth/profile`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 200) {
        // Update local profile data
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            phone: updateData.phone || userProfile.phone,
            bio: updateData.bio || userProfile.bio,
          })
        }
        return { success: true }
      }

      return { success: false, error: "Failed to update profile" }
    } catch (error) {
      console.error("Update profile error:", error)
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          logout()
          return { success: false, error: "Session expired. Please login again." }
        }
        return {
          success: false,
          error: error.response.data?.error || error.response.data?.detail || "Failed to update profile",
        }
      }
      return { success: false, error: "Network error. Please try again." }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userEmail,
        userId,
        userProfile,
        login,
        register,
        logout,
        fetchUserProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
