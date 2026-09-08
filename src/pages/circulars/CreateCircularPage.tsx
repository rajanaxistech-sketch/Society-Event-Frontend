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
import Textarea from '../../components/ui/Textarea';
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
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const CreateCircularPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, isSuperAdmin, selectedSocietyId } = useAuth();

  const urlParams = new URLSearchParams(location.search);
  const initialEventId = decodeId(urlParams.get('eventId') || '');
  const initialSocietyId = decodeId(urlParams.get('societyId') || '') || selectedSocietyId || '';

  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [societyId, setSocietyId] = useState(initialSocietyId);
  const [eventId, setEventId] = useState(initialEventId);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load societies
  useEffect(() => {
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setSocieties(res.data);
        if (!societyId && res.data.length > 0) {
          setSocietyId(res.data[0].id);
        }
      }
    });
  }, []);

  // Load events filtered by selected society
  useEffect(() => {
    if (societyId) {
      eventsService.getAll({ societyId, limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setEvents(res.data);
        }
      });
    } else {
      eventsService.getAll({ limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setEvents(res.data);
        }
      });
    }
  }, [societyId]);

  const validateFile = (selectedFile: File): boolean => {
    setFileError(null);
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExts.includes(ext)) {
      setFileError('Only PDF, PNG, JPG and JPEG files are allowed.');
      return false;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds the 10 MB limit.');
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (isSuperAdmin && !societyId) {
      newErrors.societyId = 'Target society must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('status', status);

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
          status === 'published'
            ? `Circular "${res.data.title}" published successfully!`
            : `Circular "${res.data.title}" saved as draft.`
        );
        navigate(`/circulars/${encodeId(res.data.id)}`);
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

  return (
    <div className="max-w-4xl mx-auto space-y-3.5">
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
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">Create Official Circular</h1>
            <p className="text-[11px] text-slate-500">
              Draft and publish circulars, collections, and event instructions for society members
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Card title="Circular Information" subtitle="Provide the notice title, details, and target association">
          <div className="space-y-2.5">
            {/* Title */}
            <Input
              label="Circular Title *"
              placeholder="e.g. Navratri 2026 Collection & Garba Guidelines"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((err) => ({ ...err, title: '' }));
              }}
              error={errors.title}
              helperText="A clear, descriptive title visible on the resident feed"
              required
            />

            {/* Scope: Society & Event */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {isSuperAdmin ? (
                <Select
                  label="Target Society *"
                  value={societyId}
                  onChange={(e) => {
                    setSocietyId(e.target.value);
                    setEventId('');
                  }}
                  options={societies.map((s) => ({ label: s.name, value: s.id }))}
                  error={errors.societyId}
                  required
                />
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Society</label>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 h-8 sm:h-9 flex items-center">
                    {societies.find((s) => s.id === societyId)?.name ||
                      user?.societies?.[0]?.name ||
                      'Assigned Society'}
                  </div>
                </div>
              )}

              <Select
                label="Associated Event (Optional)"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                options={[
                  { label: 'None (General Society Notice)', value: '' },
                  ...events.map((e) => ({
                    label: `${e.name} (${e.status.toUpperCase()})`,
                    value: e.id,
                  })),
                ]}
                helperText="Link this circular directly to a specific event such as Navratri"
              />
            </div>

            {/* Description */}
            <Textarea
              label="Notice Content & Instructions *"
              placeholder="Enter the official details, requirements, collection deadlines, or important announcements for residents..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((err) => ({ ...err, description: '' }));
              }}
              error={errors.description}
              rows={4}
              required
            />
          </div>
        </Card>

        {/* Attachment Upload Card */}
        <Card
          title="Document / Image Attachment"
          subtitle="Upload official signed notice in PDF, PNG, JPG, or JPEG format (Max 10 MB)"
        >
          <div className="space-y-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-white text-indigo-600 shadow-2xs flex items-center justify-center group-hover:scale-105 transition-transform mb-1.5">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Click to select file or drag & drop here
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supported formats: <span className="font-semibold text-indigo-600">PDF, PNG, JPG, JPEG</span> (Up to 10 MB)
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    {file.name.endsWith('.pdf') ? (
                      <FileText className="w-4 h-4 text-rose-600" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{file.name}</p>
                    <p className="text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {fileError && (
              <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-semibold bg-rose-50 p-2 rounded-lg border border-rose-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Publication Status Card */}
        <Card title="Publication Status" subtitle="Choose whether to publish immediately or save as a draft">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              onClick={() => setStatus('published')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                status === 'published'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-soft'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Publish Immediately</span>
                {status === 'published' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Notice is officially released and immediately visible to eligible society residents.
              </p>
            </div>

            <div
              onClick={() => setStatus('draft')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                status === 'draft'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-soft'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Save as Draft</span>
                {status === 'draft' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Notice will only be visible to administrators for review before publishing.
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(AppRoutes.CIRCULARS)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {status === 'published' ? 'Publish Circular' : 'Save Draft'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCircularPage;
