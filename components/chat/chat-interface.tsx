"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, Volume2, VolumeX, Home, User, Plus, Send, Type } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { ConfettiEffect } from "./components/confetti-effect"
import Link from "next/link"
import Cookies from "js-cookie"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  accuracy?: number
  corrections?: string[]
  isTyped?: boolean
}

export function ChatInterface() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [typedMessage, setTypedMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice")
  const [recordingTimer, setRecordingTimer] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { startListening, stopListening, transcript, isListening } = useSpeechRecognition()
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis()

  console.log("user: ", user?.id)

  useEffect(() => {
    const greeting = "Hello! I'm your AI English tutor."
    setMessages([
      {
        id: "1",
        type: "ai",
        content: greeting,
        timestamp: new Date(),
      },
    ])
    speak(greeting)
  }, [])

  useEffect(() => {
    setCurrentTranscript(transcript)
  }, [transcript])

  useEffect(() => {
    setIsAISpeaking(isSpeaking)
  }, [isSpeaking])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      setRecordingTimer(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTimer((prev) => {
          if (prev >= 20) {
            handleSendVoiceMessage()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      setRecordingTimer(0)
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const handleStartRecording = () => {
    if (isAISpeaking) {
      stopSpeaking()
    }
    setIsRecording(true)
    setCurrentTranscript("")
    startListening()
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    stopListening()
  }

  const handleSendVoiceMessage = async () => {
    if (!currentTranscript.trim()) return
    await sendMessage(currentTranscript, false)
  }

  const handleSendTypedMessage = async () => {
    if (!typedMessage.trim()) return
    await sendMessage(typedMessage, true)
    setTypedMessage("")
  }

  const sendMessage = async (content: string, isTyped: boolean) => {
    setIsLoading(true)
    setIsRecording(false)
    stopListening()

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: content,
      timestamp: new Date(),
      isTyped: isTyped,
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      // Only analyze speech for voice messages
      if (!isTyped) {
        const speechAnalysis = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/speech/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify({
            transcript: content,
            original_text: content,
          }),
        })

        const analysisData = await speechAnalysis.json()

        // Update user message with accuracy
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, accuracy: analysisData.accuracy, corrections: analysisData.corrections }
              : msg,
          ),
        )

        // Show confetti if accuracy > 80%
        if (analysisData.accuracy > 80) {
          setShowConfetti(userMessage.id)
        }
      }

      // Get AI response
      const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          message: content,
        }),
      })

      console.log("chat response: ", chatResponse)
      const chatData = await chatResponse.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: chatData.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      speak(chatData.response)
    } catch (error) {
      console.error("Error processing message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setCurrentTranscript("")
    }
  }

  const handleNewChat = () => {
    setMessages([
      {
        id: "1",
        type: "ai",
        content: "Hello! I'm your AI English tutor. Let's start a new conversation!",
        timestamp: new Date(),
      },
    ])
  }

  const getWordCount = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  const wordCount = getWordCount(typedMessage)
  const isOverLimit = wordCount > 30

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-800 relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]"></div>

      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-xl border-b border-emerald-500/20 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/10 transition-all duration-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="border-emerald-500/30 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/10 hover:border-emerald-400/50 transition-all duration-200 bg-transparent text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Chat</span>
              <span className="sm:hidden">New</span>
            </Button>

            <div className="flex items-center space-x-2 sm:space-x-3 bg-emerald-500/10 rounded-full px-2 sm:px-4 py-1 sm:py-2 backdrop-blur-sm border border-emerald-500/20">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
              </div>
              <span className="text-xs sm:text-sm text-emerald-200 font-medium max-w-20 sm:max-w-none truncate">
                {user?.displayName || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-2 sm:p-4 ">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-emerald-500/20 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-emerald-100 font-semibold">English Practice Session</span>
              {isAISpeaking && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse text-xs">
                  <Volume2 className="w-3 h-3 mr-1" />
                  AI Speaking...
                </Badge>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-[calc(100vh-380px)] sm:h-[calc(100vh-340px)] overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-emerald-600/30 scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] ${message.type === "user" ? "ml-8 sm:ml-12" : "mr-8 sm:mr-12"}`}
                >
                  {/* Message Bubble */}
                  <div className="relative">
                    <div
                      className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-lg transition-all duration-300 ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-emerald-500 to-green-400 text-white"
                          : `bg-slate-800/80 text-slate-100 border border-slate-700/50 ${
                              isAISpeaking && message.type === "ai" ? "blur-sm opacity-60" : ""
                            }`
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm leading-relaxed flex-1">{message.content}</p>
                        {message.type === "user" && (
                          <div className="ml-2 flex-shrink-0">
                            {message.isTyped ? (
                              <Type className="w-3 h-3 opacity-60" />
                            ) : (
                              <Mic className="w-3 h-3 opacity-60" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confetti Effect */}
                    {message.type === "user" && showConfetti === message.id && (
                      <ConfettiEffect show={true} onComplete={() => setShowConfetti(null)} />
                    )}
                  </div>

                  {/* Accuracy Score - Only for voice messages */}
                  {message.type === "user" && !message.isTyped && message.accuracy !== undefined && (
                    <div className="mt-2 px-3 sm:px-4 py-2 bg-slate-800/60 rounded-xl border border-emerald-500/20 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-emerald-300 font-medium">Speech Accuracy</span>
                        <span
                          className={`text-sm font-bold ${
                            message.accuracy > 80 ? "text-emerald-400" : "text-yellow-400"
                          }`}
                        >
                          {message.accuracy}%
                        </span>
                      </div>
                      <Progress value={message.accuracy} className="h-1.5 bg-slate-700/50" />
                      {message.corrections && message.corrections.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-emerald-300 font-medium mb-1">Suggestions:</p>
                          <ul className="text-xs space-y-0.5">
                            {message.corrections.map((correction, index) => (
                              <li key={index} className="text-slate-300 flex items-start">
                                <span className="text-emerald-400 mr-1 text-xs">•</span>
                                {correction}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`mt-1 text-xs text-slate-500 ${message.type === "user" ? "text-right" : "text-left"}`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-slate-800/80 text-slate-100 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border border-slate-700/50">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="mx-3 sm:mx-6 mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-300 font-medium">Recording... {20 - recordingTimer}s left</span>
                </div>
                <Button
                  onClick={handleStopRecording}
                  size="sm"
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent h-6 px-2 text-xs"
                >
                  Stop
                </Button>
              </div>
              {currentTranscript && <p className="text-sm text-emerald-100">{currentTranscript}</p>}
            </div>
          )}

          {/* Input Mode Toggle */}
          <div className="px-4 sm:px-6 py-2 border-t border-emerald-500/20 bg-slate-800/30">
            <div className="flex items-center justify-center space-x-2">
              <Button
                onClick={() => setInputMode("voice")}
                variant={inputMode === "voice" ? "default" : "ghost"}
                size="sm"
                className={`text-xs ${
                  inputMode === "voice" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-emerald-300"
                }`}
              >
                <Mic className="w-3 h-3 mr-1" />
                Voice
              </Button>
              <Button
                onClick={() => setInputMode("text")}
                variant={inputMode === "text" ? "default" : "ghost"}
                size="sm"
                className={`text-xs ${
                  inputMode === "text" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-emerald-300"
                }`}
              >
                <Type className="w-3 h-3 mr-1" />
                Type
              </Button>
            </div>
          </div>

          {/* Input Controls */}
          <div className="p-4 sm:p-6 border-t border-emerald-500/20 bg-slate-800/30">
            {inputMode === "voice" ? (
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={isRecording ? handleSendVoiceMessage : handleStartRecording}
                  disabled={isLoading || isAISpeaking}
                  className={`px-6 py-3 font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
                    isRecording
                      ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-red-500/25"
                      : "bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-black shadow-emerald-500/25"
                  }`}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {isRecording ? `Send (${20 - recordingTimer}s)` : "Tap to Speak"}
                </Button>

                {isAISpeaking && (
                  <Button
                    variant="outline"
                    onClick={stopSpeaking}
                    className="px-4 py-2 border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-400/70 rounded-xl transition-all duration-200 bg-transparent"
                  >
                    <VolumeX className="w-4 h-4 mr-2" />
                    Stop AI
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder="Type your message (max 30 words)..."
                    disabled={isLoading || isAISpeaking}
                    className={`flex-1 bg-slate-800/50 border-emerald-500/30 text-emerald-100 placeholder:text-slate-400 focus:border-emerald-400 ${
                      isOverLimit ? "border-red-500/50 focus:border-red-400" : ""
                    }`}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !isOverLimit && typedMessage.trim()) {
                        handleSendTypedMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendTypedMessage}
                    disabled={!typedMessage.trim() || isLoading || isAISpeaking || isOverLimit}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-black font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${isOverLimit ? "text-red-400" : "text-slate-400"}`}>{wordCount}/30 words</span>
                  {isAISpeaking && (
                    <Button
                      variant="outline"
                      onClick={stopSpeaking}
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-400/70 bg-transparent h-6 px-2 text-xs"
                    >
                      <VolumeX className="w-3 h-3 mr-1" />
                      Stop AI
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in { 
          animation: fade-in 0.3s ease-out; 
        }
        
        .scrollbar-thin { 
          scrollbar-width: thin; 
        }
        
        .scrollbar-thumb-emerald-600::-webkit-scrollbar-thumb {
          background-color: rgba(5, 150, 105, 0.3);
          border-radius: 9999px;
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar { 
          width: 6px; 
        }
      `}</style>
    </div>
  )
}
