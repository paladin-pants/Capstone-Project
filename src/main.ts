import { createMachine, showAll, loadMachines } from "./functions.js";
import buildingData from "./data/buildings.json";

const uri = "mongodb://localhost:27017/";

document.addEventListener("DOMContentLoaded", async () => {
    const createMachineButton = document.getElementById("saveMachineBtn");
    const showMachineButton = document.getElementById("showMachineBtn");

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




