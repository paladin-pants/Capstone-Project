import type { MachineItem, MachineState, MachinePower } from "./types/machine.js";

export async function showAll(): Promise<MachineItem[]> {
  const res = await fetch("/api/machines");
  if (!res.ok) throw new Error("Failed to load machines");
  return (await res.json()) as MachineItem[];
}

export async function getMachineState(machineId: string): Promise<MachineState | null> {
  const res = await fetch(`/api/machine-states/${machineId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch machine state");
  return res.json() as Promise<MachineState>;
}

export async function setMachineState(machineId: string, status: MachineState["status"]): Promise<void> {
  const res = await fetch(`/api/machine-states/${machineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update machine state");
}

export async function getMachinePower(machineId: string): Promise<MachinePower | null> {
  const res = await fetch(`/api/machine-power/${machineId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch machine power");
  return res.json() as Promise<MachinePower>;
}

export async function setMachinePower(machineId: string, wattage: number): Promise<void> {
  const res = await fetch(`/api/machine-power/${machineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wattage }),
  });
  if (!res.ok) throw new Error("Failed to update machine power");
}
