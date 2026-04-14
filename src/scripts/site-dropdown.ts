const dropdownEnterDurationMs = 180;
const dropdownExitDurationMs = 140;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

type DropdownState = "closed" | "opening" | "open" | "closing";

const dropdownFrameIds = new WeakMap<HTMLElement, number>();
const dropdownTimeoutIds = new WeakMap<HTMLElement, number>();

function prefersReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function clearDropdownAnimation(panel: HTMLElement) {
  const frameId = dropdownFrameIds.get(panel);

  if (frameId !== undefined) {
    window.cancelAnimationFrame(frameId);
    dropdownFrameIds.delete(panel);
  }

  const timeoutId = dropdownTimeoutIds.get(panel);

  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    dropdownTimeoutIds.delete(panel);
  }
}

function setDropdownState(panel: HTMLElement, state: DropdownState) {
  panel.dataset.siteDropdownEnhanced = "true";
  panel.dataset.siteDropdownState = state;
}

export function prepareDropdownPanel(panel: HTMLElement, open: boolean) {
  clearDropdownAnimation(panel);
  panel.hidden = !open;
  setDropdownState(panel, open ? "open" : "closed");
}

export function openDropdownPanel(panel: HTMLElement) {
  clearDropdownAnimation(panel);
  panel.hidden = false;

  if (prefersReducedMotion()) {
    setDropdownState(panel, "open");
    return;
  }

  setDropdownState(panel, "closed");
  panel.getBoundingClientRect();

  const frameId = window.requestAnimationFrame(() => {
    dropdownFrameIds.delete(panel);
    setDropdownState(panel, "opening");

    const timeoutId = window.setTimeout(() => {
      dropdownTimeoutIds.delete(panel);

      if (!panel.hidden) {
        setDropdownState(panel, "open");
      }
    }, dropdownEnterDurationMs);

    dropdownTimeoutIds.set(panel, timeoutId);
  });

  dropdownFrameIds.set(panel, frameId);
}

export function closeDropdownPanel(panel: HTMLElement) {
  clearDropdownAnimation(panel);

  if (panel.hidden) {
    setDropdownState(panel, "closed");
    return;
  }

  if (prefersReducedMotion()) {
    panel.hidden = true;
    setDropdownState(panel, "closed");
    return;
  }

  setDropdownState(panel, "closing");

  const timeoutId = window.setTimeout(() => {
    dropdownTimeoutIds.delete(panel);
    panel.hidden = true;
    setDropdownState(panel, "closed");
  }, dropdownExitDurationMs);

  dropdownTimeoutIds.set(panel, timeoutId);
}
