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

  console.log("user: ", user?.uid);

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

      console.log("chat response: ", chatResponse);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">English Practice</h1>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">{user?.displayName || user?.email}</span>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto p-4">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span>AI English Tutor</span>
              {isAISpeaking && (
                <Badge variant="secondary" className="animate-pulse">
                  <Volume2 className="w-3 h-3 mr-1" />
                  AI Speaking...
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className={`${isAISpeaking && message.type === "ai" ? "opacity-30" : ""}`}>{message.content}</p>

                    {message.type === "user" && message.accuracy !== undefined && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Accuracy Score</span>
                          <span className="font-semibold">{message.accuracy}%</span>
                        </div>
                        <Progress value={message.accuracy} className="h-2" />

                        {message.corrections && message.corrections.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">Suggestions:</p>
                            <ul className="text-sm space-y-1">
                              {message.corrections.map((correction, index) => (
                                <li key={index} className="text-blue-100">
                                  • {correction}
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
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 p-4 rounded-lg">
                    <div className="typing-indicator">
                      <span>•</span>
                      <span>•</span>
                      <span>•</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Current Transcript */}
            {currentTranscript && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Your speech:</p>
                <p className="text-gray-900">{currentTranscript}</p>
              </div>
            )}

            {/* Voice Controls */}
            <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className={`w-16 h-16 rounded-full ${isRecording ? "voice-animation" : ""}`}
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onTouchStart={handleStartRecording}
                onTouchEnd={handleStopRecording}
                disabled={isLoading || isAISpeaking}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>

              <Button
                onClick={handleSendMessage}
                disabled={!currentTranscript.trim() || isLoading || isAISpeaking}
                className="px-8"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>

              {isAISpeaking && (
                <Button variant="outline" onClick={stopSpeaking} className="px-4">
                  <VolumeX className="w-4 h-4 mr-2" />
                  Stop AI
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 text-center mt-2">
              Hold the microphone button to record, release to stop
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
