import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Mic, Brain, Zap, Database, Rocket, CheckCircle, Play, Star, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigateHome = () => {
    navigate('/product-home');
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleGetStarted = () => {
    navigate('/signin'); // Navigate to sign up flow on signin page
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-foreground">
                LinkedIn Content Suite
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost">Features</Button>
              <Button variant="ghost">Pricing</Button>
              {user ? (
                <Button variant="outline" onClick={handleNavigateHome}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
              ) : (
                <Button variant="outline" onClick={handleSignIn}>Sign In</Button>
              )}
              <Button className="bg-primary hover:bg-primary/90" onClick={user ? handleNavigateHome : handleGetStarted}>
                {user ? 'Go to App' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-6 bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/10">
              🚀 AI-Powered Content Creation
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Turn your daily insights into
              <span className="block text-primary">
                consistent LinkedIn content
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Busy executives like you want to build their personal brand on LinkedIn but struggle with 
              consistent content creation. Our AI transforms your thoughts, meetings, and experiences 
              into professional posts in minutes, not hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-3" onClick={user ? handleNavigateHome : handleGetStarted}>
                {user ? 'Go to App' : 'Start Creating Content'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                10 minutes setup
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              The executive's LinkedIn dilemma
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              You know LinkedIn is crucial for building your personal brand, but creating consistent, 
              authentic content feels impossible with your busy schedule.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 border-2 border-destructive/20">
              <CardContent className="p-0">
                <div className="text-destructive mb-4">⏰</div>
                <h3 className="text-xl font-semibold mb-3">No Time</h3>
                <p className="text-gray-600">
                  Between meetings, decisions, and strategy sessions, finding 2 hours to craft a single LinkedIn post is nearly impossible.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 border-2 border-destructive/20">
              <CardContent className="p-0">
                <div className="text-destructive mb-4">💭</div>
                <h3 className="text-xl font-semibold mb-3">Blank Page Syndrome</h3>
                <p className="text-gray-600">
                  Staring at an empty post editor, wondering what to write about. Your thoughts are scattered across meetings and conversations.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 border-2 border-destructive/20">
              <CardContent className="p-0">
                <div className="text-destructive mb-4">🎭</div>
                <h3 className="text-xl font-semibold mb-3">Authenticity Struggle</h3>
                <p className="text-gray-600">
                  Generic business content doesn't reflect your unique insights and experiences that make you a thought leader.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-accent text-accent-foreground hover:bg-accent">
              ✨ The Solution
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              AI that knows your world
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Instead of starting with a blank page, our AI captures your insights from daily life 
              and transforms them into LinkedIn content that sounds authentically you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">From scattered thoughts to polished posts</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Voice Your Ideas</h4>
                    <p className="text-gray-600">Send voice memos via WhatsApp. AI transcribes and structures your thoughts.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Smart Processing</h4>
                    <p className="text-gray-600">AI connects insights across time, finding patterns in your experiences.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Instant Content</h4>
                    <p className="text-gray-600">Get personalized post suggestions based on your actual experiences.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-xl">
              <div className="bg-muted-foreground/5 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">Voice memo from this morning:</p>
                <p className="italic">"Had an interesting conversation with our CMO about how AI is changing customer expectations..."</p>
              </div>
              <div className="flex justify-center mb-4">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <div className="bg-accent p-4 rounded-lg">
                <p className="text-sm text-accent-foreground mb-2">Generated LinkedIn post:</p>
                <p className="font-medium">🎯 AI isn't just changing what we build—it's reshaping what customers expect from us...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to transform your thoughts into LinkedIn content
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Capture</h3>
              <p className="text-gray-600">
                Voice memos, meeting insights, interesting articles—AI collects from WhatsApp, calendar, and browser extension.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Process</h3>
              <p className="text-gray-600">
                AI analyzes, connects, and structures your insights into LinkedIn-ready content suggestions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Create</h3>
              <p className="text-gray-600">
                Collaborate with AI in real-time to refine and publish authentic posts that reflect your expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Powerful features for busy executives
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <Mic className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">🎵 Voice-to-Post</h3>
                <p className="text-gray-600">
                  Speak ideas into WhatsApp, AI creates structured LinkedIn content
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent className="p-0">
                <Brain className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">🧠 Context-Aware</h3>
                <p className="text-gray-600">
                  AI knows your industry, experiences, and writing style
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent className="p-0">
                <Zap className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">⚡ Real-time Collaboration</h3>
                <p className="text-gray-600">
                  AI suggests improvements as you write, like having a writing partner
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent className="p-0">
                <Database className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">📊 Personal Knowledge Base</h3>
                <p className="text-gray-600">
                  All your insights searchable and connected across time
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent className="p-0">
                <Rocket className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">🚀 Multi-modal Input</h3>
                <p className="text-gray-600">
                  Audio, text, links, calendar events—capture ideas anywhere
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent className="p-0">
                <Star className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">✨ Always Personalized</h3>
                <p className="text-gray-600">
                  Content based on your actual experiences and conversations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Trusted by executives worldwide
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Finally, a solution that understands my workflow. I went from struggling to post once a week to consistent daily content."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div>
                    <p className="font-semibold">Sarah Chen</p>
                    <p className="text-sm text-gray-500">CEO, TechVenture</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "The AI captures my voice perfectly. People comment that my posts sound more authentic than ever."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div>
                    <p className="font-semibold">Marcus Rodriguez</p>
                    <p className="text-sm text-gray-500">CMO, GlobalCorp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "What used to take 2 hours now takes 10 minutes. My LinkedIn engagement has increased 300%."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div>
                    <p className="font-semibold">Jennifer Walsh</p>
                    <p className="text-sm text-gray-500">VP Strategy, FinanceFirst</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform your LinkedIn presence?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of executives who never run out of content ideas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 text-lg px-8 py-3">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-3">
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/60 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">LinkedIn Content Suite</h3>
              <p className="text-muted-foreground">
                AI-powered content creation for busy executives.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Features</li>
                <li>Pricing</li>
                <li>Demo</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Help Center</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 LinkedIn Content Suite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;