"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithRedirect,
  signInWithPopup,  
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile,
  reload,
  getRedirectResult 
} from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  sendEmailVerification: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     setUser(user)
  //     setLoading(false)
  //   })

  //   return unsubscribe
  // }, [])

  useEffect(() => {
  const checkRedirect = async () => {
    try {
      const result = await getRedirectResult(auth)
      if (result?.user) {
        setUser(result.user)
      }
    } catch (error) {
      console.error("Redirect sign-in failed", error)
    }
  }

  checkRedirect()

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user)
    setLoading(false)
  })

  return unsubscribe
}, [])

  // const signInWithGoogle = async () => {
  //   const provider = new GoogleAuthProvider()
  //   await signInWithPopup(auth, provider)
  // }

  const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()

  if (typeof window !== 'undefined' && window.innerWidth < 500) {
    // On mobile, use redirect for better UX
    await signInWithRedirect(auth, provider)
  } else {
    // On desktop, use popup
    await signInWithPopup(auth, provider)
  }
}

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Update the user's display name
    await updateProfile(userCredential.user, {
      displayName: name,
    })

    // Send email verification
    await firebaseSendEmailVerification(userCredential.user)
  }

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const sendEmailVerification = async () => {
    if (auth.currentUser) {
      await firebaseSendEmailVerification(auth.currentUser)
    }
  }

  const refreshUser = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser)
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendEmailVerification,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
export {AuthContext}