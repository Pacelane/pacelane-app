import React from 'react';
import { LoginForm } from '@/components/LoginForm';
import { TestimonialCard } from '@/components/TestimonialCard';

const Login = () => {
  return (
    <main className="flex min-h-screen">
      <section className="justify-center items-center flex flex-col flex-1 gap-9 bg-neutral-50 px-2.5 py-20 max-md:py-[100px]">
        <div className="flex min-h-14 w-[172px] max-w-full bg-zinc-100 rounded-lg" />
        
        <LoginForm />
        
        <TestimonialCard
          quote="By far, the best investment I made to my career this year!"
          author="Johanna Doe"
          role="Investor"
          image="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face"
        />
      </section>
      
      <section 
        className="justify-center items-center flex flex-1 gap-2.5 bg-neutral-50 px-2.5 py-[47px] max-md:hidden"
        aria-label="Hero image"
      >
        <img
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=800&fit=crop"
          alt="Login page illustration"
          className="aspect-[0.61] object-cover w-[390px] max-w-full rounded-2xl"
        />
      </section>
    </main>
  );
};

export default Login;