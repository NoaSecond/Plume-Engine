import React, { useEffect } from 'react';

interface ToastProps { message: string; onClose: () => void; duration?: number }
export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => { const t = setTimeout(onClose, duration); return () => clearTimeout(t); }, [onClose, duration]);
  return (
    <div className="fixed right-4 bottom-24 z-50 px-4 py-2 rounded shadow-lg bg-gray-900 text-white text-sm">
      {message}
    </div>
  );
};
