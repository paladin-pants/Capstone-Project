import type { MachineItem, MachineState, MachinePower } from "./types/machine.js";
import { showToast } from "./toast.js";

// Shows all machines
export async function showAll(): Promise<MachineItem[]> {
  const res = await fetch("/api/machines");
  if (!res.ok) throw new Error("Failed to load machines");
  return (await res.json()) as MachineItem[];
}

// Gets the machine state by ID
export async function getMachineState(machineId: string): Promise<MachineState | null> {
  const res = await fetch(`/api/machine-states/${machineId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch machine state");
  return res.json() as Promise<MachineState>;
}

// Sets the machine state
export async function setMachineState(machineId: string, status: MachineState["status"]): Promise<void> {
  const res = await fetch(`/api/machine-states/${machineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update machine state");
}

// Gets the machine power by ID
export async function getMachinePower(machineId: string): Promise<MachinePower | null> {
  const res = await fetch(`/api/machine-power/${machineId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch machine power");
  return res.json() as Promise<MachinePower>;
}

// Sets the machine power
export async function setMachinePower(machineId: string, wattage: number): Promise<void> {
  const res = await fetch(`/api/machine-power/${machineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wattage }),
  });
  if (!res.ok) throw new Error("Failed to update machine power");
}

// Deletes a machine by ID
export async function deleteById(event: Event) {
    const target = event.currentTarget as HTMLButtonElement;
    const id = target.id;
    if (!id) return;

    const result = await fetch(`/api/machines/${id}`, { method: "DELETE" });
    if (result.status === 200) {
        showToast(`Deleted machine with ID: ${id}`, "success");
        document.getElementById(id)?.remove();

        const remainingMachines = document.querySelectorAll("#machines tbody tr[id]");
        if (remainingMachines.length === 0) {
            document.dispatchEvent(new CustomEvent("floor-empty"));
        }
    }
}
