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

    // Section button positions (left%, top%) on the Chase simple floor plan
    const chaseFloor3Sections: { label: string; left: string; top: string }[] = [
        { label: "D", left: "46%", top: "26%" },
        { label: "E", left: "61%", top: "39%" },
        { label: "C", left: "35%", top: "67%" },
        { label: "B", left: "50%", top: "74%" },
        { label: "A", left: "66%", top: "63%" },
    ];

    async function showFloorMap(building: string, floor: number) {
        floorMap.innerHTML = "";
        if (building === "chase" && floor === 3) {
            floorMapImg.src = "/maps/chasesimplefloorplan.png";
            floorMap.appendChild(floorMapImg);

            const all = await showAll();
            const machines = all.filter(m => m.location.building === building && m.location.floor === floor);

            // Group machines by section
            const bySection = new Map<string, typeof machines>();
            for (const machine of machines) {
                const section = machine.location.section ?? "";
                if (!bySection.has(section)) bySection.set(section, []);
                bySection.get(section)!.push(machine);
            }

            for (const [section, sectionMachines] of bySection) {
                const pos = chaseFloor3Sections.find(s => s.label === section);
                if (!pos) continue;

                const table = document.createElement("table");
                table.style.cssText = `position:absolute; left:${pos.left}; top:${pos.top}; transform:translate(-50%,-50%); border-collapse:collapse; font-size:clamp(7px, 0.8vw, 13px);`;

                for (const machine of sectionMachines) {
                    const label = machine.type === "washer" ? "Washer" : "Dryer";
                    const tr = document.createElement("tr");
                    const td = document.createElement("td");
                    td.textContent = `${label} - ${machine.location.floor}${section}`;
                    td.className = machine.type === "washer" ? "btn btn-primary" : "btn btn-warning";
                    td.style.cssText = `cursor:pointer; width:5vw; height:2.5vw; text-align:center; vertical-align:middle; padding:2px; white-space:normal; word-break:break-word;`;
                    td.addEventListener("click", () => alert(`Machine ID: ${machine._id}`));
                    tr.appendChild(td);
                    table.appendChild(tr);
                }
                floorMap.appendChild(table);
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
    // loadMachines()

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




