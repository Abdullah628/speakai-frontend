import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SpeakAI - Master English with AI Conversation Practice",
  description:
    "Practice English speaking with AI-powered conversations. Get instant feedback, pronunciation correction, and personalized learning experiences.",
  keywords: "English practice, AI conversation, speech recognition, language learning, pronunciation",
  openGraph: {
    title: "SpeakAI - Master English with AI",
    description: "Practice English speaking with AI-powered conversations",
    url: "https://speakai.com",
    siteName: "SpeakAI",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpeakAI - Master English with AI",
    description: "Practice English speaking with AI-powered conversations",
    
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
