"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type React from "react"
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';


// import {
//   type User,
//   signInWithRedirect,
//   signInWithPopup,  
//   GoogleAuthProvider,
//   signOut as firebaseSignOut,
//   onAuthStateChanged,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   sendEmailVerification as firebaseSendEmailVerification,
//   updateProfile,
//   reload,
//   getRedirectResult 
// } from "firebase/auth"
// import { auth } from "@/lib/firebase"

// interface AuthContextType {
//   user: User | null
//   loading: boolean
//   signInWithGoogle: () => Promise<void>
//   signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
//   signInWithEmail: (email: string, password: string) => Promise<void>
//   sendEmailVerification: () => Promise<void>
//   signOut: () => Promise<void>
//   refreshUser: () => Promise<void>
// }

console.log("backend url", process.env.NEXT_PUBLIC_BACKEND_URL);

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  displayName?: string;
  display_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`
        }
      });
      console.log("Fetched user:", response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      Cookies.remove('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/user/login', { email, password });
      const { access_token } = response.data;
      console.log("Login successful, token:", access_token);
      toast.success('Login successful!');
      Cookies.set('access_token', access_token, { expires: 7 }); // 7 days
      await fetchUser();
      console.log("seted user");
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      await axios.post('/api/user/register', { username, email, password });
      toast.success('Registration successful! Please login.');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

//older code 
// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [loading, setLoading] = useState(true)

//   // useEffect(() => {
//   //   const unsubscribe = onAuthStateChanged(auth, (user) => {
//   //     setUser(user)
//   //     setLoading(false)
//   //   })

//   //   return unsubscribe
//   // }, [])

//   useEffect(() => {
//   const checkRedirect = async () => {
//     try {
//       const result = await getRedirectResult(auth)
//       if (result?.user) {
//         setUser(result.user)
//       }
//     } catch (error) {
//       console.error("Redirect sign-in failed", error)
//     }
//   }

//   checkRedirect()

//   const unsubscribe = onAuthStateChanged(auth, (user) => {
//     setUser(user)
//     setLoading(false)
//   })

//   return unsubscribe
// }, [])

//   // const signInWithGoogle = async () => {
//   //   const provider = new GoogleAuthProvider()
//   //   await signInWithPopup(auth, provider)
//   // }

//   const signInWithGoogle = async () => {
//   const provider = new GoogleAuthProvider()

//   if (typeof window !== 'undefined' && window.innerWidth < 500) {
//     // On mobile, use redirect for better UX
//     await signInWithRedirect(auth, provider)
//   } else {
//     // On desktop, use popup
//     await signInWithPopup(auth, provider)
//   }
// }

//   const signUpWithEmail = async (email: string, password: string, name: string) => {
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password)

//     // Update the user's display name
//     await updateProfile(userCredential.user, {
//       displayName: name,
//     })

//     // Send email verification
//     await firebaseSendEmailVerification(userCredential.user)
//   }

//   const signInWithEmail = async (email: string, password: string) => {
//     await signInWithEmailAndPassword(auth, email, password)
//   }

//   const sendEmailVerification = async () => {
//     if (auth.currentUser) {
//       await firebaseSendEmailVerification(auth.currentUser)
//     }
//   }

//   const refreshUser = async () => {
//     if (auth.currentUser) {
//       await reload(auth.currentUser)
//     }
//   }

//   const signOut = async () => {
//     await firebaseSignOut(auth)
//   }

//   const value = {
//     user,
//     loading,
//     signInWithGoogle,
//     signUpWithEmail,
//     signInWithEmail,
//     sendEmailVerification,
//     signOut,
//     refreshUser,
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
export {AuthContext}