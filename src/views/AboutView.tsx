import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';

export default function AboutView() {
    useMeta(
        'About Ketsuin — Ninja Hand Sign Input Method',
        'Learn about Ketsuin, a web-based ninja hand sign input method powered by AI. Detect 12 hand seals via webcam and type with T9 logic.'
    );

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 text-gray-100">
            <h1 className="text-3xl font-bold text-konoha-orange mb-6">About Ketsuin</h1>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-konoha-orange mb-3">What is Ketsuin?</h2>
                <p className="leading-relaxed mb-4">
                    Ketsuin (結印) is a web-based input method that lets you type text using ninja hand signs detected
                    through your webcam. Inspired by the hand seals from Japanese ninja tradition, it maps 12 zodiac
                    seals to T9 phone keypad groups — enabling text input through gesture.
                </p>
                <p className="leading-relaxed">
                    The name 結印 means "binding seal" in Japanese, referring to the hand positions used in ninja jutsu.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-konoha-orange mb-3">How It Works</h2>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                    <li>Allow webcam access when prompted</li>
                    <li>Form one of the 12 ninja hand seals in front of your camera</li>
                    <li>The AI model (YOLOX-Nano) detects your hand sign in real time</li>
                    <li>Each sign maps to a T9 key group (like an old phone keypad)</li>
                    <li>Combine signs to spell words — cycle through candidates with the Boar seal</li>
                </ol>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-konoha-orange mb-3">Technology</h2>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                    <li><strong>YOLOX-Nano</strong> — lightweight object detection model for hand sign recognition</li>
                    <li><strong>ONNX Runtime Web</strong> — runs ML inference entirely in the browser via WebAssembly</li>
                    <li><strong>T9 Engine</strong> — predictive text input mapped to 12 ninja seals</li>
                    <li><strong>React 19 + TypeScript + Vite</strong> — modern web stack</li>
                    <li><strong>Supabase</strong> — global leaderboard for challenge mode</li>
                </ul>
                <p className="mt-3 text-sm text-gray-400">
                    All detection happens locally in your browser. No video data is sent to any server.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-konoha-orange mb-3">Challenge Mode</h2>
                <p className="leading-relaxed mb-3">
                    Test your hand sign speed by performing jutsu sequences as fast as possible. Compete on the global
                    leaderboard and earn ninja ranks from Genin (rookie) to Six Paths (godlike speed).
                </p>
                <p className="leading-relaxed">
                    There are 8 jutsu challenges ranging from Chidori (4 seals, difficulty 1) to the legendary
                    Water Dragon (44 seals, difficulty 5).
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-konoha-orange mb-3">Author</h2>
                <p className="leading-relaxed">
                    Built by <a href="https://github.com/huanglizhuo" className="text-chakra-blue hover:underline" target="_blank" rel="noopener noreferrer">Huang Lizhuo</a>.
                    Open source under the MIT License.
                </p>
            </section>

            <div className="flex gap-4 mt-8">
                <Link to="/" className="px-4 py-2 bg-konoha-orange text-black font-semibold rounded hover:brightness-110 transition">
                    Try Ketsuin
                </Link>
                <Link to="/hand-signs" className="px-4 py-2 border border-konoha-orange text-konoha-orange rounded hover:bg-konoha-orange/10 transition">
                    View Hand Signs
                </Link>
                <a href="https://github.com/huanglizhuo/Ketsuin" className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-800 transition" target="_blank" rel="noopener noreferrer">
                    GitHub
                </a>
            </div>
        </div>
    );
}
