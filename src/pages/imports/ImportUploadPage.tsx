import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importsService } from '../../api/importsService';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

export const ImportUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [entityType, setEntityType] = useState<'residents' | 'flats' | 'bungalows'>('residents');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast.error('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warning('Please choose a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      const res = await importsService.uploadFile(selectedFile, entityType);

      if (res.success && res.data) {
        toast.success('File uploaded and parsed successfully.');
        navigate(`/imports/${res.data.id}`);
      } else {
        toast.error(res.message || 'File upload failed');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to upload and parse import file'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.IMPORTS)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Import File</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage spreadsheet records for validation and bulk ingestion.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              <span>File & Data Configuration</span>
            </div>
          }
        >
          <div className="space-y-6">
            <Select
              label="Target Ingestion Entity"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as any)}
              requiredIndicator
            >
              <option value="residents">Residents & Occupants (Persons)</option>
              <option value="flats">Apartment Flats (with Block & Floor)</option>
              <option value="bungalows">Bungalows & Villas</option>
            </Select>

            {/* Drag & Drop File Container */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Spreadsheet File (CSV, XLSX) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{selectedFile.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to replace
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold text-xs text-indigo-600 block">
                        Click to browse file
                      </span>
                      <span className="text-[11px] text-slate-400">Supports .CSV, .XLSX up to 10MB</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(AppRoutes.IMPORTS)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isUploading}
                disabled={!selectedFile}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Upload & Preview
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default ImportUploadPage;
