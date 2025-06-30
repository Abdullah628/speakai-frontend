"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Send, Volume2, VolumeX, Home, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import Link from "next/link"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  accuracy?: number
  corrections?: string[]
}

export function ChatInterface() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { startListening, stopListening, transcript, isListening } = useSpeechRecognition()
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis()

  console.log("user: ", user?.uid)

  useEffect(() => {
    // Initial AI greeting
    const greeting =
      "Hello! I'm your AI English tutor. Let's start practicing! Tell me about your day or ask me anything you'd like to discuss."
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

  const handleSendMessage = async () => {
    if (!currentTranscript.trim()) return

    setIsLoading(true)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: currentTranscript,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      //Analyze speech accuracy
      const speechAnalysis = await fetch("/api/speech/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: currentTranscript,
          originalText: currentTranscript,
          userId: user?.uid,
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

      // Get AI response
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentTranscript,
          userId: user?.uid,
        }),
      })

      console.log("chat response: ", chatResponse)

      const chatData = await chatResponse.json()

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: chatData.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // Speak AI response
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              English Practice
            </h1>
          </div>
          <div className="flex items-center space-x-3 bg-slate-700/30 rounded-full px-4 py-2 backdrop-blur-sm">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-slate-300 font-medium">{user?.displayName || user?.email}</span>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto p-4 relative z-10">
        <Card className="h-[calc(100vh-200px)] flex flex-col bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="pb-4 border-b border-slate-700/30">
            <CardTitle className="flex items-center justify-between">
              <span className="text-slate-100 font-bold text-lg">AI English Tutor</span>
              {isAISpeaking && (
                <Badge
                  variant="secondary"
                  className="animate-pulse bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border-purple-500/30"
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  AI Speaking...
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-6">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-6 mb-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl shadow-lg transition-all duration-300 ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/25"
                        : "bg-slate-700/50 text-slate-100 border border-slate-600/30 backdrop-blur-sm"
                    }`}
                  >
                    <p className={`leading-relaxed ${isAISpeaking && message.type === "ai" ? "opacity-50" : ""}`}>
                      {message.content}
                    </p>

                    {message.type === "user" && message.accuracy !== undefined && (
                      <div className="mt-4 space-y-3 p-3 bg-black/20 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-200 font-medium">Accuracy Score</span>
                          <span className="font-bold text-white text-lg">{message.accuracy}%</span>
                        </div>
                        <Progress value={message.accuracy} className="h-2 bg-slate-800/50" />

                        {message.corrections && message.corrections.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-semibold mb-2 text-purple-200">Suggestions:</p>
                            <ul className="text-sm space-y-1">
                              {message.corrections.map((correction, index) => (
                                <li key={index} className="text-purple-100 flex items-start">
                                  <span className="text-purple-400 mr-2">•</span>
                                  {correction}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-slate-700/50 text-slate-100 p-4 rounded-2xl border border-slate-600/30 backdrop-blur-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Current Transcript */}
            {currentTranscript && (
              <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl backdrop-blur-sm animate-fade-in">
                <p className="text-sm text-amber-300 mb-2 font-medium">Your speech:</p>
                <p className="text-slate-100 leading-relaxed">{currentTranscript}</p>
              </div>
            )}

            {/* Voice Controls */}
            <div className="flex items-center justify-center space-x-6 p-6 bg-slate-700/30 rounded-2xl backdrop-blur-sm border border-slate-600/30">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className={`w-20 h-20 rounded-full transition-all duration-300 shadow-lg ${
                  isRecording
                    ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-500/25 animate-pulse scale-110"
                    : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-purple-500/25 hover:scale-105"
                }`}
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onTouchStart={handleStartRecording}
                onTouchEnd={handleStopRecording}
                disabled={isLoading || isAISpeaking}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </Button>

              <Button
                onClick={handleSendMessage}
                disabled={!currentTranscript.trim() || isLoading || isAISpeaking}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 mr-2" />
                Send
              </Button>

              {isAISpeaking && (
                <Button
                  variant="outline"
                  onClick={stopSpeaking}
                  className="px-6 py-3 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200"
                >
                  <VolumeX className="w-4 h-4 mr-2" />
                  Stop AI
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center mt-4 font-medium">
              Hold the microphone button to record, release to stop
            </p>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background-color: rgb(71 85 105);
          border-radius: 9999px;
        }
        
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background-color: rgb(30 41 59);
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
      `}</style>
    </div>
  )
}
