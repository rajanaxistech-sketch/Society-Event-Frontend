import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importsService } from '../../api/importsService';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  Table as TableIcon,
} from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

export const ImportUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [entityType, setEntityType] = useState<'all' | 'flats' | 'bungalows' | 'residents'>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx' = 'csv') => {
    try {
      setIsDownloading(true);
      const blob = await importsService.downloadTemplate(entityType, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const entityLabel =
        entityType === 'all'
          ? 'Society_Bulk_Upload'
          : entityType === 'bungalows'
          ? 'Bungalows_Villas'
          : entityType === 'flats'
          ? 'Apartment_Flats'
          : 'Residents_Occupants';
      a.download = `Sample_Template_${entityLabel}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Downloaded sample ${format.toUpperCase()} template for ${entityLabel.replace(/_/g, ' ')}`);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to download sample template'));
    } finally {
      setIsDownloading(false);
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

  const entityGuides = {
    all: {
      title: 'Master Society Hierarchy Import Format (All-In-One)',
      description: 'Single unified CSV to import Society, Blocks, Floors, Flats, Bungalows, Residents & Primary Owners in one step.',
      required: [
        'Society Name *',
        'Unit Type (Flat/Bungalow) *',
        'Block Name (for Flats) *',
        'Floor Number (for Flats) *',
        'Flat Number (for Flats) *',
        'Bungalow Number (for Bungalows) *',
      ],
      optional: [
        'Society Code',
        'Society Address',
        'City',
        'Block Code',
        'Floor Name (e.g. 1st Floor)',
        'Flat Type (e.g. 3 BHK)',
        'Bungalow Type (e.g. 4 BHK Villa)',
        'Resident Name',
        'Resident Phone',
        'Resident Email',
        'Relationship To Owner (Self, Spouse, Child, Tenant)',
        'Is Primary Owner (Yes / No)',
      ],
      sample: [
        {
          'Society Name': 'Green Valley CHS',
          'Unit Type': 'Flat',
          'Block Name': 'Block A',
          'Floor Number': '1',
          'Flat Number': '101',
          'Flat Type': '3 BHK',
          'Resident Name': 'Rajesh Kumar',
          'Relationship': 'Self',
          'Is Primary Owner': 'Yes',
        },
        {
          'Society Name': 'Green Valley CHS',
          'Unit Type': 'Flat',
          'Block Name': 'Block A',
          'Floor Number': '1',
          'Flat Number': '101',
          'Flat Type': '3 BHK',
          'Resident Name': 'Sunita Kumar',
          'Relationship': 'Spouse',
          'Is Primary Owner': 'No',
        },
        {
          'Society Name': 'Green Valley CHS',
          'Unit Type': 'Bungalow',
          'Block Name': '',
          'Floor Number': '',
          'Bungalow Number': 'Villa-101',
          'Bungalow Type': '4 BHK Villa',
          'Resident Name': 'Vikram Mehta',
          'Relationship': 'Self',
          'Is Primary Owner': 'Yes',
        },
      ],
    },
    bungalows: {
      title: 'Bungalows & Villas Import Format',
      description: 'Import independent villas, bungalows, row houses, and their primary owners / residents.',
      required: ['Society Name *', 'Bungalow / Villa Number *'],
      optional: [
        'Society Code',
        'Society Address',
        'City',
        'Bungalow / Villa Type (e.g., 4 BHK Villa, Duplex)',
        'Resident / Owner Name',
        'Resident Phone',
        'Resident Email',
        'Relationship To Owner (Self, Tenant, etc.)',
        'Is Primary Owner (Yes / No)',
      ],
      sample: [
        {
          'Society Name': 'Green Valley CHS',
          'Bungalow / Villa Number': 'Villa-101',
          'Bungalow Type': '4 BHK Luxury Villa',
          'Resident / Owner Name': 'Vikram Mehta',
          'Resident Phone': '9876543250',
          'Is Primary Owner': 'Yes',
        },
        {
          'Society Name': 'Green Valley CHS',
          'Bungalow / Villa Number': 'Villa-102',
          'Bungalow Type': '3 BHK Duplex Villa',
          'Resident / Owner Name': 'Ananya Sharma',
          'Resident Phone': '9876543211',
          'Is Primary Owner': 'Yes',
        },
      ],
    },
    flats: {
      title: 'Apartment Flats Import Format',
      description: 'Import blocks / towers, floors, flat units, and their resident / owner details.',
      required: ['Society Name *', 'Block / Tower Name *', 'Floor Number *', 'Flat / Unit Number *'],
      optional: [
        'Society Code',
        'Society Address',
        'City',
        'Block Code',
        'Floor Name (e.g. 1st Floor)',
        'Flat Type (e.g., 3 BHK, 2 BHK)',
        'Resident / Owner Name',
        'Resident Phone',
        'Resident Email',
        'Relationship To Owner',
        'Is Primary Owner (Yes / No)',
      ],
      sample: [
        {
          'Society Name': 'Green Valley CHS',
          'Block / Tower Name': 'Block A',
          'Floor Number': '1',
          'Flat / Unit Number': '101',
          'Flat Type': '3 BHK',
          'Resident / Owner Name': 'Rajesh Kumar',
          'Resident Phone': '9876543210',
          'Is Primary Owner': 'Yes',
        },
        {
          'Society Name': 'Green Valley CHS',
          'Block / Tower Name': 'Block A',
          'Floor Number': '1',
          'Flat / Unit Number': '102',
          'Flat Type': '2 BHK',
          'Resident / Owner Name': 'Pooja Patel',
          'Resident Phone': '9876543220',
          'Is Primary Owner': 'Yes',
        },
      ],
    },
    residents: {
      title: 'Residents & Occupants Import Format',
      description: 'Import occupant / resident rosters and map them to their corresponding flats or bungalows.',
      required: [
        'Society Name *',
        'Unit Type (Flat/Bungalow) *',
        'Flat Number (for Flats) or Bungalow Number (for Bungalows) *',
        'Resident Full Name *',
      ],
      optional: [
        'Society Code',
        'Block Name (for Flats)',
        'Floor Number (for Flats)',
        'Resident Phone',
        'Resident Email',
        'Relationship To Owner (Self, Spouse, Child, Tenant)',
        'Is Primary Owner (Yes / No)',
      ],
      sample: [
        {
          'Society Name': 'Green Valley CHS',
          'Unit Type': 'Flat',
          'Block Name': 'Block A',
          'Floor Number': '1',
          'Flat Number': '101',
          'Resident Name': 'Rajesh Kumar',
          'Phone': '9876543210',
          'Is Primary Owner': 'Yes',
        },
        {
          'Society Name': 'Green Valley CHS',
          'Unit Type': 'Bungalow',
          'Bungalow Number': 'Villa-101',
          'Resident Name': 'Vikram Mehta',
          'Phone': '9876543250',
          'Is Primary Owner': 'Yes',
        },
      ],
    },
  };

  const currentGuide = entityGuides[entityType];

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.IMPORTS)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Upload Import File</h1>
          <p className="text-[11px] text-slate-500">
            Stage spreadsheet records (.csv, .xlsx) for validation and bulk ingestion.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-3 sm:space-y-3.5">
        <Card
          title={
            <div className="flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>File & Data Configuration</span>
            </div>
          }
          headerAction={
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('csv')}
                isLoading={isDownloading}
                leftIcon={<Download className="w-3 h-3 text-emerald-600" />}
                title="Download formatted CSV sample file"
              >
                Sample CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('xlsx')}
                isLoading={isDownloading}
                leftIcon={<Download className="w-3 h-3 text-indigo-600" />}
                title="Download formatted Excel sample file"
              >
                Sample XLSX
              </Button>
            </div>
          }
        >
          <div className="space-y-3 sm:space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Select
                label="Target Ingestion Entity"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                requiredIndicator
              >
                <option value="all">Complete Master Society Hierarchy (All-in-One: Blocks, Floors, Flats, Bungalows, Residents & Owners)</option>
                <option value="flats">Apartment Flats (with Block & Floor)</option>
                <option value="bungalows">Bungalows & Villas</option>
                <option value="residents">Residents & Occupants (Persons)</option>
              </Select>

              <div className="flex flex-col justify-end">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Sample Template:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('csv')}
                      className="px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> .CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="px-2 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> .XLSX
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Column Structure Guide */}
            <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <h4 className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">
                    {currentGuide.title}
                  </h4>
                </div>
                <span className="text-[10px] text-indigo-600 font-medium">Auto-mapped by Header Names</span>
              </div>
              <p className="text-[11px] text-slate-600">{currentGuide.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5 text-[11px]">Required Columns:</span>
                  <div className="flex flex-wrap gap-1">
                    {currentGuide.required.map((req, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5 text-[11px]">Optional Columns:</span>
                  <div className="flex flex-wrap gap-1">
                    {currentGuide.optional.map((opt, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample Data Table Preview */}
              <div className="mt-2 pt-2 border-t border-indigo-100">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Sample Data Structure:
                </span>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-[10px] text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        {Object.keys(currentGuide.sample[0]).map((h) => (
                          <th key={h} className="px-2 py-1">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentGuide.sample.map((sRow, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {Object.values(sRow).map((val, cIdx) => (
                            <td key={cIdx} className="px-2 py-1 text-slate-700">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Drag & Drop File Container */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Spreadsheet File (CSV, XLSX, XLS) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                  {selectedFile ? (
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{selectedFile.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to replace
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold text-xs text-indigo-600 block">
                        Click to browse file
                      </span>
                      <span className="text-[10px] text-slate-400">Supports .CSV, .XLSX, .XLS up to 10MB</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(AppRoutes.IMPORTS)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUploading}
                disabled={!selectedFile}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
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

