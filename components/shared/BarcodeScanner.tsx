
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

// SVG for viewfinder corners
const Corner = ({ position }: { position: string }) => {
  const baseClasses = "absolute w-8 h-8 border-white";
  const positionClasses: Record<string, string> = {
    'top-left': 'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
    'top-right': 'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
    'bottom-left': 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
    'bottom-right': 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
  };
  return <div className={`${baseClasses} ${positionClasses[position]}`}></div>;
};


export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const [status, setStatus] = useState<'initializing' | 'scanning' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [viewfinderHeight, setViewfinderHeight] = useState(0);

  useEffect(() => {
    const measureViewfinder = () => {
      if (viewfinderRef.current) {
        setViewfinderHeight(viewfinderRef.current.offsetHeight);
      }
    };
    measureViewfinder();
    window.addEventListener('resize', measureViewfinder);
    return () => window.removeEventListener('resize', measureViewfinder);
  }, []);


  const stopCamera = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const startScan = async () => {
      if (!('BarcodeDetector' in window)) {
        setErrorMessage('ဘားကုဒ်စကင်နာကို ဤဘရောက်စာတွင် အသုံးမပြုနိုင်ပါ။ ကျေးဇူးပြု၍ Chrome ကဲ့သို့သော နောက်ဆုံးပေါ်ဘရောက်စာကို အသုံးပြုပါ။');
        setStatus('error');
        return;
      }

      // @ts-ignore
      const barcodeDetector = new window.BarcodeDetector();

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('scanning');

          const detectFrame = async () => {
            if (!isMounted || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
              return;
            }
            
            try {
              // @ts-ignore
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0 && isMounted) {
                onScan(barcodes[0].rawValue);
                return; // Stop scanning after a successful scan
              }
            } catch (detectErr) {
               console.error("Barcode detection failed:", detectErr);
            }
            
            // Continue scanning if no barcode is found
            animationFrameId.current = requestAnimationFrame(detectFrame);
          };
          detectFrame();
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        let message = `ကင်မရာကို အသုံးပြု၍မရပါ။`;
        if (err.name === 'NotAllowedError') {
            message = 'ကင်မရာအသုံးပြုခွင့်ကို ပယ်ချထားပါသည်။ Browser ဆက်တင်တွင် ပြန်လည်ဖွင့်ပေးပါ။';
        } else if (err.name === 'NotFoundError') {
            message = 'သင့်စက်တွင် ကင်မရာမတွေ့ပါ။';
        } else {
            message = `အမှားတစ်ခုဖြစ်ပွားသည်: ${err.name}`;
        }
        setErrorMessage(message);
        setStatus('error');
      }
    };

    startScan();

    return () => {
      isMounted = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      stopCamera(stream);
    };
  }, [onScan, stopCamera]);

  const getStatusMessage = () => {
      switch(status) {
          case 'initializing':
              return 'ကင်မရာစတင်နေသည်...';
          case 'scanning':
              return 'ဘားကုဒ်ကို ဘောင်အတွင်း ထားပါ';
          case 'error':
              return errorMessage;
      }
  };

  return (
    <div className="fixed inset-0 bg-black z-[1002] flex flex-col items-center justify-center font-[Segoe_UI,Myanmar_Text,Pyidaungsu]">
      <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover" autoPlay playsInline muted />
      
      {/* Viewfinder Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' }}>
        <div ref={viewfinderRef} className="relative w-11/12 max-w-md mx-auto" style={{ top: '50%', transform: 'translateY(-70%)', aspectRatio: '1.6' }}>
            <Corner position="top-left" />
            <Corner position="top-right" />
            <Corner position="bottom-left" />
            <Corner position="bottom-right" />
            {status === 'scanning' && viewfinderHeight > 0 && (
               <div className="absolute top-0 left-2 right-2 h-1 bg-red-500 rounded-full shadow-[0_0_10px_2px_red] animate-scan-line"></div>
            )}
        </div>
      </div>
      
      <div className="absolute bottom-16 z-20 text-center px-4 w-full">
        <p className="inline-block text-white font-semibold bg-black/70 p-3 rounded-lg max-w-sm text-lg shadow-lg backdrop-blur-sm">
          {getStatusMessage()}
        </p>
      </div>

      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 bg-white/30 text-white font-bold text-2xl w-12 h-12 rounded-full backdrop-blur-sm hover:bg-white/50 transition-colors flex items-center justify-center"
        aria-label="Close scanner"
      >
        ✕
      </button>
      <style>{`
        @keyframes scan-animation {
            0% { transform: translateY(0); }
            50% { transform: translateY(${viewfinderHeight - 2}px); } /* -2 for half line height */
            100% { transform: translateY(0); }
        }
        .animate-scan-line {
          animation: scan-animation 2.5s infinite ease-in-out;
        }
        video { transform: scale(1); } /* Prevents minor scaling issues on some devices */
      `}</style>
    </div>
  );
};
