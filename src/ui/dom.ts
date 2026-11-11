/** Minimal DOM helpers — no framework, no virtual DOM, no dependencies. */

type Props = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k === 'text') el.textContent = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v as object);
    else el.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null => root.querySelector(sel);

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function mount(root: HTMLElement, ...nodes: (Node | null)[]): void {
  clear(root);
  for (const n of nodes) if (n) root.append(n);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const isTouch = (): boolean => window.matchMedia('(pointer: coarse)').matches;

/** A group of buttons navigated with Vim keys (h/l or j/k + Enter). */
export interface FocusGroup {
  els: HTMLButtonElement[];
  index: number;
}

export function focusGroup(container: HTMLElement, sel = '.btn'): FocusGroup {
  return { els: Array.from(container.querySelectorAll<HTMLButtonElement>(sel)), index: 0 };
}

export function focusIndex(g: FocusGroup, i: number): void {
  const n = g.els.length;
  if (!n) return;
  g.index = ((i % n) + n) % n;
  g.els.forEach((el, idx) => el.classList.toggle('focused', idx === g.index));
  // Keyboard-only: a focused control must be visible even in a scrolling card.
  g.els[g.index]?.scrollIntoView({ block: 'nearest' });
}

export function focusStep(g: FocusGroup, d: 1 | -1): void {
  focusIndex(g, g.index + d);
}

export function focusActivate(g: FocusGroup): boolean {
  const el = g.els[g.index];
  if (!el) return false;
  el.click();
  return true;
}
