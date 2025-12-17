import React from 'react';
import { Save, Trash2, MousePointer2, Move, Rotate3d, Scaling, Settings, Play, Pause, Square, MoreVertical, Hammer, Layers } from 'lucide-react';
import { IconButton } from '../ui/Shared';
import { ToolType } from '../../types';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
interface ToolbarProps {
  activeTool: ToolType; setActiveTool: (tool: ToolType) => void;
  onSave: () => void; onDelete: () => void;
  isPlaying: boolean; onPlay: () => void; onPause: () => void; onStop: () => void;
}
export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setActiveTool, onSave, onDelete, isPlaying, onPlay, onPause, onStop }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <div
      className="h-10 flex items-center px-2 justify-between shrink-0 relative"
      style={{
        backgroundColor: theme.colors.bg.primary,
        borderBottom: `1px solid ${theme.colors.border.default}`
      }}
    >
      <div className="flex space-x-4 items-center">
        <div className="flex space-x-0.5">
          <IconButton icon={Save} title={t('toolbar.save_level')} onClick={onSave} />
        </div>
        <div
          className="h-6 w-px"
          style={{ backgroundColor: theme.colors.border.default }}
        ></div>
        <div className="flex space-x-1">
          <IconButton icon={MousePointer2} active={activeTool === 'select'} onClick={() => setActiveTool('select')} title={t('toolbar.select')} />
          <IconButton icon={Move} active={activeTool === 'move'} onClick={() => setActiveTool('move')} title={t('toolbar.translate')} />
          <IconButton icon={Rotate3d} active={activeTool === 'rotate'} onClick={() => setActiveTool('rotate')} title={t('toolbar.rotate')} />
          <IconButton icon={Scaling} active={activeTool === 'scale'} onClick={() => setActiveTool('scale')} title={t('toolbar.scale')} />
        </div>
        <div
          className="h-6 w-px"
          style={{ backgroundColor: theme.colors.border.default }}
        ></div>
        <IconButton icon={Settings} title={t('toolbar.settings')} />
      </div>
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-1 items-center">
        {!isPlaying ? (
          <button
            onClick={onPlay}
            className="flex items-center space-x-2 px-6 py-1 rounded transition-colors bg-green-700 text-white hover:bg-green-600"
          >
            <Play size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center space-x-2 px-6 py-1 rounded transition-colors bg-yellow-600 text-white hover:bg-yellow-500"
          >
            <Pause size={14} fill="currentColor" />
          </button>
        )}
        <IconButton icon={Square} onClick={onStop} fill="currentColor" className="text-red-400 hover:bg-red-900/50 hover:text-red-200 px-3" />
        <IconButton icon={MoreVertical} />
      </div>
      <div className="flex space-x-2 items-center">
        <span
          className="text-xs font-bold px-2 border-r"
          style={{
            color: theme.colors.text.muted,
            borderRightColor: theme.colors.border.default
          }}
        >
          {t('toolbar.build')}
        </span>
        <div className="flex space-x-1">
          <IconButton icon={Hammer} />
          <IconButton icon={Layers} />
        </div>
      </div>
    </div>
  );
};
