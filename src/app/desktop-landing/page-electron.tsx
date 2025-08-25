import { ArrowRight, BookOpen, Calendar, FileText, Target, Users, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { desktopRouter } from '../../lib/desktop-router';

export default function DesktopLandingPage() {
  const handleSignIn = () => {
    console.log('Sign in clicked');
    desktopRouter.navigate('/login');
  };

  const handleSignUp = () => {
    console.log('Sign up clicked');
    desktopRouter.navigate('/signup');
  };

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
                <Button 
                  onClick={handleSignIn}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
                >
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                                  <p className="text-center text-slate-400 text-sm">
                    Don&apos;t have an account?{' '}
                  <button 
                    onClick={handleSignUp}
                    className="text-red-400 hover:text-red-300 underline"
                  >
                    Sign up here
                  </button>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Quick Start
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Get started with StudyCollab in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-xs font-bold">1</span>
                  </div>
                  <span className="text-slate-300">Create your account</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-xs font-bold">2</span>
                  </div>
                  <span className="text-slate-300">Set up your profile</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-purple-400 text-xs font-bold">3</span>
                  </div>
                  <span className="text-slate-300">Start collaborating</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-slate-400 text-sm">
            StudyCollab Desktop App - Running Standalone ✅
          </p>
        </div>
      </div>
    </div>
  );
}
