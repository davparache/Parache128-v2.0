
export interface ScanItem {
  id: string;
  code: string;
  timestamp: number;
}

export type ScanStatus = 'idle' | 'success' | 'duplicate' | 'error';

export interface CameraCapabilities {
  zoom?: {
    min: number;
    max: number;
    step: number;
  };
  torch?: boolean;
}
