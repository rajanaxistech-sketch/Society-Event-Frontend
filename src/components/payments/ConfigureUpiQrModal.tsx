import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import { paymentQrService, SocietyUpiQrConfig, DEFAULT_UPI_CONFIG } from '../../api/paymentQrService';
import { getFileUrl } from '../../utils/fileHelper';
import { useToast } from '../../hooks/useToast';
import {
  QrCode,
  CheckCircle2,
  Upload,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';

interface ConfigureUpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  onSaved?: (newConfig: SocietyUpiQrConfig) => void;
}

export const ConfigureUpiQrModal: React.FC<ConfigureUpiQrModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onSaved,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [qrMode, setQrMode] = useState<'dynamic_upi' | 'custom_image'>('dynamic_upi');
  const [customQrUrl, setCustomQrUrl] = useState('');
  const [imgLoadError, setImgLoadError] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setImgLoadError(false);
      paymentQrService.getUpiQrConfig(eventId).then((cfg) => {
        setUpiId(cfg.upi_id || DEFAULT_UPI_CONFIG.upi_id);
        setPayeeName(cfg.upi_payee_name || DEFAULT_UPI_CONFIG.upi_payee_name);
        setQrMode(cfg.qr_mode || 'dynamic_upi');
        setCustomQrUrl(cfg.custom_qr_image_url || '');
      });
    }
  }, [isOpen, eventId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, JPEG)');
      return;
    }

    setIsReadingFile(true);
    setErrorMsg('');
    setImgLoadError(false);

    // Read directly as high-quality base64 Data URL so it is fully self-contained & never breaks
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomQrUrl(result);
        toast.success('QR Code image loaded successfully!');
      }
      setIsReadingFile(false);
    };

    reader.onerror = () => {
      toast.error('Could not read the selected image file');
      setIsReadingFile(false);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearImage = () => {
    setCustomQrUrl('');
    setImgLoadError(false);
    toast.info('Custom QR image removed');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUpi = upiId.trim();
    const cleanName = payeeName.trim();

    if (qrMode === 'dynamic_upi') {
      if (!cleanUpi) {
        setErrorMsg('UPI ID is required (e.g. societyname@icici or 9876543210@paytm)');
        return;
      }
      if (!cleanUpi.includes('@')) {
        setErrorMsg('Please enter a valid UPI VPA address containing "@" (e.g. resident@okhdfcbank)');
        return;
      }
    } else if (qrMode === 'custom_image' && !customQrUrl) {
      setErrorMsg('Please upload a QR code image or switch to Dynamic Amount QR mode.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      const updated = await paymentQrService.saveUpiQrConfig(
        {
          upi_id: cleanUpi,
          upi_payee_name: cleanName || 'Society Payment',
          qr_mode: qrMode,
          custom_qr_image_url: customQrUrl,
        },
        eventId
      );

      toast.success('UPI Payment QR details updated successfully!');
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save QR configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const samplePreviewUrl = paymentQrService.buildUpiUrl({
    upiId: upiId || 'society@upi',
    payeeName: payeeName || 'Society Payment',
    amount: 1000,
    transactionNote: 'Society Event Sample Test',
  });

  const resolvedCustomUrl = customQrUrl ? (customQrUrl.startsWith('data:') ? customQrUrl : getFileUrl(customQrUrl)) : '';
  const hasValidCustomImage = Boolean(customQrUrl && !imgLoadError);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm sm:text-base block leading-tight">
              Configure Society UPI QR
            </span>
            <span className="text-[11px] text-slate-500 block font-normal">
              Changes apply instantly across Flat Collections & Advertising
            </span>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            QR Generation Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setQrMode('dynamic_upi')}
              className={clsx(
                'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all text-center gap-1 cursor-pointer',
                qrMode === 'dynamic_upi'
                  ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <div className="flex items-center gap-1 text-[12.5px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dynamic Amount QR</span>
              </div>
              <span className="text-[10px] font-normal text-slate-500">
                Auto pre-fills flat amount on scan
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQrMode('custom_image')}
              className={clsx(
                'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all text-center gap-1 cursor-pointer',
                qrMode === 'custom_image'
                  ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <div className="flex items-center gap-1 text-[12.5px]">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Custom Standee QR</span>
              </div>
              <span className="text-[10px] font-normal text-slate-500">
                Upload official bank standee photo
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Mode Fields */}
        {qrMode === 'dynamic_upi' ? (
          <div className="space-y-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
            {/* Payee UPI ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Society UPI ID (VPA) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. rosewood@icici, yashshah15199@okaxis"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800"
              />
              <p className="text-[10.5px] text-slate-500 mt-1">
                Accepts any verified UPI VPA address (GPay, PhonePe, Paytm, BHIM, Bank VPAs).
              </p>
            </div>

            {/* Payee Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Merchant / Society Payee Name
              </label>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. Rosewood Estate Cultural Committee"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800"
              />
            </div>
          </div>
        ) : (
          /* Custom Standee Mode Fields */
          <div className="space-y-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Standee / Static QR Image <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Image Preview Box */}
                {hasValidCustomImage ? (
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-indigo-200 bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
                    <img
                      src={resolvedCustomUrl}
                      onError={() => setImgLoadError(true)}
                      alt="Custom QR Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      title="Remove image"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 shadow-xs transition-transform active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0 p-2 text-center">
                    <ImageIcon className="w-7 h-7 text-slate-400 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-500 leading-tight">
                      No Image Chosen
                    </span>
                  </div>
                )}

                {/* Upload Action Box */}
                <div className="flex-1 w-full space-y-2">
                  <div className="relative overflow-hidden rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 active:scale-[0.98]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isReadingFile}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <Upload className="w-4 h-4 shrink-0 pointer-events-none" />
                    <span className="text-xs font-bold pointer-events-none">
                      {isReadingFile ? 'Reading Image...' : hasValidCustomImage ? 'Change QR Image' : 'Choose / Upload QR Image'}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-500 text-center sm:text-left leading-relaxed">
                    Select a photo of your society's official QR standee from your camera, gallery, or computer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Preview Box */}
        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-3">
          <div className="w-16 h-16 bg-white rounded-lg p-1 border border-indigo-200 shrink-0 flex items-center justify-center overflow-hidden">
            {qrMode === 'dynamic_upi' && upiId ? (
              <QRCodeSVG value={samplePreviewUrl} size={56} level="M" />
            ) : qrMode === 'custom_image' && hasValidCustomImage ? (
              <img
                src={resolvedCustomUrl}
                onError={() => setImgLoadError(true)}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <QrCode className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-indigo-950 block">Live Preview Verification</span>
            <span className="text-[10.5px] text-slate-600 block truncate font-medium">
              Mode: <span className="font-semibold text-indigo-700">{qrMode === 'dynamic_upi' ? 'Dynamic UPI Code' : 'Custom Standee'}</span>
            </span>
            <span className="text-[10.5px] text-slate-500 block truncate">
              {qrMode === 'dynamic_upi' ? `UPI: ${upiId || 'Not configured'}` : (hasValidCustomImage ? 'Image Ready' : 'Please choose an image')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Save & Update QR
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ConfigureUpiQrModal;
