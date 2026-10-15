import React from 'react';
import { AlertTriangle, Play } from 'lucide-react';

interface GlobalStopBannerProps {
  isEmergencyStopped: boolean;
  onResume: () => void;
}

export const GlobalStopBanner: React.FC<GlobalStopBannerProps> = ({
  isEmergencyStopped,
  onResume
}) => {
  if (!isEmergencyStopped) return null;

  return (
    <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b border-red-600 px-6 py-2.5 flex items-center justify-between text-red-100 shadow-xl shadow-red-950/50">
      <div className="flex items-center gap-3">
        <AlertTriangle size={20} className="text-red-400 animate-bounce" />
        <div>
          <span className="font-bold text-sm tracking-wide">GLOBAL EMERGENCY STOP ACTIVE:</span>
          <span className="text-xs text-red-200 ml-2">
            All active subprocesses and agent task dispatching have been safely paused. No further model inferences or shell commands will be executed.
          </span>
        </div>
      </div>
      <button
        onClick={onResume}
        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded transition shadow"
      >
        <Play size={14} />
        <span>Resume Execution</span>
      </button>
    </div>
  );
};
