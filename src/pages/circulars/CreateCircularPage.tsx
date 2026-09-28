import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { circularsService } from '../../api/circularsService';
import { societiesService } from '../../api/societiesService';
import { eventsService } from '../../api/eventsService';
import { SocietyItem, EventItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  ScrollText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  Save,
  Building2,
} from 'lucide-react';

export const CreateCircularPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isSuperAdmin, selectedSocietyId } = useAuth();

  const urlParams = new URLSearchParams(location.search);
  const initialEventId = decodeId(urlParams.get('eventId') || '');
  const initialSocietyId = decodeId(urlParams.get('societyId') || '') || selectedSocietyId || '';

  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [, setEvents] = useState<EventItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Core Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Context & Status
  const [societyId, setSocietyId] = useState(initialSocietyId);
  const [eventId, setEventId] = useState(initialEventId);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load societies for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      societiesService.getAll({ limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setSocieties(res.data);
          if (!societyId && res.data.length > 0) {
            setSocietyId(res.data[0].id);
          }
        }
      });
    }
  }, [isSuperAdmin]);

  // Load events filtered by selected society and automatically default to Navratri 2026 event
  useEffect(() => {
    const targetSocId = societyId || selectedSocietyId;
    if (targetSocId) {
      eventsService.getAll({ societyId: targetSocId, limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setEvents(res.data);
          const navratriEvent =
            res.data.find((e) => e.is_navratri || e.name?.toLowerCase().includes('navratri')) ||
            res.data[0];
          if (navratriEvent) {
            setEventId(navratriEvent.id);
          }
        }
      });
    }
  }, [societyId, selectedSocietyId]);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    if (isImg) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const validateFile = (selectedFile: File): boolean => {
    setFileError(null);
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExts.includes(ext) && !selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
      setFileError('Invalid format. Please upload a PDF, JPG, PNG, or WebP file.');
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
        setFile(selected);
      } else {
        e.target.value = '';
        setFile(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (validateFile(selected)) {
        setFile(selected);
      }
    }
  };

  const validateTitle = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Circular title is required';
    }
    if (trimmed.length < 3) {
      return 'Circular title must be at least 3 characters';
    }
    if (trimmed.length > 200) {
      return 'Circular title cannot exceed 200 characters';
    }
    return '';
  };

  const validateDescription = (val: string): string => {
    if (val.length > 500) {
      return 'Description cannot exceed 500 characters';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const titleErr = validateTitle(title);
    if (titleErr) newErrors.title = titleErr;

    const descErr = validateDescription(description);
    if (descErr) newErrors.description = descErr;

    if (isSuperAdmin && !societyId) {
      newErrors.societyId = 'Target society must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (submitStatus: 'draft' | 'published') => {
    if (!validateForm()) {
      toast.error('Please complete the required fields correctly.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim().slice(0, 200));
      if (description.trim()) {
        formData.append('description', description.trim().slice(0, 500));
      }
      formData.append('status', submitStatus);

      if (societyId) {
        formData.append('society_id', societyId);
      }
      if (eventId) {
        formData.append('event_id', eventId);
      }
      if (file) {
        formData.append('attachment', file);
      }

      const res = await circularsService.create(formData);
      if (res.success && res.data) {
        toast.success(
          submitStatus === 'published'
            ? `Circular "${res.data.title}" published successfully!`
            : `Circular "${res.data.title}" saved as draft.`
        );
        if (eventId) {
          navigate(`/events/${encodeId(eventId)}?tab=circulars`);
        } else {
          navigate(AppRoutes.CIRCULARS);
        }
      } else {
        toast.error(res.message || 'Failed to create circular');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create circular'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPdf = file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-slate-600 hover:text-slate-900"
        >
          Back
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
              Add Circular
            </h1>
            <p className="text-xs text-slate-500">
              Official society notice & announcement
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit('published');
        }}
        className="space-y-4"
      >
        <Card className="p-4 sm:p-6 shadow-xs border-slate-200/80">
          <div className="space-y-4">
            {/* Target Society selector for Super Admin */}
            {isSuperAdmin && (
              <div className="pb-3 border-b border-slate-100">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Target Society</span>
                  <span className="text-red-500">*</span>
                </label>
                <Select
                  value={societyId}
                  onChange={(e) => {
                    setSocietyId(e.target.value);
                    if (errors.societyId) setErrors((prev) => ({ ...prev, societyId: '' }));
                  }}
                  options={[
                    { label: 'Select Society', value: '' },
                    ...societies.map((s) => ({ label: s.name, value: s.id })),
                  ]}
                  error={errors.societyId}
                />
              </div>
            )}

            {/* Field 1: Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <span className={`text-[11px] ${title.length >= 190 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                  {title.length}/200
                </span>
              </div>
              <Input
                placeholder="e.g. Society Maintenance Notice or Event Schedule"
                value={title}
                maxLength={200}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 200);
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
              />
            </div>

            {/* Field 2: Description (Max 500 characters) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className={`text-[11px] ${description.length >= 480 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                value={description}
                maxLength={500}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 500);
                  setDescription(val);
                  if (errors.description) {
                    const err = validateDescription(val);
                    setErrors((prev) => ({ ...prev, description: err }));
                  }
                }}
                placeholder="Enter notice content, instructions, timing, or agenda points..."
                className="w-full px-3 py-2 text-xs sm:text-[13px] text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 leading-relaxed resize-y"
              />
              {errors.description && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.description}</p>
              )}
            </div>

            {/* Field 3: Attachment Dropzone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Attachment <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] text-slate-400">Max 30 MB</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
                className="hidden"
              />

              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 bg-slate-50/50 transition-all duration-150 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors mb-1.5">
                    <UploadCloud className="w-4.5 h-4.5 text-indigo-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                    Click to browse or drag & drop file
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    PDF, JPG, PNG, or WebP up to 30 MB
                  </p>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {previewUrl ? (
                      <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        {isPdf ? (
                          <FileCheck className="w-4.5 h-4.5 text-rose-600" />
                        ) : (
                          <ImageIcon className="w-4.5 h-4.5 text-indigo-600" />
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-600 uppercase">
                          {file.name.split('.').pop() || 'FILE'}
                        </span>
                        <span>&bull;</span>
                        <span>{formatFileSize(file.size)}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {fileError && (
                <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium bg-red-50 p-2 rounded-lg border border-red-200 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="text-slate-600 hover:text-slate-800"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Publish Circular
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateCircularPage;
