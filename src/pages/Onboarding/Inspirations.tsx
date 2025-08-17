import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/design-system/components/Toast';

// LinkedIn URL parsing utilities
import { parseLinkedInInput, isLinkedInUrl } from '@/utils/linkedinParser';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import ProgressBar from '@/design-system/components/ProgressBar';
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { ArrowLeft, ArrowRight, Plus, Trash2, Check, X } from 'lucide-react';

interface Benchmark {
  id: number;
  value: string;
  isRequired: boolean;
  detectedUsername?: string;
  wasUrlDetected?: boolean;
  showUrlDetection?: boolean;
}

const Inspirations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with one required benchmark field
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([
    { id: 1, value: '', isRequired: true }
  ]);

  const handleGoBack = () => {
    navigate('/onboarding/first-things-first');
  };

  const addBenchmark = () => {
    const newId = Math.max(...benchmarks.map(b => b.id)) + 1;
    setBenchmarks(prev => [...prev, { id: newId, value: '', isRequired: false }]);
  };

  const removeBenchmark = (id: number) => {
    setBenchmarks(prev => prev.filter(benchmark => benchmark.id !== id));
  };

  const updateBenchmark = (id: number, value: string) => {
    setBenchmarks(prev =>
      prev.map(benchmark => {
        if (benchmark.id === id) {
          // Check if input looks like a LinkedIn URL
          if (isLinkedInUrl(value)) {
            const parsed = parseLinkedInInput(value);
            if (parsed.isValid && parsed.username) {
              return {
                ...benchmark,
                value,
                detectedUsername: parsed.username,
                wasUrlDetected: true,
                showUrlDetection: true,
              };
            }
          }
          
          return {
            ...benchmark,
            value,
            showUrlDetection: false,
            wasUrlDetected: false,
          };
        }
        return benchmark;
      })
    );
  };

  // Handle confirmation of detected username
  const handleConfirmDetection = (id: number) => {
    setBenchmarks(prev =>
      prev.map(benchmark => {
        if (benchmark.id === id && benchmark.detectedUsername) {
          toast.success(`LinkedIn username extracted: ${benchmark.detectedUsername}`);
          return {
            ...benchmark,
            value: benchmark.detectedUsername,
            showUrlDetection: false,
          };
        }
        return benchmark;
      })
    );
  };

  // Handle dismissing the detection
  const handleDismissDetection = (id: number) => {
    setBenchmarks(prev =>
      prev.map(benchmark => {
        if (benchmark.id === id) {
          return {
            ...benchmark,
            showUrlDetection: false,
            wasUrlDetected: false,
          };
        }
        return benchmark;
      })
    );
  };

  const handleContinue = async () => {
    if (!user) return;

    // Validate required field (first benchmark)
    const requiredBenchmark = benchmarks.find(b => b.isRequired);
    if (!requiredBenchmark?.value.trim()) {
      return; // Don't proceed if required field is empty
    }

    setIsLoading(true);

    try {
      // First, delete existing inspirations for this user
      const { error: deleteError } = await supabase
        .from('inspirations')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Filter out empty benchmarks and create LinkedIn URL objects
      const validBenchmarks = benchmarks
        .filter(b => b.value.trim())
        .map(b => {
          // Parse the input to extract the username
          const parsed = parseLinkedInInput(b.value);
          const username = parsed.isValid ? parsed.username : b.value.trim();
          
          return {
            user_id: user.id,
            linkedin_url: `https://linkedin.com/in/${username}`
          };
        });

      // Insert new inspirations if any exist
      if (validBenchmarks.length > 0) {
        const { error: insertError } = await supabase
          .from('inspirations')
          .insert(validBenchmarks);

        if (insertError) throw insertError;
      }

      navigate('/onboarding/goals');
    } catch (error) {
      console.error('Error saving inspirations:', error);
      toast.error('Failed to save inspirations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if required field is filled
  const requiredBenchmark = benchmarks.find(b => b.isRequired);
  const canContinue = requiredBenchmark?.value.trim();

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
          padding: spacing.spacing[40],
          paddingBottom: '160px', // Account for button container height
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
              {/* Heading Container - 16px gap between bichaurinho and title/subtitle */}
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
                  <Bichaurinho variant={6} size={48} />
                </div>

                {/* Title and Subtitle Container - 12px gap between title and subtitle */}
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
                      fontSize: typography.desktop.size['5xl'],
                      fontWeight: typography.desktop.weight.semibold,
                      lineHeight: '0.9',
                      color: colors.text.default,
                      margin: 0,
                      textAlign: 'left',
                    }}
                  >
                    Who Do You<br />Look Up To?
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
                    Your Benchmarks. Share the LinkedIn profiles of people whose content style you admire.
                  </p>
                </div>
              </div>

              {/* Dynamic Inputs Container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[12],
                }}
              >
                {benchmarks.map((benchmark, index) => (
                  <div key={benchmark.id} style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
                    {benchmark.isRequired ? (
                      <>
                        <Input
                          label="LinkedIn Profile"
                          placeholder={benchmark.showUrlDetection ? "Paste LinkedIn URL or enter username..." : "username"}
                          value={benchmark.value}
                          onChange={(e) => updateBenchmark(benchmark.id, e.target.value)}
                          style={benchmark.showUrlDetection ? "default" : "add-on"}
                          addOnPrefix={benchmark.showUrlDetection ? undefined : "https://linkedin.com/in/"}
                          size="lg"
                          required={true}
                          disabled={isLoading}
                        />
                        
                        {/* URL Detection Confirmation UI for Required Field */}
                        {benchmark.showUrlDetection && (
                          <div
                            style={{
                              backgroundColor: colors.bg.state.soft,
                              border: `1px solid ${colors.border.highlight}`,
                              borderRadius: cornerRadius.borderRadius.md,
                              padding: spacing.spacing[16],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontFamily: typography.fontFamily.body,
                                  fontSize: typography.desktop.size.sm,
                                  fontWeight: typography.desktop.weight.medium,
                                  color: colors.text.default,
                                  margin: 0,
                                }}
                              >
                                LinkedIn URL detected!
                              </p>
                              <p
                                style={{
                                  fontFamily: typography.fontFamily.body,
                                  fontSize: typography.desktop.size.xs,
                                  fontWeight: typography.desktop.weight.normal,
                                  color: colors.text.subtle,
                                  margin: 0,
                                  marginTop: spacing.spacing[4],
                                }}
                              >
                                Extracted username: <strong>{benchmark.detectedUsername}</strong>
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: spacing.spacing[8] }}>
                              <Button
                                label="Use this"
                                style="soft"
                                size="xs"
                                leadIcon={<Check size={12} />}
                                onClick={() => handleConfirmDetection(benchmark.id)}
                              />
                              <Button
                                label="Keep editing"
                                style="ghost"
                                size="xs"
                                leadIcon={<X size={12} />}
                                onClick={() => handleDismissDetection(benchmark.id)}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            gap: spacing.spacing[8],
                            alignItems: 'flex-end',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <Input
                              placeholder={benchmark.showUrlDetection ? "Paste LinkedIn URL or enter username..." : "username"}
                              value={benchmark.value}
                              onChange={(e) => updateBenchmark(benchmark.id, e.target.value)}
                              style={benchmark.showUrlDetection ? "default" : "add-on"}
                              addOnPrefix={benchmark.showUrlDetection ? undefined : "https://linkedin.com/in/"}
                              size="lg"
                              disabled={isLoading}
                            />
                          </div>
                          <Button
                            label=""
                            style="ghost"
                            size="lg"
                            leadIcon={<Trash2 size={16} />}
                            onClick={() => removeBenchmark(benchmark.id)}
                            disabled={isLoading}
                          />
                        </div>
                        
                        {/* URL Detection Confirmation UI for Optional Fields */}
                        {benchmark.showUrlDetection && (
                          <div
                            style={{
                              backgroundColor: colors.bg.state.soft,
                              border: `1px solid ${colors.border.highlight}`,
                              borderRadius: cornerRadius.borderRadius.md,
                              padding: spacing.spacing[16],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontFamily: typography.fontFamily.body,
                                  fontSize: typography.desktop.size.sm,
                                  fontWeight: typography.desktop.weight.medium,
                                  color: colors.text.default,
                                  margin: 0,
                                }}
                              >
                                LinkedIn URL detected!
                              </p>
                              <p
                                style={{
                                  fontFamily: typography.fontFamily.body,
                                  fontSize: typography.desktop.size.xs,
                                  fontWeight: typography.desktop.weight.normal,
                                  color: colors.text.subtle,
                                  margin: 0,
                                  marginTop: spacing.spacing[4],
                                }}
                              >
                                Extracted username: <strong>{benchmark.detectedUsername}</strong>
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: spacing.spacing[8] }}>
                              <Button
                                label="Use this"
                                style="soft"
                                size="xs"
                                leadIcon={<Check size={12} />}
                                onClick={() => handleConfirmDetection(benchmark.id)}
                              />
                              <Button
                                label="Keep editing"
                                style="ghost"
                                size="xs"
                                leadIcon={<X size={12} />}
                                onClick={() => handleDismissDetection(benchmark.id)}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {/* Add Benchmark Button */}
                <div style={{ marginTop: spacing.spacing[8], width: '100%' }}>
                  <Button
                    label="Add Another Benchmark"
                    style="secondary"
                    size="sm"
                    leadIcon={<Plus size={16} />}
                    onClick={addBenchmark}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Text Container */}
            <div
              style={{
                padding: `${spacing.spacing[24]} ${spacing.spacing[36]}`,
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
                {!canContinue 
                  ? "Please add at least one benchmark to continue."
                  : "Great! We'll analyze these profiles to understand your style preferences."
                }
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
        <div style={{ width: '280px' }}>
          <Button
            label={isLoading ? "Saving..." : "Continue"}
            style="primary"
            size="lg"
            tailIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
            onClick={handleContinue}
            disabled={!canContinue || isLoading}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Inspirations;