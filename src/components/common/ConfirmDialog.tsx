import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-1.5">
          {variant === 'danger' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
          <span>{title}</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">{message}</div>
    </Modal>
  );
};

export default ConfirmDialog;
