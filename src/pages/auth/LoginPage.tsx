import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../../api/authService';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const res = await authService.login(data);

      if (res.success && res.data) {
        setAuth(res.data.tokens, res.data.user);
        toast.success(`Welcome back, ${res.data.user.fullName}!`);

        const origin = (location.state as any)?.from?.pathname || AppRoutes.DASHBOARD;
        navigate(origin, { replace: true });
      } else {
        toast.error(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Sign In to Your Account</h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
          Enter your administrative credentials to access the platform.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          inputSize="lg"
          placeholder="admin@societyevents.com"
          leftIcon={<Mail className="w-4.5 h-4.5" />}
          error={errors.email?.message}
          requiredIndicator
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          inputSize="lg"
          placeholder="••••••••"
          leftIcon={<Lock className="w-4.5 h-4.5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer flex items-center justify-center p-1 rounded hover:bg-slate-100"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          }
          error={errors.password?.message}
          requiredIndicator
          {...register('password')}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center text-sm sm:text-base h-11 sm:h-12 rounded-xl font-semibold shadow-md shadow-indigo-200"
            isLoading={isLoading}
            leftIcon={<LogIn className="w-4.5 h-4.5" />}
          >
            Sign In
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
