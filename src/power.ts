import { loadPowerTab } from "./functions.js";
import type { MachineStateConfig } from "./types/machine.js";

const STATE_BADGE_CLASS: Record<string, string> = {
  idle:    "bg-success",
  running: "bg-warning text-dark",
  off:     "bg-danger",
  unknown: "bg-secondary",
};
const STATE_LABEL: Record<string, string> = {
  idle: "Available", running: "Running", off: "Off", unknown: "Unknown",
};

function deriveStatus(wattage: number, config: { off: number; idle: number; running: number }) {
  if (wattage >= config.running) return "running";
  if (wattage >= config.idle)    return "idle";
  if (wattage >= config.off)     return "off";
  return "unknown";
}

// Track which slider is currently being dragged so SSE doesn't reset it
const dragging = new Set<string>();

document.addEventListener("DOMContentLoaded", async () => {
  await loadPowerTab();

  // Mark sliders as being dragged while the user is interacting
  document.querySelectorAll<HTMLInputElement>(".power-slider").forEach(slider => {
    slider.addEventListener("pointerdown", () => dragging.add(slider.dataset.machineId!));
    slider.addEventListener("pointerup",   () => dragging.delete(slider.dataset.machineId!));
  });

  // Subscribe to SSE and update badges + sliders for machines not being dragged
  const evtSource = new EventSource("/api/power-events");
  evtSource.onmessage = (e) => {
    const { machineId, wattage } = JSON.parse(e.data) as { machineId: string; wattage: number };

    const slider = document.querySelector<HTMLInputElement>(`.power-slider[data-machine-id="${machineId}"]`);
    if (!slider) return;

    const config: MachineStateConfig = {
      _id: "",
      machineId,
      off:     Number(slider.dataset.off),
      idle:    Number(slider.dataset.idle),
      running: Number(slider.dataset.running),
    };
    const state = deriveStatus(wattage, config);

    const badge    = document.getElementById(`power-badge-${machineId}`);
    const wattageEl = document.getElementById(`power-wattage-${machineId}`);
    if (badge)     { badge.className = `badge ${STATE_BADGE_CLASS[state]}`; badge.textContent = STATE_LABEL[state] ?? state; }
    if (wattageEl) wattageEl.textContent = `${wattage}W`;

    if (!dragging.has(machineId)) slider.value = String(wattage);
  };
});
