import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useAuth } from '@/hooks/api/useAuth';
import { useToast } from '@/design-system/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpFormData } from '@/api/schemas';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { getResponsivePadding } from '@/design-system/utils/responsive';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from '@/design-system/components/Logo';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';
import { Sparkles, LogIn, ArrowLeft } from 'lucide-react';


const LinkedInWrapped: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user, profile, signUp, signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso');
      // The redirect will happen automatically via auth state change
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Falha ao fazer logout. Por favor, tente novamente.');
    }
  };

  // Redirect if already authenticated (but allow user to logout first)
  useEffect(() => {
    if (user && profile) {
      // Small delay to allow logout button to be visible
      const timer = setTimeout(() => {
        console.log('LinkedInWrapped: User already authenticated, redirecting to /my-wrapped');
        navigate('/my-wrapped');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, profile, navigate]);

  // Form setup
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      toast.info('Criando sua conta...');
      setIsProcessingAuth(true);
      
      const result = await signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.name
          }
        }
      });
      
      if (result.error) {
        let errorMessage = String(result.error);
        
        if (errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
          errorMessage = 'Já existe uma conta com este email. Faça login para continuar.';
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 8 caracteres com maiúscula, minúscula e número.';
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Por favor, insira um endereço de e-mail válido.';
        } else if (errorMessage.includes('weak password') || errorMessage.includes('Password is too weak')) {
          errorMessage = 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.';
        }
        
        toast.error(errorMessage);
        setIsProcessingAuth(false);
        return;
      }
      
      toast.success('Conta criada com sucesso!');
      
      // Navigate to my-wrapped page
      console.log('LinkedInWrapped: New user created, redirecting to /my-wrapped');
      navigate('/my-wrapped');
      
    } catch (error: any) {
      console.error('Sign-up error:', error);
      toast.error('Falha ao criar conta. Por favor, tente novamente.');
      setIsProcessingAuth(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      toast.info('Redirecionando para Google...');
      setIsProcessingAuth(true);
      
      // Set redirect to my-wrapped instead of onboarding
      const redirectTo = `${window.location.origin}/my-wrapped`;
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });
      
      if (error) {
        let errorMessage = error.message || 'Falha ao fazer login com Google';
        
        if (errorMessage.includes('popup_closed_by_user')) {
          errorMessage = 'Login com Google foi cancelado. Por favor, tente novamente.';
        } else if (errorMessage.includes('access_denied')) {
          errorMessage = 'Acesso negado ao Google. Por favor, tente novamente.';
        }
        
        toast.error(errorMessage);
        setIsProcessingAuth(false);
        return;
      }
      
      // The redirect will happen automatically via OAuth flow
      console.log('LinkedInWrapped: Google sign-in initiated, redirecting...');
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error('Falha ao fazer login com Google. Por favor, tente novamente.');
      setIsProcessingAuth(false);
    }
  };

  const handleFormSubmit = async () => {
    try {
      await form.handleSubmit(onSubmit)();
    } catch (error) {
      console.log('Validation failed - errors are shown in form fields');
    }
  };

  const formValues = form.watch();
  const isFormValid = (() => {
    const email = formValues.email?.trim();
    const password = formValues.password?.trim();
    const name = formValues.name?.trim();

    if (!email || !password || !name) return false;
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    return true;
  })();

  // Show loading state while processing authentication
  if (isProcessingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg.muted,
      }}>
        <SubtleLoadingSpinner 
          title="Criando sua conta..."
          size={16}
        />
      </div>
    );
  }

  // Styles
  const geistFont = Array.isArray(typography.fontFamily?.inter)
    ? typography.fontFamily.inter.join(', ')
    : typography.fontFamily?.inter || 'Geist, sans-serif';

  const pageStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-default, #18181B)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: geistFont,
    color: '#FFFFFF',
  };

  const contentWrapperStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '840px',
    margin: '0 auto',
    paddingTop: spacing.spacing[40],
    paddingBottom: spacing.spacing[80],
    paddingLeft: spacing.spacing[24],
    paddingRight: spacing.spacing[24],
    boxSizing: 'border-box',
    color: '#FFFFFF',
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: '#22232a',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    padding: getResponsivePadding(isMobile, 'card'),
    marginBottom: spacing.spacing[24],
    color: '#FFFFFF',
    fontFamily: geistFont,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: geistFont,
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: '#FFFFFF',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    ...textStyles.md.normal,
    color: 'rgba(255,255,255,0.78)',
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  return (
    <div style={pageStyles}>
      <div style={contentWrapperStyles}>
        {/* Logo and Logout Button */}
        <div style={{ 
          marginBottom: spacing.spacing[32], 
          textAlign: 'center',
          position: 'relative',
        }}>
          <Logo width={120} />
          {user && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
            }}>
              <Button
                label="Sair"
                style="ghost"
                size="sm"
                onClick={handleLogout}
              />
            </div>
          )}
        </div>

        {/* Main Card */}
        <div style={cardStyles}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: spacing.spacing[32], color: '#FFFFFF' }}>
            <h1 style={{
              ...titleStyle,
              fontSize: typography.desktop.size['4xl'],
            }}>
              LinkedIn Wrapped 2025
            </h1>
            <p style={subtitleStyle}>
              Descubra sua retrospectiva do LinkedIn. Veja seus posts mais populares, 
              estatísticas de engajamento e insights de conteúdo do ano passado.
            </p>
          </div>

          {/* Form Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20], width: '100%' }}>
            {!showEmailForm ? (
              <>
                {/* Google Sign Up Button */}
                <Button
                  label="Cadastrar com Google"
                  style="secondary"
                  size="lg"
                  leadIcon={<LogIn size={18} />}
                  onClick={handleGoogleSignIn}
                  fullWidth={true}
                />
                
                {/* Divider */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.spacing[12],
                  margin: `${spacing.spacing[8]} 0`,
                }}>
                  <div style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.14)',
                  }} />
                  <span style={{
                    ...textStyles.xs.normal,
                    color: 'rgba(255,255,255,0.72)',
                  }}>
                    ou
                  </span>
                  <div style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.14)',
                  }} />
                </div>

                {/* Email Sign Up Option */}
                <Button
                  label="Cadastrar com email"
                  style="primary"
                  size="md"
                  onClick={() => setShowEmailForm(true)}
                  fullWidth={true}
                />
              </>
            ) : (
              <>
                {/* Email and Password Form Container */}
                <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16], width: '100%' }}>
                  <Input
                    type="text"
                    label="Nome Completo"
                    placeholder="Digite seu nome completo"
                    value={form.watch('name') || ''}
                    onChange={(e) => form.setValue('name', e.target.value)}
                    required
                    size="lg"
                    failed={!!(form.formState.errors as any).name}
                    caption={(form.formState.errors as any).name?.message}
                  />

                  <Input
                    type="email"
                    label="Endereço de e-mail"
                    placeholder="Digite seu e-mail"
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
                      label="Senha"
                      placeholder="Digite sua senha"
                      value={form.watch('password') || ''}
                      onChange={(e) => form.setValue('password', e.target.value)}
                      required
                      size="lg"
                      failed={!!form.formState.errors.password}
                      caption={form.formState.errors.password?.message}
                    />
                    <p style={{
                      ...textStyles.xs.normal,
                      color: colors.text.muted,
                      margin: 0,
                    }}>
                      Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
                    </p>
                  </div>

                  {/* Sign Up Button */}
                  <Button
                    label={form.formState.isSubmitting ? 'Criando conta...' : 'Criar conta'}
                    style="primary"
                    size="lg"
                    onClick={handleFormSubmit}
                    loading={form.formState.isSubmitting}
                    disabled={form.formState.isSubmitting || !isFormValid}
                    fullWidth={true}
                  />
                </form>

                {/* Back to Google option */}
                <div style={{ textAlign: 'center' }}>
                  <Button
                    label="Voltar para Google"
                    style="ghost"
                    size="sm"
                    leadIcon={<ArrowLeft size={16} />}
                    onClick={() => setShowEmailForm(false)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Sign In Link */}
          <div style={{
            textAlign: 'center',
            marginTop: spacing.spacing[24],
            paddingTop: spacing.spacing[24],
            borderTop: `1px solid rgba(255,255,255,0.12)`,
          }}>
            <p style={{
              ...textStyles.sm.normal,
              color: 'rgba(255,255,255,0.78)',
              margin: 0,
            }}>
              Já tem uma conta?{' '}
              <Button
                label="Fazer login"
                style="primary"
                size="sm"
                onClick={() => navigate('/signin?redirect=/my-wrapped')}
              />
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: spacing.spacing[24],
        }}>
          <p style={{
            ...textStyles.xs.normal,
            color: 'rgba(255,255,255,0.78)',
            fontFamily: geistFont,
          }}>
            Esta é uma ferramenta gratuita do Pacelane. Seus dados são privados e armazenados com segurança.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LinkedInWrapped;
