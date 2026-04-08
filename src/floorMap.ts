import buildingData from "./data/buildings.json";
import { showAll } from "./api.js";
import { refreshMachines } from "./machineList.js";

export const appState = {
    activeBuilding: undefined as string | undefined,
    activeFloor: undefined as number | undefined,
};

export async function showFloorMap(building: string) {
    const floorMap = document.getElementById("floorMap") as HTMLDivElement;
    const floorMapImg = document.getElementById("floorMapImg") as HTMLImageElement;
    floorMap.innerHTML = "";
    const data = buildingData[building as keyof typeof buildingData] as { mapImage?: string };
    if (data?.mapImage) {
        floorMapImg.src = data.mapImage;
        floorMap.appendChild(floorMapImg);
        floorMap.style.display = "block";
    } else {
        floorMap.style.display = "none";
    }
}

export async function renderFloorButtons(building: string) {
    const floorFilterRow = document.getElementById("floorFilterRow") as HTMLDivElement;
    const data = buildingData[building as keyof typeof buildingData];
    floorFilterRow.innerHTML = "";
    floorFilterRow.classList.remove("d-none");

    const all = await showAll();
    const floorsWithMachines = new Set(
        all.filter(m => m.location.building === building).map(m => m.location.floor)
    );

    let firstBtn: HTMLButtonElement | null = null;
    for (let i = 1; i <= data.floors; i++) {
        if (!floorsWithMachines.has(i)) continue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-outline-primary";
        btn.textContent = `Floor ${i}`;
        const floor = i;
        btn.addEventListener("click", () => {
            floorFilterRow.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            appState.activeFloor = floor;
            refreshMachines(appState.activeBuilding, floor);
            showFloorMap(building);
        });
        floorFilterRow.appendChild(btn);
        if (!firstBtn) firstBtn = btn;
    }
    firstBtn?.click();
}
