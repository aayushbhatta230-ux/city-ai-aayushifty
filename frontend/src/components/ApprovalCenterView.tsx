import React from 'react';
import { CheckSquare, AlertCircle, Check, X } from 'lucide-react';
import { ApprovalRequest } from '../types';

interface ApprovalCenterViewProps {
  approvals: ApprovalRequest[];
  onDecide: (approvalId: string, approved: boolean, note?: string) => void;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({ approvals, onDecide }) => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <CheckSquare className="text-amber-400" size={22} />
          <span>Consequential Action Approval Center</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          "Human control: require explicit approval for consequential or irreversible operations (deployments, destructive operations, publications)."
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="forge-card p-12 text-center text-slate-500 text-sm">
          No pending approval requests. Operations are safely bounded within sandboxed project workspaces.
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((req) => (
            <div key={req.id} className="forge-card p-5 space-y-3 bg-[#0D121F]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{req.id}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {req.action_type}
                    </span>
                    <span className={`forge-badge forge-badge-${req.status.toLowerCase()}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mt-2 font-medium">{req.description}</p>
                </div>

                <div className="text-xs font-mono text-slate-500">
                  {new Date(req.requested_at).toLocaleString()}
                </div>
              </div>

              {req.status === 'PENDING' && (
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onDecide(req.id, false, "Declined by operator")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white border border-red-500/30 transition"
                  >
                    <X size={14} />
                    <span>Reject Action</span>
                  </button>

                  <button
                    onClick={() => onDecide(req.id, true, "Approved by operator")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition"
                  >
                    <Check size={14} />
                    <span>Authorize Execution</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
