import buildingData from "./data/buildings.json";

export function initMachineForm() {
    const buildingSelect = document.getElementById("machineBuilding") as HTMLSelectElement | null;
    const floorSelect = document.getElementById("machineFloor") as HTMLSelectElement | null;
    const sectionSelect = document.getElementById("machineSection") as HTMLSelectElement | null;
    const sectionContainer = document.getElementById("sectionContainer") as HTMLDivElement | null;

    buildingSelect?.addEventListener("change", () => {
        if (!buildingSelect || !floorSelect || !sectionContainer || !sectionSelect) return;

        const key = buildingSelect.value as keyof typeof buildingData;
        const data = buildingData[key];

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
}
