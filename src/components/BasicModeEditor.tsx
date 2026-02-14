import React from 'react';
import { HAND_SIGNS } from '../config/data';

interface BasicModeEditorProps {
    history: number[];
    editorText: string;
    setEditorText: (text: string) => void;
}

export const BasicModeEditor: React.FC<BasicModeEditorProps> = ({ history, editorText, setEditorText }) => {
    return (
        <>
            {/* History Bar */}
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2 shadow-md">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                    <span className="text-gray-500 font-mono text-sm whitespace-nowrap">SEAL HISTORY:</span>
                    <div className="flex items-center gap-1">
                        {history.map((id, idx) => {
                            const sign = HAND_SIGNS.find(s => s.id === id);
                            return (
                                <div key={`${id}-${idx}`} className="flex items-center animate-fade-in-right">
                                    <span className="text-xl text-konoha-orange font-bold drop-shadow-[0_0_5px_rgba(242,169,0,0.8)]">
                                        {sign?.kanji}
                                    </span>
                                    {idx < history.length - 1 && <span className="text-gray-700 mx-1">→</span>}
                                </div>
                            );
                        })}
                        {history.length === 0 && <span className="text-gray-700 italic text-sm">None</span>}
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e] border border-gray-700 rounded-lg overflow-hidden shadow-lg min-h-[200px]">
                <div className="bg-[#2d2d2d] px-4 py-2 flex justify-between items-center border-b border-[#333]">
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span> detected code
                    </span>
                </div>
                <textarea
                    value={editorText}
                    onChange={(e) => setEditorText(e.target.value)}
                    className="flex-1 bg-transparent text-gray-300 font-mono p-4 resize-none focus:outline-none focus:ring-1 focus:ring-gray-700 text-sm leading-relaxed"
                    spellCheck={false}
                    placeholder="# Perform seals to write code..."
                />
            </div>
        </>
    );
};
