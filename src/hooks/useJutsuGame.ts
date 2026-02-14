import { useState, useRef, useCallback } from 'react';
import { JutsuEngine } from '../core/JutsuEngine';
import type { EngineMode } from '../core/JutsuEngine';
import type { Jutsu } from '../config/data';

export const useJutsuGame = () => {
    const [mode, setMode] = useState<EngineMode>('basic');
    const [inputBuffer, setInputBuffer] = useState<number[]>([]);
    const [lastInputTime, setLastInputTime] = useState<number>(0);
    const [activeJutsu, setActiveJutsu] = useState<Jutsu | null>(null);

    // Use ref for engine to persist across renders without re-instantiation
    // Lazy init via null check
    const engineRef = useRef<JutsuEngine | null>(null);
    if (!engineRef.current) {
        engineRef.current = new JutsuEngine();
    }

    const handleModeChange = useCallback((newMode: EngineMode) => {
        setMode(newMode);
        engineRef.current?.setMode(newMode);
        setInputBuffer([]);
        setActiveJutsu(null);
    }, []);

    const clearBuffer = useCallback(() => {
        engineRef.current?.clearBuffer();
        setInputBuffer([]);
    }, []);

    const processSign = useCallback((signId: number) => {
        // We only process if signId is valid (e.g. > 0). 0 is 'None'.
        // And ensure engine is ready.
        if (signId === 0 || !engineRef.current) return;

        const result = engineRef.current.process(signId);

        // Sync state for UI (Optimize: Only update if changed)
        const newBuffer = engineRef.current.getBuffer();

        // Check if buffer changed
        setInputBuffer(prev => {
            if (prev.length !== newBuffer.length) return [...newBuffer];
            if (prev.length > 0 && prev[prev.length - 1] !== newBuffer[newBuffer.length - 1]) return [...newBuffer];
            // If identical, return prev to skip re-render
            return prev;
        });

        // Update timer only if buffer is non-empty (session active)
        if (newBuffer.length > 0) {
            setLastInputTime(Date.now());
        }

        if (result) {
            // Jutsu Matched!
            setActiveJutsu(result.jutsu);
            setInputBuffer([]);

            // Auto-hide notification after 5s
            setTimeout(() => {
                setActiveJutsu((current) => current && current.id === result.jutsu.id ? null : current);
            }, 5000);
        }
    }, []);

    const debugTrigger = useCallback(() => {
        const result = engineRef.current?.debugComplete();
        if (result) {
            setActiveJutsu(result.jutsu);
            setInputBuffer([]);

            setTimeout(() => {
                setActiveJutsu((current) => current && current.id === result.jutsu.id ? null : current);
            }, 5000);
        }
    }, []);



    return {
        mode,
        setMode: handleModeChange,
        inputBuffer,
        lastInputTime,
        activeJutsu,
        processSign,
        clearBuffer,
        debugTrigger
    };
};
