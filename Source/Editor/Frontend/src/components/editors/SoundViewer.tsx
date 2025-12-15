import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useTheme } from '../../ThemeContext';
import { Play, Pause, Square, Repeat, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

interface SoundViewerProps {
    assetId: string; // Is actually the path or ID
    name: string;
}

export const SoundViewer: React.FC<SoundViewerProps> = ({ assetId, name }) => {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [loop, setLoop] = useState(false);
    const [isWaveformAvailable, setIsWaveformAvailable] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        setErrorMessage(null);
        // We assume waveform is unavailable by default for asset:// streams unless we can fetch them
        setIsWaveformAvailable(false);

        const audio = new Audio();
        audioRef.current = audio;

        // Construct URL using asset:// protocol
        // We do NOT replace extension because the backend likely expects the .plumeasset ID
        let url = assetId;

        // Ensure asset:// prefix
        if (!url.startsWith('asset://')) {
            // If assetId is just "Content/File.plumeasset", prepend asset://
            // If it starts with "/" or similar, handle accordingly, but typically it cleans to "Content/..."
            const cleanPath = url.startsWith('/') ? url.substring(1) : url;
            url = `asset://${cleanPath}`;
        }

        console.log(`SoundViewer setup for: ${url} (Original: ${assetId})`);

        audio.src = url;

        // WaveSurfer options
        const options: any = {
            container: containerRef.current,
            waveColor: theme.colors.accent.primary,
            progressColor: theme.colors.accent.active,
            cursorColor: theme.colors.text.primary,
            barWidth: 2,
            barGap: 3,
            height: 200,
            barRadius: 3,
            normalize: true,
            media: audio,
            // Provide dummy peaks to disable internal Fetch
            peaks: [new Float32Array(100).fill(0)]
        };

        const wavesurfer = WaveSurfer.create(options);

        // Retry logic state (unused if we trust asset://)
        // let retries = 0;

        const onError = (err: any) => {
            console.error("WaveSurfer Error:", err);
        };

        const onAudioError = () => {
            const audioEl = audioRef.current;
            if (!audioEl) return;

            console.error("Audio Element Error:", audioEl.error, "Src:", audioEl.src);
            setErrorMessage("Failed to load audio asset.");
        };

        wavesurfer.on('error', onError);
        audio.onerror = onAudioError;

        wavesurfer.on('ready', () => {
            setDuration(wavesurfer.getDuration());
        });

        audio.onloadedmetadata = () => {
            setDuration(audio.duration);
            setErrorMessage(null);
        };

        wavesurfer.on('timeupdate', (time) => {
            setCurrentTime(time);
        });

        wavesurfer.on('interaction', () => {
            setCurrentTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.on('finish', () => {
            setIsPlaying(false);
        });

        wavesurferRef.current = wavesurfer;

        return () => {
            wavesurfer.destroy();
            audio.src = '';
            audio.onerror = null;
        };
    }, [assetId, theme]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            wavesurferRef.current?.destroy();
        };
    }, []);

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
            setIsPlaying(!isPlaying);
        }
    };

    const stop = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.stop();
            setIsPlaying(false);
            setCurrentTime(0);
        }
    };

    const toggleMute = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(newVol);
        }
    };

    const toggleLoop = () => {
        setLoop(!loop);
    };

    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws) return;

        const onFinish = () => {
            if (loop) ws.play();
            else setIsPlaying(false);
        };

        ws.un('finish', onFinish);
        ws.on('finish', onFinish);

        return () => {
            ws.un('finish', onFinish);
        }
    }, [loop]);


    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.colors.bg.primary,
            color: theme.colors.text.primary
        }}>
            {/* Header */}
            <div
                className="h-8 border-b flex items-center px-4 text-xs font-bold"
                style={{
                    backgroundColor: theme.colors.bg.secondary,
                    borderColor: theme.colors.border.default,
                    color: theme.colors.text.primary
                }}
            >
                Sound Viewer: {name}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                {/* Waveform */}
                <div
                    className="w-full h-[200px] mb-8 rounded-lg overflow-hidden relative"
                    style={{
                        border: `1px solid ${theme.colors.border.subtle}`,
                        backgroundColor: 'rgba(0,0,0,0.2)'
                    }}
                >
                    <div ref={containerRef} className="w-full h-full" />

                    {!isWaveformAvailable && !errorMessage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <AlertTriangle size={32} className="text-yellow-500 mb-2 opacity-50" />
                            <div className="text-xs text-muted-foreground opacity-50">Waveform Unavailable (Streamed Asset)</div>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/50">
                            <AlertTriangle size={32} className="text-red-500 mb-2" />
                            <div className="text-xs text-red-400 font-bold">{errorMessage}</div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div
                    className="w-full max-w-3xl flex items-center gap-4 p-4 rounded-lg"
                    style={{ backgroundColor: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.default}` }}
                >
                    {/* Playback Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={togglePlay}
                            className="p-2 rounded hover:bg-white/10 transition-colors"
                            title={isPlaying ? "Pause" : "Play"}
                            disabled={!!errorMessage}
                        >
                            {isPlaying ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} />}
                        </button>
                        <button
                            onClick={stop}
                            className="p-2 rounded hover:bg-white/10 transition-colors"
                            title="Stop"
                            disabled={!!errorMessage}
                        >
                            <Square fill="currentColor" size={16} />
                        </button>
                        <button
                            onClick={toggleLoop}
                            className={`p-2 rounded hover:bg-white/10 transition-colors ${loop ? 'text-blue-400' : ''}`}
                            title="Toggle Loop"
                            style={{ color: loop ? theme.colors.accent.primary : 'inherit' }}
                        >
                            <Repeat size={16} />
                        </button>
                    </div>

                    {/* Time */}
                    <div className="text-xs font-mono min-w-[100px] text-center">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                        <button onClick={toggleMute} className="p-1 hover:text-white transition-colors">
                            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-24 accent-blue-500 h-1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
