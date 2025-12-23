
import React, { useState, useEffect, useRef } from 'react';
import { ScanItem, ScanStatus, CameraCapabilities } from './types';
import { audioService } from './services/audioService';
import { SniperOverlay } from './components/SniperOverlay';
import { 
  Barcode, 
  Trash2, 
  Copy, 
  Package, 
  Zap, 
  ZapOff, 
  X, 
  Database,
  ScanLine,
  FileDown,
  Check,
  Keyboard,
  Camera,
  Search
} from 'lucide-react';

const App: React.FC = () => {
  // --- ESTADOS ---
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [filteredScans, setFilteredScans] = useState<ScanItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [zoom, setZoom] = useState(1);
  const [caps, setCaps] = useState<CameraCapabilities>({});
  const [torchOn, setTorchOn] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // --- REFERENCIAS ---
  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const scansRef = useRef<ScanItem[]>([]);

  // Sincronización con localStorage (Persistencia Offline)
  useEffect(() => {
    scansRef.current = scans;
    localStorage.setItem('parache_pro_terminal_v5', JSON.stringify(scans));
  }, [scans]);

  useEffect(() => {
    const saved = localStorage.getItem('parache_pro_terminal_v5');
    if (saved) setScans(JSON.parse(saved));
  }, []);

  // Filtrado de registros
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredScans(scans);
    } else {
      const query = searchQuery.toUpperCase();
      setFilteredScans(scans.filter(s => s.code.includes(query)));
    }
  }, [scans, searchQuery]);

  // --- LÓGICA DE ESCANEO ---
  const startCamera = async () => {
    setIsCameraActive(true);
    setShowManualInput(false);
    setScanStatus('idle');

    setTimeout(() => {
      const html5QrCode = new (window as any).Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 25,
        qrbox: (vw: number, vh: number) => ({ width: vw * 0.94, height: 120 }),
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: "environment",
          width: { min: 1280, ideal: 1920 },
          height: { min: 720, ideal: 1080 }
        }
      };

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (text: string) => {
          if (isProcessingRef.current) return;
          processRegistry(text);
        },
        () => {}
      ).then(() => {
        try {
          const track = html5QrCode.getRunningTrackCameraCapabilities();
          if (track) {
            setCaps({
              zoom: track.zoom ? { min: track.zoom.min, max: track.zoom.max, step: track.zoom.step } : undefined,
              torch: !!track.torch
            });
          }
        } catch (e) {}
      }).catch((err: any) => {
        console.error(err);
        setIsCameraActive(false);
        alert("HARDWARE_ERROR: Parache Pro optics failed to initialize.");
      });
    }, 150);
  };

  const processRegistry = (text: string) => {
    isProcessingRef.current = true;
    const cleanText = text.trim().toUpperCase();
    const isDuplicate = scansRef.current.some(s => s.code === cleanText);

    if (isDuplicate) {
      setScanStatus('duplicate');
      audioService.playFeedback('duplicate');
      setTimeout(() => { setScanStatus('idle'); isProcessingRef.current = false; }, 1200);
    } else {
      setScanStatus('success');
      audioService.playFeedback('success');
      
      const newScan: ScanItem = {
        id: crypto.randomUUID(),
        code: cleanText,
        timestamp: Date.now()
      };

      setScans(prev => [newScan, ...prev]);
      // Limpiar búsqueda al escanear nuevo para verlo inmediatamente
      if(searchQuery) setSearchQuery("");
      setTimeout(() => { setScanStatus('idle'); isProcessingRef.current = false; }, 800);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setIsCameraActive(false);
        setTorchOn(false);
      } catch (e) {
        setIsCameraActive(false);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processRegistry(manualCode);
    setManualCode("");
    setShowManualInput(false);
  };

  const toggleTorch = () => {
    if (scannerRef.current && caps.torch) {
      const next = !torchOn;
      scannerRef.current.applyVideoConstraints({ advanced: [{ torch: next }] })
        .then(() => setTorchOn(next))
        .catch((err: any) => console.warn("Torch toggle failed", err));
    }
  };

  const copyToClipboard = () => {
    if (filteredScans.length === 0) return;
    const text = filteredScans.map(s => s.code).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const downloadCSV = () => {
    if (filteredScans.length === 0) return;
    const headers = "ID,Code,Timestamp,Date\n";
    const csvContent = filteredScans.map(s => {
      const date = new Date(s.timestamp).toISOString();
      return `${s.id},"${s.code}",${s.timestamp},${date}`;
    }).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `parache_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen flex flex-col bg-black text-zinc-100 overflow-hidden select-none">
      
      {/* HEADER DINÁMICO */}
      <header className="px-5 pt-12 pb-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-1.5 rounded shadow-[0_0_15px_rgba(220,38,38,0.4)]">
            <Barcode size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-[0.2em] text-white">PARACHE<span className="text-red-600">PRO</span></h1>
            <p className="text-[7px] font-bold text-zinc-500 tracking-widest uppercase">Registry_Mod_Offline</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isCameraActive && (
            <button 
              onClick={toggleTorch}
              disabled={!caps.torch}
              className={`p-2 rounded border border-zinc-800 transition-all ${
                !caps.torch 
                  ? 'text-zinc-800 opacity-50 cursor-not-allowed' 
                  : torchOn 
                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                    : 'bg-transparent text-zinc-500 hover:text-zinc-300'
              }`}
              title={caps.torch ? "Toggle Flash" : "Flash Unavailable"}
            >
              {torchOn ? <Zap size={14} fill="currentColor" /> : <ZapOff size={14} />}
            </button>
          )}

          {(isCameraActive || showManualInput) && (
            <button 
              onClick={() => { stopCamera(); setShowManualInput(false); }} 
              className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-black tracking-widest text-zinc-400 uppercase active:bg-zinc-800"
            >
              Standby
            </button>
          )}
        </div>
      </header>

      {/* VIEWPORT PRINCIPAL */}
      <section className={`relative transition-all duration-500 ease-in-out bg-zinc-950 overflow-hidden ${isCameraActive || showManualInput ? 'flex-grow' : 'h-48'}`}>
        
        {/* Contenedor de Cámara */}
        <div id="reader" className={`w-full h-full scanner-fade transition-opacity duration-300 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {isCameraActive && <SniperOverlay status={scanStatus} />}

        {/* Input Manual */}
        {showManualInput && (
          <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleManualSubmit} className="w-full max-w-sm flex flex-col gap-4">
               <div className="flex items-center gap-2 mb-2">
                 <Keyboard size={16} className="text-red-600" />
                 <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Manual_Registry_Input</span>
               </div>
               <input 
                 autoFocus
                 type="text"
                 value={manualCode}
                 onChange={(e) => setManualCode(e.target.value)}
                 placeholder="SCAN_ID_CODE..."
                 className="bg-black border-2 border-zinc-800 text-zinc-100 text-xl p-5 rounded font-mono uppercase focus:border-red-600 outline-none transition-colors placeholder:text-zinc-800"
               />
               <button 
                 type="submit" 
                 className="bg-red-600 text-white font-black py-4 rounded text-xs tracking-[0.3em] uppercase shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 transition-transform"
               >
                 Register_ID
               </button>
            </form>
          </div>
        )}

        {/* Pantalla de Inicio (No activa) */}
        {!isCameraActive && !showManualInput && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            <div className="flex gap-6">
              <button 
                onClick={startCamera}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-full border border-red-600/30 flex items-center justify-center relative overflow-hidden group-active:scale-90 transition-transform bg-red-600/5">
                  <Camera size={24} className="text-red-600" />
                </div>
                <span className="text-[8px] font-black tracking-widest text-zinc-600 uppercase">Optics</span>
              </button>

              <button 
                onClick={() => setShowManualInput(true)}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-full border border-zinc-800 flex items-center justify-center relative overflow-hidden group-active:scale-90 transition-transform bg-zinc-900/50">
                  <Keyboard size={24} className="text-zinc-500" />
                </div>
                <span className="text-[8px] font-black tracking-widest text-zinc-600 uppercase">Manual</span>
              </button>
            </div>
          </div>
        )}

        {/* Control de Zoom */}
        {isCameraActive && caps.zoom && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-4/5 max-w-xs z-40 bg-zinc-900/90 border border-zinc-800 px-5 py-3 rounded-full flex items-center gap-4 shadow-2xl backdrop-blur-md">
            <span className="text-[9px] font-black text-zinc-600 tracking-tighter">1.0X</span>
            <input 
              type="range"
              min={caps.zoom.min} max={caps.zoom.max} step={caps.zoom.step}
              value={zoom} onChange={(e) => {
                const z = parseFloat(e.target.value);
                setZoom(z);
                scannerRef.current.applyVideoConstraints({ advanced: [{ zoom: z }] });
              }}
              className="flex-grow h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer"
            />
            <span className="text-[9px] font-black text-red-600 tracking-tighter">{zoom.toFixed(1)}X</span>
          </div>
        )}
      </section>

      {/* FEED DE REGISTROS */}
      <main className={`flex flex-col bg-black border-t border-zinc-900 z-40 transition-all duration-500 ${isCameraActive || showManualInput ? 'h-[40vh]' : 'flex-grow'}`}>
        <div className="px-5 py-3 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database size={12} className="text-red-600" />
            <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">Local_Registry_Stream ({filteredScans.length})</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={downloadCSV} 
              disabled={filteredScans.length === 0}
              className={`transition-colors ${filteredScans.length === 0 ? 'text-zinc-800' : 'text-zinc-600 hover:text-red-500'}`}
              title="Export CSV"
            >
              <FileDown size={18} />
            </button>
            <button 
              onClick={copyToClipboard} 
              className="relative text-zinc-600 hover:text-red-500 transition-colors"
              title="Copy Stream"
            >
              {copyFeedback ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
            <button 
              onClick={() => confirm("Wipe Stream Buffer?") && setScans([])} 
              className="text-zinc-800 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        {(scans.length > 0) && (
          <div className="px-5 py-2 bg-black border-b border-zinc-900 flex items-center gap-3 shrink-0">
            <Search size={14} className="text-zinc-600" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FILTER_STREAM..." 
              className="bg-transparent border-none outline-none text-[10px] text-zinc-300 placeholder-zinc-700 font-mono flex-grow uppercase tracking-wider"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-zinc-700 hover:text-red-600 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
        )}

        <div className="flex-grow overflow-y-auto p-4 space-y-3 safe-area-bottom custom-scroll">
          {scans.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10">
              <Package size={48} className="text-zinc-500" />
              <p className="mt-4 text-[9px] font-black tracking-[0.3em] uppercase">No_Data_Buffer</p>
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <Search size={32} className="text-zinc-500 mb-2" />
              <p className="text-[9px] font-mono text-zinc-500 uppercase">NO_MATCHES_FOUND</p>
            </div>
          ) : (
            filteredScans.map((item) => (
              <div key={item.id} className="relative group bg-zinc-900/20 border border-zinc-900 rounded p-4 transition-all hover:bg-zinc-900/40 animate-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-start">
                  <div className="flex-grow overflow-hidden">
                    <span className="block text-lg font-mono font-bold tracking-tighter text-zinc-100 truncate">{item.code}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[7px] font-black px-1.5 py-0.5 bg-zinc-950 text-zinc-500 border border-zinc-800 rounded uppercase tracking-widest">
                        T_{new Date(item.timestamp).toLocaleTimeString([], {hour12: false})}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setScans(prev => prev.filter(s => s.id !== item.id))} className="text-zinc-800 hover:text-red-600 ml-4 p-1">
                    <X size={14} />
                  </button>
                </div>
                <div className="absolute top-2 bottom-2 left-0 w-[2px] bg-zinc-800 group-hover:bg-red-600 transition-colors"></div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
