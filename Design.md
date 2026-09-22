# Kitten Medical Platform â€” Design System & UI Identity

This document defines the core visual identity, design tokens, and frontend styling principles for the **Kitten Medical Imaging AI Workstation (2026)**.

---

## 1. Core Philosophy
The platform blends **clinical professionalism** with **futuristic interface design**. It abandons the sterile, flat aesthetic of traditional medical software in favor of highly tactile, glass-like UI elements (Glassmorphism), fluid animations, and a sophisticated color palette that feels both premium and approachable.

---

## 2. Color Palette

### Base Backgrounds
*   **Light Studio Mode (`#F3EFEF`)**: An off-white, warm gray used for the main dashboard, landing page, and general navigation. Reduces eye strain compared to pure white.
*   **Dark Studio Mode (`#111111` / `#0B0F19`)**: Pitch dark backgrounds used exclusively for the Diagnostic Studio and DICOM Viewer, providing maximum contrast for radiological image analysis.

### Accents & Interactions
*   **Kitten Burgundy (`#8D321F`)**: The signature brand color. Used for primary highlights, hover states on textual buttons, and active tool borders in the DICOM viewer. Provides a distinct "medical" feel without being alarmist.
*   **Action Blue (`blue-500` to `blue-600`)**: A secondary vibrant accent used for high-priority action buttons (e.g., "Open Viewer", Worklist actions).

---

## 3. Typography
The platform utilizes a curated stack of modern Google Fonts to ensure readability and a contemporary feel:

*   **Outfit (Primary UI)**: Used for general UI elements, buttons, form inputs, and modal text. It is geometric, clean, and highly legible.
*   **Plus Jakarta Sans (Data & Clinical Info)**: Used for dense data tables, patient records, and diagnostic outputs.
*   **Fredoka (Display & Headers)**: A rounded, friendly font used sparingly for large, welcoming headers or brand elements.

---

## 4. Signature UI Components

### 4.1. Glassmorphism Panels (Modals & Drawers)
All floating elements (modals, the AI Assistant Drawer, the Worklist) use a frosted glass effect to maintain contextual awareness of the background.
*   **Tailwind Recipe**: `bg-white/70 backdrop-blur-3xl border border-white/50 shadow-2xl`
*   **Backdrop**: `bg-black/60 backdrop-blur-sm`
*   **Corners**: Extreme border radii (`rounded-[32px]`) for a softer, organic feel.

### 4.2. Jelly Buttons
Buttons across the platform are styled as "Jelly Buttons"—highly tactile, glossy components with depth and dynamic press states.
*   **Visual Structure**: 
    * A base gradient (e.g., `bg-gradient-to-b from-white to-zinc-100`).
    * An inner drop shadow for a 3D bevel effect: `inset_0_2px_2px_rgba(255,255,255,1)`.
    * A top "glossy reflection" layer (absolute positioned div with `bg-gradient-to-b from-white/40 to-transparent rounded-t-full`).
*   **Interaction**: Every button scales down slightly when clicked (`active:scale-95`) and features smooth color transitions (`transition-all duration-300`).

### 4.3. The AI Magic Cursor
A global interactive element (`MagicCursor`) that follows the user's mouse, spinning and glowing to indicate the omnipresence of the underlying AI intelligence.

---

## 5. Layout Architecture

*   **Single Page Application (SPA)**: The platform operates within a fixed viewport (`100vh`, `100vw`, `overflow-hidden`), preventing native browser scrolling in favor of controlled, internal scrolling within specific panels (like the Worklist or AI chat).
*   **Floating Navigation**: Standard navigation is decentralized. A top glass navbar handles global states, while a floating chevron on the left side of the screen (`fixed left-0 top-1/2`) provides rapid access to settings and Worklists without permanently eating up valuable screen real estate.
*   **Context Switching**: Transitions between the Light Dashboard and the Dark Diagnostic Studio happen seamlessly via React state (`currentScreen`), instantly swapping out the environment based on the user's clinical task.

---

## 6. BlueLight DICOM Viewer Integration
The embedded BlueLight DICOM viewer (`start.html`) has been custom-styled to inherit the Kitten Medical identity:
*   Its raw black background is overridden with the platform's `#111111` dark mode.
*   Its legacy toolbars are wrapped in a glassmorphism header (`rgba(30,30,30,0.6)` with `blur(12px)`).
*   Active tools abandon harsh white borders in favor of the signature Kitten Burgundy (`#8D321F`) highlight with an 8px border radius.
*   The entire viewer enforces the `Outfit` font family globally.
