import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { circularsService } from '../../api/circularsService';
import { eventsService } from '../../api/eventsService';
import { CircularItem, EventItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  X,
  ScrollText,
  Save,
  AlertCircle,
  Building2,
  Hash,
  FileCheck,
} from 'lucide-react';

export const EditCircularPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();

  const [circular, setCircular] = useState<CircularItem | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3 Primary Fields
  const [serialNumber, setSerialNumber] = useState('');
  const [title, setTitle] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  // Secondary Context
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState<string>('published');
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCircular = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await circularsService.getById(id);
      if (res.success && res.data) {
        const item = res.data;
        setCircular(item);
        setSerialNumber(item.serial_number || '');
        setTitle(item.title);
        setEventId(item.event_id || '');
        setStatus(item.status);

        // Load events for this society
        const eventsRes = await eventsService.getAll({
          societyId: item.society_id,
          limit: 100,
        });
        if (eventsRes.success && eventsRes.data) {
          setEvents(eventsRes.data);
        }
      } else {
        setError(res.message || 'Circular not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load circular details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCircular();
  }, [id]);

  const validateFile = (selectedFile: File): boolean => {
    setFileError(null);
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExts.includes(ext)) {
      setFileError('Only PDF and image files are allowed.');
      return false;
    }

    if (selectedFile.size > 30 * 1024 * 1024) {
      setFileError('File size exceeds the 30 MB limit.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setNewFile(selected);
      } else {
        e.target.value = '';
        setNewFile(null);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateTitle = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Circular name is required';
    }
    if (trimmed.length < 3) {
      return 'Circular name must be at least 3 characters';
    }
    if (trimmed.length > 50) {
      return 'Circular name cannot exceed 50 characters';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const titleErr = validateTitle(title);
    if (titleErr) newErrors.title = titleErr;

    if (serialNumber.trim().length > 20) {
      newErrors.serialNumber = 'Serial number cannot exceed 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !id) {
      toast.error('Please check the form for errors.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim().slice(0, 50));
      formData.append('serial_number', serialNumber.trim().slice(0, 20));
      formData.append('event_id', eventId);
      formData.append('status', status);

      if (newFile) {
        formData.append('attachment', newFile);
      }

      const res = await circularsService.update(id, formData);
      if (res.success && res.data) {
        toast.success(`Circular "${res.data.title}" updated successfully.`);
        if (eventId) {
          navigate(`/events/${encodeId(eventId)}?tab=circulars`);
        } else {
          navigate(AppRoutes.CIRCULARS);
        }
      } else {
        toast.error(res.message || 'Failed to update circular');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update circular'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Spinner size="lg" label="Loading circular details..." />
      </div>
    );
  }

  if (error || !circular) {
    return <ErrorState message={error || 'Circular not found'} onRetry={fetchCircular} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Edit Circular</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Update Serial Number, Circular Name, or PDF Document
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Core 3 Fields Card */}
        <Card title="Circular Information" subtitle="Update the 3 core fields">
          <div className="space-y-3.5">
            {/* Field 1: Serial Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-indigo-500" />
                  <span>1. Circular Serial Number</span>
                  <span className="text-slate-400 font-normal text-[11px]">(e.g. CIRC-01)</span>
                </label>
                <span className={`text-[10px] font-medium ${serialNumber.length >= 20 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                  {serialNumber.length}/20
                </span>
              </div>
              <Input
                placeholder="e.g. CIRC-01 or 001"
                value={serialNumber}
                maxLength={20}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 20);
                  setSerialNumber(val);
                  if (errors.serialNumber) {
                    setErrors((prev) => ({ ...prev, serialNumber: '' }));
                  }
                }}
                error={errors.serialNumber}
                helperText={!errors.serialNumber ? 'Identifier number for this circular notice (max 20 characters)' : undefined}
              />
            </div>

            {/* Field 2: Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <span>2. Circular Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className={`text-[10px] font-medium ${title.length >= 50 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                  {title.length}/50
                </span>
              </div>
              <Input
                placeholder="e.g. Navratri 2026 Guidelines"
                value={title}
                maxLength={50}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 50);
                  setTitle(val);
                  if (errors.title) {
                    const err = validateTitle(val);
                    setErrors((prev) => ({ ...prev, title: err }));
                  }
                }}
                onBlur={() => {
                  const err = validateTitle(title);
                  if (err) setErrors((prev) => ({ ...prev, title: err }));
                }}
                error={errors.title}
                helperText={!errors.title ? 'Official heading or topic of the circular (max 50 characters)' : undefined}
              />
            </div>

            {/* Field 3: Attachment Card */}
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>3. Circular PDF Document</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
              />

              {/* Existing attachment info */}
              {circular.file_url && !newFile && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 overflow-hidden">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                      <FileCheck className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate" title={circular.file_name || 'Current PDF Attachment'}>
                        {circular.file_name || 'Current PDF Attachment'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px]">
                          {circular.file_type?.toUpperCase() || 'PDF'}
                        </span>
                        <span>&bull;</span>
                        <span>Current Attachment</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace PDF
                  </Button>
                </div>
              )}

              {/* Replacement or New File Selected */}
              {newFile && (
                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 flex items-center justify-between gap-3 overflow-hidden shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <FileCheck className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate" title={newFile.name}>
                        {newFile.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded text-[10px]">
                          PDF
                        </span>
                        <span>&bull;</span>
                        <span>{formatFileSize(newFile.size)}</span>
                        <span>&bull;</span>
                        <span className="text-indigo-600 font-semibold">New PDF selected</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/60 rounded-md transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove selected file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {!circular.file_url && !newFile && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer group"
                >
                  <UploadCloud className="w-5 h-5 text-indigo-600 mb-1" />
                  <p className="text-xs font-bold text-slate-800">Upload Circular PDF</p>
                </div>
              )}

              {fileError && (
                <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-semibold bg-red-50 p-2 rounded-lg border border-red-200 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditCircularPage;

