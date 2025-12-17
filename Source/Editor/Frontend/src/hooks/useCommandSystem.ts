import { useCallback } from 'react';
import { COMMANDS } from '../data/commands';
import { Tab } from '../components/layout/TabSystem';

interface UseCommandSystemProps {
    addLog: (msg: string, level: 'INFO' | 'WARN' | 'ERROR' | 'USER') => void;
    setShowFPS: (show: boolean) => void;
    showFPS: boolean;
    setVsyncEnabled: (enabled: boolean) => void;
    vsyncEnabled: boolean;
    setMaxFpsCap: (cap: number) => void;
    maxFpsCap: number;
    setLogs: (logs: any[]) => void;
    setTabs: (tabs: Tab[] | ((prev: Tab[]) => Tab[])) => void;
    setActiveTabId: (id: string) => void;
    setCameraTransform: (transform: any) => void; // Using any for composite update
    t: (key: string) => string;
}

export function useCommandSystem({
    addLog,
    setShowFPS,
    showFPS,
    setVsyncEnabled,
    vsyncEnabled,
    setMaxFpsCap,
    maxFpsCap,
    setLogs,
    setTabs,
    setActiveTabId,
    setCameraTransform,
    t
}: UseCommandSystemProps) {

    const normalizeAngle = (v: number) => {
        let a = ((v % 360) + 360) % 360;
        if (a >= 180) a -= 360;
        return a;
    };

    const handleExecuteCommand = useCallback((cmd: string) => {
        const raw = cmd.trim();
        if (!raw) return;
        addLog(`> ${raw}`, 'USER');

        const helpPrefixMatch = raw.match(/^(help|\?|commands)\s+([a-z0-9_.-]+)$/i);
        if (helpPrefixMatch) {
            const prefix = helpPrefixMatch[2].toLowerCase();
            const exact = COMMANDS[prefix];
            if (exact) {
                addLog(`${prefix}: ${exact.description}`, 'INFO');
                addLog(`${exact.usage}`, 'INFO');
                return;
            }
            const keys = Object.keys(COMMANDS);
            const normalized = prefix.replace(/^\.+|\.+$/g, '');
            const matched = keys.filter(k => k === normalized || k.startsWith(normalized + '.'));
            if (matched.length === 0) {
                addLog(`No commands under ${prefix}`, 'WARN');
                return;
            }
            addLog(`Commands under '${prefix}':`, 'INFO');
            const children = new Set<string>();
            for (const k of matched) {
                if (k === normalized) {
                    children.add('');
                } else {
                    const rest = k.slice(normalized.length + 1);
                    const next = rest.split('.')[0];
                    children.add(next);
                }
            }
            Array.from(children).sort().forEach((child) => {
                if (child === '') {
                    const info = COMMANDS[normalized];
                    if (info) addLog(`${normalized}: ${info.usage} — ${info.description}`, 'INFO');
                    return;
                }
                const full = normalized + '.' + child;
                const isLeaf = !!COMMANDS[full];
                const descendantCount = keys.filter(k => k === full || k.startsWith(full + '.')).length;
                if (isLeaf) {
                    const info = COMMANDS[full];
                    addLog(`${full}: ${info.usage} — ${info.description}`, 'INFO');
                }
                if (descendantCount > 1) {
                    addLog(`${full}/ (${descendantCount})`, 'INFO');
                }
            });
            return;
        }

        if (/^(help|\?|commands)$/i.test(raw)) {
            addLog('Top-level command prefixes:', 'INFO');
            const keys = Object.keys(COMMANDS);
            const top = Array.from(new Set(keys.map(k => k.split('.')[0]))).sort();
            top.forEach(t => {
                const count = keys.filter(k => k === t || k.startsWith(t + '.')).length;
                addLog(`${t}/ (${count})`, 'INFO');
            });
            addLog("Note: to see child commands of a prefix use e.g. 'help viewport' or 'help viewport.cam'", 'INFO');
            return;
        }

        const parts = raw.replace(/,/g, ' ').split(/\s+/);
        const name = parts[0].toLowerCase();
        const args = parts.slice(1).map(v => Number(v));

        if (name === 'fps') {
            if (args.length === 0) {
                addLog(`${showFPS ? 1 : 0}`, 'INFO');
                return;
            }
            const v = args[0];
            if (v === 0) {
                setShowFPS(false);
                addLog('FPS display hidden', 'INFO');
                return;
            }
            if (v === 1) {
                setShowFPS(true);
                addLog('FPS display shown', 'INFO');
                return;
            }
            addLog("Usage: fps [0|1]", 'ERROR');
            return;
        }

        if (name === 'vsync') {
            if (args.length === 0) {
                addLog(`${vsyncEnabled ? 1 : 0}`, 'INFO');
                return;
            }
            const v = args[0];
            if (v === 0) {
                setVsyncEnabled(false);
                if ((window as any).chrome?.webview) (window as any).chrome.webview.postMessage({ action: 'set-vsync', value: false });
                addLog('VSync disabled', 'INFO');
                return;
            }
            if (v === 1) {
                setVsyncEnabled(true);
                if ((window as any).chrome?.webview) (window as any).chrome.webview.postMessage({ action: 'set-vsync', value: true });
                addLog('VSync enabled', 'INFO');
                return;
            }
            addLog("Usage: vsync [0|1]", 'ERROR');
            return;
        }

        if (name === 'maxfps') {
            if (args.length === 0) {
                addLog(`${maxFpsCap}`, 'INFO');
                return;
            }
            const v = args[0];
            if (v >= 0) {
                setMaxFpsCap(v);
                if ((window as any).chrome?.webview) (window as any).chrome.webview.postMessage({ action: 'set-maxfps', value: v });
                addLog(`Max FPS set to ${v}`, 'INFO');
                return;
            }
            addLog('Usage: maxfps [value >= 0]', 'ERROR');
            return;
        }

        if (name === 'clear') {
            setLogs([]);
            return;
        }

        if (name === 'openmesh') {
            const meshName = parts[1] || t('app.mesh.new');
            const newTabId = `mesh-${Date.now()}`;
            setTabs(prev => [...prev, { id: newTabId, title: meshName, type: 'static-mesh', data: { entityId: meshName }, closable: true }]);
            setActiveTabId(newTabId);
            addLog(`Opened Static Mesh Editor: ${meshName}`, 'INFO');
            return;
        }

        if (name === 'viewport.cam.loc') {
            if (args.length < 3 || !args.slice(0, 3).every(Number.isFinite)) {
                addLog('Usage: viewport.cam.loc x y z', 'ERROR');
                return;
            }
            const [x, y, z] = args;
            setCameraTransform((prev: any) => ({ ...prev, position: { x, y, z } }));
            if ((window as any).chrome?.webview) {
                (window as any).chrome.webview.postMessage({ action: 'set-camera', position: { x, y, z } });
            }
            addLog(`Camera position set to (${x}, ${y}, ${z})`, 'INFO');
            return;
        }

        if (name === 'viewport.cam.rot') {
            if (args.length < 3 || !args.slice(0, 3).every(Number.isFinite)) {
                addLog('Usage: viewport.cam.rot pitch yaw roll', 'ERROR');
                return;
            }
            let [px, py, pz] = args;
            px = Math.max(-89, Math.min(89, normalizeAngle(px)));
            py = normalizeAngle(py);
            pz = normalizeAngle(pz);
            setCameraTransform((prev: any) => ({ ...prev, rotation: { x: px, y: py, z: pz } }));
            if ((window as any).chrome?.webview) {
                (window as any).chrome.webview.postMessage({ action: 'set-camera', rotation: { x: px, y: py, z: pz } });
            }
            addLog(`Camera rotation set to (${px}, ${py}, ${pz})`, 'INFO');
            return;
        }

        addLog(`Unknown command: ${name}`, 'WARN');
    }, [addLog, t, showFPS, setShowFPS, vsyncEnabled, setVsyncEnabled, maxFpsCap, setMaxFpsCap, setLogs, setTabs, setActiveTabId, setCameraTransform, COMMANDS]);

    return { handleExecuteCommand };
}
