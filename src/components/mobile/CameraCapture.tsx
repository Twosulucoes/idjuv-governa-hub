/**
 * COMPONENTE: CAPTURA DE FOTO
 * Permite capturar fotos usando a câmera do dispositivo
 */

import { useRef, useState, useCallback } from "react";
import { Camera, X, RotateCcw, Check, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function CameraCapture({ onCapture, onClose, isOpen }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error("Error starting camera:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Permissão de câmera negada. Por favor, permita o acesso à câmera."
          : "Não foi possível acessar a câmera."
      );
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imageData);
      stopCamera();
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  }, [capturedImage, onCapture]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  }, [stopCamera, onClose]);

  const toggleCamera = useCallback(async () => {
    stopCamera();
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    // Camera will restart with new facingMode on next effect
    setTimeout(() => startCamera(), 100);
  }, [stopCamera, startCamera]);

  // Auto-start camera when opened
  useState(() => {
    if (isOpen) {
      startCamera();
    }
    return () => stopCamera();
  });

  if (!isOpen) return null;

  return (
    <div className="dark fixed inset-0 z-50 bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-background/50">
        <Button 
          variant="ghost" 
          size="icon" 
          className="min-h-11 min-w-11 text-foreground hover:bg-foreground/20 hover:text-foreground"
          onClick={handleClose}
          aria-label="Fechar câmera"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </Button>
        <h2 className="text-base font-medium">
          {capturedImage ? "Confirmar foto" : "Tirar foto"}
        </h2>
        {!capturedImage && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="min-h-11 min-w-11 text-foreground hover:bg-foreground/20 hover:text-foreground"
            onClick={toggleCamera}
            aria-label="Trocar câmera"
          >
            <SwitchCamera className="w-6 h-6" aria-hidden="true" />
          </Button>
        )}
        {capturedImage && <div className="w-11" aria-hidden="true" />}
      </div>

      {/* Camera/Preview Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8">
            <Camera className="w-16 h-16 mx-auto mb-4 text-foreground/60" aria-hidden="true" />
            <p role="alert" className="text-base mb-4">{error}</p>
            <Button onClick={startCamera} variant="secondary" className="min-h-11">
              Tentar Novamente
            </Button>
          </div>
        ) : capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Foto capturada" 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onLoadedMetadata={() => setIsStreaming(true)}
          />
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-background/50 flex items-center justify-center gap-8">
        {capturedImage ? (
          <>
            <Button 
              variant="outline" 
              size="lg"
              className="rounded-full w-16 h-16 border-foreground bg-transparent text-foreground hover:bg-foreground/20 hover:text-foreground"
              onClick={retakePhoto}
              aria-label="Tirar outra foto"
            >
              <RotateCcw className="w-6 h-6" aria-hidden="true" />
            </Button>
            <Button 
              size="lg"
              className="rounded-full w-20 h-20 bg-success text-success-foreground hover:bg-success/90"
              onClick={confirmPhoto}
              aria-label="Usar esta foto"
            >
              <Check className="w-8 h-8" aria-hidden="true" />
            </Button>
          </>
        ) : (
          <Button 
            size="lg"
            className="rounded-full w-20 h-20 bg-foreground text-background hover:bg-foreground/90"
            onClick={capturePhoto}
            disabled={!isStreaming}
            aria-label="Tirar foto"
          >
            <Camera className="w-8 h-8" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
