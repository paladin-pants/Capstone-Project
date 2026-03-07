import { showToast } from "./minorFunctions.js"
import type { MachineItem } from "./types/machine.js";

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

// Displays all machines, optionally filtered by building and/or floor
export async function loadMachines(building?: string, floor?: number) {
  const list = document.getElementById("list")
    if (list) {
        const all = await showAll();
        const machineList = all.filter(m =>
            (!building || m.location.building === building) &&
            (!floor || m.location.floor === floor)
        );
        let html = ''
        html += '<table style="width: 100%" class="table table-bordered table-hover" id="machines">'
        html +=     '<thead>'
        html +=         '<tr>'
        html +=             '<th style="width: 40%">Type</th>'
        html +=             '<th style="width: 40%">Building</th>'
        html +=             '<th style="width: 10%">Floor</th>'
        html +=             '<th style="width: 10%">Section</th>'
        html +=         '</tr>'
        html +=     '</thead>'
        html +=     '<tbody>'
        for(const machine of machineList) {
            html += `<tr id=${machine._id}>`
            html +=     `<td>${machine.type}</td>`
            html +=     `<td>${machine.location.building}</td>`
            html +=     `<td>${machine.location.floor}</td>`
            html +=     `<td>${machine.location.section ?? ""}</td>`
            html +=     `<td><button class="delete-btn" id=${machine._id}>Delete</button></td>`
            html += '</tr>'
        }
        html +=     '</tbody>'
        html += '</table>'
        list.innerHTML = html

        const buttons = document.querySelectorAll(".delete-btn");

        // Delete buttons added
        buttons.forEach((button) => {
            button.addEventListener("click", async (event) => {
                deleteById(event)
            });
        });
    }
}

export function refreshMachines(building?: string, floor?: number) {
  const list = document.getElementById("machines")
  list?.remove()
  loadMachines(building, floor)
}
