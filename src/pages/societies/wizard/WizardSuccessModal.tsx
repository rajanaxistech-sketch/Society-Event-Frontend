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
      <div className="text-center py-1 space-y-4">
        {/* Celebration Header */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-inner ring-4 ring-emerald-50">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-1 border border-emerald-200">
            <Sparkles className="w-3 h-3" />
            Society Onboarded Successfully
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {society.name}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Code: <strong className="text-slate-800">{society.code || 'N/A'}</strong> &bull; Entire building hierarchy created and ready.
          </p>
        </div>

        {/* Structure Generation Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block">Blocks</span>
            <span className="text-sm font-bold text-slate-900">{summaryData.totalBlocks} Blocks</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block">Residential Units</span>
            <span className="text-sm font-bold text-indigo-600">{summaryData.totalFlats} Flats</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block">Commercial Shops</span>
            <span className="text-sm font-bold text-emerald-600">{summaryData.totalShops} Shops</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block">Villas / Bungalows</span>
            <span className="text-sm font-bold text-amber-600">{summaryData.totalBungalows} Villas</span>
          </div>
        </div>

        {/* Next Recommended Actions */}
        <div className="space-y-2 text-left">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            What would you like to do next?
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Action 1: Explore Structure */}
            <button
              type="button"
              onClick={() => handleNavigate('structure')}
              className="p-3 rounded-lg border-2 border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-2xs"
            >
              <div>
                <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Structure Explorer
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  View and manage blocks, floors, shops, and flat unit matrix.
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 mt-2 inline-flex items-center gap-1">
                Explore &rarr;
              </span>
            </button>

            {/* Action 2: Import Owners */}
            <button
              type="button"
              onClick={() => handleNavigate('import')}
              className="p-3 rounded-lg border-2 border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-2xs"
            >
              <div>
                <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
                  <UploadCloud className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Import Owners Excel
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Download pre-filled template and bulk import resident data.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 mt-2 inline-flex items-center gap-1">
                Import Data &rarr;
              </span>
            </button>

            {/* Action 3: Add Society User */}
            <button
              type="button"
              onClick={() => handleNavigate('users')}
              className="p-3 rounded-lg border-2 border-purple-100 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-400 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-2xs"
            >
              <div>
                <div className="w-7 h-7 rounded-md bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Society Admin Users
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Create admin or staff accounts (quota meter tracking).
                </p>
              </div>
              <span className="text-[11px] font-bold text-purple-600 mt-2 inline-flex items-center gap-1">
                Manage Users &rarr;
              </span>
            </button>
          </div>
        </div>

        {/* Footer fallback */}
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-center">
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
