import { showToast } from "./minorFunctions.js"
import type { MachineItem, MachineState, MachinePower, MachineNote, ActivityLog, MachineStateConfig } from "./types/machine.js";
import buildingData from "./data/buildings.json";

// Creates a washer or dryer machine and adds it to the database
export async function createMachine(): Promise<void> {
  const typeSelect = document.getElementById("machineType") as HTMLSelectElement | null;
  const buildingSelect = document.getElementById("machineBuilding") as HTMLInputElement | null;
  const floorInput = document.getElementById("machineFloor") as HTMLInputElement | null;
  const sectionSelect = document.getElementById("machineSection") as HTMLInputElement | null;

  const form = document.getElementById("machineForm") as HTMLFormElement | null;
  const modalElement = document.getElementById("createMachineModal");

  if (!typeSelect || !buildingSelect || !floorInput) {
    alert("Form elements missing");
    return;
  }

  const type = typeSelect.value;
  const building = buildingSelect.value;
  const floor = Number(floorInput.value.trim());
  const section = sectionSelect?.value;

  try {
    const response = await fetch("http://localhost:3000/api/machines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        building,
        floor,
        ...(section ? { section } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create machine");
    }

    const data = await response.json();

    showToast(`Created machine with ID: ${data._id}`, "success");
    refreshMachines(building, floor);
    
    // Resetting the form
    form?.reset();

    // Hiding Modal
    if (modalElement) {
      const modal =
        (window as any).bootstrap.Modal.getInstance(modalElement) ||
        new (window as any).bootstrap.Modal(modalElement);

      modal.hide();
    }

  } catch (err) {
    console.error(err);
    alert("Error creating machine");
  }

}

// Deletes a machine
export async function deleteById(event: Event) {
  const target = event.currentTarget as HTMLButtonElement;
  const id = target.id;

  if (!id) return;

  const result = await fetch(`/api/machines/${id}`, {
      method: "DELETE",
  });
  if (result.status === 200) {
    showToast(`Deleted machine with ID: ${id}`, "success");
    const row = document.getElementById(id);
    row?.remove();

    // If no machine rows remain, signal that the floor is now empty
    const remainingMachines = document.querySelectorAll("#machines tbody tr[id]");
    if (remainingMachines.length === 0) {
      document.dispatchEvent(new CustomEvent("floor-empty"));
    }
  }
  // location.reload();
}

// Shows all machines from database
export async function showAll(): Promise<MachineItem[]> {
  const res = await fetch("/api/machines"); 
  if (!res.ok) throw new Error("Failed to load machines");
  const docs = (await res.json()) as MachineItem[];

  return docs;
}

const STATUS_DOT: Record<string, string> = {
    idle:    '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#198754;margin-right:6px;" title="Available"></span>',
    running: '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ffc107;margin-right:6px;" title="Running"></span>',
    off:     '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#dc3545;margin-right:6px;" title="Off"></span>',
    unknown: '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#adb5bd;margin-right:6px;" title="Unknown"></span>',
};

const DEFAULT_STATE_CONFIG = { off: 5, idle: 10, running: 200 };

function deriveStatus(wattage: number | undefined, config: { off: number; idle: number; running: number } = DEFAULT_STATE_CONFIG): "off" | "idle" | "running" | "unknown" {
    if (wattage === undefined) return "unknown";
    const offIdleMid = (config.off + config.idle) / 2;
    const idleRunningMid = (config.idle + config.running) / 2;
    if (wattage <= offIdleMid) return "off";
    if (wattage <= idleRunningMid) return "idle";
    return "running";
}

// Displays all machines, optionally filtered by building and/or floor
export async function loadMachines(building?: string, floor?: number) {
  const list = document.getElementById("list")
    if (list) {
        const [all, allPower, allConfigs] = await Promise.all([
            showAll(),
            fetch("/api/machine-power").then(r => r.ok ? r.json() as Promise<MachinePower[]> : []),
            fetch("/api/machine-state-config").then(r => r.ok ? r.json() as Promise<MachineStateConfig[]> : []),
        ]);
        const powerByMachineId = new Map<string, number>(
            (allPower as MachinePower[]).map(p => [p.machineId, p.wattage])
        );
        const configByMachineId = new Map<string, MachineStateConfig>(
            (allConfigs as MachineStateConfig[]).map(c => [c.machineId, c])
        );
        const machineList = all.filter(m =>
            (!building || m.location.building === building) &&
            (!floor || m.location.floor === floor)
        );
        // Group machines by section (empty string for machines with no section)
        const bySection = new Map<string, typeof machineList>();
        for (const machine of machineList) {
            const section = machine.location.section ?? "";
            if (!bySection.has(section)) bySection.set(section, []);
            bySection.get(section)!.push(machine);
        }

        let html = ''
        html += '<table style="width: 100%" class="table table-bordered table-hover" id="machines">'
        html +=     '<tbody>'
        for (const [section, machines] of [...bySection.entries()].sort(([a], [b]) => a.localeCompare(b))) {
            if (section) {
                html += `<tr><td colspan="2" class="table-secondary fw-bold">Section ${section}</td></tr>`
            }
            for (const machine of machines) {
                const wattage = powerByMachineId.get(machine._id);
                const config = configByMachineId.get(machine._id);
                const derivedStatus = deriveStatus(wattage, config);
                const dot = STATUS_DOT[derivedStatus];
                html += `<tr id=${machine._id}>`
                html +=     `<td>${dot}${machine.type}</td>`
                html +=     '<td>'
                html +=         `<button class="comment-btn btn btn-secondary btn-sm" id=${machine._id}><i class="bi bi-chat"></i></button>`
                html +=     '</td>'
                html +=     '<td class="admin d-flex gap-1">'
                html +=         `<button class="calibrate-btn btn btn-warning btn-sm" id=${machine._id}><i class="bi bi-wrench"></i></button>`
                html +=         `<button class="delete-btn btn btn-danger btn-sm" id=${machine._id}><i class="bi bi-trash"></i></button>`
                html +=     '</td>'
                html += '</tr>'
            }
        }
        html +=     '</tbody>'
        html += '</table>'
        list.innerHTML = html

        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", async (event) => {
                deleteById(event)
            });
        });

        document.querySelectorAll(".calibrate-btn").forEach((button) => {
            button.addEventListener("click", (event) => {
                const id = (event.currentTarget as HTMLButtonElement).id;
                openCalibrateModal(id, building, floor);
            });
        });

        document.querySelectorAll(".comment-btn").forEach((button) => {
            button.addEventListener("click", (event) => {
                const id = (event.currentTarget as HTMLButtonElement).id;
                const machine = machineList.find(m => m._id === id);
                openCommentModal(id, machine?.type ?? "Machine");
            });
        });

        // Render section status dots on the floor map
        const floorMapEl = document.getElementById("floorMap");
        floorMapEl?.querySelectorAll(".section-dot").forEach(d => d.remove());
        if (building && floorMapEl) {
            const bData = buildingData[building as keyof typeof buildingData] as typeof buildingData["chase"] & { sectionCoords?: Record<string, { x: number; y: number }> };
            const coords = bData?.sectionCoords;
            if (coords) {
                for (const [section, pos] of Object.entries(coords)) {
                    const sectionMachines = machineList.filter(m => m.location.section === section);
                    if (sectionMachines.length === 0) continue;

                    const STATE_LABEL_MAP: Record<string, string> = { idle: "Available", running: "Running", off: "Off", unknown: "Unknown" };
                    const statuses = sectionMachines.map(m => deriveStatus(powerByMachineId.get(m._id), configByMachineId.get(m._id)));
                    let color = "#adb5bd";
                    if (statuses.some(s => s === "running"))     color = "#ffc107";
                    else if (statuses.some(s => s === "idle"))   color = "#198754";
                    else if (statuses.every(s => s === "off"))   color = "#dc3545";

                    const tooltipLines = sectionMachines.map((m, i) => {
                        const label = STATE_LABEL_MAP[statuses[i] ?? "unknown"] ?? "Unknown";
                        return `${m.type.charAt(0).toUpperCase() + m.type.slice(1)}: ${label}`;
                    }).join("\n");

                    const dot = document.createElement("span");
                    dot.className = "section-dot";
                    dot.title = `Section ${section}\n${tooltipLines}`;
                    dot.style.cssText = `position:absolute;left:${pos.x}%;top:${pos.y}%;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;transform:translate(-50%,-50%);z-index:10;pointer-events:none;`;
                    floorMapEl.appendChild(dot);
                }
            }
        }
    }
}

// Opens the calibrate modal for a machine and saves the state thresholds on confirm
async function openCalibrateModal(machineId: string, building?: string, floor?: number) {
    const modalEl = document.getElementById("calibrateMachineModal");
    const offInput = document.getElementById("offWattageInput") as HTMLInputElement;
    const idleInput = document.getElementById("idleWattageInput") as HTMLInputElement;
    const runningInput = document.getElementById("runningWattageInput") as HTMLInputElement;
    const saveBtn = document.getElementById("saveCalibrateBtn");
    if (!modalEl || !offInput || !idleInput || !runningInput || !saveBtn) return;

    const configRes = await fetch(`/api/machine-state-config`);
    const allConfigs: MachineStateConfig[] = configRes.ok ? await configRes.json() : [];
    const config = allConfigs.find(c => c.machineId === machineId) ?? DEFAULT_STATE_CONFIG;
    offInput.value = String(config.off);
    idleInput.value = String(config.idle);
    runningInput.value = String(config.running);

    const modal = (window as any).bootstrap.Modal.getInstance(modalEl)
        ?? new (window as any).bootstrap.Modal(modalEl);

    const newSaveBtn = saveBtn.cloneNode(true) as HTMLElement;
    saveBtn.replaceWith(newSaveBtn);

    newSaveBtn.addEventListener("click", async () => {
        const off = Number(offInput.value);
        const idle = Number(idleInput.value);
        const running = Number(runningInput.value);

        if (isNaN(off) || isNaN(idle) || isNaN(running) || !(off < idle && idle < running)) {
            showToast("Thresholds must satisfy: off < idle < running", "danger");
            return;
        }

        const res = await fetch(`/api/machine-state-config/${machineId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ off, idle, running }),
        });

        if (res.ok) {
            showToast("Calibration saved", "success");
            modal.hide();
            refreshMachines(building, floor);
        } else {
            showToast("Failed to save calibration", "danger");
        }
    });

    modal.show();
}

// Opens the comment modal for a machine, loads existing notes and allows adding new ones
async function openCommentModal(machineId: string, machineType: string) {
    const modalEl = document.getElementById("commentModal");
    const title = document.getElementById("commentModalLabel");
    const notesList = document.getElementById("commentNotesList");
    const noteInput = document.getElementById("commentNoteInput") as HTMLTextAreaElement;
    const saveBtn = document.getElementById("saveCommentBtn");
    if (!modalEl || !notesList || !noteInput || !saveBtn || !title) return;

    title.textContent = `Notes – ${machineType}`;
    const list = notesList;

    async function loadNotes() {
        const res = await fetch(`/api/machine-notes/${machineId}`);
        const notes: MachineNote[] = res.ok ? await res.json() : [];
        if (notes.length === 0) {
            list.innerHTML = '<p class="text-muted mb-0">No notes yet.</p>';
        } else {
            list.innerHTML = notes.map(n => {
                const date = new Date(n.createdAt).toLocaleString();
                return `<div class="border rounded p-2 mb-2 d-flex justify-content-between align-items-start gap-2">
                    <div><small class="text-muted">${date}</small><p class="mb-0">${n.text}</p></div>
                    <button class="admin dismiss-note-btn btn btn-outline-danger btn-sm flex-shrink-0" data-note-id="${n._id}" title="Dismiss"><i class="bi bi-x-lg"></i></button>
                </div>`;
            }).join("");

            list.querySelectorAll(".dismiss-note-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const noteId = (btn as HTMLElement).dataset.noteId;
                    const delRes = await fetch(`/api/machine-notes/note/${noteId}/dismiss`, { method: "PATCH" });
                    if (delRes.ok) {
                        showToast("Note dismissed", "success");
                        await loadNotes();
                    } else {
                        showToast("Failed to dismiss note", "danger");
                    }
                });
            });
        }
    }

    await loadNotes();
    noteInput.value = "";

    const modal = (window as any).bootstrap.Modal.getInstance(modalEl)
        ?? new (window as any).bootstrap.Modal(modalEl);

    const newSaveBtn = saveBtn.cloneNode(true) as HTMLElement;
    saveBtn.replaceWith(newSaveBtn);

    newSaveBtn.addEventListener("click", async () => {
        const text = noteInput.value.trim();
        if (!text) {
            showToast("Please enter a note", "danger");
            return;
        }
        const res = await fetch(`/api/machine-notes/${machineId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        if (res.ok) {
            noteInput.value = "";
            showToast("Note saved", "success");
            await loadNotes();
        } else {
            showToast("Failed to save note", "danger");
        }
    });

    modal.show();
}

// Gets the state for a machine
export async function getMachineState(machineId: string): Promise<MachineState | null> {
  const res = await fetch(`/api/machine-states/${machineId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch machine state");
  return res.json() as Promise<MachineState>;
}

// Sets the state for a machine
export async function setMachineState(machineId: string, status: MachineState["status"]): Promise<void> {
  const res = await fetch(`/api/machine-states/${machineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update machine state");
}

// Gets the power record for a machine
export async function getMachinePower(machineId: string): Promise<MachinePower | null> {
  const res = await fetch(`/api/machine-power/${machineId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch machine power");
  return res.json() as Promise<MachinePower>;
}

// Sets the wattage for a machine
export async function setMachinePower(machineId: string, wattage: number): Promise<void> {
  const res = await fetch(`/api/machine-power/${machineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wattage }),
  });
  if (!res.ok) throw new Error("Failed to update machine power");
}

export function refreshMachines(building?: string, floor?: number) {
  const list = document.getElementById("machines")
  list?.remove()
  loadMachines(building, floor)
}

// Loads all notes across all machines into the comments panel
export async function loadComments() {
  const activityList = document.getElementById("commentsList");
  if (!activityList) return;

  const [notesRes, machinesRes] = await Promise.all([
    fetch("/api/machine-notes"),
    fetch("/api/machines"),
  ]);
  const notes: MachineNote[] = notesRes.ok ? await notesRes.json() : [];
  const machines: MachineItem[] = machinesRes.ok ? await machinesRes.json() : [];
  const machineMap = new Map(machines.map(m => [m._id, m]));

  if (notes.length === 0) {
    activityList.innerHTML = '<p class="text-muted">No notes recorded yet.</p>';
    return;
  }

  let html = '<table class="table table-bordered table-hover">';
  html += '<thead><tr><th>Type</th><th>Location</th><th>Note</th><th>Status</th></tr></thead>';
  html += '<tbody>';
  for (const note of notes) {
    const machine = machineMap.get(note.machineId);
    const type = machine ? machine.type : "Unknown";
    const building = machine ? machine.location.building.charAt(0).toUpperCase() + machine.location.building.slice(1) : "—";
    const location = machine
      ? `${building}, Floor ${machine.location.floor}${machine.location.section ? ` ${machine.location.section}` : ""}`
      : "—";
    const created = new Date(note.createdAt).toLocaleString();
    const status = note.dismissed
      ? `<span class="badge bg-secondary" title="Dismissed: ${new Date(note.dismissedAt!).toLocaleString()}">Dismissed</span>`
      : `<span class="badge bg-success" title="Created: ${created}">Active</span>`;
    html += `<tr><td>${type}</td><td>${location}</td><td>${note.text}</td><td>${status}</td></tr>`;
  }
  html += '</tbody></table>';
  activityList.innerHTML = html;
}

const STATE_BADGE: Record<string, string> = {
  idle:    '<span class="badge bg-success">Available</span>',
  running: '<span class="badge bg-warning text-dark">Running</span>',
  off:     '<span class="badge bg-danger">Off</span>',
  unknown: '<span class="badge bg-secondary">Unknown</span>',
};

// Loads all state transition logs into the activity panel
export async function loadActivityLogs() {
  const logList = document.getElementById("activityLogList");
  if (!logList) return;

  const [logsRes, machinesRes] = await Promise.all([
    fetch("/api/activity-logs"),
    fetch("/api/machines"),
  ]);
  const logs: ActivityLog[] = logsRes.ok ? await logsRes.json() : [];
  const machines: MachineItem[] = machinesRes.ok ? await machinesRes.json() : [];
  const machineMap = new Map(machines.map(m => [m._id, m]));

  if (logs.length === 0) {
    logList.innerHTML = '<p class="text-muted">No state transitions recorded yet.</p>';
    return;
  }

  let html = '<table class="table table-bordered table-hover">';
  html += '<thead><tr><th>Machine</th><th>From</th><th>To</th><th>Time</th></tr></thead>';
  html += '<tbody>';
  for (const log of logs) {
    const machine = machineMap.get(log.machineId);
    const label = machine
      ? `${machine.type} – ${machine.location.building.charAt(0).toUpperCase() + machine.location.building.slice(1)}, Floor ${machine.location.floor}${machine.location.section ? ` ${machine.location.section}` : ""}`
      : log.machineId;
    const from = STATE_BADGE[log.fromState] ?? `<span class="badge bg-secondary">${log.fromState}</span>`;
    const to   = STATE_BADGE[log.toState]   ?? `<span class="badge bg-secondary">${log.toState}</span>`;
    const time = new Date(log.timestamp).toLocaleString();
    html += `<tr><td>${label}</td><td>${from}</td><td>${to}</td><td>${time}</td></tr>`;
  }
  html += '</tbody></table>';
  logList.innerHTML = html;
}

const STATE_BADGE_CLASS: Record<string, string> = {
  idle:    "bg-success",
  running: "bg-warning text-dark",
  off:     "bg-danger",
  unknown: "bg-secondary",
};
const STATE_LABEL: Record<string, string> = {
  idle: "Available", running: "Running", off: "Off", unknown: "Unknown",
};

// Loads the power control tab — a slider per calibrated machine for admins
export async function loadPowerTab() {
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
