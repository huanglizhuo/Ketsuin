import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import { LOCALE_LABELS, LOCALES } from '../i18n/translations';
import type { Locale } from '../i18n/translations';

export const LanguageSwitcher: React.FC = () => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, right: 0 });
    const { locale, setLocale } = useI18n();

    // Calculate dropdown position from button rect
    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPos({
            top: rect.bottom + 6, // 6px gap
            right: window.innerWidth - rect.right,
        });
    }, []);

    // Reposition on scroll/resize while open
    useEffect(() => {
        if (!open) return;
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open, updatePosition]);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                buttonRef.current && !buttonRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    const current = LOCALE_LABELS[locale];

    return (
        <>
            {/* Toggle Button */}
            <button
                ref={buttonRef}
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/40 border border-white/20 rounded
                           text-xs font-mono text-gray-300
                           hover:border-konoha-orange/50 hover:text-white transition-all duration-200"
                aria-haspopup="listbox"
                aria-expanded={open}
                title="Language"
            >
                <span className="text-base leading-none">{current.flag}</span>
                <span>{current.short}</span>
                <span className={`text-[8px] leading-none transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Portal Dropdown — rendered at document.body, escapes all stacking contexts */}
            {open && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-gray-900/95 backdrop-blur-md
                               border border-white/20 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)]
                               overflow-hidden min-w-[140px]"
                    style={{ top: pos.top, right: pos.right, zIndex: 9999 }}
                    role="listbox"
                    aria-activedescendant={`lang-${locale}`}
                >
                    {LOCALES.map((l: Locale) => {
                        const info = LOCALE_LABELS[l];
                        const isActive = l === locale;
                        return (
                            <button
                                key={l}
                                id={`lang-${l}`}
                                role="option"
                                aria-selected={isActive}
                                onClick={() => { setLocale(l); setOpen(false); }}
                                className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm font-mono
                                            transition-colors duration-150
                                    ${isActive
                                        ? 'bg-konoha-orange/15 text-konoha-orange font-bold'
                                        : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <span className="text-lg leading-none">{info.flag}</span>
                                <span>{info.name}</span>
                                {isActive && <span className="ml-auto text-konoha-orange text-xs">✓</span>}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
};
