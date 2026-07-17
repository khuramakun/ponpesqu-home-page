import React, { useRef, useEffect, useState } from 'react';
import { LucideIcon } from './LucideIcon';

interface LiveViewfinderProps {
  placeholderText?: string;
  className?: string;
  colorTheme?: 'amber' | 'blue' | 'emerald';
  onReset?: () => void;
}

export function LiveViewfinder({
  placeholderText,
  className,
  colorTheme = 'amber',
  onReset
}: LiveViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    async function startCamera() {
      try {
        // Request rear camera if possible, or any camera
        const constraints = {
          video: { facingMode: "environment" },
          audio: false
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);
        setIsPermissionGranted(true);
      } catch (err: any) {
        console.warn("Rear camera not found or failed, attempting standard camera", err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          activeStream = fallbackStream;
          setStream(fallbackStream);
          setIsPermissionGranted(true);
        } catch (fallbackErr: any) {
          console.error("All camera initialization attempts failed:", fallbackErr);
          setError("Akses kamera tidak aktif atau ditolak browser. Izinkan izin kamera.");
        }
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  // Bind the stream once video element mounts and stream is ready
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn("Video playback was interrupted or prevented:", e));
    }
  }, [stream, isPermissionGranted]);

  const handleManualReset = () => {
    if (onReset) onReset();
  };

  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'blue':
        return {
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-400',
          borders: 'border-blue-400',
          laser: 'bg-blue-400 shadow-blue-500/50'
        };
      case 'emerald':
        return {
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          borders: 'border-emerald-400',
          laser: 'bg-emerald-400 shadow-emerald-500/50'
        };
      case 'amber':
      default:
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
          borders: 'border-amber-400',
          laser: 'bg-amber-400 shadow-amber-500/50'
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className={`bg-black rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 ${className || 'h-[160px]'}`}>
      <div className="flex justify-between items-center z-10">
        <span className={`text-[9px] border px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${theme.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme.dot}`}></span>
          PEMINDAI AKTIF (KAMERA LIVE)
        </span>
        <button 
          onClick={handleManualReset}
          className="text-[9px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1"
        >
          <LucideIcon name="refresh-cw" className="w-2.5 h-2.5 animate-spin-slow" />
          Reset
        </button>
      </div>

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 bg-black/95">
          <LucideIcon name="camera-off" className="w-7 h-7 text-red-500 mb-1" />
          <p className="text-[10px] text-red-400 font-bold leading-tight">{error}</p>
          <p className="text-[8px] text-emerald-500/50 mt-1">Gunakan perangkat yang mendukung kamera atau izinkan izin kamera di browser Anda.</p>
        </div>
      ) : !isPermissionGranted ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 bg-black/95">
          <LucideIcon name="loader" className="w-7 h-7 text-amber-500 animate-spin mb-1" />
          <p className="text-[10px] text-amber-400 font-bold">Meminta akses kamera fisik...</p>
        </div>
      ) : null}

      {/* Real Live Camera Video Stream */}
      {isPermissionGranted && !error && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-50 z-0"
        />
      )}

      {/* Dotted scanning line and corners overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
        <div className="w-40 h-24 border border-dashed border-white/20 rounded-xl relative flex items-center justify-center">
          <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${theme.borders}`}></div>
          <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${theme.borders}`}></div>
          <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${theme.borders}`}></div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${theme.borders}`}></div>
          
          {/* Scanning laser line */}
          <div className={`w-[130px] h-0.5 shadow-md absolute animate-[bounce_2s_infinite] ${theme.laser}`}></div>
        </div>
      </div>

      <div className="text-center text-[8px] text-gray-500 font-mono z-10 select-none bg-black/60 py-1 rounded">
        {placeholderText || "[DEPAN AREA KAMERA AKTIF]"}
      </div>
    </div>
  );
}
