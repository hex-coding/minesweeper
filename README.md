# Minesweeper (Windows 98 Style)

A classic Minesweeper game clone featuring a nostalgic Windows 98 user interface.

![Game Screenshot](/Users/hui.he/.gemini/antigravity/brain/ae506867-b43a-4732-84cf-f8f42a836a1b/minesweeper_reset_1763693774951.png)

## How to Play
1.  Open `index.html` in your web browser.
2.  **Left Click**: Reveal a square.
3.  **Right Click**: Flag a square as a mine.
4.  **Smiley Face**: Click to reset the game.

## Features
-   **Classic Design**: Authentic Windows 98 look and feel with gray backgrounds, beveled edges, and pixelated fonts.
-   **Game Logic**:
    -   **Safe Start**: The first click is guaranteed to be safe.
    -   **Recursive Reveal**: Automatically clears empty areas.
    -   **Win Condition**: Reveal all squares that do not contain a mine.
    -   **Lose Condition**: Click on a mine.
-   **Counters**:
    -   **Mine Counter**: Tracks remaining mines (total mines minus flags).
    -   **Timer**: Tracks elapsed time in seconds.

## Technologies
-   HTML5
-   CSS3 (Variables, Flexbox, Grid)
-   JavaScript (Vanilla)
