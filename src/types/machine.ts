export type MachineItem = {
  _id: string;
  type: string,
  location: {
    building: string,
    floor: number,
    section?: string
  },
  status: string
};

export type MachineState = {
  _id: string;
  machineId: string;
  status: "idle" | "running" | "off";
};

export type MachinePower = {
  _id: string;
  machineId: string;
  wattage: number;
};