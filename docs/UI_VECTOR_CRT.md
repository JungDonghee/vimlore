# UI direction — CRT vector terminal

> P2. Do not start until P0/P1 are green; performance is non-negotiable.

## Feel

A **vector display inside a failing CRT terminal**, not a retro filter:
phosphor geometry, thin luminous rules, calibrated crosshairs, angular
instrument frames, a subtle grid that appears only where it helps reading.
Hacker-terminal, not cyberpunk neon.

## Shipped first increment

- Static instrument frame + exposed corner rules around the play buffer
  (`.board::after`), no JS and no per-frame work. Browser QA stayed ≥55 FPS;
  audit 38 screens clean.

## Cheap, measurable ideas

- Vector corner brackets / a thin instrument frame around the play buffer,
  drawn with static CSS or the cached renderer layer (no per-frame allocations).
- A low-opacity coordinate grid or crosshair in empty buffer margins; it must
  never reduce text contrast.
- Statusline as an instrument readout: `NORMAL`, coordinates, GOLF par/best.
- CRT beam returned only if the frame budget survives; desktop beam currently
  off for performance.
- Motion is restrained: cursor tween, phosphor afterglow, no screen-shake spam.

## Hard constraints

- Mobile 390×844 must remain ≥50fps (current 57.5 desktop headless; measure).
- Desktop headless ≥50fps; no 144 claim without a 144Hz/GPU measurement.
- Zero runtime dependencies; bundle ceiling is a gate. Any raise needs a
  measured reason and a before/after FPS/profile.
- `body.crt-off` still looks intentional; no effect may bypass the CRT setting.
- Keyboard-first; no hover-only affordance.

## Order

1. Performance profile current play/map/results.
2. Static vector frame + HUD readout (cheapest).
3. Grid/reticle experiment, measured.
4. Only then animation/bloom changes.
