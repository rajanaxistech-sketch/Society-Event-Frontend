import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../../api/authService';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../utils/errorExtractor';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Lock, KeyRound, ShieldCheck, Eye, EyeOff, Key } from 'lucide-react';

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password cannot be the same as current password',
    path: ['newPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Independent eye visibility states for each of the 3 fields
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleClose = () => {
    if (isLoading) return;
    reset();
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsLoading(true);
      const res = await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (res.success) {
        toast.success(res.message || 'Password changed successfully!');
        handleClose();
      } else {
        toast.error(res.message || 'Failed to change password. Please check your credentials.');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to change password. Please verify your current password.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold">Change Password</h3>
            <p className="text-xs text-slate-500 font-normal">
              Update your account password to keep your profile secure
            </p>
          </div>
        </div>
      }
      size="md"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {/* Current Password Field */}
        <Input
          label="Current Password"
          type={showCurrentPassword ? 'text' : 'password'}
          inputSize="md"
          placeholder="Enter your current password"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer flex items-center justify-center p-1 rounded hover:bg-slate-100"
              aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              title={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.currentPassword?.message}
          requiredIndicator
          {...register('currentPassword')}
        />

        {/* New Password Field */}
        <Input
          label="New Password"
          type={showNewPassword ? 'text' : 'password'}
          inputSize="md"
          placeholder="Minimum 6 characters"
          leftIcon={<KeyRound className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer flex items-center justify-center p-1 rounded hover:bg-slate-100"
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              title={showNewPassword ? 'Hide new password' : 'Show new password'}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.newPassword?.message}
          helperText="Must be at least 6 characters and different from old password"
          requiredIndicator
          {...register('newPassword')}
        />

        {/* Confirm New Password Field */}
        <Input
          label="Confirm New Password"
          type={showConfirmPassword ? 'text' : 'password'}
          inputSize="md"
          placeholder="Re-enter your new password"
          leftIcon={<ShieldCheck className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer flex items-center justify-center p-1 rounded hover:bg-slate-100"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.confirmPassword?.message}
          requiredIndicator
          {...register('confirmPassword')}
        />

        {/* Modal Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            leftIcon={<Key className="w-4 h-4" />}
          >
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
