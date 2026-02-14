import classNames from 'classnames';
import type { EngineMode } from '../core/JutsuEngine';

interface ModeSwitcherProps {
    currentMode: EngineMode;
    onModeChange: (mode: EngineMode) => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
    const modes: { id: EngineMode; label: string; icon: string }[] = [
        { id: 'basic', label: 'Basic Recon', icon: '🔍' },
        { id: 'jutsu_practice', label: 'Practice', icon: '🧘' },
    ];

    return (
        <div className="flex bg-gray-900 rounded-lg p-1 gap-1 border border-gray-700 shadow-lg">
            {modes.map((mode) => (
                <button
                    key={mode.id}
                    onClick={() => onModeChange(mode.id)}
                    className={classNames(
                        'px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2',
                        {
                            'bg-konoha-orange text-black shadow-[0_0_10px_rgba(242,169,0,0.5)]': currentMode === mode.id,
                            'text-gray-400 hover:text-gray-200 hover:bg-gray-800': currentMode !== mode.id,
                        }
                    )}
                >
                    <span>{mode.icon}</span>
                    <span className="hidden sm:inline">{mode.label}</span>
                </button>
            ))}
        </div>
    );
};
