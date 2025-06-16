"use client"

import { useState, useRef } from "react"

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Stop any current speech
      window.speechSynthesis.cancel()

      utteranceRef.current = new SpeechSynthesisUtterance(text)
      utteranceRef.current.rate = 0.9
      utteranceRef.current.pitch = 1
      utteranceRef.current.volume = 1

      utteranceRef.current.onstart = () => {
        setIsSpeaking(true)
      }

      utteranceRef.current.onend = () => {
        setIsSpeaking(false)
      }

      utteranceRef.current.onerror = () => {
        setIsSpeaking(false)
      }

      window.speechSynthesis.speak(utteranceRef.current)
    }
  }

  const stop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  return {
    speak,
    stop,
    isSpeaking,
  }
}
