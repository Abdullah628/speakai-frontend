"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ChatInterface } from "@/components/chat/chat-interface"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user && mounted) {
      router.push("/auth/login")
    }
  }, [user, loading, router, mounted])

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <ChatInterface />
}
