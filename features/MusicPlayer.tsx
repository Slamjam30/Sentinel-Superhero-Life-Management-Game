import React, { useRef, useEffect, useState } from 'react';
import { GameState, MusicContext } from '../types';
import { Play, Pause, SkipForward, Volume2, VolumeX, Music, Youtube, ListMusic, X } from 'lucide-react';

interface MusicPlayerProps {
    gameState: GameState;
    onToggle: () => void;
    onVolumeChange: (vol: number) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ gameState, onToggle, onVolumeChange }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
    const [showPlaylist, setShowPlaylist] = useState(false);
    
    // Derived from state
    const { music } = gameState;
    const { currentMood, isPlaying, volume, tracks } = music;

    // Filter tracks for current mood
    const validTracks = tracks.filter(t => t.contexts.includes(currentMood));
    const currentTrack = tracks.find(t => t.id === currentTrackId);

    // Helpers
    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const isYouTube = currentTrack && getYouTubeId(currentTrack.url);

    // Pick a new track if necessary
    useEffect(() => {
        // If we have no track, or the current track is invalid for the mood, pick a new one.
        const needsNewTrack = !currentTrack || !currentTrack.contexts.includes(currentMood);
        
        if (needsNewTrack && validTracks.length > 0) {
            pickRandomTrack();
        }
    }, [currentMood, tracks]); // Check when mood changes or track list changes (e.g. edit)

    // Handle Play/Pause - Audio
    useEffect(() => {
        if (audioRef.current && !isYouTube) {
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn("Autoplay blocked or error:", error);
                    });
                }
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrackId, isYouTube, currentTrack?.url]); // Added currentTrack.url to re-trigger if url changes

    // Handle Volume - Audio
    useEffect(() => {
        if (audioRef.current && !isYouTube) {
            audioRef.current.volume = volume;
        }
    }, [volume, isYouTube]);

    // Handle YouTube Control via PostMessage
    useEffect(() => {
        if (isYouTube && iframeRef.current && iframeRef.current.contentWindow) {
            const cmd = isPlaying ? 'playVideo' : 'pauseVideo';
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: cmd,
                args: []
            }), '*');
        }
    }, [isPlaying, currentTrackId, isYouTube, currentTrack?.url]);

    useEffect(() => {
        if (isYouTube && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [volume * 100]
            }), '*');
        }
    }, [volume, isYouTube]);

    // YouTube Event Listener
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!isYouTube) return;
            try {
                const data = JSON.parse(event.data);
                if (data.info && data.info.playerState === 0) { // 0 = Ended
                    pickRandomTrack();
                }
            } catch (e) {
                // Ignore
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isYouTube]);

    const pickRandomTrack = () => {
        if (validTracks.length === 0) return;
        // Try to pick a different one if possible
        let candidates = validTracks.filter(t => t.id !== currentTrackId);
        if (candidates.length === 0) candidates = validTracks; // Only 1 track available
        
        const randomIndex = Math.floor(Math.random() * candidates.length);
        setCurrentTrackId(candidates[randomIndex].id);
    };

    const handleManualSelect = (id: string) => {
        setCurrentTrackId(id);
        setShowPlaylist(false);
        if (!isPlaying) onToggle(); // Auto-play on manual select
    };

    const handleEnded = () => {
        pickRandomTrack();
    };

    if (!currentTrack && validTracks.length === 0) return null;

    const youtubeId = currentTrack ? getYouTubeId(currentTrack.url) : null;

    return (
        <div className="bg-slate-900 border-t border-slate-800 p-2 flex items-center gap-4 text-white text-xs relative z-50">
            {currentTrack && youtubeId ? (
                <iframe
                    key={currentTrack.url} // Re-mount on URL change
                    ref={iframeRef}
                    title="yt-player"
                    width="1"
                    height="1"
                    src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&origin=${window.location.origin}`}
                    className="absolute opacity-0 pointer-events-none -top-full"
                    allow="autoplay"
                />
            ) : currentTrack ? (
                <audio 
                    key={currentTrack.url} // Re-mount on URL change
                    ref={audioRef}
                    src={currentTrack.url}
                    onEnded={handleEnded}
                    onError={(e) => console.error("Audio error", e)}
                />
            ) : null}
            
            <div className="flex items-center gap-2">
                <button onClick={onToggle} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors">
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={pickRandomTrack} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors" title="Shuffle / Next">
                    <SkipForward size={14} />
                </button>
                <button 
                    onClick={() => setShowPlaylist(!showPlaylist)} 
                    className={`p-2 rounded-full transition-colors ${showPlaylist ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                    title="Select Track"
                >
                    <ListMusic size={14} />
                </button>
            </div>

            {/* Playlist Popup */}
            {showPlaylist && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-2 fade-in">
                    <div className="p-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                        <span className="font-bold text-slate-300 uppercase text-[10px]">Current Mood: {currentMood}</span>
                        <button onClick={() => setShowPlaylist(false)}><X size={12} /></button>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {validTracks.length === 0 ? (
                            <div className="p-3 text-slate-500 italic text-center">No tracks for this mood.</div>
                        ) : (
                            validTracks.map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => handleManualSelect(t.id)}
                                    className={`w-full text-left p-2 hover:bg-slate-800 transition-colors flex items-center gap-2 ${t.id === currentTrackId ? 'text-amber-400 bg-slate-800/50' : 'text-slate-300'}`}
                                >
                                    {t.id === currentTrackId && <Play size={8} className="fill-current" />}
                                    <div className="truncate flex-1">
                                        <div className="font-bold truncate">{t.name}</div>
                                        <div className="text-[9px] text-slate-500 truncate">{t.author}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 min-w-0">
                {currentTrack ? (
                    <>
                        <div className="font-bold truncate text-amber-500 flex items-center gap-2">
                            {youtubeId && <Youtube size={12} className="text-red-500" />}
                            {currentTrack.name}
                        </div>
                        <div className="truncate text-slate-500 flex items-center gap-1">
                            <span>{currentTrack.author}</span>
                            <span className="text-[10px] opacity-50">({currentTrack.source})</span>
                        </div>
                    </>
                ) : (
                    <div className="text-slate-500 italic">No track playing</div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)} className="text-slate-400 hover:text-white">
                    {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <input 
                    type="range" 
                    min="0" max="1" step="0.05"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-16 accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            
            <div className="bg-slate-800 px-2 py-1 rounded text-[10px] uppercase font-bold text-slate-400">
                {currentMood}
            </div>
        </div>
    );
};