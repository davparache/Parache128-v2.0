
import React from 'react';
import { ScanStatus } from '../types';

interface SniperOverlayProps {
  status: ScanStatus;
}

export const SniperOverlay: React.FC<SniperOverlayProps> = ({ status }) => {
  const accentColor = 
    status === 'success' ? '#10b981' :
    status === 'duplicate' ? '#f59e0b' :
    status === 'error' ? '#ef4444' :
    '#dc2626';

  const label = 
    status === 'success' ? 'ITEM_VALIDATED' :
    status === 'duplicate' ? 'DUPLICATE_ID' :
    status === 'error' ? 'SCAN_FAILURE' :
    'PARACHE_PRO_OPTICS_v5.0';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-30">
      <div className="w-full flex-grow bg-black/80 backdrop-blur-[1px]"></div>
      
      <div className="relative w-[94%] h-[120px] transition-all duration-300">
        <div 
          className="absolute inset-0 border-[1px] rounded-lg transition-colors duration-500"
          style={{ borderColor: `${accentColor}44` }}
        >
          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2" style={{ borderColor: accentColor }}></div>
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2" style={{ borderColor: accentColor }}></div>
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2" style={{ borderColor: accentColor }}></div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2" style={{ borderColor: accentColor }}></div>
        </div>

        <div 
            className="absolute left-4 right-4 h-[1px] opacity-60"
            style={{ 
                top: '50%',
                background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                boxShadow: `0 0 10px ${accentColor}`,
                display: status === 'idle' ? 'block' : 'none'
            }}
        ></div>

        <div className="absolute -top-7 left-0 right-0 text-center">
          <span 
            className="text-[8px] font-black tracking-[0.4em] px-2 py-0.5 rounded uppercase"
            style={{ 
                color: '#fff', 
                backgroundColor: accentColor
            }}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="w-full flex-grow bg-black/80 backdrop-blur-[1px]"></div>
    </div>
  );
};
