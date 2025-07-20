import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Chrome } from 'lucide-react';

const SignIn = () => {
  const [email, setEmail] = useState('');

  const handleContinue = () => {
    console.log('Continue with email:', email);
  };

  const handleGoogleSignIn = () => {
    console.log('Sign in with Google');
  };

  const handleSignUp = () => {
    console.log('Navigate to sign up');
  };

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Left Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Sign In Form */}
          <Card className="bg-white shadow-xl border-0 rounded-3xl">
            <CardContent className="p-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-full"></div>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
              <p className="text-gray-500 mb-8">Welcome back! Please enter your details.</p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-3">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder=""
                  />
                </div>

                <Button 
                  onClick={handleContinue}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
                >
                  Continue
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full h-12 border border-gray-200 hover:bg-gray-50 font-medium rounded-xl"
                >
                  <Chrome className="mr-3 h-5 w-5" />
                  Sign in with Google
                </Button>

                <div className="text-center pt-4">
                  <span className="text-gray-500">Don't have an account? </span>
                  <button
                    onClick={handleSignUp}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Blue Character */}
      <div className="flex-1 bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
        <div className="relative">
          <img
            src="/lovable-uploads/039537f1-a082-4fd3-b40f-6c1366b7de40.png"
            alt="Blue character mascot"
            className="w-80 h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;