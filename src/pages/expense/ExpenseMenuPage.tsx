import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { expenseCategoriesService } from '../../api/expenseCategoriesService';
import { expensesService } from '../../api/expensesService';
import { Receipt, Tag, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

export const ExpenseMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedSocietyId } = useAuth();
  const [expensesCount, setExpensesCount] = useState<number | undefined>(undefined);
  const [categoriesCount, setCategoriesCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    Promise.all([
      expensesService.getAll({ limit: 1, societyId: selectedSocietyId || undefined }).catch(() => null),
      expenseCategoriesService.getAll({ limit: 1, societyId: selectedSocietyId || undefined }).catch(() => null),
    ]).then(([expRes, catRes]) => {
      if (expRes?.meta) setExpensesCount(expRes.meta.total);
      if (catRes?.meta) setCategoriesCount(catRes.meta.total);
    });
  }, [selectedSocietyId]);

  const menuItems = [
    {
      title: 'Expense Category',
      icon: Tag,
      iconStyle: 'bg-purple-50 text-purple-600 border border-purple-100 shadow-purple-100/50',
      badge: categoriesCount,
      to: AppRoutes.EXPENSE_CATEGORIES,
      description: 'Manage expense category heads',
    },
    {
      title: 'Expenses',
      icon: Receipt,
      iconStyle: 'bg-rose-50 text-rose-600 border border-rose-100 shadow-rose-100/50',
      badge: expensesCount,
      to: AppRoutes.EXPENSES,
      description: 'Record & view event expenses',
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-4 pt-1">
      {/* Title Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.DASHBOARD)}
            className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Back to Admin Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Expense Management</h1>
            <p className="text-[11.5px] text-slate-500 font-medium">Select a section to manage</p>
          </div>
        </div>
      </div>

      {/* 2 Submenu Cards Grid matching Quick Launcher design */}
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
              {/* Icon Container */}
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
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold text-slate-800 text-center leading-tight tracking-tight group-hover:text-indigo-600 transition-colors block">
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  {item.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExpenseMenuPage;
