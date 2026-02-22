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