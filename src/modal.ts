import { showToast } from "./minorFunctions.js";
import type { MachineStateConfig, MachineNote } from "./types/machine.js";
import { DEFAULT_STATE_CONFIG, refreshMachines } from "./machineList.js";
import buildingData from "./data/buildings.json";

export async function openCalibrateModal(machineId: string, building?: string, floor?: number) {
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

export async function openCommentModal(machineId: string, machineType: string) {
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

export function initMachineForm() {
    const buildingSelect = document.getElementById("machineBuilding") as HTMLSelectElement | null;
    const floorSelect = document.getElementById("machineFloor") as HTMLSelectElement | null;
    const sectionSelect = document.getElementById("machineSection") as HTMLSelectElement | null;
    const sectionContainer = document.getElementById("sectionContainer") as HTMLDivElement | null;

    buildingSelect?.addEventListener("change", () => {
        if (!buildingSelect || !floorSelect || !sectionContainer || !sectionSelect) return;

        const key = buildingSelect.value as keyof typeof buildingData;
        const data = buildingData[key];

        floorSelect.innerHTML = `<option value="" disabled selected>Select Floor</option>`;
        floorSelect.disabled = true;

        if (data) {
            for (let i = 1; i <= data.floors; i++) {
                const opt = document.createElement("option");
                opt.value = String(i);
                opt.textContent = `Floor ${i}`;
                floorSelect.appendChild(opt);
            }
            floorSelect.disabled = false;
        }

        sectionSelect.innerHTML = `<option value="" selected>Select Section</option>`;

        if (!data || data.sections.length === 0) {
            sectionContainer.classList.add("d-none");
            sectionSelect.value = "";
            return;
        }

        sectionContainer.classList.remove("d-none");

        for (const s of data.sections) {
            const opt = document.createElement("option");
            opt.value = s;
            opt.textContent = s;
            sectionSelect.appendChild(opt);
        }
    });
}
