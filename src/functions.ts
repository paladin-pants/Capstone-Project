import { showToast } from "./minorFunctions.js"
import type { MachineItem, MachineState, MachinePower } from "./types/machine.js";

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
    refreshMachines();
    
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

// Displays all machines, optionally filtered by building and/or floor
export async function loadMachines(building?: string, floor?: number) {
  const list = document.getElementById("list")
    if (list) {
        const [all, allPower] = await Promise.all([
            showAll(),
            fetch("/api/machine-power").then(r => r.ok ? r.json() as Promise<MachinePower[]> : []),
        ]);
        const powerByMachineId = new Map<string, number>(
            (allPower as MachinePower[]).map(p => [p.machineId, p.wattage])
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
        for (const [section, machines] of bySection) {
            if (section) {
                html += `<tr><td colspan="2" class="table-secondary fw-bold">Section ${section}</td></tr>`
            }
            for (const machine of machines) {
                const wattage = powerByMachineId.get(machine._id);
                const derivedStatus: MachineState["status"] | "unknown" =
                    wattage === undefined ? "unknown" :
                    wattage === 0         ? "off" :
                    wattage > 100         ? "running" :
                    wattage > 10          ? "idle" : "unknown";
                const dot = STATUS_DOT[derivedStatus];
                html += `<tr id=${machine._id}>`
                html +=     `<td>${dot}${machine.type}</td>`
                html +=     '<td class="admin d-flex gap-1">'
                html +=         `<button class="configure-btn btn btn-warning btn-sm" id=${machine._id}><i class="bi bi-wrench"></i></button>`
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

        document.querySelectorAll(".configure-btn").forEach((button) => {
            button.addEventListener("click", (event) => {
                const id = (event.currentTarget as HTMLButtonElement).id;
                openConfigureModal(id, powerByMachineId.get(id), building, floor);
            });
        });
    }
}

// Opens the configure modal for a machine and saves the wattage on confirm
function openConfigureModal(machineId: string, currentWattage: number | undefined, building?: string, floor?: number) {
    const modalEl = document.getElementById("configureMachineModal");
    const input = document.getElementById("machineWattageInput") as HTMLInputElement;
    const saveBtn = document.getElementById("saveConfigureBtn");
    if (!modalEl || !input || !saveBtn) return;

    input.value = currentWattage !== undefined ? String(currentWattage) : "";

    const modal = (window as any).bootstrap.Modal.getInstance(modalEl)
        ?? new (window as any).bootstrap.Modal(modalEl);

    // Remove any previous listener to avoid stacking
    const newSaveBtn = saveBtn.cloneNode(true) as HTMLElement;
    saveBtn.replaceWith(newSaveBtn);

    newSaveBtn.addEventListener("click", async () => {
        const wattage = Number(input.value);
        if (isNaN(wattage) || wattage < 0) {
            showToast("Please enter a valid wattage", "danger");
            return;
        }
        await setMachinePower(machineId, wattage);
        showToast(`Wattage set to ${wattage}W`, "success");
        modal.hide();
        refreshMachines(building, floor);
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
