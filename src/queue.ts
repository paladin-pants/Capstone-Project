import { showToast } from "./toast.js";

export const queuedMachines = new Set<string>();
export const activeQueueToasts = new Map<string, () => void>();

// Shows notification for machine availability then stars a 300 second or 5 minute countdown
export function showQueueNotification(machineId: string, machineLabel: string) {
    const container = document.getElementById("queueToastContainer");
    if (!container) return;

    const toastEl = document.createElement("div");
    toastEl.className = "toast show align-items-center text-bg-success border-0";
    toastEl.setAttribute("role", "alert");
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>Machine available!</strong> ${machineLabel} is ready.
                Your spot expires in <span id="queue-countdown-${machineId}">5:00</span>.
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto queue-toast-close"></button>
        </div>`;
    container.appendChild(toastEl);

    const dismiss = () => {
        clearInterval(interval);
        toastEl.remove();
        activeQueueToasts.delete(machineId);
    };
    activeQueueToasts.set(machineId, dismiss);

    let seconds = 300;
    const interval = setInterval(() => {
        seconds--;
        const el = document.getElementById(`queue-countdown-${machineId}`);
        if (el) {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            el.textContent = `${m}:${s.toString().padStart(2, "0")}`;
        }
        if (seconds <= 0) {
            dismiss();
            showToast("Your queue spot for a machine has expired", "warning");
        }
    }, 1000);

    toastEl.querySelector(".queue-toast-close")?.addEventListener("click", dismiss);
}
