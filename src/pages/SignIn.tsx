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
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sign in</h1>
              <p className="text-gray-600 mb-6">Welcome back! Please enter your details.</p>

              <div className="space-y-4">
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
                  />
                </div>

                <Button 
                  onClick={handleContinue}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3"
                >
                  Continue
                </Button>

                <div className="text-center">
                  <span className="text-gray-500">or</span>
                </div>

                <Button
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full border-gray-300 py-3"
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>

                <div className="text-center">
                  <span className="text-gray-600">Don't have an account? </span>
                  <button
                    onClick={handleSignUp}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </div>
              </div>
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