"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Mic, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export function PricingPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const plans = [
    {
      name: "Free",
      price: 0,
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "5 conversations per month",
        "Basic pronunciation feedback",
        "Limited AI responses",
        "Mobile app access",
      ],
      buttonText: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: 19,
      period: "month",
      description: "Best for regular learners",
      features: [
        "Unlimited conversations",
        "Advanced pronunciation analysis",
        "Detailed progress tracking",
        "Priority AI responses",
        "Custom learning paths",
        "Export progress reports",
      ],
      buttonText: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Premium",
      price: 39,
      period: "month",
      description: "For serious language learners",
      features: [
        "Everything in Pro",
        "Personal AI tutor customization",
        "1-on-1 video calls with tutors",
        "Industry-specific vocabulary",
        "Advanced analytics",
        "Priority support",
        "Offline practice mode",
      ],
      buttonText: "Start Premium Trial",
      popular: false,
    },
  ]

  const handleSubscribe = async (planName: string) => {
    setIsLoading(planName)

    try {
      // This would integrate with your payment system
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          userId: user?.uid,
        }),
      })

      const { checkoutUrl } = await response.json()
      window.location.href = checkoutUrl
    } catch (error) {
      console.error("Payment error:", error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SpeakAI</span>
            </div>
          </div>
          {user && (
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Choose Your Learning Plan</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan to accelerate your English speaking skills with AI-powered practice
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? "ring-2 ring-blue-600 shadow-lg" : ""}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">Most Popular</Badge>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 mt-2">{plan.description}</CardDescription>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={isLoading === plan.name}
                >
                  {isLoading === plan.name ? "Processing..." : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Secure Payment Options</h3>
          <div className="flex justify-center items-center space-x-8 text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <span>Credit Cards</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">SSL</span>
              </div>
              <span>SSL Commerz</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">MB</span>
              </div>
              <span>Mobile Banking</span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                question: "Can I cancel my subscription anytime?",
                answer:
                  "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
              },
              {
                question: "Is there a free trial?",
                answer: "Yes! Pro and Premium plans come with a 7-day free trial. No credit card required to start.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept all major credit cards, SSL Commerz, and mobile banking options for Bangladesh users.",
              },
              {
                question: "Can I change my plan later?",
                answer: "You can upgrade or downgrade your plan at any time from your dashboard.",
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
