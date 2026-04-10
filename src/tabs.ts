import { loadComments, loadActivityLogs } from "./logs.js";

// Initializes navbar tabs buttons
export function initPanels(filterButtons: NodeListOf<HTMLButtonElement>) {
    const mainContent = document.getElementById("mainContent") as HTMLDivElement;
    const commentsPanel = document.getElementById("commentsPanel") as HTMLDivElement;
    const activityPanel = document.getElementById("activityPanel") as HTMLDivElement;
    const commentsBtn = document.getElementById("filterComments") as HTMLButtonElement;
    const activityBtn = document.getElementById("filterActivity") as HTMLButtonElement;
    const powerBtn = document.getElementById("filterPower") as HTMLButtonElement;

    const allPanelBtns = [commentsBtn, activityBtn];

    function showMainContent() {
        mainContent.style.display = "block";
        commentsPanel.style.display = "none";
        activityPanel.style.display = "none";
        allPanelBtns.forEach(b => b?.classList.remove("active"));
    }

    commentsBtn?.addEventListener("click", () => {
        mainContent.style.display = "none";
        commentsPanel.style.display = "block";
        activityPanel.style.display = "none";
        filterButtons.forEach(b => b.classList.remove("active"));
        allPanelBtns.forEach(b => b?.classList.remove("active"));
        commentsBtn.classList.add("active");
        loadComments();
    });

    activityBtn?.addEventListener("click", () => {
        mainContent.style.display = "none";
        commentsPanel.style.display = "none";
        activityPanel.style.display = "block";
        filterButtons.forEach(b => b.classList.remove("active"));
        allPanelBtns.forEach(b => b?.classList.remove("active"));
        activityBtn.classList.add("active");
        loadActivityLogs();
    });

    powerBtn?.addEventListener("click", () => {
        window.open("/power.html", "_blank");
    });

    return { showMainContent };
}
