import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/design-system/components/Toast';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import OnboardingProgressIndicator from '@/design-system/components/OnboardingProgressIndicator';
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { ArrowLeft, ArrowRight, User, MapPin, Building, Globe, Calendar, Award } from 'lucide-react';

interface LinkedInProfile {
  name?: string;
  headline?: string;
  location?: string;
  company?: string;
  website?: string;
  joinedDate?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  education?: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
}

const LinkedInSummary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [profile, setProfile] = useState<LinkedInProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinkedInProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('linkedin_profile_data')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching LinkedIn profile:', error);
          // For now, show mock data since backend isn't implemented yet
          setProfile({
            name: 'John Doe',
            headline: 'Senior Software Engineer at Tech Company',
            location: 'San Francisco, CA',
            company: 'Tech Company',
            website: 'johndoe.com',
            joinedDate: '2020',
            skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
            experience: [
              { title: 'Senior Software Engineer', company: 'Tech Company', duration: '2020 - Present' },
              { title: 'Software Engineer', company: 'Previous Company', duration: '2018 - 2020' }
            ],
            education: [
              { degree: 'Bachelor of Science in Computer Science', school: 'University of Technology', year: '2018' }
            ]
          });
        } else {
          // Use real data when available
          setProfile(data?.linkedin_profile_data || {
            name: 'John Doe',
            headline: 'Senior Software Engineer at Tech Company',
            location: 'San Francisco, CA',
            company: 'Tech Company',
            website: 'johndoe.com',
            joinedDate: '2020',
            skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
            experience: [
              { title: 'Senior Software Engineer', company: 'Tech Company', duration: '2020 - Present' },
              { title: 'Software Engineer', company: 'Previous Company', duration: '2018 - 2020' }
            ],
            education: [
              { degree: 'Bachelor of Science in Computer Science', school: 'University of Technology', year: '2018' }
            ]
          });
        }
      } catch (error) {
        console.error('Error loading LinkedIn profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkedInProfile();
  }, [user, toast]);

  const handleGoBack = () => {
    navigate('/onboarding/first-things-first');
  };

  const handleContinue = () => {
    navigate('/onboarding/guides');
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.bg.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Bichaurinho variant={12} size={64} />
          <p style={{ ...textStyles.md.normal, color: colors.text.muted, marginTop: spacing.spacing[16] }}>
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg.default,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation */}
      <TopNav />

      {/* Content Container with gradient background */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: colors.bg.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? spacing.spacing[24] : spacing.spacing[40],
          paddingBottom: isMobile ? '140px' : '160px', // Account for button container height
        }}
      >
        {/* Gradient background with 5% opacity */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/src/assets/images/gradient-bg.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.05,
            zIndex: 0,
          }}
        />

        {/* Content Column */}
        <div style={{ 
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.spacing[24],
          alignItems: 'center',
        }}>
          {/* Back Button */}
          <div style={{ 
            alignSelf: 'flex-start', 
            width: isMobile ? '100%' : '400px',
            maxWidth: isMobile ? '320px' : '400px'
          }}>
            <Button
              label="Go Back"
              style="dashed"
              size="xs"
              leadIcon={<ArrowLeft size={12} />}
              onClick={handleGoBack}
            />
          </div>

          {/* Progress Indicator */}
          <div style={{ 
            width: isMobile ? '100%' : '400px',
            maxWidth: isMobile ? '320px' : '400px'
          }}>
            <OnboardingProgressIndicator 
              currentStep={3}
              compact={true}
            />
          </div>

          {/* Main Card */}
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.darker}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              width: isMobile ? '100%' : '400px',
              maxWidth: isMobile ? '320px' : '400px',
              overflow: 'hidden',
            }}
          >
            {/* Main Container */}
            <div
              style={{
                padding: isMobile ? spacing.spacing[24] : spacing.spacing[36],
                backgroundColor: colors.bg.card.default,
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Heading Container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: spacing.spacing[16],
                  marginBottom: spacing.spacing[32],
                }}
              >
                {/* Bichaurinho */}
                <div>
                  <Bichaurinho variant={13} size={48} />
                </div>

                {/* Title and Subtitle Container */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.spacing[12],
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Title */}
                  <h1
                    style={{
                      fontFamily: typography.fontFamily['awesome-serif'],
                      fontSize: isMobile ? typography.desktop.size['3xl'] : typography.desktop.size['5xl'],
                      fontWeight: typography.desktop.weight.semibold,
                      lineHeight: '0.9',
                      color: colors.text.default,
                      margin: 0,
                      textAlign: 'left',
                    }}
                  >
                    Profile Summary
                  </h1>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.desktop.size.sm,
                      fontWeight: typography.desktop.weight.normal,
                      lineHeight: typography.desktop.lineHeight.sm,
                      color: colors.text.muted,
                      margin: 0,
                      textAlign: 'left',
                    }}
                  >
                    Here's what we found from your LinkedIn profile. This information will help us personalize your content strategy.
                  </p>
                </div>
              </div>

              {/* Profile Summary Content */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[20],
                }}
              >
                {/* Basic Info */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.spacing[12],
                  }}
                >
                  <h3
                    style={{
                      ...textStyles.md.semibold,
                      color: colors.text.default,
                      margin: 0,
                    }}
                  >
                    {profile?.name || 'Name not available'}
                  </h3>
                  
                  <p
                    style={{
                      ...textStyles.sm.normal,
                      color: colors.text.subtle,
                      margin: 0,
                    }}
                  >
                    {profile?.headline || 'Headline not available'}
                  </p>

                  {/* Location and Company */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.spacing[8],
                    }}
                  >
                    {profile?.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
                        <MapPin size={16} color={colors.icon.subtle} />
                        <span style={{ ...textStyles.sm.normal, color: colors.text.subtle }}>
                          {profile.location}
                        </span>
                      </div>
                    )}
                    
                    {profile?.company && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
                        <Building size={16} color={colors.icon.subtle} />
                        <span style={{ ...textStyles.sm.normal, color: colors.text.subtle }}>
                          {profile.company}
                        </span>
                      </div>
                    )}

                    {profile?.website && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
                        <Globe size={16} color={colors.icon.subtle} />
                        <span style={{ ...textStyles.sm.normal, color: colors.text.subtle }}>
                          {profile.website}
                        </span>
                      </div>
                    )}

                    {profile?.joinedDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
                        <Calendar size={16} color={colors.icon.subtle} />
                        <span style={{ ...textStyles.sm.normal, color: colors.text.subtle }}>
                          Member since {profile.joinedDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {profile?.skills && profile.skills.length > 0 && (
                  <div>
                    <h4
                      style={{
                        ...textStyles.sm.semibold,
                        color: colors.text.default,
                        margin: 0,
                        marginBottom: spacing.spacing[8],
                      }}
                    >
                      Top Skills
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: spacing.spacing[6],
                      }}
                    >
                      {profile.skills.slice(0, 6).map((skill, index) => (
                        <span
                          key={index}
                          style={{
                            ...textStyles.xs.normal,
                            color: colors.text.subtle,
                            backgroundColor: colors.bg.subtle,
                            padding: `${spacing.spacing[4]} ${spacing.spacing[8]}`,
                            borderRadius: cornerRadius.borderRadius.sm,
                            border: `1px solid ${colors.border.default}`,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {profile?.experience && profile.experience.length > 0 && (
                  <div>
                    <h4
                      style={{
                        ...textStyles.sm.semibold,
                        color: colors.text.default,
                        margin: 0,
                        marginBottom: spacing.spacing[8],
                      }}
                    >
                      Recent Experience
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing.spacing[8],
                      }}
                    >
                      {profile.experience.slice(0, 2).map((exp, index) => (
                        <div key={index}>
                          <p
                            style={{
                              ...textStyles.sm.medium,
                              color: colors.text.default,
                              margin: 0,
                            }}
                          >
                            {exp.title}
                          </p>
                          <p
                            style={{
                              ...textStyles.xs.normal,
                              color: colors.text.subtle,
                              margin: 0,
                            }}
                          >
                            {exp.company} • {exp.duration}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {profile?.education && profile.education.length > 0 && (
                  <div>
                    <h4
                      style={{
                        ...textStyles.sm.semibold,
                        color: colors.text.default,
                        margin: 0,
                        marginBottom: spacing.spacing[8],
                      }}
                    >
                      Education
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing.spacing[8],
                      }}
                    >
                      {profile.education.slice(0, 1).map((edu, index) => (
                        <div key={index}>
                          <p
                            style={{
                              ...textStyles.sm.medium,
                              color: colors.text.default,
                              margin: 0,
                            }}
                          >
                            {edu.degree}
                          </p>
                          <p
                            style={{
                              ...textStyles.xs.normal,
                              color: colors.text.subtle,
                              margin: 0,
                            }}
                          >
                            {edu.school} • {edu.year}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Text Container */}
            <div
              style={{
                padding: isMobile 
                  ? `${spacing.spacing[20]} ${spacing.spacing[24]}` 
                  : `${spacing.spacing[24]} ${spacing.spacing[36]}`,
                backgroundColor: colors.bg.card.subtle,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.spacing[4],
              }}
            >
              <p
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.desktop.size.sm,
                  fontWeight: typography.desktop.weight.normal,
                  lineHeight: typography.desktop.lineHeight.sm,
                  color: colors.text.muted,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                This information will help us create personalized content that matches your professional background and expertise.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Button Container - Fixed overlay at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          backgroundColor: colors.bg.default,
          borderTop: `1px solid ${colors.border.default}`,
          padding: spacing.spacing[40],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ 
          width: '280px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Button
            label="Continue"
            style="primary"
            size="lg"
            tailIcon={<ArrowRight size={16} />}
            onClick={handleContinue}
            fullWidth={true}
          />
        </div>
      </div>
    </div>
  );
};

export default LinkedInSummary;
