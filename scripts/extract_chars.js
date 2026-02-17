import fs from 'fs';
import path from 'path';

// Files to scan
const FILES = [
    'src/i18n/translations.ts',
    'src/config/data.ts',
    'src/config/t9_dictionary.ts'
];

// Always include these
const BASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?:;\"'()[]{}<>/-_+=@#$%^&*~`|\\ ";

function extractChars() {
    const uniqueChars = new Set(BASE_CHARS.split(''));

    FILES.forEach(file => {
        const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');

        // Remove comments roughly to avoid scanning commented out code if possible, 
        // but scanning them is harmless for font subsetting (just adds a few chars).
        // We'll just scan everything to be safe.

        for (const char of content) {
            if (!uniqueChars.has(char)) {
                uniqueChars.add(char);
            }
        }
    });

    const sortedChars = Array.from(uniqueChars).sort().join('');

    // Write to file
    fs.writeFileSync('chars.txt', sortedChars, 'utf-8');

    console.log(`✅ Extracted ${uniqueChars.size} unique characters to chars.txt`);
}

extractChars();
