import { createMachine } from "./functions.js";
document.addEventListener("DOMContentLoaded", () => {
    const createMachineButton = document.getElementById("saveMachineBtn");
    // const showMachineButton = document.getElementById("showMachineBtn");
    createMachineButton?.addEventListener("click", () => {
        createMachine();
    });
    // showMachineButton?.addEventListener("click", () => {
    //     showAll();
    // });
});
