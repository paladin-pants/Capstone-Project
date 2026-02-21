import { createMachine, showAll } from "./functions.js";

const uri = "mongodb://localhost:27017/";

document.addEventListener("DOMContentLoaded", () => {
    const createMachineButton = document.getElementById("saveMachineBtn");
    const showMachineButton = document.getElementById("showMachineBtn");

    createMachineButton?.addEventListener("click", () => {
        createMachine();
    });
    showMachineButton?.addEventListener("click", () => {
        console.log('lol')
        showAll();
    });
});
