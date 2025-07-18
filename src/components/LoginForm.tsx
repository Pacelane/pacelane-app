import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempted with:', { email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-[525px] max-w-full gap-6 flex-col items-stretch">
      <header className="flex gap-2 flex-col text-center">
        <h1 className="text-[#27272A] text-3xl font-bold leading-9">
          Welcome back
        </h1>
        <p className="text-[#6F6F77] text-base leading-6">
          Welcome back! Please enter your details.
        </p>
      </header>

      <div className="flex gap-4 flex-col items-stretch">
        <div className="flex gap-1.5 flex-col">
          <Label htmlFor="email" className="text-[#27272A] text-sm font-medium leading-5">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            placeholder="Enter your email"
            className="bg-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-1.5 flex-col">
          <Label htmlFor="password" className="text-[#27272A] text-sm font-medium leading-5">
            Password
          </Label>
          <Input
            type="password"
            id="password"
            placeholder="••••••••"
            className="bg-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-4 justify-between items-center flex-wrap">
          <label className="flex gap-2 items-center text-[#27272A] text-sm font-medium leading-5 cursor-pointer">
            <input type="checkbox" className="w-4 h-4" />
            Remember for 30 days
          </label>
          <a href="#" className="text-[#2067A4] text-sm font-semibold leading-5 hover:underline">
            Forgot password
          </a>
        </div>

        <Button 
          type="submit" 
          className="bg-[#2067A4] hover:bg-[#1a5a93] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          Sign in
        </Button>

        <Button 
          type="button"
          variant="outline" 
          className="border-[#E4E4E7] text-[#27272A] font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sign in with Google
        </Button>
      </div>

      <p className="text-center text-[#6F6F77] text-sm leading-5">
        Don't have an account?{' '}
        <Link to="/signup" className="text-[#2067A4] font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
};