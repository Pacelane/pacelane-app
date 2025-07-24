import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Chrome } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
        if (isSignUp) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/product-home`
            }
          });
          
          if (error) throw error;
          toast.success('Check your email for the confirmation link!');
        } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Google sign in failed');
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Left Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/lovable-uploads/fe97b466-2c78-4c2a-baeb-f2e13105460d.png" 
              alt="Logo" 
              className="w-8 h-8 mb-4"
            />
          </div>

           {/* Sign In Form */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {isSignUp ? 'Create account' : 'Sign in'}
              </h1>
              <p className="text-gray-600 mb-6">
                {isSignUp ? 'Get started with your free account' : 'Welcome back! Please enter your details.'}
              </p>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3"
                >
                  {loading ? 'Loading...' : (isSignUp ? 'Create account' : 'Sign in')}
                </Button>

                <div className="text-center">
                  <span className="text-gray-500">or</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full border-gray-300 py-3"
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  {isSignUp ? 'Sign up' : 'Sign in'} with Google
                </Button>

                <div className="text-center">
                  <span className="text-gray-600">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={toggleAuthMode}
                    className="text-primary hover:underline font-medium"
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Testimonial */}
          <div className="mt-8 flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/75fe1b108c00417d7dc855be81d3b2879bf7e2f0?placeholderIfAbsent=true"
                alt="Johanna Doe"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">
                "By far, the best investment I made to my career this year!"
              </p>
              <p className="text-gray-600 text-sm">
                Johanna Doe • Investor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Blue Character */}
      <div className="flex-1 bg-muted flex items-center justify-center">
        <div className="relative">
          <img
            src="/lovable-uploads/039537f1-a082-4fd3-b40f-6c1366b7de40.png"
            alt="Blue character mascot"
            className="w-96 h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;