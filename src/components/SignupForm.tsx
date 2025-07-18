import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup attempted with:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-[525px] max-w-full gap-6 flex-col items-stretch">
      <header className="flex gap-2 flex-col text-center">
        <h1 className="text-[#27272A] text-3xl font-bold leading-9">
          Create an account
        </h1>
        <p className="text-[#6F6F77] text-base leading-6">
          Get started with your free account today.
        </p>
      </header>

      <div className="flex gap-4 flex-col items-stretch">
        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-1.5 flex-col flex-1 min-w-0">
            <Label htmlFor="firstName" className="text-[#27272A] text-sm font-medium leading-5">
              First name
            </Label>
            <Input
              type="text"
              id="firstName"
              name="firstName"
              placeholder="First name"
              className="bg-white"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex gap-1.5 flex-col flex-1 min-w-0">
            <Label htmlFor="lastName" className="text-[#27272A] text-sm font-medium leading-5">
              Last name
            </Label>
            <Input
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Last name"
              className="bg-white"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex gap-1.5 flex-col">
          <Label htmlFor="email" className="text-[#27272A] text-sm font-medium leading-5">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            className="bg-white"
            value={formData.email}
            onChange={handleChange}
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
            name="password"
            placeholder="Create a password"
            className="bg-white"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex gap-1.5 flex-col">
          <Label htmlFor="confirmPassword" className="text-[#27272A] text-sm font-medium leading-5">
            Confirm password
          </Label>
          <Input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your password"
            className="bg-white"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <label className="flex gap-2 items-start text-[#27272A] text-sm font-medium leading-5 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 mt-0.5" required />
          <span>
            I agree to the{' '}
            <a href="#" className="text-[#2067A4] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-[#2067A4] hover:underline">Privacy Policy</a>
          </span>
        </label>

        <Button 
          type="submit" 
          className="bg-[#2067A4] hover:bg-[#1a5a93] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          Create account
        </Button>

        <Button 
          type="button"
          variant="outline" 
          className="border-[#E4E4E7] text-[#27272A] font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sign up with Google
        </Button>
      </div>

      <p className="text-center text-[#6F6F77] text-sm leading-5">
        Already have an account?{' '}
        <Link to="/login" className="text-[#2067A4] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
};