import { useEffect, useRef } from 'react';
import { Entity } from '../types';
import { DEFAULT_SCENE } from '../data/constants';

interface UseNativeBridgeProps {
    setPlugins: (plugins: any[]) => void;
    setShowFPS: (show: boolean) => void;
    showFPSRef: React.MutableRefObject<boolean>;
    setVsyncEnabled: (enabled: boolean) => void;
    setMaxFpsCap: (cap: number) => void;
    setRenderingAPI: (api: 'DirectX12' | 'Vulkan' | 'OpenGL' | 'Metal') => void;
    setFpsValue: (fps: number) => void;
    setCameraTransform: (transform: any) => void; // Using any for composite state update, or specific type
    setEntities: (entities: Entity[] | ((prev: Entity[]) => Entity[])) => void;
    addLog: (msg: string, level: 'INFO' | 'WARN' | 'ERROR' | 'USER') => void;
}

export function useNativeBridge({
    setPlugins,
    setShowFPS,
    showFPSRef,
    setVsyncEnabled,
    setMaxFpsCap,
    setRenderingAPI,
    setFpsValue,
    setCameraTransform,
    setEntities,
    addLog
}: UseNativeBridgeProps) {

    // Main Initialization & Event Listener Effect
    useEffect(() => {
        // Listen to messages from native (WebView2 PostWebMessage)
        const handleNativeMessage = (e: any) => {
            try {
                const data = (e && e.data) ? e.data : (e && e.detail) ? e.detail : e;
                if (!data) return;
                const action = data.action;

                if (action === 'plugin-list') {
                    if (data.plugins) {
                        const enrichedPlugins = data.plugins.map((p: any) => {
                            if (p.name === 'Discord Rich Presence' && !p.author) {
                                return { ...p, author: 'Plume Engine Team' };
                            }
                            return p;
                        });
                        setPlugins(enrichedPlugins);
                        addLog(`Loaded ${data.plugins.length} plugins`, 'INFO');
                    }
                }

                if (action === 'ui_config' && data.uiConfig) {
                    if (typeof data.uiConfig.showFPS !== 'undefined') {
                        const val = !!data.uiConfig.showFPS;
                        setShowFPS(val);
                        showFPSRef.current = val;
                    }
                    if (typeof data.uiConfig.vsync !== 'undefined') {
                        setVsyncEnabled(!!data.uiConfig.vsync);
                    }
                    if (typeof data.uiConfig.maxFPS !== 'undefined') {
                        setMaxFpsCap(data.uiConfig.maxFPS);
                    }
                }
            } catch (e) {
                console.warn('Error handling native message:', e);
            }
        };

        try {
            if ((window as any).chrome?.webview) {
                (window as any).chrome.webview.addEventListener('message', handleNativeMessage);
                // Request initial plugin list once listener is attached
                setTimeout(() => {
                    (window as any).chrome.webview.postMessage({ action: 'get-plugins' });
                }, 500);
            }
            else window.addEventListener('message', handleNativeMessage as any);
        } catch (e) {
            console.warn('Error attaching message listener:', e);
        }

        const loadSceneData = () => {
            const script = document.createElement('script');
            script.src = './scene_data.js';
            script.onload = () => {
                const data = (window as any).PLUME_SCENE_DATA;
                if (data) {
                    setEntities(data);
                    addLog('Scene loaded successfully', 'INFO');
                }
            };
            script.onerror = () => {
                setEntities(DEFAULT_SCENE);
                addLog('Failed to load scene, using default', 'WARN');
            };
            document.body.appendChild(script);
        };

        const loadRenderingData = () => {
            const script = document.createElement('script');
            script.src = './rendering_data.js';
            script.onload = () => {
                const data = (window as any).PLUME_RENDERING_DATA;
                if (data && data.graphicsAPI) {
                    setRenderingAPI(data.graphicsAPI);
                }
                if (data && typeof data.fps === 'number') {
                    setFpsValue(Math.round(data.fps));
                }
                if (data && data.uiConfig) {
                    if (typeof data.uiConfig.showFPS !== 'undefined') {
                        const val = !!data.uiConfig.showFPS;
                        setShowFPS(val);
                        showFPSRef.current = val;
                    }
                    if (typeof data.uiConfig.vsync !== 'undefined') {
                        setVsyncEnabled(!!data.uiConfig.vsync);
                    }
                    if (typeof data.uiConfig.maxFPS !== 'undefined') {
                        setMaxFpsCap(data.uiConfig.maxFPS);
                    }
                }
            };
            document.body.appendChild(script);
        };

        loadSceneData();
        loadRenderingData();

        // Initial sycn
        try {
            const init = (window as any).PLUME_RENDERING_DATA;
            if (init) {
                if (init.graphicsAPI) setRenderingAPI(init.graphicsAPI);
                if (typeof init.fps === 'number') setFpsValue(Math.round(init.fps));
                if (init.uiConfig && typeof init.uiConfig.showFPS !== 'undefined') {
                    const val = !!init.uiConfig.showFPS;
                    setShowFPS(val);
                    showFPSRef.current = val;
                }
                if (init.camera) {
                    const rawRot = init.camera.rotation || { x: 0, y: 0, z: 0 };
                    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
                    const normalizeAngle = (v: number) => { let a = ((v % 360) + 360) % 360; if (a >= 180) a -= 360; return a; };
                    const normRaw = { x: normalizeAngle(rawRot.x), y: normalizeAngle(rawRot.y), z: normalizeAngle(rawRot.z) };
                    const normRot = { x: clamp(normRaw.x, -89, 89), y: normRaw.y, z: normRaw.z };
                    setCameraTransform({ position: init.camera.position || { x: 0, y: 0, z: 0 }, rotation: normRot });
                }
            }
        } catch (e) {
            console.warn('Error initializing rendering data:', e);
        }

        // Poll for rendering data updates every 500ms
        const renderingInterval = setInterval(() => {
            const script = document.createElement('script');
            script.src = './rendering_data.js?t=' + Date.now();
            script.onload = () => {
                const data = (window as any).PLUME_RENDERING_DATA;
                if (data && data.graphicsAPI) {
                    setRenderingAPI(data.graphicsAPI);
                }
                // Update FPS and sync camera transform from C++ backend
                if (data && typeof data.fps === 'number') {
                    setFpsValue(Math.round(data.fps));
                }
                if (data && data.uiConfig && typeof data.uiConfig.showFPS !== 'undefined') {
                    const val = !!data.uiConfig.showFPS;
                    if (val !== showFPSRef.current) {
                        showFPSRef.current = val;
                        setShowFPS(val);
                    } else {
                        setShowFPS(val);
                    }
                }
                if (data && data.uiConfig) {
                    if (typeof data.uiConfig.vsync !== 'undefined') setVsyncEnabled(!!data.uiConfig.vsync);
                    if (typeof data.uiConfig.maxFPS !== 'undefined') setMaxFpsCap(data.uiConfig.maxFPS);
                }

                if (data && data.camera) {
                    // Normalize and clamp rotation values coming from the native backend
                    const rawRot = data.camera.rotation || { x: 0, y: 0, z: 0 };
                    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
                    const normalizeAngle = (v: number) => {
                        // Normalize to [-180,180)
                        let a = ((v % 360) + 360) % 360;
                        if (a >= 180) a -= 360;
                        return a;
                    };
                    // First normalize all incoming angles, then clamp pitch
                    const normRaw = {
                        x: normalizeAngle(rawRot.x),
                        y: normalizeAngle(rawRot.y),
                        z: normalizeAngle(rawRot.z)
                    };
                    const normRot = {
                        x: clamp(normRaw.x, -89, 89), // restrict pitch to avoid gimbal/inversion
                        y: normRaw.y,
                        z: normRaw.z
                    };
                    setCameraTransform({
                        position: data.camera.position || { x: 0, y: 0, z: 0 },
                        rotation: normRot
                    });
                }
                document.body.removeChild(script);
            };
            script.onerror = () => {
                document.body.removeChild(script);
            };
            document.body.appendChild(script);
        }, 500);

        return () => clearInterval(renderingInterval);
    }, [addLog, setPlugins, setShowFPS, showFPSRef, setVsyncEnabled, setMaxFpsCap, setRenderingAPI, setFpsValue, setCameraTransform, setEntities]);
}
