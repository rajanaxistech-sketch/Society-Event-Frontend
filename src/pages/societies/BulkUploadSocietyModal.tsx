import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { importsService } from '../../api/importsService';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  FileText,
  Building2,
  Layers,
  Home,
  Users,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BulkUploadSocietyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkUploadSocietyModal: React.FC<BulkUploadSocietyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showColumnSpec, setShowColumnSpec] = useState(false);

  const handleDownloadSample = async (format: 'csv' | 'xlsx' = 'csv') => {
    try {
      setIsDownloading(true);
      const blob = await importsService.downloadTemplate('all', format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sample_Society_Bulk_Upload_Template.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Sample ${format.toUpperCase()} template downloaded successfully!`);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to download sample CSV template'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Invalid file format. Please upload a .csv or .xlsx file.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds the 15MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!selectedFile) {
      toast.warning('Please choose or drag a CSV/Excel file to upload');
      return;
    }

    try {
      setIsUploading(true);
      const res = await importsService.uploadFile(selectedFile, 'all');

      if (res.success && res.data) {
        toast.success(
          `File parsed successfully! Found ${res.data.total_rows || 0} rows (${res.data.valid_rows || 0} valid, ${res.data.invalid_rows || 0} errors).`
        );
        onClose();
        if (onSuccess) onSuccess();
        navigate(`/imports/${res.data.id}`);
      } else {
        toast.error(res.message || 'File upload and parsing failed');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to upload and validate CSV file'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Bulk Upload Society Data
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Upload Societies, Blocks, Floors, Flats, Bungalows, Residents & Owners in a single CSV
            </p>
          </div>
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDownloadSample('csv')}
              isLoading={isDownloading}
              leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Download Sample CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadSample('xlsx')}
              isLoading={isDownloading}
              leftIcon={<Download className="w-4 h-4 text-slate-500" />}
              className="text-slate-600 hover:bg-slate-100 hidden sm:inline-flex"
            >
              Download Sample .XLSX
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleUploadAndPreview}
              isLoading={isUploading}
              disabled={!selectedFile || isUploading}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Upload & Preview
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Hierarchy Overview Banner */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-slate-50 rounded-xl border border-indigo-100 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                All-In-One Unified Structure Hierarchy
              </span>
              <p className="text-xs text-slate-600 mt-1">
                A single CSV file creates the complete property structure and resident hierarchy automatically in one go:
              </p>
            </div>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-700 rounded-full shrink-0">
              Master Format
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <div className="p-2.5 bg-white rounded-lg border border-indigo-100/80 shadow-2xs text-center">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md w-fit mx-auto mb-1">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 block">1 Society</span>
              <span className="text-[10px] text-slate-400">Complex / CHS</span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-indigo-100/80 shadow-2xs text-center">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md w-fit mx-auto mb-1">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 block">Blocks / Wings</span>
              <span className="text-[10px] text-slate-400">e.g. Block A, B</span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-indigo-100/80 shadow-2xs text-center">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md w-fit mx-auto mb-1">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 block">Floors</span>
              <span className="text-[10px] text-slate-400">1st, 2nd Floor...</span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-indigo-100/80 shadow-2xs text-center">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md w-fit mx-auto mb-1">
                <Home className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 block">Flats / Villas</span>
              <span className="text-[10px] text-slate-400">Flat 101, Villa 1</span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-indigo-100/80 shadow-2xs text-center col-span-2 sm:col-span-1">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md w-fit mx-auto mb-1">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 block">Residents & Owner</span>
              <span className="text-[10px] text-purple-600 font-semibold">1 Owner per unit</span>
            </div>
          </div>
        </div>

        {/* Drag & Drop File Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.005]'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-between gap-4 p-2">
              <div className="flex items-center gap-3 text-left">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 truncate max-w-sm">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull;{' '}
                    <span className="text-emerald-700 font-medium">Ready for validation</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="w-12 h-12 mx-auto bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag and drop your CSV file here
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supports .csv, .xlsx, .xls (Up to 15MB)
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors">
                <FileText className="w-3.5 h-3.5" /> Select CSV File
              </div>
            </div>
          )}
        </div>

        {/* Quick Important Guidelines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900 block">Single Primary Owner Rule</span>
              <span className="text-amber-800">
                A flat or bungalow can have multiple family members/residents, but only <strong>one</strong> row per unit should have <code>Is Primary Owner = Yes</code>.
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-900 block">Hierarchy Grouping</span>
              <span className="text-blue-800">
                Rows with the same Block Name, Floor Number, and Flat Number are automatically grouped under the same unit.
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Column Specs & Sample Format */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowColumnSpec(!showColumnSpec)}
            className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              View Supported CSV Column Headers & Examples
            </span>
            {showColumnSpec ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showColumnSpec && (
            <div className="p-4 space-y-3 bg-white text-xs border-t border-slate-200 max-h-56 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider text-indigo-700">
                    Required Columns:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 mt-1">
                    <li><code>Society Name *</code> (e.g. Green Valley CHS)</li>
                    <li><code>Unit Type</code> (Flat or Bungalow)</li>
                    <li><code>Block Name (Flats)</code> (e.g. Block A, Tower 1)</li>
                    <li><code>Floor Number (Flats)</code> (e.g. 1, 2, 3...)</li>
                    <li><code>Flat Number (Flats)</code> (e.g. 101, 102...)</li>
                    <li><code>Bungalow Number</code> (if Bungalow unit)</li>
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-700">
                    Optional Details:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 mt-1">
                    <li><code>Society Code</code>, <code>Society Address</code>, <code>City</code></li>
                    <li><code>Block Code</code>, <code>Floor Name</code>, <code>Flat Type</code> (3 BHK)</li>
                    <li><code>Resident Name</code>, <code>Resident Phone</code>, <code>Resident Email</code></li>
                    <li><code>Relationship To Owner</code> (Self, Spouse, Child, Tenant)</li>
                    <li><code>Is Primary Owner (Yes/No)</code></li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Tip: Download the sample CSV to get the pre-filled template with accurate columns.
                </span>
                <button
                  type="button"
                  onClick={() => handleDownloadSample('csv')}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BulkUploadSocietyModal;
