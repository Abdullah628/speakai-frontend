declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export interface SpeechAnalysis {
  accuracy: number
  corrections: string[]
  suggestions: string[]
}

export interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  accuracy?: number
  corrections?: string[]
}
