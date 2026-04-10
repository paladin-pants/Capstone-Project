import type { MachineItem, MachineNote, ActivityLog } from "./types/machine.js";

export const STATE_BADGE: Record<string, string> = {
  idle:    '<span class="badge bg-success">Available</span>',
  running: '<span class="badge bg-warning text-dark">Running</span>',
  off:     '<span class="badge bg-danger">Off</span>',
  unknown: '<span class="badge bg-secondary">Unknown</span>',
};

// Loads and renders machine notes in the comments tab
export async function loadComments() {
  const activityList = document.getElementById("commentsList");
  if (!activityList) return;

  const [notesRes, machinesRes] = await Promise.all([
    fetch("/api/machine-notes"),
    fetch("/api/machines"),
  ]);
  const notes: MachineNote[] = notesRes.ok ? await notesRes.json() : [];
  const machines: MachineItem[] = machinesRes.ok ? await machinesRes.json() : [];
  const machineMap = new Map(machines.map(m => [m._id, m]));

  if (notes.length === 0) {
    activityList.innerHTML = '<p class="text-muted">No notes recorded yet.</p>';
    return;
  }

  let html = '<table class="table table-bordered table-hover">';
  html += '<thead><tr><th>Type</th><th>Location</th><th>Note</th><th>Status</th></tr></thead>';
  html += '<tbody>';
  for (const note of notes) {
    const machine = machineMap.get(note.machineId);
    const type = machine ? machine.type : "Unknown";
    const building = machine ? machine.location.building.charAt(0).toUpperCase() + machine.location.building.slice(1) : "—";
    const location = machine
      ? `${building}, Floor ${machine.location.floor}${machine.location.section ? ` ${machine.location.section}` : ""}`
      : "—";
    const created = new Date(note.createdAt).toLocaleString();
    const status = note.dismissed
      ? `<span class="badge bg-secondary" title="Dismissed: ${new Date(note.dismissedAt!).toLocaleString()}">Dismissed</span>`
      : `<span class="badge bg-success" title="Created: ${created}">Active</span>`;
    html += `<tr><td>${type}</td><td>${location}</td><td>${note.text}</td><td>${status}</td></tr>`;
  }
  html += '</tbody></table>';
  activityList.innerHTML = html;
}

// Loads and renders machine state transition logs in the activity tab
export async function loadActivityLogs() {
  const logList = document.getElementById("activityLogList");
  if (!logList) return;

  const [logsRes, machinesRes] = await Promise.all([
    fetch("/api/activity-logs"),
    fetch("/api/machines"),
  ]);
  const logs: ActivityLog[] = logsRes.ok ? await logsRes.json() : [];
  const machines: MachineItem[] = machinesRes.ok ? await machinesRes.json() : [];
  const machineMap = new Map(machines.map(m => [m._id, m]));

  if (logs.length === 0) {
    logList.innerHTML = '<p class="text-muted">No state transitions recorded yet.</p>';
    return;
  }

  let html = '<table class="table table-bordered table-hover">';
  html += '<thead><tr><th>Machine</th><th>From</th><th>To</th><th>Time</th></tr></thead>';
  html += '<tbody>';
  for (const log of logs) {
    const machine = machineMap.get(log.machineId);
    const label = machine
      ? `${machine.type} – ${machine.location.building.charAt(0).toUpperCase() + machine.location.building.slice(1)}, Floor ${machine.location.floor}${machine.location.section ? ` ${machine.location.section}` : ""}`
      : log.machineId;
    const from = STATE_BADGE[log.fromState] ?? `<span class="badge bg-secondary">${log.fromState}</span>`;
    const to   = STATE_BADGE[log.toState]   ?? `<span class="badge bg-secondary">${log.toState}</span>`;
    const time = new Date(log.timestamp).toLocaleString();
    html += `<tr><td>${label}</td><td>${from}</td><td>${to}</td><td>${time}</td></tr>`;
  }
  html += '</tbody></table>';
  logList.innerHTML = html;
}
