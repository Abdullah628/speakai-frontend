"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, Volume2, VolumeX, Home, User, Plus, Send, Type, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { ConfettiEffect } from "./components/confetti-effect"
import Cookies from "js-cookie"
import Link from "next/link"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  accuracy?: number
  corrections?: string[]
  isTyped?: boolean
}

export default function ChatInterface() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [showConfetti, setShowConfetti] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [typedMessage, setTypedMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice")
  const [recordingTimer, setRecordingTimer] = useState(0)
  const [showVoicePopup, setShowVoicePopup] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { startListening, stopListening, transcript, isListening } = useSpeechRecognition()
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis()
  
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
    setShowVoicePopup(true)
    setIsRecording(true)
    setCurrentTranscript("")
    startListening()
    
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    stopListening()
    setShowVoicePopup(false)
    setCurrentTranscript("")
  }

  const handleSendVoiceMessage = async () => {
    if (!currentTranscript.trim()) return
    setShowVoicePopup(false);
    setIsRecording(false)
    setIsLoading(true)
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: currentTranscript,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      // For conversation mode, we analyze grammar/fluency using the same text
      // For pronunciation practice, we would need a different approach
      // const originalText = currentTranscript // In conversation mode, we can't predict what user should say
      const originalTextData = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/acc`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 
          Authorization: `Bearer ${Cookies.get("access_token")}`
         },
        body: JSON.stringify({
          message: currentTranscript,
        }),
      })
      const originalText = await originalTextData.json()

      // Analyze speech accuracy
      const speechAnalysis = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/speech/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" ,
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          transcript: currentTranscript, // What user actually said
          original_text: originalText.response, // What user was supposed to say (same in conversation mode)
        }),
      })

      const analysisData = await speechAnalysis.json()
      console.log("Speech analysis data:", analysisData)

      // Update user message with accuracy
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, accuracy: analysisData.accuracy, corrections: analysisData.corrections }
            : msg,
        ),
      )

      // Get AI response
      const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 
          Authorization: `Bearer ${Cookies.get("access_token")}`
         },
        body: JSON.stringify({
          message: currentTranscript,
        }),
      })

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
        console.log("Speech analysis data:", analysisData)

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
      console.log("api endpoint: ", `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-blue-200/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
              onClick={() => window.location.href = "/dashboard"}
            >
              <Home className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Chat</span>
              <span className="sm:hidden">New</span>
            </Button>

            <div className="flex items-center space-x-2 bg-blue-50 rounded-full px-3 py-2 border border-blue-200">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-xs sm:text-sm text-blue-700 font-medium max-w-20 sm:max-w-none truncate">
                {user?.displayName || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-2 sm:p-4">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-blue-200/50 shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-200/50 bg-blue-50/50">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-blue-800 font-semibold">English Practice Session</span>
              {isAISpeaking && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 animate-pulse text-xs">
                  <Volume2 className="w-3 h-3 mr-1" />
                  AI Speaking...
                </Badge>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-[calc(100vh-320px)] sm:h-[calc(100vh-280px)] overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
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
                      className={`px-4 py-3 rounded-2xl shadow-md transition-all duration-300 ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                          : `bg-white border border-blue-100 text-gray-800 ${
                              isAISpeaking && message.type === "ai" && message.id !== "1" ? "blur-sm opacity-60" : ""
                            }`
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm leading-relaxed flex-1">{message.content}</p>
                        {message.type === "user" && (
                          <div className="ml-2 flex-shrink-0">
                            {message.isTyped ? (
                              <Type className="w-3 h-3 opacity-70" />
                            ) : (
                              <Mic className="w-3 h-3 opacity-70" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accuracy Score - Only for voice messages */}
                  {message.type === "user" && !message.isTyped && message.accuracy !== undefined && (
                    <div className="mt-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-blue-600 font-medium">Speech Accuracy</span>
                        <span
                          className={`text-sm font-bold ${
                            message.accuracy > 80 ? "text-green-600" : "text-amber-600"
                          }`}
                        >
                          {message.accuracy}%
                        </span>
                      </div>
                      <Progress value={message.accuracy} className="h-2 bg-blue-100" />
                      {message.corrections && message.corrections.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-blue-600 font-medium mb-1">Corrections:</p>
                          <ul className="text-xs space-y-0.5">
                            {message.corrections.map((correction, index) => (
                              <li key={index} className="text-gray-600 flex items-start">
                                <span className="text-blue-500 mr-1">•</span>
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
                    className={`mt-1 text-xs text-gray-500 ${message.type === "user" ? "text-right" : "text-left"}`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-blue-100 text-gray-800 px-4 py-3 rounded-2xl shadow-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Mode Toggle */}
          <div className="px-4 sm:px-6 py-3 border-t border-blue-200/50 bg-blue-50/30">
            <div className="flex items-center justify-center space-x-2">
              <Button
                onClick={() => setInputMode("voice")}
                variant={inputMode === "voice" ? "default" : "ghost"}
                size="sm"
                className={`text-xs transition-all duration-200 ${
                  inputMode === "voice" 
                    ? "bg-blue-500 text-white hover:bg-blue-600" 
                    : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                <Mic className="w-3 h-3 mr-1" />
                Voice
              </Button>
              <Button
                onClick={() => setInputMode("text")}
                variant={inputMode === "text" ? "default" : "ghost"}
                size="sm"
                className={`text-xs transition-all duration-200 ${
                  inputMode === "text" 
                    ? "bg-blue-500 text-white hover:bg-blue-600" 
                    : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                <Type className="w-3 h-3 mr-1" />
                Type
              </Button>
            </div>
          </div>

          {/* Input Controls */}
          <div className="p-4 sm:p-6 border-t border-blue-200/50 bg-white/50">
            {inputMode === "voice" ? (
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={handleStartRecording}
                  disabled={isLoading || isAISpeaking}
                  className="px-6 py-3 font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Tap to Speak
                </Button>

                {isAISpeaking && (
                  <Button
                    variant="outline"
                    onClick={() => setIsAISpeaking(false)}
                    className="px-4 py-2 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all duration-200"
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
                    className={`flex-1 bg-white border-blue-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 ${
                      isOverLimit ? "border-red-300 focus:border-red-400 focus:ring-red-200" : ""
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
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${isOverLimit ? "text-red-500" : "text-gray-500"}`}>{wordCount}/30 words</span>
                  {isAISpeaking && (
                    <Button
                      variant="outline"
                      onClick={() => setIsAISpeaking(false)}
                      size="sm"
                      className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 h-6 px-2 text-xs"
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

      {/* Voice Recording Popup */}
      {showVoicePopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={handleStopRecording}></div>
          <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 w-full max-w-md border-t border-blue-200 animate-slide-up">
            <div className="flex flex-col items-center space-y-4">
              {/* Timer */}
              <div className={`text-3xl font-bold ${recordingTimer >= 15 ? "text-red-500" : "text-blue-600"}`}>
                0:{recordingTimer.toString().padStart(2, '0')}
              </div>
              
              {/* Recording indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Recording...</span>
              </div>

              {/* Transcript */}
              {currentTranscript && (
                <div className="w-full p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-gray-700 text-center">{currentTranscript}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center space-x-4 pt-2">
                <Button
                  onClick={handleStopRecording}
                  variant="outline"
                  size="lg"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-full w-14 h-14 p-0"
                >
                  <X className="w-6 h-6" />
                </Button>
                <Button
                  onClick={handleSendVoiceMessage}
                  disabled={!currentTranscript.trim()}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full w-14 h-14 p-0 disabled:opacity-50"
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        .animate-fade-in { 
          animation: fade-in 0.3s ease-out; 
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}