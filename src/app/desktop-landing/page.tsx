'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Calendar, FileText, Target, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DesktopLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mr-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white">StudyCollab</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Your comprehensive academic companion for collaborative learning, task management, and study success
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-6">
              Transform Your Study Experience
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Smart Task Management</h3>
                  <p className="text-slate-400">Organize assignments, deadlines, and study goals with intelligent prioritization</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Advanced Note Taking</h3>
                  <p className="text-slate-400">Create, organize, and share rich notes with multimedia support and real-time collaboration</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Study Groups & Collaboration</h3>
                  <p className="text-slate-400">Join study groups, share resources, and collaborate with peers in real-time</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Resource Management</h3>
                  <p className="text-slate-400">Discover, organize, and share academic resources, papers, and study materials</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Action Cards */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
                <CardDescription className="text-slate-300">
                  Sign in to continue your academic journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg">
                  <Link href="/login">
                    Sign In
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <p className="text-center text-slate-400 text-sm">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-red-400 hover:text-red-300 underline">
                    Sign up here
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">New to StudyCollab?</CardTitle>
                <CardDescription className="text-slate-300">
                  Join thousands of students achieving academic success
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 h-12 text-lg">
                  <Link href="/signup">
                    Create Account
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <div className="text-center text-slate-400 text-sm">
                  <p>Free to use • No credit card required</p>
                  <p className="mt-1">Start organizing your academic life today</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-white/10">
          <div className="flex items-center justify-center space-x-6 text-slate-400 text-sm">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Academic Focused</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Collaborative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
