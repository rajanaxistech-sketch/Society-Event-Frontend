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
import { Mail, Lock, LogIn } from 'lucide-react';
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
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-slate-900">Sign In to Your Account</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Enter your administrative credentials to access the platform.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@societyevents.com"
          leftIcon={<Mail className="w-3.5 h-3.5" />}
          error={errors.email?.message}
          requiredIndicator
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="w-3.5 h-3.5" />}
          error={errors.password?.message}
          requiredIndicator
          {...register('password')}
        />

        <div className="pt-1.5">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="w-full justify-center"
            isLoading={isLoading}
            leftIcon={<LogIn className="w-3.5 h-3.5" />}
          >
            Sign In
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
