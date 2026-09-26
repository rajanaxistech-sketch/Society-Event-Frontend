import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { advertisementCategoriesService } from '../../api/advertisementCategoriesService';
import { advertisementsService } from '../../api/advertisementsService';
import { Megaphone, Layers } from 'lucide-react';

export const AdvertisingMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedSocietyId } = useAuth();
  const [adsCount, setAdsCount] = useState<number | undefined>(undefined);
  const [catCount, setCatCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    Promise.all([
      advertisementsService.getAll({ limit: 1, societyId: selectedSocietyId || undefined }).catch(() => null),
      advertisementCategoriesService.getAll({ limit: 1, societyId: selectedSocietyId || undefined }).catch(() => null),
    ]).then(([adsRes, catRes]) => {
      if (adsRes?.meta) setAdsCount(adsRes.meta.total);
      if (catRes?.meta) setCatCount(catRes.meta.total);
    });
  }, [selectedSocietyId]);

  const menuItems = [
    {
      title: 'Advertisement',
      icon: Megaphone,
      iconStyle: 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-indigo-100/50',
      badge: adsCount,
      to: AppRoutes.ADVERTISEMENTS,
    },
    {
      title: 'Advertisement Category',
      icon: Layers,
      iconStyle: 'bg-purple-50 text-purple-600 border border-purple-100 shadow-purple-100/50',
      badge: catCount,
      to: AppRoutes.ADVERTISEMENT_CATEGORIES,
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-4 pt-1">
      {/* Title Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Advertising</h1>
          <p className="text-[11.5px] text-slate-500 font-medium">Select a section to manage</p>
        </div>
      </div>

      {/* 2 Menu Cards Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => navigate(item.to)}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col items-center justify-center gap-2.5 shadow-2xs hover:shadow-sm hover:border-indigo-300 active:scale-[0.98] transition-all duration-150 cursor-pointer group text-center focus:outline-hidden"
            >
              {/* Icon */}
              <div className="relative">
                <div
                  className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 ${item.iconStyle}`}
                >
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-full bg-indigo-600 text-white text-[10.5px] font-bold flex items-center justify-center ring-2 ring-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <span className="text-[13px] font-bold text-slate-800 text-center leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdvertisingMenuPage;
