import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/api/useProfile';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactFormData } from '@/lib/validationSchemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Contact = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveContactInfo, saving } = useProfile();
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      countryCode: '+55',
      phoneNumber: '',
    },
  });

  const handleGoBack = () => {
    navigate('/onboarding/pacing');
  };

  const onSubmit = async (data: ContactFormData) => {
    if (!user) return;
    
    try {
      // Use our clean contact info API
      const result = await saveContactInfo({
        countryCode: data.countryCode,
        phoneNumber: data.phoneNumber
      });

      if (result.error) {
        throw new Error(result.error);
      }

      navigate('/onboarding/ready');
    } catch (error: any) {
      console.error('Error saving phone number:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save phone number. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Go Back
          </button>

          {/* Phone icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center relative">
              <div className="w-8 h-8 relative">
                <div className="w-6 h-8 bg-white rounded-lg border-2 border-green-500 relative mx-auto">
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-green-500 rounded-full"></div>
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
                <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-2 text-center">
            Keeping<br />Contact
          </h1>

          <p className="text-[#4E4E55] text-sm text-center leading-relaxed mb-8">
            Enter your WhatsApp number so we can send<br />
            you updates and reminders.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Phone Number Input */}
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+55">🇧🇷 +55</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                            <SelectItem value="+49">🇩🇪 +49</SelectItem>
                            <SelectItem value="+33">🇫🇷 +33</SelectItem>
                            <SelectItem value="+34">🇪🇸 +34</SelectItem>
                            <SelectItem value="+39">🇮🇹 +39</SelectItem>
                            <SelectItem value="+52">🇲🇽 +52</SelectItem>
                            <SelectItem value="+54">🇦🇷 +54</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <p className="text-[#4E4E55] text-sm text-center mb-8">
                We'll ask a few questions to tailor your strategy.
              </p>

              {/* Progress indicator */}
              <div className="flex justify-center gap-2 mb-8">
                <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
              </div>

              <Button 
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Continue"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Contact;