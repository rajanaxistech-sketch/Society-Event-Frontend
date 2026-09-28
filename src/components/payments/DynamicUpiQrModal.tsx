import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import { paymentQrService, SocietyUpiQrConfig, DEFAULT_UPI_CONFIG } from '../../api/paymentQrService';
import ConfigureUpiQrModal from './ConfigureUpiQrModal';
import { formatCurrency } from '../../utils/formatters';
import { getFileUrl } from '../../utils/fileHelper';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Settings,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

export interface DynamicUpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  unitOrAdvertiserName: string;
  categoryOrEventName?: string;
  transactionNote?: string;
  eventId?: string;
  onDone?: () => void;
}

export const DynamicUpiQrModal: React.FC<DynamicUpiQrModalProps> = ({
  isOpen,
  onClose,
  amount,
  unitOrAdvertiserName,
  categoryOrEventName,
  transactionNote,
  eventId,
  onDone,
}) => {
  const { user, isSuperAdmin } = useAuth();
  const toast = useToast();

  const [config, setConfig] = useState<SocietyUpiQrConfig>(DEFAULT_UPI_CONFIG);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [standeeImgError, setStandeeImgError] = useState(false);

  // Check if current user has permission to configure QR code
  const canConfigure = useMemo(() => {
    if (isSuperAdmin) return true;
    const role = (user?.role?.name || '').toLowerCase();
    return role.includes('admin') || role.includes('secretary') || role.includes('treasurer') || role.includes('president');
  }, [user, isSuperAdmin]);

  // Load config and listen to live updates
  useEffect(() => {
    if (isOpen) {
      setStandeeImgError(false);
      paymentQrService.getUpiQrConfig(eventId).then((cfg) => {
        setConfig(cfg);
      });
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    const unsubscribe = paymentQrService.subscribe((newCfg) => {
      setStandeeImgError(false);
      setConfig(newCfg);
    });
    return () => unsubscribe();
  }, []);

  // Construct Dynamic UPI Deep Link URL
  const dynamicUpiUrl = useMemo(() => {
    return paymentQrService.buildUpiUrl({
      upiId: config.upi_id || DEFAULT_UPI_CONFIG.upi_id,
      payeeName: config.upi_payee_name || DEFAULT_UPI_CONFIG.upi_payee_name,
      amount: amount > 0 ? amount : undefined,
      transactionNote: transactionNote || `${categoryOrEventName ? `${categoryOrEventName} - ` : ''}${unitOrAdvertiserName}`,
    });
  }, [config, amount, transactionNote, categoryOrEventName, unitOrAdvertiserName]);

  const handleCopyUpi = () => {
    const upi = config.upi_id || DEFAULT_UPI_CONFIG.upi_id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upi);
      setCopied(true);
      toast.success('UPI ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDoneClick = () => {
    if (onDone) {
      onDone();
    } else {
      onClose();
    }
  };

  const shouldShowCustomStandee = Boolean(
    config.qr_mode === 'custom_image' &&
    config.custom_qr_image_url &&
    !standeeImgError
  );

  const resolvedStandeeUrl = config.custom_qr_image_url
    ? config.custom_qr_image_url.startsWith('data:')
      ? config.custom_qr_image_url
      : getFileUrl(config.custom_qr_image_url)
    : '';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="sm"
        title={
          <div className="flex items-center justify-between w-full pr-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-slate-900 text-sm sm:text-base block leading-tight">
                  UPI Payment QR
                </span>
                <span className="text-[10px] text-slate-500 block font-normal">
                  Scan with GPay, PhonePe, Paytm, or BHIM
                </span>
              </div>
            </div>

            {/* Admin Quick Configure Button directly from modal */}
            {canConfigure && (
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                title="Configure Society UPI QR / Edit UPI ID"
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/80 transition-all cursor-pointer shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Edit QR</span>
              </button>
            )}
          </div>
        }
      >
        <div className="flex flex-col items-center text-center space-y-3 py-1 animate-in fade-in duration-150">
          {/* Target Unit / Resident & Amount Badge */}
          <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="text-left min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
                {categoryOrEventName || 'Unit / Resident'}
              </span>
              <span className="font-bold text-slate-800 block truncate max-w-[140px] sm:max-w-[170px]">
                {unitOrAdvertiserName || 'Society Contribution'}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Amount to Pay
              </span>
              <span className="font-extrabold text-indigo-600 text-sm sm:text-base">
                {formatCurrency(Number(amount) || 0)}
              </span>
            </div>
          </div>

          {/* QR Code Container Box */}
          <div className="relative p-3.5 bg-white rounded-2xl border-2 border-indigo-100 shadow-md flex flex-col items-center w-full max-w-[280px]">
            {/* Dynamic Live Tag */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{shouldShowCustomStandee ? 'Standee QR' : 'Dynamic UPI'}</span>
            </div>

            {/* QR Viewport */}
            <div className="w-52 h-52 sm:w-56 sm:h-56 rounded-xl overflow-hidden bg-white p-2 flex items-center justify-center">
              {shouldShowCustomStandee ? (
                <img
                  src={resolvedStandeeUrl}
                  onError={() => setStandeeImgError(true)}
                  alt="Society Payment UPI QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="p-1 bg-white flex items-center justify-center">
                  <QRCodeSVG
                    value={dynamicUpiUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Verified Payee Details Box */}
            <div className="w-full mt-2 pt-2 border-t border-slate-100 flex flex-col items-center gap-0.5">
              <span className="text-xs font-bold text-slate-800 block truncate max-w-[240px]">
                {config.upi_payee_name || 'Rosewood Estate Society'}
              </span>
              
              {/* Copyable UPI ID Pill */}
              <button
                type="button"
                onClick={handleCopyUpi}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-mono bg-indigo-50/80 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-all cursor-pointer border border-indigo-100"
              >
                <span>{config.upi_id || DEFAULT_UPI_CONFIG.upi_id}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-indigo-500" />
                )}
              </button>
            </div>
          </div>

          {/* Supported UPI Apps */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <span>Accepted via:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">GPay</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">PhonePe</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">Paytm</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">BHIM UPI</span>
          </div>

          {/* Action Buttons */}
          <div className="w-full pt-1 space-y-2">
            {/* Direct Open in UPI App button (for mobile browser users) */}
            <a
              href={dynamicUpiUrl}
              className="sm:hidden flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Open in UPI App on this Phone</span>
            </a>

            <Button
              type="button"
              variant="primary"
              onClick={handleDoneClick}
              className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Done / Capture Payment Receipt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Admin Configure QR Modal */}
      {canConfigure && (
        <ConfigureUpiQrModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          eventId={eventId}
          onSaved={(newCfg) => setConfig(newCfg)}
        />
      )}
    </>
  );
};

export default DynamicUpiQrModal;
