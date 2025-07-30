import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, signUpSchema, type SignInFormData, type SignUpFormData } from '@/lib/validationSchemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const SignIn = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();

  // Use a single form instance with dynamic schema
  const form = useForm<SignInFormData | SignUpFormData>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/product-home');
    }
  }, [user, navigate]);

  // Update form validation when switching modes
  useEffect(() => {
    form.clearErrors();
  }, [isSignUp, form]);

  const onSubmit = async (data: SignInFormData | SignUpFormData) => {
    try {
      if (isSignUp) {
        // Use our new clean signUp function
        const result = await signUp({
          email: data.email,
          password: data.password,
        });
        
        if (result.error) throw new Error(result.error);
        
        toast.success('Check your email for the confirmation link!');
        
        // Reset form and switch to sign-in mode
        form.reset({ email: '', password: '' });
        setIsSignUp(false);
      } else {
        // Use our new clean signIn function
        const result = await signIn({
          email: data.email,
          password: data.password,
        });
        
        if (result.error) throw new Error(result.error);
        
        toast.success('Welcome back!');
        navigate('/product-home');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Authentication failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Use our new clean Google sign-in function
      const result = await signInWithGoogle();
      
      if (result.error) throw new Error(result.error);
    } catch (error: any) {
      toast.error(error.message || 'Google sign in failed');
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    // Keep the current values but clear errors
    form.clearErrors();
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

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-gray-700">
                          Email address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-gray-700">
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        {isSignUp && (
                          <p className="text-xs text-gray-500 mt-1">
                            Must be 8+ characters with uppercase, lowercase, and number
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3"
                  >
                    {form.formState.isSubmitting ? 'Loading...' : (isSignUp ? 'Create account' : 'Sign in')}
                  </Button>
                </form>
              </Form>

              <div className="text-center mt-4">
                <span className="text-gray-500">or</span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full border-gray-300 py-3 mt-4"
              >
                <Chrome className="mr-2 h-4 w-4" />
                {isSignUp ? 'Sign up' : 'Sign in'} with Google
              </Button>

              <div className="text-center mt-4">
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