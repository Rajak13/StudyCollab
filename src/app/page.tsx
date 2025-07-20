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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="bg-grid-pattern absolute inset-0 opacity-5"></div>
        <div className="container relative mx-auto px-4 py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                🇳🇵 Made in Nepal for Students Worldwide
              </div>
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-7xl">
                Your Academic Life,{' '}
                <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Organized
                </span>
              </h1>
              <p className="mb-8 text-xl leading-relaxed text-muted-foreground md:text-2xl">
                StudyCollab combines personal productivity with community-driven
                learning. Manage tasks, take notes, share resources, and
                collaborate with fellow students in one powerful platform.
              </p>
              <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-purple-600 px-8 py-6 text-lg shadow-lg transition-all duration-300 hover:from-primary/90 hover:to-purple-600/90 hover:shadow-xl"
                  >
                    🚀 Start Your Journey
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/20 px-8 py-6 text-lg transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  ▶️ Watch Demo
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground lg:justify-start">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Completely Free
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Open Source
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-purple-600/10 p-8 backdrop-blur-sm">
                <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-2xl">
                  <div className="text-center">
                    <div className="mb-4 text-8xl">📚</div>
                    <h3 className="mb-2 text-2xl font-bold text-gray-800">
                      StudyCollab Dashboard
                    </h3>
                    <p className="text-gray-600">Your academic companion</p>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -right-4 -top-4 animate-bounce rounded-full bg-primary p-3 text-primary-foreground shadow-lg">
                  <span className="text-xl">✨</span>
                </div>
                <div className="absolute -bottom-4 -left-4 animate-pulse rounded-full bg-purple-600 p-3 text-white shadow-lg">
                  <span className="text-xl">🎯</span>
                </div>
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
            <Card className="group border-0 bg-gradient-to-br from-white to-primary/5 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 transition-transform duration-300 group-hover:scale-110">
                  <span className="text-3xl">📋</span>
                </div>
                <CardTitle className="text-xl">Smart Task Management</CardTitle>
                <CardDescription>Never miss a deadline again</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organize assignments with priorities, due dates, categories,
                  and smart notifications. View tasks in list or calendar
                  format.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 bg-gradient-to-br from-white to-purple-600/5 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-600/10 transition-transform duration-300 group-hover:scale-110">
                  <span className="text-3xl">📝</span>
                </div>
                <CardTitle className="text-xl">Rich Note Taking</CardTitle>
                <CardDescription>Capture knowledge beautifully</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create structured notes with rich formatting, templates like
                  Cornell notes, and organize with folders and tags.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 bg-gradient-to-br from-white to-green-500/5 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 transition-transform duration-300 group-hover:scale-110">
                  <span className="text-3xl">📚</span>
                </div>
                <CardTitle className="text-xl">Resource Sharing</CardTitle>
                <CardDescription>Learn from the community</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share and discover study materials, vote on quality content,
                  and engage in discussions with fellow students.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 bg-gradient-to-br from-white to-orange-500/5 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 transition-transform duration-300 group-hover:scale-110">
                  <span className="text-3xl">👥</span>
                </div>
                <CardTitle className="text-xl">Study Groups</CardTitle>
                <CardDescription>
                  Collaborate and succeed together
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create or join study groups, chat with members, and share
                  resources in dedicated group spaces.
                </p>
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">
              Loved by Students in Nepal and Beyond
            </h2>
            <p className="text-xl text-muted-foreground">
              See what students are saying about StudyCollab
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="border-0 bg-gradient-to-br from-white to-primary/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center">
                  <div className="flex text-lg text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                  &ldquo;StudyCollab ले मेरो पढाइको तरिका नै बदलिदियो। Task
                  management र note-taking features अति राम्रो छ!&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                    <span className="text-lg font-bold">सु</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Sujata Sharma</div>
                    <div className="text-sm text-muted-foreground">
                      Computer Engineering, IOE Pulchowk
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-white to-purple-600/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center">
                  <div className="flex text-lg text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                  &ldquo;Study groups feature ले साथीहरूसँग collaborate गर्न
                  धेरै सजिलो बनायो। My grades improved significantly!&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600/20 to-purple-600/10">
                    <span className="text-lg font-bold">अ</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Arjun Thapa</div>
                    <div className="text-sm text-muted-foreground">
                      Business Studies, TU
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-white to-green-500/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center">
                  <div className="flex text-lg text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                  &ldquo;Resource sharing is a game-changer! अरू students को
                  notes र materials पाउन सकिन्छ easily।&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10">
                    <span className="text-lg font-bold">प्र</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Priya Gurung</div>
                    <div className="text-sm text-muted-foreground">
                      Psychology, KU
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <InteractiveFAQ />

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
              No credit card required • Always free • Made with ❤️ in Nepal
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
                organization and collaboration. Made in Nepal for the world.
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
                &copy; 2024 StudyCollab. All rights reserved. Made with ❤️ in
                Nepal 🇳🇵
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
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
