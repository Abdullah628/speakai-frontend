"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Send, Mic } from "lucide-react"

interface VoiceTimerModalProps {
  isRecording: boolean
  onStop: () => void
  onSend: () => void
  maxDuration?: number
}

export function VoiceTimerModal({ isRecording, onStop, onSend, maxDuration = 20 }: VoiceTimerModalProps) {
  const [timeLeft, setTimeLeft] = useState(maxDuration)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (isRecording) {
      setTimeLeft(maxDuration)
      setProgress(100)

      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 0.1
          setProgress((newTime / maxDuration) * 100)

          if (newTime <= 0) {
            onSend()
            return maxDuration
          }
          return newTime
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isRecording, maxDuration, onSend])

  if (!isRecording) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-black/95 backdrop-blur-xl border-t border-emerald-500/30 p-4">
        <div className="max-w-sm mx-auto">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 font-medium text-sm">Recording...</span>
            </div>

            <div className="relative">
              
              <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/30 animate-ping"></div>
            </div>

            <div className="space-y-2">
              <div className="text-lg font-bold text-emerald-300">{Math.ceil(timeLeft)}s</div>
              <Progress value={progress} className="h-1.5 bg-emerald-950/50" />
              <p className="text-xs text-emerald-400/80">Auto-send in {Math.ceil(timeLeft)}s</p>
            </div>

            <div className="flex space-x-3 justify-center">
              <Button
                onClick={onStop}
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-400/70 bg-transparent h-8 px-3"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={onSend}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-black font-semibold h-8 px-3"
              >
                <Send className="w-3 h-3 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
