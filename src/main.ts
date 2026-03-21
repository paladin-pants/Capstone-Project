import { createMachine, loadMachines, refreshMachines, showAll, loadComments, loadActivityLogs } from "./functions.js";
import buildingData from "./data/buildings.json";

const uri = "mongodb://localhost:27017/";

document.addEventListener("DOMContentLoaded", async () => {
    const createMachineButton = document.getElementById("saveMachineBtn");
    const showMachineButton = document.getElementById("showMachineBtn");

    const modeToggleBtn = document.getElementById("modeToggleBtn");

    const filterButtons = document.querySelectorAll<HTMLButtonElement>("#filterAll, #filterChase, #filterTower");
    const buildingMap: Record<string, string | undefined> = {
        filterAll: undefined,
        filterChase: "chase",
        filterTower: "tower",
    };
    const floorFilterRow = document.getElementById("floorFilterRow") as HTMLDivElement;
    const floorMap = document.getElementById("floorMap") as HTMLDivElement;
    const floorMapImg = document.getElementById("floorMapImg") as HTMLImageElement;

    async function showFloorMap(building: string) {
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

    let activeBuilding: string | undefined = undefined;

    async function renderFloorButtons(building: string) {
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
                refreshMachines(activeBuilding, floor);
                if (activeBuilding) showFloorMap(activeBuilding);
            });
            floorFilterRow.appendChild(btn);
            if (!firstBtn) firstBtn = btn;
        }
        firstBtn?.click();
    }

    const mainContent = document.getElementById("mainContent") as HTMLDivElement;
    const commentsPanel = document.getElementById("commentsPanel") as HTMLDivElement;
    const activityPanel = document.getElementById("activityPanel") as HTMLDivElement;
    const commentsBtn = document.getElementById("filterComments") as HTMLButtonElement;
    const activityBtn = document.getElementById("filterActivity") as HTMLButtonElement;

    function showMainContent() {
        mainContent.style.display = "";
        commentsPanel.style.display = "none";
        activityPanel.style.display = "none";
        commentsBtn.classList.remove("active");
        activityBtn.classList.remove("active");
    }

    commentsBtn?.addEventListener("click", () => {
        mainContent.style.display = "none";
        commentsPanel.style.display = "block";
        activityPanel.style.display = "none";
        filterButtons.forEach(b => b.classList.remove("active"));
        commentsBtn.classList.add("active");
        activityBtn.classList.remove("active");
        loadComments();
    });

    activityBtn?.addEventListener("click", () => {
        mainContent.style.display = "none";
        commentsPanel.style.display = "none";
        activityPanel.style.display = "block";
        filterButtons.forEach(b => b.classList.remove("active"));
        commentsBtn.classList.remove("active");
        activityBtn.classList.add("active");
        loadActivityLogs();
    });

    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            showMainContent();
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeBuilding = buildingMap[btn.id];
            if (activeBuilding) {
                renderFloorButtons(activeBuilding);
            } else {
                floorFilterRow.innerHTML = "";
                floorFilterRow.classList.add("d-none");
                floorMap.style.display = "none";
                refreshMachines(undefined);
            }
        });
    });

    const buildingSelect = document.getElementById("machineBuilding") as HTMLSelectElement | null;
    const floorSelect = document.getElementById("machineFloor") as HTMLSelectElement | null;
    const sectionSelect = document.getElementById("machineSection") as HTMLSelectElement | null;

    const sectionContainer = document.getElementById("sectionContainer") as HTMLDivElement | null;

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
        activeBuilding = undefined;
        floorFilterRow.innerHTML = "";
        floorFilterRow.classList.add("d-none");
        floorMap.style.display = "none";
        document.getElementById("machines")?.remove();
    });

    // Button Handlers
    createMachineButton?.addEventListener("click", () => {
        createMachine();
    });
    showMachineButton?.addEventListener("click", () => {
        refreshMachines()
        showAll();
    });
    
    modeToggleBtn?.addEventListener("click", () => {
      const isUser = document.body.classList.toggle("user");
      modeToggleBtn.textContent = isUser ? "Admin" : "User";
    });

    // Building Selection Handler
    buildingSelect?.addEventListener("change", () => {
        if (!buildingSelect || !floorSelect || !sectionContainer || !sectionSelect) return;

        const key = buildingSelect.value as keyof typeof buildingData;
        const data = buildingData[key];

        // Floors
        floorSelect.innerHTML = `<option value="" disabled selected>Select Floor</option>`;
        floorSelect.disabled = true;

        if (data) {
        for (let i = 1; i <= data.floors; i++) {
            const opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = `Floor ${i}`;
            floorSelect.appendChild(opt);
        }
            floorSelect.disabled = false;
        }

        // Sections
        sectionSelect.innerHTML = `<option value="" selected>Select Section</option>`;

        if (!data || data.sections.length === 0) {
            sectionContainer.classList.add("d-none");
            sectionSelect.value = "";
            return;
        }

        sectionContainer.classList.remove("d-none");

        for (const s of data.sections) {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        sectionSelect.appendChild(opt);
        }
    });
});




