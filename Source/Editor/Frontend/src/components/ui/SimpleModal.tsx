import React, { useEffect, useRef } from 'react';

interface SimpleModalProps { title: string; defaultValue?: string; open: boolean; placeholder?: string; onCancel: () => void; onSubmit: (value: string) => void }
export const SimpleModal: React.FC<SimpleModalProps> = ({ title, defaultValue = '', open, placeholder = '', onCancel, onSubmit }) => {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 50); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded p-4 w-96 shadow-lg">
        <div className="font-bold mb-2">{title}</div>
        <input ref={ref} defaultValue={defaultValue} placeholder={placeholder} className="w-full border px-2 py-1 mb-3" />
        <div className="flex justify-end space-x-2">
          <button className="px-3 py-1 border rounded" onClick={onCancel}>Cancel</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => onSubmit((ref.current?.value || '').trim())}>OK</button>
        </div>
      </div>
    </div>
  );
};
