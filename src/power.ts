import { setMachinePower } from "./api.js";
import { deriveStatus } from "./machineList.js";
import type { MachineItem, MachinePower, MachineStateConfig } from "./types/machine.js";

const STATE_BADGE_CLASS: Record<string, string> = {
  idle:    "bg-success",
  running: "bg-warning text-dark",
  off:     "bg-danger",
  unknown: "bg-secondary",
};

const STATE_LABEL: Record<string, string> = {
  idle: "Available", running: "Running", off: "Off", unknown: "Unknown",
};

async function loadPowerTab() {
  const powerList = document.getElementById("powerList");
  if (!powerList) return;

  const [machines, allPower, allConfigs] = await Promise.all([
    fetch("/api/machines").then(r => r.ok ? r.json() as Promise<MachineItem[]> : []),
    fetch("/api/machine-power").then(r => r.ok ? r.json() as Promise<MachinePower[]> : []),
    fetch("/api/machine-state-config").then(r => r.ok ? r.json() as Promise<MachineStateConfig[]> : []),
  ]);

  const powerMap = new Map<string, number>((allPower as MachinePower[]).map(p => [p.machineId, p.wattage]));
  const configMap = new Map<string, MachineStateConfig>((allConfigs as MachineStateConfig[]).map(c => [c.machineId, c]));
  const calibrated = (machines as MachineItem[]).filter(m => configMap.has(m._id));

  if (calibrated.length === 0) {
    powerList.innerHTML = '<p class="text-muted">No calibrated machines. Use the calibrate button on a machine first.</p>';
    return;
  }

  let html = '';
  for (const machine of calibrated) {
    const config = configMap.get(machine._id)!;
    const wattage = powerMap.get(machine._id) ?? 0;
    const state = deriveStatus(wattage, config);
    const max = Math.ceil(config.running * 1.2);
    const building = machine.location.building.charAt(0).toUpperCase() + machine.location.building.slice(1);
    const label = `${machine.type} – ${building}, Floor ${machine.location.floor}${machine.location.section ? ` ${machine.location.section}` : ""}`;

    html += `
      <div class="card mb-3 p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-bold">${label}</span>
          <div class="d-flex align-items-center gap-2">
            <span id="power-badge-${machine._id}" class="badge ${STATE_BADGE_CLASS[state]}">${STATE_LABEL[state]}</span>
            <span id="power-wattage-${machine._id}" class="text-muted small">${wattage}W</span>
          </div>
        </div>
        <input type="range" class="form-range power-slider" data-machine-id="${machine._id}"
          data-off="${config.off}" data-idle="${config.idle}" data-running="${config.running}"
          min="0" max="${max}" step="1" value="${wattage}" />
        <div class="d-flex justify-content-between">
          <small class="text-muted">0W</small>
          <small class="text-muted">${max}W</small>
        </div>
      </div>`;
  }
  powerList.innerHTML = html;

  powerList.querySelectorAll<HTMLInputElement>(".power-slider").forEach(slider => {
    const machineId = slider.dataset.machineId!;
    const config = { off: Number(slider.dataset.off), idle: Number(slider.dataset.idle), running: Number(slider.dataset.running) };

    slider.addEventListener("input", () => {
      const w = Number(slider.value);
      const state = deriveStatus(w, config);
      const badge = document.getElementById(`power-badge-${machineId}`);
      const wattageEl = document.getElementById(`power-wattage-${machineId}`);
      if (badge) { badge.className = `badge ${STATE_BADGE_CLASS[state]}`; badge.textContent = STATE_LABEL[state] ?? state; }
      if (wattageEl) wattageEl.textContent = `${w}W`;
    });

    slider.addEventListener("change", async () => {
      await setMachinePower(machineId, Number(slider.value));
    });
  });
}

const dragging = new Set<string>();

document.addEventListener("DOMContentLoaded", async () => {
  await loadPowerTab();

  document.querySelectorAll<HTMLInputElement>(".power-slider").forEach(slider => {
    slider.addEventListener("pointerdown", () => dragging.add(slider.dataset.machineId!));
    slider.addEventListener("pointerup",   () => dragging.delete(slider.dataset.machineId!));
  });

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

    const badge     = document.getElementById(`power-badge-${machineId}`);
    const wattageEl = document.getElementById(`power-wattage-${machineId}`);
    if (badge)     { badge.className = `badge ${STATE_BADGE_CLASS[state]}`; badge.textContent = STATE_LABEL[state] ?? state; }
    if (wattageEl) wattageEl.textContent = `${wattage}W`;

    if (!dragging.has(machineId)) slider.value = String(wattage);
  };
});
