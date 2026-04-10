import { showToast } from "./toast.js";
import type { MachinePower, MachineStateConfig } from "./types/machine.js";
import { showAll, deleteById } from "./api.js";
import { queuedMachines } from "./queue.js";
import { openCalibrateModal, openCommentModal } from "./modal.js";
import buildingData from "./data/buildings.json";

export const DEFAULT_STATE_CONFIG = { off: 5, idle: 10, running: 200 };

export function deriveStatus(wattage: number | undefined, config: { off: number; idle: number; running: number } = DEFAULT_STATE_CONFIG): "off" | "idle" | "running" | "unknown" {
    if (wattage === undefined) return "unknown";
    if (wattage >= config.running) return "running";
    if (wattage >= config.idle)    return "idle";
    if (wattage >= config.off)     return "off";
    return "unknown";
}

// Status dot for machine list and floor map
const STATUS_DOT: Record<string, string> = {
    idle:    '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#198754;margin-right:6px;" title="Available"></span>',
    running: '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ffc107;margin-right:6px;" title="Running"></span>',
    off:     '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#dc3545;margin-right:6px;" title="Off"></span>',
    unknown: '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#adb5bd;margin-right:6px;" title="Unknown"></span>',
};


let loadGeneration = 0;

export async function loadMachines(building?: string, floor?: number) {
    const gen = ++loadGeneration;
    const list = document.getElementById("list");
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

        const bySection = new Map<string, typeof machineList>();
        for (const machine of machineList) {
            const section = machine.location.section ?? "";
            if (!bySection.has(section)) bySection.set(section, []);
            bySection.get(section)!.push(machine);
        }

        let html = '';
        html += '<table style="width: 100%" class="table table-bordered table-hover" id="machines">';
        html +=     '<tbody>';
        for (const [section, machines] of [...bySection.entries()].sort(([a], [b]) => a.localeCompare(b))) {
            if (section) {
                html += `<tr><td colspan="2" class="table-secondary fw-bold">Section ${section}</td></tr>`;
            }
            for (const machine of machines) {
                const wattage = powerByMachineId.get(machine._id);
                const config = configByMachineId.get(machine._id);
                const derivedStatus = deriveStatus(wattage, config);
                const dot = STATUS_DOT[derivedStatus];
                html += `<tr id=${machine._id}>`;
                html +=     `<td style="width:100%">${dot}${machine.type}</td>`;
                html +=     '<td class="d-flex gap-1" style="white-space:nowrap">';
                html +=         `<button class="comment-btn btn btn-secondary btn-sm" id=${machine._id}><i class="bi bi-chat"></i></button>`;
                const queued = queuedMachines.has(machine._id);
                const queueDisabled = derivedStatus === "off" || derivedStatus === "unknown";
                html +=         `<button class="queue-btn btn ${queued ? "btn-info" : "btn-outline-info"} btn-sm" id=${machine._id} title="${queued ? "Leave queue" : "Join queue"}"${queueDisabled ? " disabled" : ""}><i class="bi bi-bell${queued ? "-fill" : ""}"></i></button>`;
                html +=         `<button class="calibrate-btn admin btn btn-warning btn-sm" id=${machine._id}><i class="bi bi-wrench"></i></button>`;
                html +=         `<button class="delete-btn admin btn btn-danger btn-sm" id=${machine._id}><i class="bi bi-trash"></i></button>`;
                html +=     '</td>';
                html += '</tr>';
            }
        }
        html +=     '</tbody>';
        html += '</table>';
        if (gen !== loadGeneration) return;
        list.innerHTML = html;

        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", async (event) => {
                deleteById(event);
            });
        });

        document.querySelectorAll(".calibrate-btn").forEach((button) => {
            button.addEventListener("click", (event) => {
                const id = (event.currentTarget as HTMLButtonElement).id;
                openCalibrateModal(id, building, floor);
            });
        });

        document.querySelectorAll(".queue-btn").forEach((button) => {
            button.addEventListener("click", (event) => {
                const id = (event.currentTarget as HTMLButtonElement).id;
                const isNowQueued = !queuedMachines.has(id);
                if (isNowQueued) queuedMachines.add(id); else queuedMachines.delete(id);
                const btn = event.currentTarget as HTMLButtonElement;
                btn.className = `queue-btn btn ${isNowQueued ? "btn-info" : "btn-outline-info"} btn-sm`;
                btn.title = isNowQueued ? "Leave queue" : "Join queue";
                btn.innerHTML = `<i class="bi bi-bell${isNowQueued ? "-fill" : ""}"></i>`;
                showToast(isNowQueued ? "You've joined the queue" : "You've left the queue", "success");
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

export function refreshMachines(building?: string, floor?: number) {
    document.getElementById("machines")?.remove();
    loadMachines(building, floor);
}

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
        const response = await fetch("/api/machines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, building, floor, ...(section ? { section } : {}) }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create machine");
        }

        const data = await response.json();
        showToast(`Created machine with ID: ${data._id}`, "success");
        refreshMachines(building, floor);
        form?.reset();

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
