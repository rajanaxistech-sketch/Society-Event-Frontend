import React from 'react';
import { ContractItemModel } from '../../../types';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { Printer, X, Building2, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

interface PrintableWorkOrderProps {
  contract: ContractItemModel;
  onClose: () => void;
}

export const PrintableWorkOrder: React.FC<PrintableWorkOrderProps> = ({ contract, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const society = contract.event?.society;
  const event = contract.event;
  const vendor = contract.vendor;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Print Toolbar - Hidden during print */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-800 text-white border-b border-slate-700 rounded-t-xl print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-sm">Official Work Order / Contract Document</span>
            <span className="text-xs text-slate-400">({contract.contract_number})</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print / Save as PDF
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Work Order Document Body */}
        <div className="p-8 sm:p-12 space-y-8 print:p-6 text-slate-800">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{society?.name || 'Society / Resident Welfare Association'}</h2>
                    <p className="text-xs text-slate-500">{society?.address_line1 ? `${society.address_line1}, ${society.city || ''}` : 'Event Organizing Committee'}</p>
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-right">
                <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md font-mono text-sm font-bold">
                  {contract.contract_number}
                </span>
                <p className="text-xs text-slate-500 mt-1">Date: {formatDate(contract.created_at)}</p>
                <div className="mt-1 flex items-center justify-end gap-1.5">
                  <StatusBadge status={contract.status} size="sm" />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Work Order Title</span>
                <h1 className="text-lg font-bold text-slate-900 mt-0.5">{contract.title}</h1>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Associated Event</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{event?.name || 'Society Event'}</p>
              </div>
            </div>
          </div>

          {/* Party Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            {/* Vendor / Contractor Info */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
                Vendor / Contractor Details
              </span>
              <p className="font-bold text-sm text-slate-900">{vendor?.vendor_name || 'N/A'}</p>
              {vendor?.short_name && <p className="text-slate-500">Short Name: {vendor.short_name}</p>}
              {vendor?.mobile_no && <p className="text-slate-600">Contact: {vendor.mobile_no}</p>}
              {vendor?.email && <p className="text-slate-600">Email: {vendor.email}</p>}
              {vendor?.address && <p className="text-slate-600">Address: {vendor.address}</p>}
            </div>

            {/* Contract Period & Service Category */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
                Execution Period & Service Group
              </span>
              <p className="text-slate-700">
                <strong className="text-slate-900">Duration:</strong> {formatDate(contract.start_date)} to {formatDate(contract.end_date)}
              </p>
              {(contract.start_time || contract.end_time) && (
                <p className="text-slate-600">
                  <strong className="text-slate-800">Timing:</strong> {contract.start_time || '--'} to {contract.end_time || '--'}
                </p>
              )}
              {contract.service_group && (
                <p className="text-slate-700">
                  <strong className="text-slate-900">Service Group:</strong> {contract.service_group.name}
                </p>
              )}
              {contract.expense_category && (
                <p className="text-slate-700">
                  <strong className="text-slate-900">Expense Category:</strong> {contract.expense_category.name}
                </p>
              )}
              <p className="text-slate-600">
                <strong className="text-slate-800">Contract Type:</strong> {contract.contract_type?.replace(/_/g, ' ').toUpperCase() || 'FIXED RATE'}
              </p>
            </div>
          </div>

          {/* Line Items / Deliverables Breakdown */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
              Deliverables & Itemized Breakdown
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Service Group / Category</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {contract.items && contract.items.length > 0 ? (
                    contract.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-900">{item.item_name}</p>
                          {item.description && <p className="text-[11px] text-slate-500">{item.description}</p>}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {item.service_group?.name || '--'}
                          {item.expense_category && <span className="text-[10px] text-slate-400 block">{item.expense_category.name}</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">{item.quantity}</td>
                        <td className="py-2 px-3 text-center text-slate-500">{item.unit || 'Nos'}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(item.unit_price ?? item.unit_rate ?? 0)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900">{formatCurrency(item.total_amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        Lump sum contract as per scope of work.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-day Execution Schedule (if present) */}
          {contract.items?.some((i) => i.schedules && i.schedules.length > 0) && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                3. Day-Wise Execution Schedule
              </h3>
              <div className="space-y-2">
                {contract.items.map(
                  (item) =>
                    item.schedules &&
                    item.schedules.length > 0 && (
                      <div key={item.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-800 mb-2">Item: {item.item_name}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {item.schedules.map((sch, sIdx) => (
                            <div key={sch.id || sIdx} className="bg-white p-2.5 rounded border border-slate-200 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-indigo-700">
                                  {sch.event_day?.display_name || `Day ${sch.event_day?.day_number || sIdx + 1}`}
                                </span>
                                <span className="text-[10px] text-slate-500">{sch.event_day?.date ? formatDate(sch.event_day.date) : ''}</span>
                              </div>
                              <p className="text-slate-700 mt-1">
                                Qty: <strong>{sch.quantity ?? sch.quantity_for_day ?? 1}</strong> {item.unit || 'Nos'}
                              </p>
                              {(sch.start_time || sch.end_time) && (
                                <p className="text-[11px] text-slate-500">
                                  Time: {sch.start_time || '--'} - {sch.end_time || '--'}
                                </p>
                              )}
                              {sch.special_instructions && (
                                <p className="text-[11px] text-slate-600 mt-1 italic">&ldquo;{sch.special_instructions}&rdquo;</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Commercial Summary Table */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Amount:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(contract.sub_total_amount)}</span>
              </div>
              {Number(contract.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount Applied:</span>
                  <span className="font-semibold">- {formatCurrency(contract.discount_amount)}</span>
                </div>
              )}
              {contract.tax_applicable && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({contract.tax_percentage || 0}%):</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(contract.tax_amount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Contract Value:</span>
                <span className="text-indigo-700">{formatCurrency(contract.total_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Advance Agreed:</span>
                <span className="font-medium text-slate-800">{formatCurrency(contract.advance_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Paid to Date:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(contract.total_paid)}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-200">
                <span>Remaining Due:</span>
                <span className={Number(contract.remaining_balance) > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                  {formatCurrency(contract.remaining_balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          {contract.payment_terms && (
            <div className="space-y-2 text-xs border-t border-slate-200 pt-4">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Payment Terms</h4>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{contract.payment_terms}</p>
              </div>
            </div>
          )}

          {/* Signatures & Execution Section */}
          <div className="pt-12 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-16">
              <div className="border-t border-slate-400 pt-2 text-center sm:text-left">
                <p className="font-bold text-slate-900">Authorized Society Signatory</p>
                <p className="text-[11px] text-slate-500">Managing Committee / Event Convener</p>
                {contract.approver && (
                  <p className="text-[10px] text-indigo-600 mt-1">
                    Approved by: {contract.approver.full_name} ({contract.approver.email})
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-16">
              <div className="border-t border-slate-400 pt-2 text-center sm:text-right">
                <p className="font-bold text-slate-900">Vendor / Contractor Signatory</p>
                <p className="text-[11px] text-slate-500">For {vendor?.vendor_name || 'Contractor'}</p>
                <p className="text-[10px] text-slate-400 mt-1">Signature & Official Stamp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
