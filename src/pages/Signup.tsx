import React from 'react';
import { SignupForm } from '@/components/SignupForm';
import { TestimonialCard } from '@/components/TestimonialCard';

const Signup = () => {
  return (
    <main className="flex min-h-screen">
      <section className="justify-center items-center flex flex-col flex-1 gap-9 bg-neutral-50 px-2.5 py-20 max-md:py-[100px]">
        <div className="flex min-h-14 w-[172px] max-w-full bg-zinc-100 rounded-lg" />
        
        <SignupForm />
        
        <TestimonialCard
          quote="This platform transformed how I approach my daily workflow!"
          author="Alex Chen"
          role="Product Manager"
          image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
        />
      </section>
      
      <section 
        className="justify-center items-center flex flex-1 gap-2.5 bg-neutral-50 px-2.5 py-[47px] max-md:hidden"
        aria-label="Hero image"
      >
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=800&fit=crop"
          alt="Signup page illustration"
          className="aspect-[0.61] object-cover w-[390px] max-w-full rounded-2xl"
        />
      </section>
    </main>
  );
};

export default Signup;