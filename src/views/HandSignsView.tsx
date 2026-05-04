import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';
import { HAND_SIGNS, WORD_MAPPINGS, SPECIAL_KEY_MAPPINGS } from '../config/data';

const T9_DISPLAY: Record<number, string> = {
    1: '.,?!', 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL',
    6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ',
};

export default function HandSignsView() {
    useMeta(
        '12 Ninja Hand Signs Reference — Ketsuin',
        'Complete reference for the 12 ninja hand signs used in Ketsuin. Each zodiac seal maps to a T9 key group for text input via webcam.'
    );

    const signs = HAND_SIGNS.filter(s => s.id >= 1 && s.id <= 12);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 text-gray-100">
            <h1 className="text-3xl font-bold text-konoha-orange mb-2">12 Ninja Hand Signs</h1>
            <p className="text-gray-400 mb-8">
                Each hand sign corresponds to one of the 12 Chinese zodiac branches (十二支) and maps to a T9 key group.
                Form these signs in front of your webcam to type text.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {signs.map(sign => {
                    const keyMapping = WORD_MAPPINGS[String(sign.id)] || SPECIAL_KEY_MAPPINGS[String(sign.id)];
                    const t9Letters = T9_DISPLAY[sign.id] || (keyMapping === 'space' ? 'SPC' : '');

                    return (
                        <div key={sign.id} className="bg-ink/80 border border-gray-800 rounded-lg p-4 flex gap-4 items-center">
                            <img
                                src={`${import.meta.env.BASE_URL}asset/${sign.kanji}.png`}
                                alt={`${sign.name} (${sign.kanji})`}
                                loading="lazy"
                                className="w-16 h-16 object-contain flex-shrink-0"
                            />
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-konoha-orange font-mono text-lg font-bold">{sign.id}</span>
                                    <span className="text-gray-100 font-semibold">{sign.name}</span>
                                </div>
                                <div className="text-gray-400 text-sm">
                                    Kanji: <span className="text-gray-200">{sign.kanji}</span>
                                </div>
                                <div className="text-gray-400 text-sm">
                                    Letters: <span className="text-konoha-orange font-mono">{t9Letters}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-konoha-orange mb-3">Special Keys</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-ink/80 border border-gray-800 rounded-lg p-4">
                        <span className="text-konoha-orange font-mono font-bold">0</span>
                        <span className="text-gray-100 ml-2">Dog 戌</span>
                        <div className="text-gray-400 text-sm">Space</div>
                    </div>
                    <div className="bg-ink/80 border border-gray-800 rounded-lg p-4">
                        <span className="text-konoha-orange font-mono font-bold">*</span>
                        <span className="text-gray-100 ml-2">Bird 酉</span>
                        <div className="text-gray-400 text-sm">Delete</div>
                    </div>
                    <div className="bg-ink/80 border border-gray-800 rounded-lg p-4">
                        <span className="text-konoha-orange font-mono font-bold">#</span>
                        <span className="text-gray-100 ml-2">Boar 亥</span>
                        <div className="text-gray-400 text-sm">Next candidate</div>
                    </div>
                </div>
            </section>

            <div className="flex gap-4">
                <Link to="/" className="px-4 py-2 bg-konoha-orange text-black font-semibold rounded hover:brightness-110 transition">
                    Try Ketsuin
                </Link>
                <Link to="/about" className="px-4 py-2 border border-konoha-orange text-konoha-orange rounded hover:bg-konoha-orange/10 transition">
                    About
                </Link>
            </div>
        </div>
    );
}
