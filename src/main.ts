import { createMachine, refreshMachines } from "./machineList.js";
import { showAll, } from "./api.js";
import { queuedMachines, showQueueNotification, activeQueueToasts } from "./queue.js";
import { appState } from "./floorMap.js";
import { renderFloorButtons } from "./floorMap.js";
import { initPanels } from "./tabs.js";
import { initMachineForm } from "./modal.js";

document.addEventListener("DOMContentLoaded", async () => {
    const createMachineButton = document.getElementById("saveMachineBtn");
    const modeToggleBtn = document.getElementById("modeToggleBtn");
    const filterButtons = document.querySelectorAll<HTMLButtonElement>("#filterChase, #filterTower");
    const buildingMap: Record<string, string | undefined> = {
        filterChase: "chase",
        filterTower: "tower",
    };
    const floorFilterRow = document.getElementById("floorFilterRow") as HTMLDivElement;
    const floorMap = document.getElementById("floorMap") as HTMLDivElement;

    const { showMainContent } = initPanels(filterButtons);
    initMachineForm();

    // Live power updates via SSE — check queue and refresh machine list on wattage changes
    const powerEvents = new EventSource("/api/power-events");
    powerEvents.onmessage = async (e) => {
        const { machineId, toState } = JSON.parse(e.data) as { machineId: string; wattage: number; toState: string };
        if (toState === "idle" && queuedMachines.has(machineId)) {
            queuedMachines.delete(machineId);
            const machines = await showAll();
            const machine = machines.find(m => m._id === machineId);
            const label = machine
                ? `${machine.type} – Floor ${machine.location.floor}${machine.location.section ? ` ${machine.location.section}` : ""}`
                : "Machine";
            showQueueNotification(machineId, label);
        } else {
            activeQueueToasts.get(machineId)?.();
        }
        if (appState.activeBuilding) refreshMachines(appState.activeBuilding, appState.activeFloor);
    };

    // Location filter buttons
    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            document.getElementById("splash")!.classList.replace("d-flex", "d-none");
            showMainContent();
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            appState.activeBuilding = buildingMap[btn.id];
            if (appState.activeBuilding) {
                renderFloorButtons(appState.activeBuilding);
            } else {
                floorFilterRow.innerHTML = "";
                floorFilterRow.classList.add("d-none");
                floorMap.style.display = "none";
                refreshMachines(undefined);
            }
        });
    });

    // Fix Bootstrap aria-hidden warning by blurring focused elements before modal hides
    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("hide.bs.modal", () => {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        });
    });

    // Reset to main menu when a floor becomes empty after deletion
    document.addEventListener("floor-empty", () => {
        appState.activeBuilding = undefined;
        floorFilterRow.innerHTML = "";
        floorFilterRow.classList.add("d-none");
        floorMap.style.display = "none";
        document.getElementById("machines")?.remove();
    });

    createMachineButton?.addEventListener("click", () => {
        createMachine();
    });

    modeToggleBtn?.addEventListener("click", () => {
        const isUser = document.body.classList.toggle("user");
        modeToggleBtn.textContent = isUser ? "Admin" : "User";
    });
});
