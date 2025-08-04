import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/services/theme-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';

interface Benchmark {
  id: number;
  value: string;
  isRequired: boolean;
}

const Inspirations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
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
      prev.map(benchmark =>
        benchmark.id === id ? { ...benchmark, value } : benchmark
      )
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
      // Filter out empty benchmarks and trim values
      const validBenchmarks = benchmarks
        .filter(b => b.value.trim())
        .map(b => b.value.trim());

      const { error } = await supabase
        .from('profiles')
        .update({ inspirations: validBenchmarks })
        .eq('user_id', user.id);

      if (error) throw error;

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
          <div style={{ alignSelf: 'flex-start', width: '400px' }}>
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
              width: '400px',
              overflow: 'hidden',
            }}
          >
            {/* Main Container */}
            <div
              style={{
                padding: spacing.spacing[36],
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
                  <Bichaurinho variant={8} size={48} />
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
                  <div
                    key={benchmark.id}
                    style={{
                      display: 'flex',
                      gap: spacing.spacing[8],
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <Input
                        placeholder={index === 0 ? "Benchmark 1 *" : `Benchmark ${index + 1}`}
                        value={benchmark.value}
                        onChange={(e) => updateBenchmark(benchmark.id, e.target.value)}
                        style="default"
                        size="lg"
                        disabled={isLoading}
                      />
                    </div>
                    
                    {/* Only show delete button for non-required benchmarks */}
                    {!benchmark.isRequired && (
                      <Button
                        label=""
                        style="ghost"
                        size="sm"
                        leadIcon={<Trash2 size={16} />}
                        onClick={() => removeBenchmark(benchmark.id)}
                        disabled={isLoading}
                      />
                    )}
                  </div>
                ))}

                {/* Add Benchmark Button */}
                <div style={{ marginTop: spacing.spacing[8] }}>
                  <Button
                    label="Add Another Benchmark"
                    style="dashed"
                    size="sm"
                    leadIcon={<Plus size={16} />}
                    onClick={addBenchmark}
                    disabled={isLoading}
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