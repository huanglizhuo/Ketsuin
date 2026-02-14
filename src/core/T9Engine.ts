import { T9_DICTIONARY } from '../config/t9_dictionary';

// Mapping from Key (Sign ID 1-12) to Letters/Function
const T9_MAP: Record<number, string[]> = {
    1: ['.', ',', '?', '!', ':', ';', '1'], // Rat
    2: ['a', 'b', 'c', '2'],      // Ox
    3: ['d', 'e', 'f', '3'],      // Tiger
    4: ['g', 'h', 'i', '4'],      // Hare
    5: ['j', 'k', 'l', '5'],      // Dragon
    6: ['m', 'n', 'o', '6'],      // Snake
    7: ['p', 'q', 'r', 's', '7'], // Horse
    8: ['t', 'u', 'v', '8'],      // Ram
    9: ['w', 'x', 'y', 'z', '9'], // Monkey
    10: [], // Bird (*) - Backspace/Delete (Handled in Engine)
    11: [], // Dog (0) - Space (Handled in Engine)
    12: [], // Boar (#) - Next Candidate (Handled in Engine)
};

export class T9Engine {
    private currentSequence: string = ""; // e.g. "43556"
    private candidates: string[] = [];
    private candidateIndex: number = 0;
    private committedText: string = "";

    // Returns the current state for UI rendering
    getState() {
        return {
            currentSequence: this.currentSequence,
            candidates: this.candidates,
            candidateIndex: this.candidateIndex,
            currentCandidate: this.candidates.length > 0 ? this.candidates[this.candidateIndex] : this.currentSequence,
            committedText: this.committedText,
            // Full sequence of signs for the committed text + current sequence
            fullSignSequence: this.getCommittedSignSequence()
        };
    }

    // ... existing handleInput ...

    // Helper: text to signs
    private getCommittedSignSequence(): number[] {
        // Map committed text to signs
        const signs: number[] = [];
        for (const char of this.committedText.toLowerCase()) {
            if (char === ' ') {
                signs.push(11); // Dog = Space
                continue;
            }
            // Find key for char
            let found = false;
            for (let k = 1; k <= 9; k++) {
                if (T9_MAP[k].includes(char)) {
                    signs.push(k);
                    found = true;
                    break;
                }
            }
            // If not found (e.g. newline or unknown), maybe skip or add special?
        }

        // Add current sequence (which are already raw keys/signIds)
        for (const char of this.currentSequence) {
            signs.push(parseInt(char));
        }

        return signs;
    }

    // ... existing methods ...


    // Handles input from signs (1-12)
    handleInput(signId: number) {
        // 10: Bird (*) -> Backspace / Delete
        if (signId === 10) {
            this.backspace();
            return;
        }

        // 11: Dog (0) -> Space / Confirm
        if (signId === 11) {
            this.confirm();
            return;
        }

        // 12: Boar (#) -> Next Candidate / Cycle
        if (signId === 12) {
            this.cycleCandidate();
            return;
        }

        // 1-9: Character Inputs
        if (signId >= 1 && signId <= 9) {
            // Map signId directly to T9 key (Rat=1, ..., Monkey=9)
            // Note: Our sign IDs are 1-based, just like the keys we want
            this.currentSequence += signId.toString();
            this.updateCandidates();
        }
    }

    private updateCandidates() {
        if (this.currentSequence.length === 0) {
            this.candidates = [];
            this.candidateIndex = 0;
            return;
        }

        // FILTER: Find words that match the number sequence
        // We need a helper to convert words to T9 sequence to check match
        // Optimization: In a real app, use a Trie. Here, iterating list is fine for small PoC.
        const matches = T9_DICTIONARY.filter(word => {
            const seq = this.wordToT9(word);
            return seq.startsWith(this.currentSequence);
        });

        // Exact matches (length matches) should come first
        matches.sort((a, b) => {
            const aDiff = Math.abs(a.length - this.currentSequence.length);
            const bDiff = Math.abs(b.length - this.currentSequence.length);
            return aDiff - bDiff;
        });

        // If no dictionary match, maybe add raw digits as fallback?
        if (matches.length === 0) {
            this.candidates = [this.currentSequence]; // Fallback to numbers
        } else {
            this.candidates = matches;
        }

        this.candidateIndex = 0;
    }

    private wordToT9(word: string): string {
        return word.toLowerCase().split('').map(char => {
            for (let k = 1; k <= 9; k++) {
                if (T9_MAP[k].includes(char)) return k.toString();
            }
            return ''; // symbol or unknown
        }).join('');
    }

    private backspace() {
        if (this.currentSequence.length > 0) {
            this.currentSequence = this.currentSequence.slice(0, -1);
            this.updateCandidates();
        } else if (this.committedText.length > 0) {
            // If already empty sequence, delete last char of committed text
            this.committedText = this.committedText.slice(0, -1);
        }
    }

    private confirm() {
        if (this.candidates.length > 0) {
            const word = this.candidates[this.candidateIndex];
            this.committedText += word + " ";
            this.resetSequence(); // logic clear
        } else if (this.currentSequence.length > 0) {
            // No candidates but sequence exists (e.g. raw numbers)
            this.committedText += this.currentSequence + " ";
            this.resetSequence();
        } else {
            // Just add a space if nothing typing
            this.committedText += " ";
        }
    }

    private cycleCandidate() {
        if (this.candidates.length > 1) {
            this.candidateIndex = (this.candidateIndex + 1) % this.candidates.length;
        }
    }

    private resetSequence() {
        this.currentSequence = "";
        this.candidates = [];
        this.candidateIndex = 0;
    }

    // Allow setting text from outside (e.g. initial state or clear)
    setText(text: string) {
        this.committedText = text;
        this.resetSequence();
    }
}
