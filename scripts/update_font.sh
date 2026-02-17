#!/bin/bash

# 1. Extract used characters from codebase
echo "🔍 Extracting characters from source code..."
node scripts/extract_chars.js

# 2. Check if chars.txt exists
if [ ! -f "chars.txt" ]; then
    echo "❌ Error: chars.txt not found!"
    exit 1
fi

# 3. Generate WOFF2 subset
echo "🔠 Generating WOFF2 subset..."
# Ensure output directory exists
mkdir -p src/assets/fonts

# Run fonttools subset
# Note: Requires fonttools and brotli to be installed via pip
python3 -m fontTools.subset "unused_assets/fonts/AaJianMingShouShu-2.ttf" \
    --text-file=chars.txt \
    --output-file="src/assets/fonts/AaJianMingShouShu-2.woff2" \
    --flavor=woff2 \
    --layout-features='*' \
    --unicodes="U+0020-007E"

if [ $? -eq 0 ]; then
    echo "✅ Font updated successfully at src/assets/fonts/AaJianMingShouShu-2.woff2"
    ls -lh src/assets/fonts/AaJianMingShouShu-2.woff2
else
    echo "❌ Error generating font. Make sure 'fonttools' and 'brotli' are installed (pip install fonttools brotli)."
    exit 1
fi
