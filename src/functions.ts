import{ showToast } from "./minorFunctions.js"

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

    // Toast showing success
    showToast(`Created machine with ID: ${data._id}`, "success");

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

// Shows all machines from database
export async function showAll(): Promise<void> {
  const res = await fetch("/api/machines"); 
  if (!res.ok) throw new Error("Failed to load machines");
  const docs = await res.json();
  console.log(docs);
}