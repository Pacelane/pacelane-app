import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/design-system/components/Toast';
import { useAuth } from '@/hooks/api/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, signUpSchema, type SignInFormData, type SignUpFormData } from '@/api/schemas';
import { useIsMobile } from '@/hooks/use-mobile';

// Design System Components
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';
import { shadows, getShadow } from '@/design-system/tokens/shadows';
import { getResponsivePadding, getResponsiveWidth } from '@/design-system/utils/responsive';
import Logo from '@/design-system/components/Logo';
import Bichaurinho from '@/design-system/components/Bichaurinho';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import Divider from '@/design-system/components/Divider';

// Icons
import { FcGoogle } from 'react-icons/fc';

// Assets
import signinBichaurinho from '@/assets/images/signin-bichaurinho.svg';

const SignIn = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signIn, signUp, signInWithGoogle } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Use a single form instance with dynamic schema
  const form = useForm<SignInFormData | SignUpFormData>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    mode: 'onSubmit', // Only validate on submit, not on change
    reValidateMode: 'onSubmit', // Only re-validate on submit
    defaultValues: {
      email: '',
      password: '',
      ...(isSignUp && { name: '' }),
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && profile) {
      // Check if user has completed onboarding
      if (profile.onboarding_completed) {
        navigate('/product-home');
      } else {
        navigate('/onboarding/welcome');
      }
    }
  }, [user, profile, navigate]);

  // Update form validation when switching modes
  useEffect(() => {
    // Clear errors and reset with current values
    const currentValues = form.getValues();
    form.clearErrors();
    form.reset({
      email: currentValues.email || '',
      password: currentValues.password || '',
      ...(isSignUp && { name: (currentValues as any).name || '' }),
    });
  }, [isSignUp, form]);

  // Clear form when switching between Google and email
  useEffect(() => {
    if (!showEmailForm) {
      form.reset({
        email: '',
        password: '',
        ...(isSignUp && { name: '' }),
      });
      form.clearErrors();
    }
  }, [showEmailForm, isSignUp, form]);

  const onSubmit = async (data: SignInFormData | SignUpFormData) => {
    try {
      if (isSignUp) {
        // Show loading toast for sign up
        toast.info('Creating your account...');
        
        const result = await signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              display_name: (data as SignUpFormData).name
            }
          }
        });
        
        if (result.error) {
          // Handle specific Supabase errors with user-friendly messages
          let errorMessage = String(result.error);
          
          console.error('Sign-up error:', result.error);
          
          if (errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
            errorMessage = 'An account with this email already exists. Please sign in instead.';
          } else if (errorMessage.includes('Password should be at least')) {
            errorMessage = 'Password must be at least 8 characters long with uppercase, lowercase, and number.';
          } else if (errorMessage.includes('Invalid email')) {
            errorMessage = 'Please enter a valid email address.';
          } else if (errorMessage.includes('weak password') || errorMessage.includes('Password is too weak')) {
            errorMessage = 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
          } else if (errorMessage.includes('signup is disabled')) {
            errorMessage = 'Account creation is currently disabled. Please contact support.';
          } else if (errorMessage.includes('rate limit')) {
            errorMessage = 'Too many sign-up attempts. Please wait a moment and try again.';
          } else {
            // Default error handler for unexpected errors
            console.error('Unexpected sign-up error:', result.error);
            errorMessage = 'Unable to create account. Please try again or contact support if the problem persists.';
          }
          
          toast.error(errorMessage);
          return;
        }
        
        toast.success('Account created successfully!');
        
        // Navigate to onboarding flow
        navigate('/onboarding/welcome');
        
      } else {
        // Show loading toast for sign in
        toast.info('Signing you in...');
        
        const result = await signIn({
          email: data.email,
          password: data.password,
        });
        
        if (result.error) {
          // Handle specific Supabase errors with user-friendly messages
          let errorMessage = String(result.error);
          
          if (errorMessage.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (errorMessage.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
          } else if (errorMessage.includes('Too many requests')) {
            errorMessage = 'Too many login attempts. Please wait a moment and try again.';
          } else if (errorMessage.includes('Invalid email')) {
            errorMessage = 'Please enter a valid email address.';
          }
          
          toast.error(errorMessage);
          return;
        }
        
        toast.success('Welcome back!');
        // Don't navigate directly - let the auth state change listener handle onboarding validation
        // navigate('/product-home');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Enhanced error handling for different types of errors
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.name === 'NetworkError' || error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'Connection error. Please try again in a moment.';
      } else if (error.message) {
        // Log the actual error message for debugging but show a user-friendly message
        console.error('Detailed error:', error.message);
        errorMessage = 'Unable to process your request. Please try again or contact support.';
      }
      
      toast.error(errorMessage);
    }
  };

  // Handle form submission with proper error handling
  const handleFormSubmit = async () => {
    try {
      await form.handleSubmit(onSubmit)();
    } catch (error) {
      // This catches validation errors from Zod
      console.log('Validation failed - errors are shown in form fields');
      // Errors are already handled by React Hook Form and displayed in the UI
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      toast.info('Redirecting to Google...');
      
      const result = await signInWithGoogle();
      
      if (result.error) {
        let errorMessage = result.error;
        
        if (result.error.includes('popup_closed_by_user')) {
          errorMessage = 'Google sign-in was cancelled. Please try again.';
        } else if (result.error.includes('access_denied')) {
          errorMessage = 'Google sign-in access denied. Please try again.';
        } else if (result.error.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        toast.error(errorMessage);
        return;
      }
      
      // On success, let the useEffect handle the redirect based on onboarding status
      // The useEffect will check profile.onboarding_completed and redirect accordingly

    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    form.clearErrors();
    // Clear form when switching between sign in/up modes
    form.reset({
      email: '',
      password: '',
      ...((!isSignUp) && { name: '' }),
    });
  };

  // Check if form has required values and is valid for submission
  const formValues = form.watch();
  const isFormValid = (() => {
    const email = formValues.email?.trim();
    const password = formValues.password?.trim();
    const name = (formValues as any).name?.trim();

    // Basic validation: check if required fields have values
    if (!email || !password) return false;
    if (isSignUp && !name) return false;

    // Check minimum password length
    if (password.length < (isSignUp ? 8 : 6)) return false;

    // For sign-up, check additional password requirements to match schema
    if (isSignUp) {
      if (!/[A-Z]/.test(password)) return false; // At least one uppercase letter
      if (!/[a-z]/.test(password)) return false; // At least one lowercase letter
      if (!/\d/.test(password)) return false;    // At least one number
    }

    // Basic email format check (simple regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    return true;
  })();

  // Page container styles - responsive layout
  const pageContainerStyles: React.CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    position: 'relative',
    backgroundColor: colors.bg.default,
  };

  // Main column styles - responsive width and padding
  const mainColumnStyles: React.CSSProperties = {
    width: isMobile ? '100%' : '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: isMobile ? 'flex-start' : 'center',
    padding: getResponsivePadding(isMobile, 'container'),
    paddingTop: isMobile ? spacing.spacing[48] : spacing.spacing[40],
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 5,
  };

  // Content container styles - responsive width
  const contentContainerStyles = {
    ...getResponsiveWidth(isMobile, 'card'),
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: spacing.spacing[24],
  };

  // Card styles - responsive width
  const cardStyles = {
    ...getResponsiveWidth(isMobile, 'card'),
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: colors.bg.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    overflow: 'hidden' as const,
  };

  // Form container styles - main content area with responsive padding
  const formContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[24],
    padding: getResponsivePadding(isMobile, 'card'),
  };

  // Text container styles - bottom section with responsive padding
  const textContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[4],
    paddingLeft: getResponsivePadding(isMobile, 'card'),
    paddingRight: getResponsivePadding(isMobile, 'card'),
    paddingTop: spacing.spacing[24],
    paddingBottom: spacing.spacing[24],
    backgroundColor: colors.bg.card.subtle,
    borderTop: `1px solid ${colors.border.default}`,
  };

  // Right column styles (50% width)
  const rightColumnStyles = {
    width: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    zIndex: 5,
  };

  // Right column inner container styles
  const rightContainerStyles = {
    width: '100%',
    height: '100%',
    backgroundColor: primitiveColors.cyan[100], // D5EFF6 equivalent
    borderRadius: cornerRadius.borderRadius['3xl'],
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  return (
    <div style={pageContainerStyles}>
      {/* Main Column - Full width on mobile, 50% on desktop */}
      <div style={mainColumnStyles}>
        <div style={contentContainerStyles}>
          {/* Logo */}
          <Logo width={120} />

          {/* Main Card */}
          <div style={cardStyles}>
            {/* Form Container */}
            <div style={formContainerStyles}>
              {/* Heading Container */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: spacing.spacing[4] }}>
                <h1 style={{
                  ...textStyles['2xl'].semibold,
                  color: colors.text.default,
                  fontFamily: 'Awesome Serif VAR, ui-serif, Georgia, serif',
                  margin: 0
                }}>
                  {showEmailForm ? (isSignUp ? 'Sign Up with Email' : 'Sign In with Email') : (isSignUp ? 'Sign Up' : 'Sign In')}
                </h1>

                {/* Subtitle */}
                <p style={{
                  ...textStyles.sm.normal,
                  color: colors.text.muted,
                  margin: 0,
                  textAlign: 'left'
                }}>
                  {showEmailForm 
                    ? (isSignUp ? 'Create your account with email and password' : 'Sign in with your email and password')
                    : (isSignUp ? 'Get started with your free account' : 'Welcome back! Sign in to continue.')
                  }
                </p>
              </div>

              {/* Form Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20], width: '100%' }}>
                {!showEmailForm ? (
                  <>
                    {/* Google Sign In Button - Secondary Action */}
                    <div style={{ width: '100%' }}>
                      <Button
                        label={`${isSignUp ? 'Sign Up' : 'Sign In'} with Google`}
                        style="secondary"
                        size="lg"
                        leadIcon={<FcGoogle size={18} />}
                        onClick={handleGoogleSignIn}
                        className="w-full"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Email and Password Form Container */}
                    <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16], width: '100%' }}>
                      {isSignUp && (
                        <Input
                          type="text"
                          label="Full Name"
                          placeholder="Enter your full name"
                          value={form.watch('name') || ''}
                          onChange={(e) => form.setValue('name', e.target.value)}
                          required
                          size="lg"
                          failed={!!(form.formState.errors as any).name}
                          caption={(form.formState.errors as any).name?.message}
                        />
                      )}

                      <Input
                        type="email"
                        label="Email address"
                        placeholder="Enter your email"
                        value={form.watch('email') || ''}
                        onChange={(e) => form.setValue('email', e.target.value)}
                        required
                        size="lg"
                        failed={!!form.formState.errors.email}
                        caption={form.formState.errors.email?.message}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
                        <Input
                          type="password"
                          label="Password"
                          placeholder="Enter your password"
                          value={form.watch('password') || ''}
                          onChange={(e) => form.setValue('password', e.target.value)}
                          required
                          size="lg"
                          failed={!!form.formState.errors.password}
                          caption={form.formState.errors.password?.message}
                        />
                        {isSignUp && (
                          <p style={{
                            ...textStyles.xs.normal,
                            color: colors.text.muted,
                            margin: 0,
                          }}>
                            At least 8 characters, 1 uppercase, 1 lowercase, 1 number
                          </p>
                        )}
                      </div>

                      {/* Sign In/Up Button */}
                      <Button
                        label={form.formState.isSubmitting ? 'Loading...' : (isSignUp ? 'Create account' : 'Sign In')}
                        style="primary"
                        size="lg"
                        onClick={handleFormSubmit}
                        loading={form.formState.isSubmitting}
                        disabled={form.formState.isSubmitting || !isFormValid}
                        className="w-full"
                      />
                    </form>

                    {/* Back to Google option */}
                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setShowEmailForm(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          ...textStyles.sm.normal,
                          color: colors.text.informative,
                          textDecoration: 'none',
                        }}
                      >
                        ← Back to Google Sign In
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Text Container */}
            <div style={textContainerStyles}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12], alignItems: 'center' }}>
                {/* Sign Up/Sign In toggle */}
                <p style={{
                  ...textStyles.sm.normal,
                  color: colors.text.muted,
                  margin: 0,
                  textAlign: 'center'
                }}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <span 
                    style={{ color: colors.text.informative, cursor: 'pointer' }}
                    onClick={toggleAuthMode}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </span>
                </p>

                {/* Email login option - only show when not already showing email form */}
                {!showEmailForm && (
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      ...textStyles.xs.normal,
                      color: colors.text.hint,
                      textDecoration: 'underline',
                      fontSize: '11px',
                    }}
                  >
                    Continue with email instead
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Legal Links - Outside main card */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.spacing[12],
            marginTop: spacing.spacing[16],
          }}>
            <button
              type="button"
              onClick={() => navigate('/terms')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                ...textStyles.xs.normal,
                color: colors.text.hint,
                textDecoration: 'none',
                fontSize: '11px',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = colors.text.muted;
                target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = colors.text.hint;
                target.style.textDecoration = 'none';
              }}
            >
              Terms of Service
            </button>
            <span style={{
              ...textStyles.xs.normal,
              color: colors.text.hint,
              fontSize: '11px'
            }}>
              •
            </span>
            <button
              type="button"
              onClick={() => navigate('/privacy')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                ...textStyles.xs.normal,
                color: colors.text.hint,
                textDecoration: 'none',
                fontSize: '11px',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = colors.text.muted;
                target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = colors.text.hint;
                target.style.textDecoration = 'none';
              }}
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Only show on desktop */}
      {!isMobile && (
        <div style={rightColumnStyles}>
          <div style={rightContainerStyles}>
            {/* Sign In Bichaurinho - positioned bottom right */}
            <img
              src={signinBichaurinho}
              alt="Sign in illustration"
              style={{
                position: 'absolute',
                bottom: '-150px', // Partially outside container
                right: '-100px', // Partially outside container
                width: '800px',
                height: '800px',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;