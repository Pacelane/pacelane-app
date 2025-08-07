import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/design-system/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, signUpSchema, type SignInFormData, type SignUpFormData } from '@/lib/validationSchemas';

// Design System Components
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';
import { shadows, getShadow } from '@/design-system/tokens/shadows';
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
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();

  // Use a single form instance with dynamic schema
  const form = useForm<SignInFormData | SignUpFormData>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(isSignUp && { name: '' }),
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
    form.reset({
      email: form.getValues('email'),
      password: form.getValues('password'),
      ...(isSignUp && { name: form.getValues('name') || '' }),
    });
  }, [isSignUp, form]);

  const onSubmit = async (data: SignInFormData | SignUpFormData) => {
    try {
      if (isSignUp) {
        const result = await signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              display_name: data.name
            }
          }
        });
        
        if (result.error) throw new Error(result.error);
        
        toast.success('Check your email for the confirmation link!');
        
        // Reset form and switch to sign-in mode
        form.reset({ email: '', password: '', name: '' });
        setIsSignUp(false);
      } else {
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
      const result = await signInWithGoogle();
      
      if (result.error) throw new Error(result.error);
    } catch (error: any) {
      toast.error(error.message || 'Google sign in failed');
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    form.clearErrors();
  };

  // Page container styles
  const pageContainerStyles = {
    height: '100vh',
    width: '100%',
    display: 'flex',
    position: 'relative',
    backgroundColor: colors.bg.default,
  };

  // Left column styles (50% width, 720px container)
  const leftColumnStyles = {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.spacing[40],
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    zIndex: 5,
  };

  // 400px centered container styles
  const contentContainerStyles = {
    width: '400px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: spacing.spacing[24],
  };

  // Card styles - single card containing both form and text sections
  const cardStyles = {
    width: '400px',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: colors.bg.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    overflow: 'hidden' as const, // Ensure rounded corners are maintained
  };

  // Form container styles - main content area
  const formContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[24], // 24px gap between major sections
    padding: spacing.spacing[36],
  };

  // Text container styles - bottom section  
  const textContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[4],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
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
      {/* Left Column */}
      <div style={leftColumnStyles}>
        <div style={contentContainerStyles}>
          {/* Logo */}
          <Logo width={120} />

          {/* Main Card */}
          <div style={cardStyles}>
            {/* Form Container */}
            <div style={formContainerStyles}>
              {/* Heading Container */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: spacing.spacing[4] }}>
                {/* Bichaurinho 31 */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Bichaurinho variant={31} size={32} />
                </div>

                <h1 style={{
                  ...textStyles['2xl'].semibold,
                  color: colors.text.default,
                  fontFamily: 'Awesome Serif VAR, ui-serif, Georgia, serif',
                  margin: 0
                }}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </h1>

                {/* Subtitle */}
                <p style={{
                  ...textStyles.sm.normal,
                  color: colors.text.muted,
                  margin: 0,
                  textAlign: 'left'
                }}>
                  {isSignUp ? 'Get started with your free account' : 'Welcome back! Please enter your details.'}
                </p>
              </div>

              {/* Form Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20], width: '100%' }}>
                {/* Email and Password Form Container */}
                <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16], width: '100%' }}>
                  {isSignUp && (
                    <Input
                      type="text"
                      label="Full Name"
                      placeholder="Enter your full name"
                      value={form.watch('name') || ''}
                      onChange={(e) => form.setValue('name', e.target.value, { shouldValidate: true })}
                      required
                      size="lg"
                      failed={!!form.formState.errors.name}
                      caption={form.formState.errors.name?.message}
                    />
                  )}

                  <Input
                    type="email"
                    label="Email address"
                    placeholder="Enter your email"
                    value={form.watch('email') || ''}
                    onChange={(e) => form.setValue('email', e.target.value, { shouldValidate: true })}
                    required
                    size="lg"
                    failed={!!form.formState.errors.email}
                    caption={form.formState.errors.email?.message}
                  />

                  <Input
                    type="password"
                    label="Password"
                    placeholder="Enter your password"
                    value={form.watch('password') || ''}
                    onChange={(e) => form.setValue('password', e.target.value, { shouldValidate: true })}
                    required
                    size="lg"
                    failed={!!form.formState.errors.password}
                    caption={form.formState.errors.password?.message}
                  />

                  {/* Sign In/Up Button */}
                  <Button
                    label={form.formState.isSubmitting ? 'Loading...' : (isSignUp ? 'Create account' : 'Sign In')}
                    style="primary"
                    size="lg"
                    onClick={form.handleSubmit(onSubmit)}
                    loading={form.formState.isSubmitting}
                    disabled={form.formState.isSubmitting}
                    className="w-full"
                  />
                </form>

                {/* Divider */}
                <Divider label="or" maxWidth={400} />

                {/* Google Sign In Button */}
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
              </div>
            </div>

            {/* Text Container */}
            <div style={textContainerStyles}>
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
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
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
    </div>
  );
};

export default SignIn;