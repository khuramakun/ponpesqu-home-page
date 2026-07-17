import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { LucideIcon } from './LucideIcon';

interface LiveBarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  dummyOptions?: { label: string; code: string; subLabel?: string }[];
  isInline?: boolean;
}

export function LiveBarcodeScanner({
  onScanSuccess,
  onClose,
  title = "Pemindaian Barcode Aktif",
  subtitle = "Arahkan kamera ke barcode/QR kartu fisik",
  dummyOptions = [],
  isInline = false
}: LiveBarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [scannedText, setScannedText] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const elementId = useRef(`live-barcode-scanner-viewport-${Math.random().toString(36).slice(2, 9)}`).current;
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);

  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("default-environment");

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        // We keep selectedCameraId as "default-environment" so the standard rear-facing mode
        // starts up exactly once. We do NOT auto-assign another ID to prevent rapid double-initialization.
      }
    }).catch(err => {
      console.warn("Error listing cameras:", err);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    // Wait a brief moment for the element to mount in DOM
    const timer = setTimeout(() => {
      if (!isMounted) return;

      try {
        html5QrCode = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.ITF
          ],
          verbose: false
        });
        html5QrCodeRef.current = html5QrCode;

        const cameraConfig = selectedCameraId === "default-environment" 
          ? { facingMode: "environment" } 
          : selectedCameraId;

        html5QrCode.start(
          cameraConfig,
          {
            fps: 25,
            qrbox: (width, height) => {
              // Create a wider and slightly taller box for easier alignment of 1D barcodes
              let qrWidth = Math.min(width * 0.95, 340);
              let qrHeight = Math.min(height * 0.55, 150);
              if (qrWidth < 50) qrWidth = 150;
              if (qrHeight < 50) qrHeight = 100;
              return { width: Math.round(qrWidth), height: Math.round(qrHeight) };
            },
            aspectRatio: 1.777778 // 16:9
          },
          (decodedText) => {
            if (isMounted) {
              handleSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Keep scanner running, ignore verbose frame processing errors
          }
        ).then(() => {
          if (isMounted) {
            setIsInitializing(false);
            setError(null);
          }
        }).catch((err) => {
          console.error("Error starting html5-qrcode scanner:", err);
          if (isMounted) {
            setError("Gagal memulai kamera terpilih. Pastikan izin kamera diaktifkan atau coba pilih kamera lainnya di atas.");
            setIsInitializing(false);
          }
        });
      } catch (e: any) {
        console.error("Exception in scanner init:", e);
        if (isMounted) {
          setError("Gagal memuat modul kamera scanner.");
          setIsInitializing(false);
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch((stopErr) => {
            console.warn("Failed to stop scanner on unmount:", stopErr);
          });
        }
      }
    };
  }, [selectedCameraId]);

  const handleSuccess = (decodedText: string) => {
    const now = Date.now();
    if (lastScannedRef.current && lastScannedRef.current.code === decodedText && (now - lastScannedRef.current.time < 3000)) {
      // Ignore rapid repeat scans of the same card within 3 seconds
      return;
    }
    lastScannedRef.current = { code: decodedText, time: now };

    // Play an elegant success audio beep
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = 1200; // high pitch beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Web Audio API not supported/blocked by user gesture:", e);
    }

    setScannedText(decodedText);
    setTimeout(() => {
      onScanSuccess(decodedText);
      if (isInline) {
        setTimeout(() => {
          setScannedText(null);
        }, 1500);
      }
    }, 400);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleSuccess(manualInput.trim());
    }
  };

  const content = (
    <div className={`glass-card rounded-2xl border border-emerald-500/30 overflow-hidden flex flex-col shadow-2xl relative ${isInline ? 'w-full h-full min-h-[320px]' : 'max-w-md w-full'}`}>
      
      {/* Modal/Inline Header */}
      <div className="p-4 bg-emerald-950/80 border-b border-emerald-500/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider">{title}</h3>
            <p className="text-[10px] text-emerald-400/80 leading-none">{subtitle}</p>
          </div>
        </div>
        {onClose && !isInline && (
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          >
            <LucideIcon name="x" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Camera Selector Dropdown */}
      {cameras.length > 1 && (
        <div className="px-4 py-2 bg-emerald-950 border-b border-emerald-500/15 flex items-center justify-between gap-2">
          <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1.5">
            <LucideIcon name="camera" className="w-3.5 h-3.5 animate-pulse" /> Pilih Lensa Kamera:
          </span>
          <select
            value={selectedCameraId}
            onChange={(e) => {
              setIsInitializing(true);
              setSelectedCameraId(e.target.value);
            }}
            className="bg-black/80 border border-emerald-800/60 rounded-xl px-2 py-1 text-[10.5px] text-amber-400 font-medium focus:outline-none focus:border-amber-500 max-w-[210px] cursor-pointer"
          >
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.label || `Kamera ${cam.id.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Camera Viewfinder Box */}
      <div className="relative bg-black min-h-[220px] max-h-[300px] flex items-center justify-center overflow-hidden">
        
        {/* HTML5 QR Code Container */}
        <div id={elementId} className="w-full h-full object-cover z-0" />

        {/* Dotted Scan Area Overlay (Shown if scanning is active) */}
        {!error && !scannedText && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
            {/* Scan target corners */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[300px] h-[150px] border border-emerald-500/20 rounded-xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                
                {/* Laser line animation */}
                <div className="w-[90%] h-0.5 bg-emerald-400/80 shadow-md shadow-emerald-400/50 absolute left-1/2 -translate-x-1/2 animate-[bounce_2.5s_infinite]"></div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Initializer screen */}
        {isInitializing && !error && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-4 z-20">
            <LucideIcon name="loader" className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
            <p className="text-xs text-emerald-400 font-semibold tracking-wide font-mono">MENGAKTIFKAN KAMERA...</p>
            <p className="text-[9px] text-gray-500 mt-1">Izinkan akses kamera pada pop-up browser jika diminta</p>
          </div>
        )}

        {/* Camera Error Screen */}
        {error && (
          <div className="absolute inset-0 bg-[#02110e]/95 flex flex-col items-center justify-center text-center p-6 z-20">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
              <LucideIcon name="camera-off" className="w-6 h-6" />
            </div>
            <p className="text-xs text-red-400 font-bold leading-tight">{error}</p>
            <p className="text-[9px] text-gray-400 mt-2 max-w-[280px]">
              Anda tetap bisa menggunakan fitur pencarian manual atau mengetikkan kode barcode di bawah ini.
            </p>
          </div>
        )}

        {/* Success scan badge overlay */}
        {scannedText && (
          <div className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center text-center p-4 z-30 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-2 animate-bounce">
              <LucideIcon name="check" className="w-6 h-6" />
            </div>
            <p className="text-xs text-emerald-400 font-bold">BARCODE TERBACA!</p>
            <span className="text-[11px] font-mono text-white bg-black/40 px-3 py-1 rounded-lg border border-emerald-500/20 mt-1 font-bold">
              {scannedText}
            </span>
          </div>
        )}
      </div>

      {/* Manual Code Input & Testing Tool */}
      <div className="p-4 bg-emerald-950/40 border-t border-emerald-500/10 flex flex-col gap-3">
        
        {/* Manual Form */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input 
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Input kode barcode manual..."
            className="flex-1 bg-black/50 border border-emerald-900 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
          />
          <button 
            type="submit"
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <LucideIcon name="arrow-right" className="w-3.5 h-3.5" /> Scan
          </button>
        </form>

        {/* Dummy Options for testing if they don't have physically printed barcode handy */}
        {dummyOptions.length > 0 && (
          <div className="border-t border-emerald-500/5 pt-3">
            <p className="text-[9px] text-emerald-500/50 uppercase tracking-widest font-bold mb-1.5 text-center">
              Atau Simulasi Klik Cepat (Testing)
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-h-[120px] overflow-y-auto no-scrollbar">
              {dummyOptions.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleSuccess(opt.code)}
                  className="flex justify-between items-center py-1.5 px-3 bg-black/30 border border-emerald-900/40 hover:border-emerald-500/40 rounded-lg text-[10px] text-gray-300 hover:bg-emerald-950/30 transition-all text-left cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-gray-100">{opt.label}</span>
                    {opt.subLabel && <span className="text-[8px] text-gray-500 ml-1.5">({opt.subLabel})</span>}
                  </div>
                  <span className="font-mono text-emerald-400 text-[9px]">{opt.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer (Hidden if inline) */}
      {!isInline && onClose && (
        <div className="p-3 bg-emerald-950/80 border-t border-emerald-500/15 flex justify-end gap-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/40 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Tutup Pemindai
          </button>
        </div>
      )}
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      {content}
    </div>
  );
}
