import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { Play, Pause, Square, Repeat, Volume2, VolumeX, AlertTriangle, SkipBack } from 'lucide-react';

interface SoundViewerProps {
    assetId: string; // Is actually the path or ID
    name: string;
}

interface AudioControlsProps {
    isPlaying: boolean;
    loop: boolean;
    isMuted: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    hasError: boolean;
    theme: any;
    t: (key: string) => string;
    onRewind: () => void;
    onTogglePlay: () => void;
    onStop: () => void;
    onToggleLoop: () => void;
    onToggleMute: () => void;
    onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
    isPlaying,
    loop,
    isMuted,
    volume,
    currentTime,
    duration,
    hasError,
    theme,
    t,
    onRewind,
    onTogglePlay,
    onStop,
    onToggleLoop,
    onToggleMute,
    onVolumeChange
}) => {
    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div
            className="w-full max-w-3xl flex items-center gap-4 p-4 rounded-lg"
            style={{ backgroundColor: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.default}` }}
        >
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onRewind}
                    className="p-2 rounded hover:bg-white/10 transition-colors"
                    title={t('sound.rewind')}
                    disabled={hasError}
                >
                    <SkipBack fill="currentColor" size={20} />
                </button>

                <button
                    onClick={onTogglePlay}
                    className="p-2 rounded hover:bg-white/10 transition-colors"
                    title={isPlaying ? t('sound.pause') : t('sound.play')}
                    disabled={hasError}
                >
                    {isPlaying ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} />}
                </button>
                <button
                    onClick={onStop}
                    className="p-2 rounded hover:bg-white/10 transition-colors"
                    title={t('sound.stop')}
                    disabled={hasError}
                >
                    <Square fill="currentColor" size={16} />
                </button>

                <div className="w-px h-6 bg-gray-700 mx-2" />

                <button
                    onClick={onToggleLoop}
                    className={`p-2 rounded hover:bg-white/10 transition-colors ${loop ? 'text-blue-400' : ''}`}
                    title={t('sound.loop')}
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
                <button
                    onClick={onToggleMute}
                    className="p-1 hover:text-white transition-colors"
                    title={t('sound.mute')}
                >
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={onVolumeChange}
                    className="w-24 accent-blue-500 h-1"
                />
            </div>
        </div>
    );
};

export const SoundViewer: React.FC<SoundViewerProps> = ({ assetId, name }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [loop, setLoop] = useState(false);
    const loopRef = useRef(loop); // Ref to access loop state in event listeners
    const [isWaveformAvailable, setIsWaveformAvailable] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Update loopRef whenever loop state changes
    useEffect(() => {
        loopRef.current = loop;
    }, [loop]);

    useEffect(() => {
        if (!containerRef.current) return;

        setErrorMessage(null);
        // We assume waveform is available to try loading it
        setIsWaveformAvailable(true);


        const audio = new Audio();
        audioRef.current = audio;

        // Construct URL using http://plume-assets/ protocol for Fetch support (http avoids SSL issues locally)
        // We do NOT replace extension because the backend likely expects the .plumeasset ID
        let url = assetId;

        // Ensure protocol prefix
        if (url.startsWith('asset://')) {
            // Replace asset:// with http://plume-assets/
            url = url.replace('asset://', 'http://plume-assets/');
        } else if (!url.startsWith('http://plume-assets/') && !url.startsWith('https://plume-assets/')) {
            // If assetId is just "Content/File.plumeasset", prepend http://plume-assets/
            const cleanPath = url.startsWith('/') ? url.substring(1) : url;
            url = `http://plume-assets/${cleanPath}`;
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
            height: containerRef.current.clientHeight,
            barRadius: 3,
            normalize: true,
            media: audio,

        };

        const wavesurfer = WaveSurfer.create(options);

        const onError = (err: any) => {
            // Ignore AbortError (happens during cleanup/fast swtiching)
            if (err.name === 'AbortError' || (typeof err === 'string' && err.includes('aborted'))) {
                return;
            }
            console.error("WaveSurfer Error:", err);
            // If waveform generation fails, we fall back to unavailable state
            setIsWaveformAvailable(false);
        };

        const onAudioError = () => {
            const audioEl = audioRef.current;
            if (!audioEl) return;

            console.error("Audio Element Error:", audioEl.error, "Src:", audioEl.src);
            setErrorMessage(t('sound.load_error'));
        };

        wavesurfer.on('error', onError);
        audio.onerror = onAudioError;

        wavesurfer.on('ready', () => {
            setDuration(wavesurfer.getDuration());
            setIsWaveformAvailable(true);
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
            if (loopRef.current) {
                wavesurfer.play();
                // Stay playing
            } else {
                setIsPlaying(false);
            }
        });

        wavesurferRef.current = wavesurfer;

        // Trigger loading of the audio file to generate the waveform
        // Must be done AFTER listeners are attached to catch errors
        wavesurfer.load(url);

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

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if we are focused within the editor or globally if desired? 
            // For now, global within the webview seems appropriate for a focused tool.
            // Check if input is focused to avoid typing conflict
            if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'KeyL':
                    toggleLoop();
                    break;
                case 'KeyM':
                    toggleMute();
                    break;
                case 'Backspace':
                case 'Home':
                    rewind();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, loop, isMuted, volume]); // Dependencies needed for toggle functions to see correct state? 
    // Wait, toggle functions use refs or state setters?
    // togglePlay uses waveSurferRef and setIsPlaying(!isPlaying). Needs isPlaying dependency.

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
            setIsPlaying((prev) => !prev);
        }
    };

    const stop = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.stop();
            setIsPlaying(false);
            setCurrentTime(0);
        }
    };

    const rewind = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.seekTo(0);
            setCurrentTime(0);
            // If it was playing, it continues playing.
        }
    }

    const toggleMute = () => {
        if (wavesurferRef.current) {
            const nextMute = !isMuted;
            wavesurferRef.current.setMuted(nextMute);
            setIsMuted(nextMute);
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
        setLoop((prev) => !prev);
        // loop logic is handled in 'finish' event via ref
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


            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                {/* Waveform */}
                <div
                    className="w-full flex-1 mb-8 rounded-lg overflow-hidden relative"
                    style={{
                        border: `1px solid ${theme.colors.border.subtle}`,
                        backgroundColor: 'rgba(0,0,0,0.2)'
                    }}
                >
                    <div ref={containerRef} className="w-full h-full" />

                    {!isWaveformAvailable && !errorMessage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <AlertTriangle size={32} className="text-yellow-500 mb-2 opacity-50" />
                            <div className="text-xs text-muted-foreground opacity-50">{t('sound.waveform_unavailable')}</div>
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
                <AudioControls
                    isPlaying={isPlaying}
                    loop={loop}
                    isMuted={isMuted}
                    volume={volume}
                    currentTime={currentTime}
                    duration={duration}
                    hasError={!!errorMessage}
                    theme={theme}
                    t={t}
                    onRewind={rewind}
                    onTogglePlay={togglePlay}
                    onStop={stop}
                    onToggleLoop={toggleLoop}
                    onToggleMute={toggleMute}
                    onVolumeChange={handleVolumeChange}
                />
            </div>

            {/* Footer */}
            <div
                className="h-8 border-t flex items-center px-4 text-xs"
                style={{
                    backgroundColor: theme.colors.bg.secondary,
                    borderColor: theme.colors.border.default,
                    color: theme.colors.text.secondary
                }}
            >
                <span>{t('asset.path').replace('{path}', assetId)}</span>
            </div>
        </div>
    );
};
