'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { MapPin, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, ApiResponse } from '@/types';
import { AxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const fillCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>(
        '/auth/login',
        data
      );
      login(response.data.data.accessToken, response.data.data.user);
      toast.success(`Welcome back, ${response.data.data.user.name}!`);
      router.push('/dashboard');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Location Manager</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="relative">
              <Mail className="absolute left-3 top-[38px] h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="pl-9"
                error={errors.email?.message}
                required
                {...register('email')}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-[38px] h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="pl-9"
                error={errors.password?.message}
                required
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          {/* Dev-only credentials */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Dev Credentials — click to fill
              </p>
              <div className="space-y-1">
                {[
                  { label: 'Admin',             email: 'admin@example.com',       password: 'Admin123!'        },
                  { label: 'Franchise Manager', email: 'frank.east@example.com',  password: 'Franchise123!'    },
                  { label: 'Manager',           email: 'manager1@example.com',    password: 'Manager123!'      },
                  { label: 'Technician',        email: 'tech1@example.com',       password: 'Technician123!'   },
                  { label: 'User',              email: 'user1@example.com',       password: 'User123!'         },
                ].map(({ label, email, password }) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => fillCredentials(email, password)}
                    className="w-full text-left text-xs text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
                  >
                    <span className="font-medium">{label}:</span> {email}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
