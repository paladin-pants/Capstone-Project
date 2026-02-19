// app.ts
// Hook this up to YOUR existing function that returns items from the database.
// The function can return either an array of objects or an array of strings/numbers.
//
// Option A (recommended): you already have an API endpoint, so fetch from it here.
// Option B: you already have a TS function you can import and call directly (browser-safe).
// ✅ Replace this with your existing function.
// If your current function is server-side only (uses MongoClient, etc.), you should expose an API route
// and call that route from the browser instead.
async function fetchItems() {
    // EXAMPLE: fetch from your backend endpoint
    // return (await fetch("http://localhost:3000/items")).json();
    // Placeholder demo data so the UI works immediately:
    return [
        { _id: "a1", name: "Washer 1", status: "running", watts: 620 },
        { _id: "b2", name: "Dryer 2", status: "idle", watts: 0 },
    ];
}
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const itemsEl = document.getElementById("items");
const refreshBtn = document.getElementById("refreshBtn");
function setStatus(text) {
    statusEl.textContent = text;
}
function setError(err) {
    if (!err) {
        errorEl.textContent = "";
        return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    errorEl.textContent = `Error:\n${msg}`;
}
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function renderItems(items) {
    if (!items || items.length === 0) {
        itemsEl.innerHTML = `<p class="muted">No items found.</p>`;
        return;
    }
    // Render each item as a simple “card”
    itemsEl.innerHTML = items
        .map((item) => {
        const id = typeof item._id === "string" ? item._id : undefined;
        // A nice compact header if "name" exists
        const name = typeof item.name === "string" ? item.name : (id ? `Item ${id}` : "Item");
        // Show some common fields as pills (optional)
        const pills = [];
        if (id)
            pills.push(`<span class="pill">_id: ${escapeHtml(id)}</span>`);
        if (typeof item.status === "string")
            pills.push(`<span class="pill">status: ${escapeHtml(item.status)}</span>`);
        if (typeof item.watts === "number")
            pills.push(`<span class="pill">watts: ${item.watts}</span>`);
        return `
        <div class="card">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <strong>${escapeHtml(name)}</strong>
          </div>
          <div class="row" style="margin: 8px 0;">
            ${pills.join("")}
          </div>
          <details>
            <summary class="muted">Raw JSON</summary>
            <pre>${escapeHtml(JSON.stringify(item, null, 2))}</pre>
          </details>
        </div>
      `;
    })
        .join("");
}
async function load() {
    setError(null);
    setStatus("Loading...");
    refreshBtn.disabled = true;
    try {
        const items = await fetchItems();
        renderItems(items);
        setStatus(`Loaded ${items.length} item(s).`);
    }
    catch (e) {
        setError(e);
        setStatus("Failed to load.");
        itemsEl.innerHTML = "";
    }
    finally {
        refreshBtn.disabled = false;
    }
}
refreshBtn.addEventListener("click", () => {
    void load();
});
void load();
export {};
