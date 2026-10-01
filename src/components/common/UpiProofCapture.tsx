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
  User,
  Zap,
  ZapOff,
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
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Synchronize when existingProofUrl prop changes
  useEffect(() => {
    setCapturedPreview(existingProofUrl || null);
  }, [existingProofUrl]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const backCameraInputRef = useRef<HTMLInputElement | null>(null);
  const frontCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setIsTorchSupported(false);
  }, []);

  // Attach stream to videoRef when active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.onloadedmetadata = async () => {
        try {
          await video.play();
        } catch (err) {
          console.warn('Video play warning:', err);
        }
      };
      video.play().catch((err) => console.warn('Video immediate play warning:', err));
    }
  }, [isCameraActive, facingMode]);

  // Start in-browser WebRTC camera stream or native fallback
  const startCamera = async (mode: 'user' | 'environment' = 'environment') => {
    setCameraError(null);
    stopCamera();
    setFacingMode(mode);

    // If WebRTC is not supported (e.g. non-HTTPS mobile environment), fallback to native camera input
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (mode === 'user') {
        frontCameraInputRef.current?.click();
      } else {
        backCameraInputRef.current?.click();
      }
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode === 'user' ? 'user' : { ideal: 'environment' },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);

      // Check for torch/flashlight capability on back camera
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities && (videoTrack.getCapabilities() as any)) || {};
        if (capabilities.torch) {
          setIsTorchSupported(true);
        }
      }
    } catch (err: any) {
      console.error('Camera stream error:', err);
      // Fallback directly to native mobile camera app if permission is denied or device constraints failed
      if (mode === 'user' && frontCameraInputRef.current) {
        frontCameraInputRef.current.click();
      } else if (backCameraInputRef.current) {
        backCameraInputRef.current.click();
      } else {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera permission denied. Please enable camera permissions or upload a receipt.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No camera found on this device. Please upload a screenshot instead.');
        } else {
          setCameraError(err.message || 'Unable to open camera stream.');
        }
      }
      setIsCameraActive(false);
    }
  };

  // Trigger native mobile camera directly
  const openNativeCamera = (mode: 'user' | 'environment') => {
    stopCamera();
    if (mode === 'user') {
      frontCameraInputRef.current?.click();
    } else {
      backCameraInputRef.current?.click();
    }
  };

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && isTorchSupported) {
      const nextTorch = !isTorchOn;
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
      } catch (err) {
        console.warn('Torch constraint error:', err);
      }
    }
  };

  // Toggle facing mode (Flip Front / Back)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flash animation effect
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    // If front camera, apply mirror flip during drawing so text/image matches standard perspective
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

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
      0.92
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
    // Reset file inputs so re-selecting same photo triggers onChange
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (backCameraInputRef.current) backCameraInputRef.current.value = '';
    if (frontCameraInputRef.current) frontCameraInputRef.current.value = '';
  };

  // Clear captured proof
  const handleRemoveProof = () => {
    setCapturedPreview(null);
    onImageCaptured(null, null);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (backCameraInputRef.current) backCameraInputRef.current.value = '';
    if (frontCameraInputRef.current) frontCameraInputRef.current.value = '';
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
      className={`rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50 p-3.5 space-y-3 shadow-xs ${className}`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">UPI Payment Proof / Receipt</span>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/90 px-1.5 py-0.5 rounded border border-indigo-200/60">
                Front & Back Camera
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Capture proof with Back / Front Camera or upload payment screenshot
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
        <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video sm:aspect-[4/3] max-h-72 flex items-center justify-center border-2 border-indigo-500 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Shutter flash overlay */}
          {isFlashActive && <div className="absolute inset-0 bg-white z-30 animate-fade-out" />}

          {/* Camera Mode Indicator Badge at Top */}
          <div className="absolute top-2.5 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-medium border border-white/20 shadow-xs">
              {facingMode === 'environment' ? (
                <>
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Back Camera (Rear)</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>Front Camera (Selfie)</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => openNativeCamera(facingMode)}
                className="p-1 px-2 rounded-full border border-white/25 bg-black/70 hover:bg-black text-white text-[10.5px] font-semibold flex items-center gap-1 shadow-xs backdrop-blur-xs cursor-pointer"
                title="Open native mobile camera application"
              >
                <Camera className="w-3 h-3 text-indigo-400" />
                <span>Native App</span>
              </button>
              {isTorchSupported && facingMode === 'environment' && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-1.5 rounded-full border transition-colors shadow-xs ${
                    isTorchOn
                      ? 'bg-amber-500 border-amber-300 text-white'
                      : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
                  }`}
                  title={isTorchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                >
                  {isTorchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Guide Overlay */}
          <div className="absolute inset-4 border-2 border-dashed border-white/40 rounded-lg pointer-events-none flex items-center justify-center">
            <span className="text-[11px] text-white/90 bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full font-medium shadow-xs">
              {facingMode === 'environment' ? 'Align Receipt / Phone Screen' : 'Front Camera View'}
            </span>
          </div>

          {/* Viewfinder Bottom Controls */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-between px-5 z-20">
            {/* Flip / Switch Camera Button */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggleFacingMode}
              className="bg-black/70 hover:bg-black/90 text-white border-white/30 h-9 px-2.5 text-xs font-medium rounded-lg shadow-md backdrop-blur-xs"
              title="Switch between Front and Back camera"
            >
              <SwitchCamera className="w-4 h-4 mr-1.5 text-indigo-300" />
              Flip
            </Button>

            {/* Shutter Capture Button */}
            <button
              type="button"
              onClick={capturePhoto}
              className="w-13 h-13 rounded-full border-4 border-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-2xl flex items-center justify-center group"
              title="Capture Photo"
            >
              <div className="w-9 h-9 rounded-full bg-white group-hover:scale-90 transition-transform shadow-inner" />
            </button>

            {/* Cancel Button */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={stopCamera}
              className="bg-black/70 hover:bg-black/90 text-white border-white/30 h-9 px-3 text-xs font-medium rounded-lg shadow-md backdrop-blur-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Hidden canvas for snapshot rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Captured Image Preview Card */}
      {!isCameraActive && capturedPreview && (
        <div className="relative rounded-xl border border-emerald-300 bg-white p-2.5 flex items-center gap-3 shadow-xs">
          <div
            onClick={() => setIsPreviewModalOpen(true)}
            className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 cursor-pointer relative group"
          >
            <img
              src={getFileUrl(capturedPreview)}
              alt="UPI Payment Proof"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Eye className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              UPI Receipt Attached
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Ready to be saved with payment transaction
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
              >
                <Camera className="w-3 h-3" />
                Retake (Back)
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => startCamera('user')}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 hover:underline"
              >
                <User className="w-3 h-3" />
                Retake (Front)
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 hover:underline"
              >
                <Upload className="w-3 h-3" />
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons: Back Camera, Front Camera, Upload Screenshot */}
      {!isCameraActive && !capturedPreview && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Back Camera (Rear) Button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => startCamera('environment')}
              className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white h-9 shadow-xs text-xs font-semibold"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              Back Camera
            </Button>

            {/* Front Camera (Selfie) Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => startCamera('user')}
              className="w-full justify-center border-indigo-300 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 h-9 shadow-xs text-xs font-semibold"
            >
              <SwitchCamera className="w-3.5 h-3.5 mr-1.5 text-indigo-600 shrink-0" />
              Front Camera
            </Button>
          </div>

          {/* Upload Screenshot Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => galleryInputRef.current?.click()}
            className="w-full justify-center border-slate-300 bg-white hover:bg-slate-50 text-slate-700 h-8.5 text-xs font-medium"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
            Upload Screenshot / Gallery
          </Button>
        </div>
      )}

      {/* Hidden File Input for Gallery / File Browser */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden Fallback Input for Back / Rear Camera (capture="environment") */}
      <input
        ref={backCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden Fallback Input for Front / User Camera (capture="user") */}
      <input
        ref={frontCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
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
              You can click "Upload Screenshot / Gallery" to select a photo from your device.
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
              <span className="text-slate-500 font-medium">Payment verification proof</span>
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
