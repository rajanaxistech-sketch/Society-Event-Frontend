import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  Image as ImageIcon,
  SwitchCamera,
  Eye,
} from 'lucide-react';
import Button from '../ui/Button';
import { getFileUrl } from '../../utils/fileHelper';

interface UpiProofCaptureProps {
  onImageCaptured: (file: File | Blob | null, previewUrl: string | null) => void;
  existingProofUrl?: string | null;
  className?: string;
}

export const UpiProofCapture: React.FC<UpiProofCaptureProps> = ({
  onImageCaptured,
  existingProofUrl,
  className = '',
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(existingProofUrl || null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Synchronize when existingProofUrl prop changes (e.g. editing a different flat/collection)
  useEffect(() => {
    setCapturedPreview(existingProofUrl || null);
  }, [existingProofUrl]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start camera helper
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access or upload an image.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please upload a receipt screenshot instead.');
      } else {
        setCameraError(err.message || 'Unable to access camera.');
      }
      setIsCameraActive(false);
    }
  };

  // Flip camera (rear / front)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Take photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flash animation effect
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          setCapturedPreview(previewUrl);
          onImageCaptured(blob, previewUrl);
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // File upload change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCapturedPreview(previewUrl);
      onImageCaptured(file, previewUrl);
      stopCamera();
    }
  };

  // Clear captured proof
  const handleRemoveProof = () => {
    setCapturedPreview(null);
    onImageCaptured(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    stopCamera();
  };

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div
      className={`rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 p-3.5 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">UPI Payment Proof / Receipt</span>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                Live Capture
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Capture or upload resident UPI transaction screenshot / QR receipt
            </p>
          </div>
        </div>

        {capturedPreview && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="p-1 rounded-md text-indigo-600 hover:bg-indigo-100 transition-colors"
              title="View full proof image"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemoveProof}
              className="p-1 rounded-md text-rose-500 hover:bg-rose-100 transition-colors"
              title="Remove proof"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Camera Live Viewfinder */}
      {isCameraActive && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video sm:aspect-[4/3] max-h-64 flex items-center justify-center border-2 border-indigo-500 shadow-inner animate-in fade-in zoom-in-95 duration-200">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Shutter flash overlay */}
          {isFlashActive && <div className="absolute inset-0 bg-white z-20 animate-fade-out" />}

          {/* Guide Overlay for UPI receipts */}
          <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none flex items-center justify-center">
            <span className="text-[11px] text-white/80 bg-black/60 px-2 py-0.5 rounded-full font-medium shadow-xs">
              Align UPI Receipt / Screen
            </span>
          </div>

          {/* Live Controls */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-10 px-4">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggleFacingMode}
              className="bg-black/60 text-white border-white/30 hover:bg-black/80 h-8 px-2 text-xs"
              title="Switch Camera"
            >
              <SwitchCamera className="w-3.5 h-3.5 mr-1" />
              Flip
            </Button>

            <button
              type="button"
              onClick={capturePhoto}
              className="w-12 h-12 rounded-full border-4 border-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-lg flex items-center justify-center group"
              title="Take Photo"
            >
              <div className="w-8 h-8 rounded-full bg-white group-hover:scale-90 transition-transform" />
            </button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={stopCamera}
              className="bg-black/60 text-white border-white/30 hover:bg-black/80 h-8 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Hidden canvas for snapshot rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Captured Image Preview Display */}
      {!isCameraActive && capturedPreview && (
        <div className="relative rounded-xl border border-emerald-300 bg-white p-2.5 flex items-center gap-3 shadow-xs">
          <div
            onClick={() => setIsPreviewModalOpen(true)}
            className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 cursor-pointer relative group"
          >
            <img
              src={getFileUrl(capturedPreview)}
              alt="UPI Payment Proof"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Eye className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              UPI Receipt Attached
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Ready to be saved with payment transaction
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => startCamera()}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Retake Photo
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 hover:underline"
              >
                <Upload className="w-3 h-3" />
                Choose Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons: Open Camera & Upload File */}
      {!isCameraActive && !capturedPreview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => startCamera()}
            className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white h-9 shadow-xs"
          >
            <Camera className="w-4 h-4 mr-1.5" />
            Open Camera to Capture
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full justify-center border-indigo-200 bg-white hover:bg-indigo-50/50 text-indigo-900 h-9"
          >
            <Upload className="w-4 h-4 mr-1.5 text-indigo-600" />
            Upload Screenshot
          </Button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera Error Message */}
      {cameraError && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{cameraError}</p>
            <p className="text-[10px] text-amber-700 mt-0.5">
              You can click "Upload Screenshot" to select a photo from your gallery or files.
            </p>
          </div>
        </div>
      )}

      {/* Full-Screen Proof Image Preview Modal */}
      {isPreviewModalOpen && capturedPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">UPI Receipt Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={getFileUrl(capturedPreview)}
                alt="Enlarged UPI Receipt"
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Payment verification artifact</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
