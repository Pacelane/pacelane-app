import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/api/useProfile';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { linkedInProfileSchema, type LinkedInProfileFormData } from '@/lib/validationSchemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const FirstThingsFirst = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setupLinkedInProfile, saving } = useProfile();

  const form = useForm<LinkedInProfileFormData>({
    resolver: zodResolver(linkedInProfileSchema),
    defaultValues: {
      profileUrl: '',
    },
  });

  const handleGoBack = () => {
    navigate('/onboarding/welcome');
  };

  const onSubmit = async (data: LinkedInProfileFormData) => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    try {
      // Use our clean LinkedIn setup API
      const result = await setupLinkedInProfile({
        profileUrl: data.profileUrl
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Profile setup completed!');
      navigate('/onboarding/inspirations');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete setup');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Go Back button */}
        <button 
          onClick={handleGoBack}
          className="flex items-center gap-2 text-[#4E4E55] text-sm mb-6 hover:text-[#111115] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Blue blob icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-4 text-center">
            First Things First
          </h1>

          <p className="text-[#4E4E55] text-sm text-center mb-8 leading-relaxed">
            Tell Us About You. We'll use this to analyze your<br />
            LinkedIn and match your style.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="profileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#111115] text-sm font-medium">
                      Your LinkedIn Profile <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://www.linkedin.com/in/your-profile"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-[#4E4E55] text-sm text-center mt-8 mb-8">
                We'll ask a few questions to tailor your strategy.
              </p>

              <Button 
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing LinkedIn Profile...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default FirstThingsFirst;