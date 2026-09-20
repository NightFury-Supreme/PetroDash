import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export function ValidationMsg({ touched, valid, message, hideSuccess }: { touched: boolean; valid: boolean; message: string; hideSuccess?: boolean }) {
    if (!touched) return null;
    if (valid && hideSuccess) return null;
    return (
      <p className={`mt-2 text-xs flex items-center gap-1.5 ${valid ? 'text-green-400' : 'text-red-400'}`}>
        {valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {message}
      </p>
    );
}
