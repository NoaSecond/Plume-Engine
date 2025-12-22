import React, { useState } from 'react';
import { Maximize, Lock, Unlock, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, Save, Play } from 'lucide-react';
import { useLanguage } from '../../../LanguageContext';

interface ToolbarButtonProps {
    theme: any;
    onClick: () => void;
    disabled?: boolean;
    forceActive?: boolean;
    icon: any;
    label?: string;
    tooltip?: string;
    shortcut?: string;
    active?: boolean;
}

const ToolbarButton = ({ theme, onClick, disabled, forceActive, icon: Icon, label, tooltip, shortcut, active: externalActive }: ToolbarButtonProps) => {
    const [hover, setHover] = useState(false);
    const [localActive, setLocalActive] = useState(false);
    const active = localActive || forceActive || externalActive;
    const tooltipText = tooltip || label;

    // Determine button styles based on state
    let background = theme.colors.bg.secondary;
    let color = theme.colors.text.secondary;
    let borderColor = theme.colors.border.default;

    if (active) {
        background = theme.colors.accent.primary;
        color = '#fff';
        borderColor = theme.colors.accent.primary;
    } else if (disabled) {
        background = theme.colors.bg.secondary;
        color = theme.colors.text.muted;
        borderColor = theme.colors.border.default; // or different if needed
    } else if (hover) {
        background = theme.colors.accent.primary + '40';
        color = '#fff'; // or theme text
        borderColor = theme.colors.accent.primary;
    }

    return (
        <button
            title={shortcut ? `${tooltipText} (${shortcut})` : tooltipText}
            style={{
                background,
                color,
                border: `1px solid ${borderColor}`,
                borderRadius: theme.borderRadius.md,
                padding: label ? '6px 12px' : '6px',
                minWidth: label ? 'auto' : '32px',
                height: '32px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: disabled ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: disabled ? 'none' : theme.shadows.md,
                transition: 'all 0.1s ease',
                transform: active ? 'translateY(1px)' : 'none',
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                outline: 'none'
            }}
            onMouseEnter={() => !disabled && setHover(true)}
            onMouseLeave={() => { setHover(false); setLocalActive(false); }}
            onMouseDown={() => !disabled && setLocalActive(true)}
            onMouseUp={() => setLocalActive(false)}
            onClick={onClick}
            disabled={disabled}
        >
            <Icon size={16} />
            {label}
        </button>
    );
};

interface EditorToolbarProps {
    theme: any;
    onSave: () => void;
    onFitView: () => void;
    onLock: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onCompile: () => void;
    isDirty: boolean;
    isInteractive: boolean;
    isSaving: boolean;
    isFitting: boolean;
    isLocking: boolean;
    isZoomingIn: boolean;
    isZoomingOut: boolean;
}

export const EditorToolbar = ({ theme, onSave, onFitView, onLock, onZoomIn, onZoomOut, onCompile, isDirty, isInteractive, isSaving, isFitting, isLocking, isZoomingIn, isZoomingOut }: EditorToolbarProps) => {
    const { t } = useLanguage();
    return (
        <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
            <ToolbarButton theme={theme} onClick={onSave} icon={Save} label={t('material.save')} shortcut="Ctrl+S" disabled={!isDirty} forceActive={isSaving} />
            <div style={{ width: '1px', background: theme.colors.border.default, margin: '0 4px', height: '24px', alignSelf: 'center' }} />
            <ToolbarButton theme={theme} onClick={onCompile} icon={Play} label={t('material.compile') || "Compile"} tooltip="Generate HLSL" />
            <div style={{ width: '1px', background: theme.colors.border.default, margin: '0 4px', height: '24px', alignSelf: 'center' }} />
            <ToolbarButton theme={theme} onClick={onFitView} icon={Maximize} tooltip={t('material.fit_view')} shortcut="Ctrl+F" forceActive={isFitting} />
            <ToolbarButton theme={theme} onClick={onLock} icon={isInteractive ? Unlock : Lock} tooltip={isInteractive ? t('material.lock') : t('material.unlock')} shortcut="Ctrl+L" forceActive={isLocking} active={!isInteractive} />
            <div style={{ width: '1px', background: theme.colors.border.default, margin: '0 4px', height: '24px', alignSelf: 'center' }} />
            <ToolbarButton theme={theme} onClick={onZoomIn} icon={ZoomInIcon} tooltip={t('material.zoom_in')} shortcut="Scroll Up" forceActive={isZoomingIn} />
            <ToolbarButton theme={theme} onClick={onZoomOut} icon={ZoomOutIcon} tooltip={t('material.zoom_out')} shortcut="Scroll Down" forceActive={isZoomingOut} />
        </div>
    );
};
