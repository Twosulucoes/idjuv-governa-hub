/**
 * COMPONENTE: SCANNER DE QR CODE
 * Usa a câmera do dispositivo para escanear QR Codes e códigos de barras
 */

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, Flashlight, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRCodeScanner({ onScan, onClose, isOpen }: QRCodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const startScanner = async () => {
    try {
      setError(null);
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // QR code scan failure - this is called frequently, ignore
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError(
        err.message?.includes("Permission")
          ? "Permissão de câmera negada. Por favor, permita o acesso à câmera."
          : "Não foi possível iniciar a câmera. Verifique as permissões."
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const toggleCamera = async () => {
    await stopScanner();
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/20"
          onClick={handleClose}
        >
          <X className="w-6 h-6" />
        </Button>
        <span className="text-white font-medium">Escanear QR Code</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/20"
          onClick={toggleCamera}
        >
          <SwitchCamera className="w-6 h-6" />
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="h-full flex items-center justify-center">
        {error ? (
          <div className="text-center p-8">
            <Camera className="w-16 h-16 mx-auto mb-4 text-white/50" />
            <p className="text-white mb-4">{error}</p>
            <Button onClick={startScanner} variant="secondary">
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div id="qr-reader" className="w-[300px] h-[300px]" />
            {/* Scan Frame Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-center bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white/80 text-sm">
          Posicione o QR Code ou código de barras dentro da área de leitura
        </p>
      </div>
    </div>
  );
}
