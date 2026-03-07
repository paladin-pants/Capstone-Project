import { createMachine, loadMachines, refreshMachines, showAll } from "./functions.js";
import buildingData from "./data/buildings.json";

const uri = "mongodb://localhost:27017/";

document.addEventListener("DOMContentLoaded", async () => {
    const createMachineButton = document.getElementById("saveMachineBtn");
    const showMachineButton = document.getElementById("showMachineBtn");

    const filterButtons = document.querySelectorAll<HTMLButtonElement>("#filterAll, #filterChase, #filterTower");
    const buildingMap: Record<string, string | undefined> = {
        filterAll: undefined,
        filterChase: "chase",
        filterTower: "tower",
    };
    const floorFilterRow = document.getElementById("floorFilterRow") as HTMLDivElement;
    const floorMap = document.getElementById("floorMap") as HTMLDivElement;
    const floorMapImg = document.getElementById("floorMapImg") as HTMLImageElement;

    // Section button positions (left%, top%) on the Chase Floor 3 map
    const chaseFloor3Sections: { label: string; left: string; top: string }[] = [
        { label: "D", left: "28%", top: "20%" },
        { label: "E", left: "62%", top: "30%" },
        { label: "C", left: "20%", top: "63%" },
        { label: "B", left: "40%", top: "70%" },
        { label: "A", left: "63%", top: "63%" },
    ];

    function showFloorMap(building: string, floor: number) {
        floorMap.innerHTML = "";
        if (building === "chase" && floor === 3) {
            floorMapImg.src = "/maps/chase_about_floor3.jpg";
            floorMap.appendChild(floorMapImg);
            for (const section of chaseFloor3Sections) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "btn btn-warning";
                btn.textContent = `Section ${section.label}`;
                btn.style.cssText = `position:absolute; left:${section.left}; top:${section.top}; transform:translate(-50%,-50%);`;
                floorMap.appendChild(btn);
            }
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
                if (activeBuilding) showFloorMap(activeBuilding, floor);
            });
            floorFilterRow.appendChild(btn);
        }
    }

    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeBuilding = buildingMap[btn.id];
            if (activeBuilding) {
                renderFloorButtons(activeBuilding);
            } else {
                floorFilterRow.innerHTML = "";
                floorFilterRow.classList.add("d-none");
            }
            floorMap.style.display = "none";
            refreshMachines(activeBuilding);
        });
    });

    const buildingSelect = document.getElementById("machineBuilding") as HTMLSelectElement | null;
    const floorSelect = document.getElementById("machineFloor") as HTMLSelectElement | null;
    const sectionSelect = document.getElementById("machineSection") as HTMLSelectElement | null;

    const sectionContainer = document.getElementById("sectionContainer") as HTMLDivElement | null;
    
    // Loads all machines and displays it
    loadMachines()

    // Button Handlers
    createMachineButton?.addEventListener("click", () => {
        createMachine();
    });
    showMachineButton?.addEventListener("click", () => {
        refreshMachines()
        showAll();
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




