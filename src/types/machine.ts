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

export type MachineStateConfig = {
  _id: string;
  machineId: string;
  off: number;
  idle: number;
  running: number;
};

export type ActivityLog = {
  _id: string;
  machineId: string;
  fromState: string;
  toState: string;
  timestamp: string;
};

export type MachineNote = {
  _id: string;
  machineId: string;
  text: string;
  createdAt: string;
  dismissed?: boolean;
  dismissedAt?: string;
};