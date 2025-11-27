import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
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
import type { LinkedInAnalyzerFormData, LinkedInAnalyzerResult } from '@/types/leads';

const LinkedInAnalyzer: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [goal, setGoal] = useState('');
  
  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<LinkedInAnalyzerResult | null>(null);
  const [error, setError] = useState('');

  // Validation
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    linkedinUrl: '',
    goal: ''
  });

  const goalOptions = [
    { value: '', label: 'Select your main goal (optional)...' },
    { value: 'Get Hired', label: 'Get Hired' },
    { value: 'Hire Talent', label: 'Hire Talent' },
    { value: 'Build Personal Brand', label: 'Build Personal Brand' },
    { value: 'Generate Leads', label: 'Generate Leads' },
    { value: 'Network', label: 'Network' }
  ];

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      linkedinUrl: '',
      goal: ''
    };

    let isValid = true;

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // LinkedIn URL validation
    if (!linkedinUrl.trim()) {
      newErrors.linkedinUrl = 'LinkedIn profile URL is required';
      isValid = false;
    } else if (!linkedinUrl.includes('linkedin.com/in/')) {
      newErrors.linkedinUrl = 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setResult(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://plbgeabtrkdhbrnjonje.supabase.co";
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
      
      // Call the new lead-specific edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/scrape-lead-linkedin-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          linkedinUrl: linkedinUrl.trim(),
          goal: goal || undefined
        } as LinkedInAnalyzerFormData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze profile');
      }

      if (data.success && data.data) {
        setResult({
          profileData: data.data.profileData,
          analysis: data.data.analysis,
          suggestions: []
        });
      } else {
        throw new Error('No analysis received');
      }

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze your LinkedIn profile. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGoToThankYou = () => {
    navigate('/thank-you?source=linkedin-analyzer');
  };

  const handleAnalyzeAnother = () => {
    setResult(null);
    setName('');
    setEmail('');
    setLinkedinUrl('');
    setGoal('');
    setError('');
    setErrors({ name: '', email: '', linkedinUrl: '', goal: '' });
  };

  // Styles
  const pageStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.bg.muted,
    display: 'flex',
    flexDirection: 'column',
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
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    padding: getResponsivePadding(isMobile, 'card'),
    marginBottom: spacing.spacing[24],
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: Array.isArray(typography.fontFamily['awesome-serif']) 
      ? typography.fontFamily['awesome-serif'].join(', ') 
      : typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    ...textStyles.md.normal,
    color: colors.text.muted,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  const sectionTitleStyle: React.CSSProperties = {
    ...textStyles.lg.semibold,
    color: colors.text.default,
    margin: 0,
    marginBottom: spacing.spacing[16],
  };

  const selectStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.spacing[12],
    fontSize: typography.desktop.size.md,
    fontFamily: Array.isArray(typography.fontFamily.inter) 
      ? typography.fontFamily.inter.join(', ') 
      : typography.fontFamily.inter,
    color: colors.text.default,
    backgroundColor: colors.bg.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    outline: 'none',
    cursor: 'pointer',
  };

  const analysisTextStyle: React.CSSProperties = {
    ...textStyles.md.normal,
    color: colors.text.default,
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
  };

  if (isAnalyzing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg.muted,
      }}>
        <SubtleLoadingSpinner 
          title="Analyzing your LinkedIn profile..."
          subtitle="This may take up to 2 minutes"
          size={16}
        />
      </div>
    );
  }

  return (
    <div style={pageStyles}>
      <div style={contentWrapperStyles}>
        {/* Logo */}
        <div style={{ marginBottom: spacing.spacing[32], textAlign: 'center' }}>
          <Logo width={120} />
        </div>

        {/* Main Card */}
        <div style={cardStyles}>
          <h1 style={titleStyle}>LinkedIn Profile Analyzer</h1>
          <p style={subtitleStyle}>
            Get AI-powered feedback on your LinkedIn profile based on your goals. 
            Our analysis uses best practices to help you optimize your profile.
          </p>

          {!result ? (
            <form onSubmit={handleSubmit} style={{ marginTop: spacing.spacing[32] }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
                {/* Name */}
                <Input
                  type="text"
                  label="Your Name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  required
                  size="lg"
                  failed={!!errors.name}
                  caption={errors.name}
                />

                {/* Email */}
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  required
                  size="lg"
                  failed={!!errors.email}
                  caption={errors.email}
                />

                {/* LinkedIn URL */}
                <Input
                  type="text"
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/your-profile"
                  value={linkedinUrl}
                  onChange={(e) => {
                    setLinkedinUrl(e.target.value);
                    if (errors.linkedinUrl) setErrors({ ...errors, linkedinUrl: '' });
                  }}
                  required
                  size="lg"
                  failed={!!errors.linkedinUrl}
                  caption={errors.linkedinUrl}
                />

                {/* Goal (Optional) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                  <label style={{
                    ...textStyles.sm.medium,
                    color: colors.text.default,
                  }}>
                    Main Goal <span style={{ color: colors.text.muted }}>(optional)</span>
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => {
                      setGoal(e.target.value);
                      if (errors.goal) setErrors({ ...errors, goal: '' });
                    }}
                    style={{
                      ...selectStyles,
                      borderColor: errors.goal ? colors.border.critical : colors.border.default,
                    }}
                  >
                    {goalOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Message */}
                {error && (
                  <div style={{
                    padding: spacing.spacing[12],
                    backgroundColor: colors.bg.critical?.subtle || colors.bg.muted,
                    border: `1px solid ${colors.border.critical}`,
                    borderRadius: cornerRadius.borderRadius.md,
                  }}>
                    <p style={{
                      ...textStyles.sm.medium,
                      color: colors.text.critical,
                      margin: 0,
                    }}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  label="Analyze My Profile"
                  style="primary"
                  size="lg"
                  onClick={handleSubmit}
                  fullWidth={true}
                  disabled={isAnalyzing}
                />
              </div>
            </form>
          ) : (
            <div style={{ marginTop: spacing.spacing[32] }}>
              <h2 style={sectionTitleStyle}>Your LinkedIn Profile Analysis</h2>
              
              <div style={{
                padding: spacing.spacing[20],
                backgroundColor: colors.bg.muted,
                borderRadius: cornerRadius.borderRadius.md,
                marginBottom: spacing.spacing[24],
              }}>
                <p style={analysisTextStyle}>{result.analysis}</p>
              </div>

              <div style={{ display: 'flex', gap: spacing.spacing[12], flexWrap: 'wrap' }}>
                <Button
                  label="Analyze Another Profile"
                  style="secondary"
                  size="md"
                  onClick={handleAnalyzeAnother}
                />
                <Button
                  label="Done"
                  style="primary"
                  size="md"
                  onClick={handleGoToThankYou}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: spacing.spacing[24],
        }}>
          <p style={{
            ...textStyles.xs.normal,
            color: colors.text.hint,
          }}>
            This is a free tool by Pacelane. Your analysis is private and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LinkedInAnalyzer;
