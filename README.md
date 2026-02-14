# 结印 Ketsuin - Ninja Hand Sign Input

[中文文档](README_zh.md)

**Ketsuin** is an experimental input method that replaces the traditional keyboard with **Ninja Hand Signs** (based on Naruto seals). It utilizes computer vision to detect hand gestures in real-time and maps them to a T9 predictive text system.

![Ketsuin Screenshot](public/asset/shinra.png)

## Features

-   **Hand Sign Detection**: Uses a lightweight YOLOX-Nano model via ONNX Runtime to detect 12 distinct hand signs.
-   **T9 Ninja Engine**: Implements a strict T9 input system where each hand sign corresponds to a key on a traditional phone keypad.
-   **Predictive Text**: Suggests words based on the input sequence using a built-in dictionary.
-   **Reverse Mapping**: Type manually to see the corresponding hand seal sequence dynamically displayed.
-   **Mobile Optimized**: Fully responsive layout that works on desktop and mobile devices.
-   **Continuous Delete**: Hold the "Bird" sign to rapidly delete text.

## How to Use

### The 12 Signs of the Zodiac

The input method uses the 12 hand signs (Rat, Ox, Tiger, etc.) mapped to the keys 1-9, *, 0, #.

| Sign ID | Hand Sign | T9 Key | Function / Letters |
| :--- | :--- | :--- | :--- |
| **1** | **Rat (子)** | **1** | `. , ? ! : ; 1` |
| **2** | **Ox (丑)** | **2** | `A B C 2` |
| **3** | **Tiger (寅)** | **3** | `D E F 3` |
| **4** | **Hare (卯)** | **4** | `G H I 4` |
| **5** | **Dragon (辰)** | **5** | `J K L 5` |
| **6** | **Snake (巳)** | **6** | `M N O 6` |
| **7** | **Horse (午)** | **7** | `P Q R S 7` |
| **8** | **Ram (未)** | **8** | `T U V 8` |
| **9** | **Monkey (申)** | **9** | `W X Y Z 9` |
| **10** | **Bird (酉)** | **(*)** | **DELETE / BACKSPACE** (Hold to continuous delete) |
| **11** | **Dog (戌)** | **(0)** | **SPACE / CONFIRM CANDIDATE** |
| **12** | **Boar (亥)** | **(#)** | **NEXT CANDIDATE / CYCLE** |

### Basic Operation

1.  **Form a Sign**: Show a hand sign to the camera.
2.  **Input**: The corresponding number is added to your sequence.
3.  **Candidates**: Words matching the sequence will appear.
4.  **Cycle**: Use the **Boar (#)** sign to cycle through candidate words.
5.  **Confirm**: Use the **Dog (0)** sign to confirm the selected word and insert a space.
6.  **Delete**: Use the **Bird (*)** sign to delete the last character.

## Development

### Prerequisites

-   Node.js
-   npm

### Setup

```bash
npm install
npm run dev
```

### Tech Stack

-   **React + TypeScript + Vite**: Frontend framework.
-   **ONNX Runtime Web**: For running the YOLOX object detection model in the browser.
-   **Tailwind CSS**: For styling and responsive design.

## License

MIT
