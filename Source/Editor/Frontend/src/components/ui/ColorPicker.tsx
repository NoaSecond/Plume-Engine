import React, { useState, useEffect } from 'react';
import { useTheme } from '../../ThemeContext';

export const ColorPicker: React.FC<{
  initial?: string;
  onPick: (hex: string) => void;
  onCancel?: () => void;
}> = ({ initial = '#ffffff', onPick, onCancel }) => {
  const { theme } = useTheme();
  const [value, setValue] = useState(initial);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('plume:recent_colors');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const pick = (hex: string) => {
    setValue(hex);
    const r = [hex, ...recent.filter(c => c !== hex)].slice(0, 8);
    setRecent(r);
    localStorage.setItem('plume:recent_colors', JSON.stringify(r));
    onPick(hex);
  };

  const tryEyeDropper = async () => {
    try {
      // @ts-ignore
      const ed = new (window as any).EyeDropper();
      // @ts-ignore
      const res = await ed.open();
      if (res && res.sRGBHex) pick(res.sRGBHex);
    } catch (e) {
      // not available or failed
      console.warn('EyeDropper not available', e);
    }
  };

  return (
    <div style={{ padding: 8, display: 'flex', gap: 8, alignItems: 'center', backgroundColor: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.default}`, borderRadius: 6 }}>
      <input type="color" value={value} onChange={(e) => setValue(e.target.value)} style={{ width: 44, height: 28, border: 'none', background: 'transparent' }} />
      <button onClick={() => pick(value)} style={{ padding: '6px 8px', background: theme.colors.accent.primary, color: theme.colors.text.primary, borderRadius: 4 }}>Apply</button>
      <button onClick={tryEyeDropper} style={{ padding: '6px 8px', background: theme.colors.bg.elevated, color: theme.colors.text.primary, borderRadius: 4 }}>Pipette</button>
      <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
        {recent.map(c => (
          <button key={c} onClick={() => pick(c)} style={{ width: 22, height: 22, background: c.startsWith('#') ? c : ('#' + c), border: `1px solid ${theme.colors.border.default}`, borderRadius: 4 }} />
        ))}
      </div>
      {onCancel && <button onClick={onCancel} style={{ marginLeft: 8, padding: '6px 8px', background: theme.colors.bg.elevated, color: theme.colors.text.primary, borderRadius: 4 }}>Cancel</button>}
    </div>
  );
};

export default ColorPicker;
