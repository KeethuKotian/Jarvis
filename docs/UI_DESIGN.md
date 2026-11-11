# Futuristic UI/UX Design System Specification

## 1. Aesthetic Direction: Cinematic Holographic HUD

JARVIS is designed as a **premium, cinematic AI operating system** inspired by Tony Stark's Iron Man interface. It rejects generic chatbot layouts in favor of an immersive command deck.

### Core Visual Principles
- **Deep Midnight Obsidian Backdrop**: Layered dark navy `#040814` and `#070d20` with fine hexagonal grid patterns and radial vignettes.
- **Electric Cyan Accents**: Primary interactive highlights (`#00f3ff`, `#38bdf8`) with luminous neon glow filters.
- **Subtle AI Violet Accents**: Deep neural state indicators (`#a855f7`).
- **Sci-Fi HUD Corner Brackets**: Precision 2px corner brackets on all panels (`::before` / `::after`).
- **Restrained Scanline Texture**: Fine CRT-style scanline overlay with 60% opacity.

---

## 2. Animated Arc Reactor Core

The central Command Core renders multiple SVG telemetry rings:
1. **Outer Telemetry Ring**: Clockwise rotation with dashed angular ticks.
2. **Inner Stator Ring**: Counter-clockwise rotation with 12 radial reactor nodes.
3. **Core Arc Chamber**: Double border with inner glow filter.
4. **Central Reactor Node**: 45-degree diamond core pulsating with breathing animation (`corePulse`).

### Reactive State Matrix
| State | Core Color | Rotation Speed | Pulse Dynamics | Waveform Visualizer |
|---|---|---|---|---|
| `IDLE` | Electric Cyan (`#00f3ff`) | 12s | Subtle ambient glow | Stable 6px bars |
| `LISTENING` | Ice Blue (`#38bdf8`) | 2s | Rapid pulse | Bouncing high-amplitude bars |
| `THINKING` | Neon Violet (`#a855f7`) | 1.2s | Fast dual counter-rotation | Moderate oscillating bars |
| `EXECUTING` | Solar Amber (`#f59e0b`) | 1.5s | Focused beam pulse | Sequential scanning bars |
| `SPEAKING` | Deep Teal (`#2dd4bf`) | 2.5s | Rhythmic soundwave pulse | Dynamic speech envelope bars |
| `ERROR` | Laser Red (`#ef4444`) | 0.8s | Strobe warning flash | Erratic spike bars |

---

## 3. Web Audio Synthesis

Audio effects are synthesized entirely in real-time via the browser's **Web Audio API** without loading external audio assets:
- **Wake Chirp**: High-pitch rising sine sweep (520Hz to 1040Hz in 120ms).
- **Tool Execution Tone**: Triangle harmonic chirp (880Hz / 1320Hz).
- **Response Shimmer**: Tri-tone chord cascade (E5, G5, C6).
- **Security Alert Chime**: Descending warning saw (440Hz to 330Hz).
