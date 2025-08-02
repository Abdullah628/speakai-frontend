"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Cookies from 'js-cookie';
import { MessageCircle, TrendingUp, Clock, Target, Award, Calendar, Mic, Settings, CreditCard } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

interface UserStats {
  display_name?: string
  total_sessions: number
  average_accuracy: number
  total_minutes: number
  current_streak: number
  level: string
  nextLevelProgress: number
}


export function Dashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<UserStats>({

    total_sessions: 0,
    average_accuracy: 0,
    total_minutes: 0,
    current_streak: 0,
    level: "Beginner",
    nextLevelProgress: 0,
  })

  useEffect(() => {
    // Fetch user stats from backend
    fetchUserStats()
  }, [])


  const fetchUserStats = async () => {
    try {
      // This would connect to your FastAPI backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get('access_token')}`, // Assuming you have a token in user object
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched user stats:", data)
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Set mock data for demo
      setStats({
        total_sessions: 12,
        average_accuracy: 85,
        total_minutes: 240,
        current_streak: 5,
        level: "Intermediate",
        nextLevelProgress: 65,
      })
    }
  }

  const achievements = [
    { name: "First Conversation", icon: MessageCircle, earned: true },
    { name: "7-Day Streak", icon: Calendar, earned: true },
    { name: "90% Accuracy", icon: Target, earned: false },
    { name: "Speed Speaker", icon: Mic, earned: false },
  ]


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">SpeakAI Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.display_name?.split(" ")[0] || "Student"}!
          </h2>
          <p className="text-gray-600">Ready to continue your English practice?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/chat">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Start Practice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Begin a new conversation with your AI tutor</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                View Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Check your learning analytics and improvements</CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Customize your learning preferences</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total_sessions}</div>
              <p className="text-xs text-gray-500">+2 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.average_accuracy}%</div>
              <p className="text-xs text-green-600">+5% improvement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Practice Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.total_minutes}m</div>
              <p className="text-xs text-gray-500">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.current_streak} days</div>
              <p className="text-xs text-blue-600">Keep it up!</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-600" />
                Your Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {stats.level}
                </Badge>
                <span className="text-sm text-gray-600">{stats.nextLevelProgress}% to next level</span>
              </div>
              <Progress value={stats.nextLevelProgress || 65} className="h-3" />
              <p className="text-sm text-gray-600">Complete more practice sessions to reach the next level!</p>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      achievement.earned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <achievement.icon
                      className={`w-5 h-5 ${achievement.earned ? "text-green-600" : "text-gray-400"}`}
                    />
                    <span className={`text-sm ${achievement.earned ? "text-green-900" : "text-gray-500"}`}>
                      {achievement.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: "Today", activity: "Completed conversation practice", accuracy: 88 },
                { date: "Yesterday", activity: "Pronunciation exercise", accuracy: 92 },
                { date: "2 days ago", activity: "Grammar discussion", accuracy: 85 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.activity}</p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                  <Badge variant="outline">{item.accuracy}% accuracy</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
