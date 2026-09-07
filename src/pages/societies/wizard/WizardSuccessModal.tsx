import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import {
  CheckCircle2,
  Building2,
  UploadCloud,
  UserPlus,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SocietyItem } from '../../../types';
import { encodeId } from '../../../utils/idObfuscator';

interface WizardSuccessModalProps {
  isOpen: boolean;
  society: SocietyItem | null;
  summaryData: {
    totalBlocks: number;
    totalFloors: number;
    totalFlats: number;
    totalShops: number;
    totalBungalows: number;
  };
  onClose: () => void;
}

export const WizardSuccessModal: React.FC<WizardSuccessModalProps> = ({
  isOpen,
  society,
  summaryData,
  onClose,
}) => {
  const navigate = useNavigate();
  if (!society) return null;

  const societyIdEncoded = encodeId(society.id);

  const handleNavigate = (tab: string) => {
    onClose();
    navigate(`/societies/${societyIdEncoded}?tab=${tab}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="text-center py-2 space-y-6">
        {/* Celebration Header */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-1 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            Society Onboarded Successfully
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {society.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Code: <strong className="text-slate-800">{society.code || 'N/A'}</strong> &bull; Entire building hierarchy created and ready.
          </p>
        </div>

        {/* Structure Generation Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
          <div className="p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-semibold block">Blocks</span>
            <span className="text-lg font-bold text-slate-900">{summaryData.totalBlocks} Blocks</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-semibold block">Residential Units</span>
            <span className="text-lg font-bold text-indigo-600">{summaryData.totalFlats} Flats</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-semibold block">Commercial Shops</span>
            <span className="text-lg font-bold text-emerald-600">{summaryData.totalShops} Shops</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-semibold block">Villas / Bungalows</span>
            <span className="text-lg font-bold text-amber-600">{summaryData.totalBungalows} Villas</span>
          </div>
        </div>

        {/* Next Recommended Actions */}
        <div className="space-y-3 text-left">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            What would you like to do next?
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: Explore Structure */}
            <button
              type="button"
              onClick={() => handleNavigate('structure')}
              className="p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Structure Explorer
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  View and manage blocks, floors, shops, and flat unit matrix.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 mt-3 inline-flex items-center gap-1">
                Explore &rarr;
              </span>
            </button>

            {/* Action 2: Import Owners */}
            <button
              type="button"
              onClick={() => handleNavigate('import')}
              className="p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Import Owners Excel
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Download pre-filled template and bulk import resident data.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 mt-3 inline-flex items-center gap-1">
                Import Data &rarr;
              </span>
            </button>

            {/* Action 3: Add Society User */}
            <button
              type="button"
              onClick={() => handleNavigate('users')}
              className="p-4 rounded-xl border-2 border-purple-100 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-400 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Society Admin Users
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Create admin or staff accounts (quota meter tracking).
                </p>
              </div>
              <span className="text-xs font-bold text-purple-600 mt-3 inline-flex items-center gap-1">
                Manage Users &rarr;
              </span>
            </button>
          </div>
        </div>

        {/* Footer fallback */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigate('overview')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Go to Society Overview Page
          </Button>
        </div>
      </div>
    </Modal>
  );
};
