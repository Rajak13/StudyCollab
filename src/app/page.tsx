/* eslint-disable react/no-unescaped-entities */
'use client'

import { FeedbackSystem } from '@/components/landing/feedback-system'
import { HeroImage } from '@/components/landing/hero-image'
import { InteractiveFAQ } from '@/components/landing/interactive-faq'
import { Navigation } from '@/components/landing/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/10 dark:from-background dark:via-primary/10 dark:to-secondary/5">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-3xl delay-1000"></div>
          <div className="absolute top-1/4 left-1/4 h-32 w-32 animate-bounce rounded-full bg-gradient-to-br from-green-400/10 to-primary/10 blur-2xl delay-500"></div>
        </div>

        <div className="container relative mx-auto px-4 py-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-card/80 px-6 py-3 text-sm font-medium text-primary backdrop-blur-sm shadow-sm">
                  <span className="mr-2 animate-bounce">🎓</span>
                  The Future of Student Productivity
                </div>
                
                <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
                  Study Smarter,{' '}
                  <span className="bg-gradient-to-r from-primary via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Together
                  </span>
                </h1>
                
                <p className="text-xl leading-relaxed text-muted-foreground md:text-2xl max-w-2xl">
                  Transform your academic journey with StudyCollab's all-in-one platform. 
                  Organize tasks, collaborate with peers, and achieve your goals with powerful tools designed for modern students.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm shadow-lg">
                <div className="text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-sm font-medium text-card-foreground">Smart Tasks</div>
                </div>
                <div className="border-x border-border text-center">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="text-sm font-medium text-card-foreground">Rich Notes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-sm font-medium text-card-foreground">Study Groups</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-primary to-purple-600 px-8 py-4 text-lg font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <span className="mr-2 transition-transform group-hover:scale-110">
                      🚀
                    </span>
                    Get Started Free
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="group border-2 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105"
                  >
                    <span className="mr-2 transition-transform group-hover:scale-110">
                      📖
                    </span>
                    Explore Features
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground lg:justify-start">
                <div className="group flex items-center gap-2">
                  <span className="text-green-500 transition-transform group-hover:scale-110">✓</span>
                  100% Free
                </div>
                <div className="group flex items-center gap-2">
                  <span className="text-green-500 transition-transform group-hover:scale-110">✓</span>
                  No Setup Required
                </div>
                <div className="group flex items-center gap-2">
                  <span className="text-green-500 transition-transform group-hover:scale-110">✓</span>
                  Open Source
                </div>
              </div>
            </div>

            {/* Right Column - Visual with hero-books.png */}
            <div className="relative">
              {/* Hero Books Image Background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20 dark:opacity-10">
                <img
                  src="/hero-books.png"
                  alt="Study Books"
                  className="w-full h-full object-contain max-w-lg"
                />
              </div>

              {/* Main dashboard mockup */}
              <div className="relative rounded-3xl border border-border bg-card/10 p-8 backdrop-blur-sm shadow-2xl">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted shadow-2xl">
                  {/* Dashboard header */}
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-3">
                      <HeroImage width={32} height={32} />
                      <span className="font-semibold text-card-foreground">StudyCollab</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-400"></div>
                      <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                      <div className="h-2 w-2 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  
                  {/* Dashboard content */}
                  <div className="p-6 space-y-4">
                    {/* Stats cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-primary/10 p-3 text-center">
                        <div className="text-lg font-bold text-primary">12</div>
                        <div className="text-xs text-primary/70">Tasks</div>
                      </div>
                      <div className="rounded-lg bg-purple-500/10 p-3 text-center">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">8</div>
                        <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Notes</div>
                      </div>
                      <div className="rounded-lg bg-green-500/10 p-3 text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">3</div>
                        <div className="text-xs text-green-600/70 dark:text-green-400/70">Groups</div>
                      </div>
                    </div>
                    
                    {/* Task list mockup */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                        <div className="h-2 flex-1 rounded bg-muted-foreground/20"></div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <div className="h-2 flex-1 rounded bg-muted-foreground/20"></div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                        <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                        <div className="h-2 flex-1 rounded bg-muted-foreground/20"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating feature badges */}
                <div className="absolute -right-6 -top-6 animate-bounce rounded-full bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-xl">
                  <span className="text-xl">📊</span>
                </div>
                <div className="absolute -bottom-6 -left-6 animate-pulse rounded-full bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white shadow-xl delay-300">
                  <span className="text-xl">🎯</span>
                </div>
                <div className="absolute -right-8 top-1/2 animate-bounce rounded-full bg-gradient-to-br from-green-500 to-green-600 p-3 text-white shadow-xl delay-700">
                  <span className="text-lg">✨</span>
                </div>
                <div className="absolute -left-8 top-1/4 animate-pulse rounded-full bg-gradient-to-br from-orange-500 to-orange-600 p-3 text-white shadow-xl delay-1000">
                  <span className="text-lg">📝</span>
                </div>
              </div>

              {/* Additional floating elements */}
              <div className="absolute top-8 right-8 animate-float rounded-lg bg-card/80 p-3 shadow-lg backdrop-blur-sm border border-border">
                <div className="text-xs font-medium text-muted-foreground">Live Collaboration</div>
                <div className="flex -space-x-2 mt-1">
                  <div className="h-6 w-6 rounded-full bg-primary border-2 border-card"></div>
                  <div className="h-6 w-6 rounded-full bg-green-500 border-2 border-card"></div>
                  <div className="h-6 w-6 rounded-full bg-purple-500 border-2 border-card"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-gradient-to-r from-primary/5 to-purple-600/5 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">
              Trusted by Students Worldwide
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Join students who are transforming their academic journey with better organization and collaboration
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="group text-center">
              <div className="rounded-2xl border border-primary/10 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-4 text-4xl transition-transform group-hover:scale-110">
                  📚
                </div>
                <div className="mb-2 text-3xl font-bold text-primary">
                  10,000+
                </div>
                <div className="text-muted-foreground">Notes Created</div>
              </div>
            </div>

            <div className="group text-center">
              <div className="rounded-2xl border border-purple-600/10 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-4 text-4xl transition-transform group-hover:scale-110">
                  ✅
                </div>
                <div className="mb-2 text-3xl font-bold text-purple-600">
                  25,000+
                </div>
                <div className="text-muted-foreground">Tasks Completed</div>
              </div>
            </div>

            <div className="group text-center">
              <div className="rounded-2xl border border-green-500/10 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-4 text-4xl transition-transform group-hover:scale-110">
                  👥
                </div>
                <div className="mb-2 text-3xl font-bold text-green-500">
                  500+
                </div>
                <div className="text-muted-foreground">Study Groups</div>
              </div>
            </div>

            <div className="group text-center">
              <div className="rounded-2xl border border-orange-500/10 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-4 text-4xl transition-transform group-hover:scale-110">
                  🎓
                </div>
                <div className="mb-2 text-3xl font-bold text-orange-500">
                  95%
                </div>
                <div className="text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">
              Everything You Need to Excel
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              From personal organization to community collaboration, StudyCollab
              provides all the tools for academic success.
            </p>
          </div>

          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-primary/5 text-center transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <CardHeader className="relative z-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 transition-all duration-500 group-hover:rotate-6 group-hover:scale-125">
                  <span className="text-3xl transition-transform group-hover:scale-110">
                    📋
                  </span>
                </div>
                <CardTitle className="text-xl transition-colors group-hover:text-primary">
                  Smart Task Management
                </CardTitle>
                <CardDescription>Never miss a deadline again</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground transition-colors group-hover:text-foreground/80">
                  Organize assignments with priorities, due dates, categories,
                  and smart notifications. View tasks in list or calendar
                  format.
                </p>
                <div className="mt-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="text-sm font-medium text-primary">
                    Learn more →
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-purple-600/5 text-center transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-purple-600/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <CardHeader className="relative z-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-600/10 transition-all duration-500 group-hover:rotate-6 group-hover:scale-125">
                  <span className="text-3xl transition-transform group-hover:scale-110">
                    📝
                  </span>
                </div>
                <CardTitle className="text-xl transition-colors group-hover:text-purple-600">
                  Rich Note Taking
                </CardTitle>
                <CardDescription>Capture knowledge beautifully</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground transition-colors group-hover:text-foreground/80">
                  Create structured notes with rich formatting, templates like
                  Cornell notes, and organize with folders and tags.
                </p>
                <div className="mt-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="text-sm font-medium text-purple-600">
                    Learn more →
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-green-500/5 text-center transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <CardHeader className="relative z-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 transition-all duration-500 group-hover:rotate-6 group-hover:scale-125">
                  <span className="text-3xl transition-transform group-hover:scale-110">
                    📚
                  </span>
                </div>
                <CardTitle className="text-xl transition-colors group-hover:text-green-500">
                  Resource Sharing
                </CardTitle>
                <CardDescription>Learn from the community</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground transition-colors group-hover:text-foreground/80">
                  Share and discover study materials, vote on quality content,
                  and engage in discussions with fellow students.
                </p>
                <div className="mt-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="text-sm font-medium text-green-500">
                    Learn more →
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-orange-500/5 text-center transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-orange-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <CardHeader className="relative z-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 transition-all duration-500 group-hover:rotate-6 group-hover:scale-125">
                  <span className="text-3xl transition-transform group-hover:scale-110">
                    👥
                  </span>
                </div>
                <CardTitle className="text-xl transition-colors group-hover:text-orange-500">
                  Study Groups
                </CardTitle>
                <CardDescription>
                  Collaborate and succeed together
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground transition-colors group-hover:text-foreground/80">
                  Create or join study groups, chat with members, and share
                  resources in dedicated group spaces.
                </p>
                <div className="mt-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="text-sm font-medium text-orange-500">
                    Learn more →
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <h3 className="mb-6 text-3xl font-bold">
                Built for Modern Students
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent p-4 transition-colors duration-300 hover:from-primary/10">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                    <span className="text-sm text-primary-foreground">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">
                      Cross-Platform Access
                    </h4>
                    <p className="text-muted-foreground">
                      Access your study materials anywhere, on any device
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 rounded-xl bg-gradient-to-r from-purple-600/5 to-transparent p-4 transition-colors duration-300 hover:from-purple-600/10">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600">
                    <span className="text-sm text-white">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">
                      Real-time Collaboration
                    </h4>
                    <p className="text-muted-foreground">
                      Work together with classmates in real-time
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 rounded-xl bg-gradient-to-r from-green-500/5 to-transparent p-4 transition-colors duration-300 hover:from-green-500/10">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                    <span className="text-sm text-white">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">
                      Smart Organization
                    </h4>
                    <p className="text-muted-foreground">
                      Intelligent suggestions for better organization
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-purple-600/10 p-8 text-center">
              <div className="mb-6 text-8xl">🎓</div>
              <h4 className="mb-4 text-3xl font-bold">
                Ready to Transform Your Studies?
              </h4>
              <p className="mb-8 text-lg text-muted-foreground">
                Join students who are already improving their academic
                performance
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-purple-600 shadow-lg transition-all duration-300 hover:from-primary/90 hover:to-purple-600/90 hover:shadow-xl"
                >
                  Start Free Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose StudyCollab Section */}
      <section className="bg-gradient-to-br from-background to-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">
              Why Students Love StudyCollab
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Discover what makes StudyCollab the perfect companion for your
              academic journey
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="group flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 transition-transform group-hover:scale-110">
                  <span className="text-xl text-white">🎯</span>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold transition-colors group-hover:text-primary">
                    Focus on What Matters
                  </h3>
                  <p className="text-muted-foreground">
                    Eliminate distractions and focus on your studies with our
                    clean, intuitive interface designed specifically for
                    students.
                  </p>
                </div>
              </div>

              <div className="group flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-600/80 transition-transform group-hover:scale-110">
                  <span className="text-xl text-white">🤝</span>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold transition-colors group-hover:text-purple-600">
                    Community-Driven Learning
                  </h3>
                  <p className="text-muted-foreground">
                    Connect with fellow students, share knowledge, and learn
                    together in a supportive academic community.
                  </p>
                </div>
              </div>

              <div className="group flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-500/80 transition-transform group-hover:scale-110">
                  <span className="text-xl text-white">🚀</span>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold transition-colors group-hover:text-green-500">
                    Boost Your Productivity
                  </h3>
                  <p className="text-muted-foreground">
                    Smart features like task prioritization, deadline reminders,
                    and progress tracking help you stay on top of your game.
                  </p>
                </div>
              </div>

              <div className="group flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-500/80 transition-transform group-hover:scale-110">
                  <span className="text-xl text-white">🌍</span>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold transition-colors group-hover:text-orange-500">
                    Built for Students Worldwide
                  </h3>
                  <p className="text-muted-foreground">
                    Designed with deep understanding of student needs and modern learning requirements, by students for students.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
                    <span className="font-medium">Today's Tasks</span>
                    <span className="font-bold text-primary">8/12</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 rounded-lg border-l-4 border-green-500 bg-green-50 p-3">
                      <div className="h-4 w-4 rounded-full bg-green-500"></div>
                      <span className="text-sm">
                        Complete Physics Assignment
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3">
                      <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Review Math Notes</span>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border-l-4 border-orange-500 bg-orange-50 p-3">
                      <div className="h-4 w-4 rounded-full bg-orange-500"></div>
                      <span className="text-sm">Group Study Session</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 text-center">
                    <div className="mb-2 text-2xl">🎉</div>
                    <p className="text-sm font-medium">Great progress today!</p>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -right-4 -top-4 flex h-8 w-8 animate-bounce items-center justify-center rounded-full bg-primary">
                <span className="text-sm text-white">✓</span>
              </div>
              <div className="absolute -bottom-4 -left-4 flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-purple-600">
                <span className="text-sm text-white">📊</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">
              Join the StudyCollab Community
            </h2>
            <p className="text-xl text-muted-foreground">
              Connect with students, share knowledge, and grow together
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-primary/5 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <CardContent className="relative z-10 pt-6 text-center">
                <div className="mb-4 text-4xl">🤝</div>
                <h3 className="mb-4 text-xl font-semibold">Collaborative Learning</h3>
                <p className="text-muted-foreground">
                  Work together with fellow students in study groups, share resources, and learn from each other's experiences.
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-purple-600/5 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-purple-600/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <CardContent className="relative z-10 pt-6 text-center">
                <div className="mb-4 text-4xl">📚</div>
                <h3 className="mb-4 text-xl font-semibold">Knowledge Sharing</h3>
                <p className="text-muted-foreground">
                  Access a vast library of shared study materials, notes, and resources contributed by the community.
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-green-500/5 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-green-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <CardContent className="relative z-10 pt-6 text-center">
                <div className="mb-4 text-4xl">🎯</div>
                <h3 className="mb-4 text-xl font-semibold">Goal Achievement</h3>
                <p className="text-muted-foreground">
                  Stay motivated and achieve your academic goals with peer support, progress tracking, and accountability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <InteractiveFAQ />

      {/* Feedback System */}
      <FeedbackSystem />

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary/5 to-purple-600/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              Ready to Transform Your Academic Journey?
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-muted-foreground">
              Join students who are already using StudyCollab to organize their
              studies, collaborate with peers, and achieve academic success.
            </p>
            <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-purple-600 px-10 py-6 text-lg shadow-lg transition-all duration-300 hover:from-primary/90 hover:to-purple-600/90 hover:shadow-xl"
                >
                  Get Started for Free
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-primary/20 px-10 py-6 text-lg transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
              >
                Learn More
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • Always free • Open source
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-br from-muted/30 to-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600">
                  <span className="font-bold text-primary-foreground">SC</span>
                </div>
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                  StudyCollab
                </span>
              </div>
              <p className="mb-6 max-w-sm text-muted-foreground">
                Empowering students to achieve academic excellence through
                organization and collaboration. Built by students, for students.
              </p>
              <div className="flex space-x-4">
                <Link
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors hover:bg-primary/20"
                >
                  <span className="text-lg">📧</span>
                </Link>
                <Link
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors hover:bg-primary/20"
                >
                  <span className="text-lg">🐦</span>
                </Link>
                <Link
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors hover:bg-primary/20"
                >
                  <span className="text-lg">💼</span>
                </Link>
                <Link
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors hover:bg-primary/20"
                >
                  <span className="text-lg">📱</span>
                </Link>
              </div>
            </div>

            <div>
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <span className="text-lg">🚀</span>
                Product
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link
                    href="#features"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">✨</span> Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">🔗</span> Integrations
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">⚡</span> API
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">📱</span> Mobile App
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <span className="text-lg">🛟</span>
                Support
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">📚</span> Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">💬</span> Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">👥</span> Community
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">📊</span> Status
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <span className="text-lg">🏢</span>
                Company
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">ℹ️</span> About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">📝</span> Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">💼</span> Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <span className="text-sm">🔒</span> Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-primary/10 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-center text-muted-foreground md:text-left">
                &copy; 2024 StudyCollab. All rights reserved. Made with ❤️ for students worldwide
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link href="#" className="transition-colors hover:text-primary">
                  Terms
                </Link>
                <Link href="#" className="transition-colors hover:text-primary">
                  Privacy
                </Link>
                <Link href="#" className="transition-colors hover:text-primary">
                  Cookies
                </Link>
                <Link href="/admin/branding" className="transition-colors hover:text-primary">
                  🎨 Developer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}