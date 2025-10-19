// ---------------------------------------------
// Dynamic Quote Generator with Filtering, Storage & Server Sync (Simulation)
// ---------------------------------------------

// Retrieve quotes from localStorage or use defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Simplicity is the soul of efficiency.", category: "Technology" },
  { text: "Do or do not. There is no try.", category: "Wisdom" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "Technology" },
  { text: "Believe you can and you're halfway there.", category: "Inspiration" },
];

// ---------- DOM Elements ----------
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const categorySelect = document.getElementById("categorySelect");
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");

// ---------- Sync UI (banner & modal) ----------
const syncBanner = document.createElement("div");
syncBanner.id = "syncBanner";
syncBanner.style.cssText = "position:fixed; right:12px; bottom:12px; background:#fff; border:1px solid #ddd; padding:10px 12px; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.08); font-family:system-ui; z-index:9999;";
document.body.appendChild(syncBanner);

const modalBackdrop = document.createElement("div");
modalBackdrop.id = "conflictModal";
modalBackdrop.style.cssText = "position:fixed; inset:0; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); z-index:10000;";
modalBackdrop.innerHTML = `
  <div style="width:min(720px,94%); background:#fff; border-radius:10px; padding:18px; box-shadow:0 12px 40px rgba(0,0,0,0.2);">
    <h2 style="margin-top:0">Conflict Review</h2>
    <div id="conflictList" style="max-height:50vh; overflow:auto; margin-bottom:12px;"></div>
    <div style="text-align:right"><button id="closeConflicts" style="margin-right:8px;">Close</button><button id="resolveAllServer">Accept All Server</button></div>
  </div>
`;
document.body.appendChild(modalBackdrop);
document.getElementById("closeConflicts").addEventListener("click", () => modalBackdrop.style.display = "none");
document.getElementById("resolveAllServer").addEventListener("click", () => {
  // Accept server for all conflicts (applies server resolution already staged)
  pendingConflicts.forEach(c => applyServerResolution(c));
  pendingConflicts = [];
  saveQuotes();
  populateCategories();
  renderSyncBanner();
  modalBackdrop.style.display = "none";
});

// ---------- Sync State ----------
let pendingConflicts = []; // {local, server}
let lastSync = null;
let syncIntervalMs = 60_000; // 60s sync; you can adjust

// ---------- Helpers ----------
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function dedupeAndMergeLocal(newList) {
  // Keep unique by text (case-insensitive); prefer first occurrence in 'quotes' unless replaced by server logic elsewhere.
  const map = new Map();
  // Start with existing local quotes
  quotes.forEach(q => map.set(q.text.toLowerCase(), q));
  // Merge incoming (server) - may overwrite later in sync logic
  newList.forEach(q => map.set(q.text.toLowerCase(), q));
  return Array.from(map.values());
}

function findQuoteByText(text, arr = quotes) {
  const t = text?.toLowerCase?.();
  return arr.find(q => q.text.toLowerCase() === t);
}

// ---------- Category population & filtering (unchanged) ----------
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];

  // Populate main category selector
  categorySelect.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  // Populate filter dropdown (include "All")
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  saveQuotes();
}

function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filteredQuotes = quotes.filter(q => q.category === selectedCategory);

  if (!selectedCategory || filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  quoteDisplay.textContent = filteredQuotes[randomIndex].text;

  localStorage.setItem("lastCategory", selectedCategory);
}

function addQuote() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();

  newQuoteText.value = "";
  newQuoteCategory.value = "";

  alert("Quote added successfully!");
}

function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem("lastFilter", selectedCategory);

  let filtered = quotes;
  if (selectedCategory !== "all") {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
  } else {
    // show first matching quote (deterministic) to help browsing
    quoteDisplay.textContent = filtered[0].text;
  }
}

function restorePreferences() {
  const lastCategory = localStorage.getItem("lastCategory");
  const lastFilter = localStorage.getItem("lastFilter");

  if (lastCategory && [...categorySelect.options].some(o => o.value === lastCategory)) {
    categorySelect.value = lastCategory;
  }

  if (lastFilter && [...categoryFilter.options].some(o => o.value === lastFilter)) {
    categoryFilter.value = lastFilter;
    filterQuotes();
  }
}

// ---------- Server Simulation & Sync ----------

async function fetchServerQuotes() {
  // Use JSONPlaceholder for simulation then convert to quote objects
  try {
    const resp = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=6");
    if (!resp.ok) throw new Error("Server fetch failed");
    const data = await resp.json();

    // Convert posts to quotes: title -> text, use 'Server' category as base
    const serverQuotes = data.map(item => ({
      text: item.title.trim().replace(/\s+/g, " "), // tidy
      category: "Server"
    }));

    // --- For demonstration only: inject a conflict for a known local quote ---
    // If local has the 'Do or do not' quote, create a server variant with same text but different category:
    const localExample = findQuoteByText("Do or do not. There is no try.");
    if (localExample) {
      // Replace one server quote with a conflicting variant
      serverQuotes[0] = { text: localExample.text, category: "Philosophy (Server)" };
    }

    return serverQuotes;
  } catch (err) {
    console.warn("fetchServerQuotes error:", err);
    return []; // gracefully degrade
  }
}

function detectConflicts(localList, serverList) {
  // Conflict = same text (case-insensitive) but different category
  const conflicts = [];

  serverList.forEach(sq => {
    const local = findQuoteByText(sq.text, localList);
    if (local && local.category !== sq.category) {
      conflicts.push({ local, server: sq });
    }
  });

  return conflicts;
}

function applyServerResolution(conflict) {
  // Replace local's category with server's category for that text
  const idx = quotes.findIndex(q => q.text.toLowerCase() === conflict.server.text.toLowerCase());
  if (idx >= 0) {
    quotes[idx] = { text: conflict.server.text, category: conflict.server.category };
  } else {
    // not found locally -> push it
    quotes.push({ text: conflict.server.text, category: conflict.server.category });
  }
}

function applyLocalResolution(conflict) {
  // Keep local; in real app we'd send this to server. Here we just keep local (no-op)
  // Optionally: mark for upload (not implemented)
  // noop
}

async function syncWithServer({ showNotification = true } = {}) {
  // Fetch server quotes
  const serverQuotes = await fetchServerQuotes();
  if (!serverQuotes || serverQuotes.length === 0) {
    if (showNotification) renderSyncBanner("No server updates", 0);
    return;
  }

  // Detect conflicts where same text but different category
  const conflicts = detectConflicts(quotes, serverQuotes);

  // For server-wins strategy: apply server entries (add missing, overwrite categories)
  serverQuotes.forEach(sq => {
    const localIdx = quotes.findIndex(q => q.text.toLowerCase() === sq.text.toLowerCase());
    if (localIdx === -1) {
      // add missing server quote
      quotes.push({ text: sq.text, category: sq.category });
    } else {
      // If categories differ, overwrite local with server (server wins)
      if (quotes[localIdx].category !== sq.category) {
        quotes[localIdx] = { text: sq.text, category: sq.category };
      }
    }
  });

  // De-duplicate and save
  const merged = dedupeAndMergeLocal(quotes);
  quotes = merged;
  saveQuotes();
  populateCategories();

  // Update pendingConflicts for manual review (we keep a list so user can inspect what was changed)
  pendingConflicts = conflicts.slice(); // shallow copy

  lastSync = new Date();
  if (showNotification) renderSyncBanner("Synced with server", pendingConflicts.length);
}

// ---------- Sync banner & conflict review UI ----------
function renderSyncBanner(message = "Idle", conflictCount = pendingConflicts.length) {
  syncBanner.innerHTML = `
    <div style="font-size:13px; margin-bottom:6px;"><strong>Sync:</strong> ${message}</div>
    <div style="font-size:12px; color:#555; margin-bottom:8px;">Last: ${lastSync ? lastSync.toLocaleString() : "never"}</div>
    <div style="display:flex; gap:8px; align-items:center;">
      <button id="btnSyncNow" style="padding:6px 10px; border-radius:8px; border:1px solid #ddd; background:#f7f7f8; cursor:pointer;">Sync Now</button>
      <button id="btnReview" style="padding:6px 10px; border-radius:8px; border:1px solid #ddd; background:#fff; cursor:pointer;">Review Conflicts (${conflictCount})</button>
    </div>
  `;

  document.getElementById("btnSyncNow").addEventListener("click", () => syncWithServer({ showNotification: true }));
  document.getElementById("btnReview").addEventListener("click", () => {
    openConflictModal();
  });
}

function openConflictModal() {
  const list = document.getElementById("conflictList");
  list.innerHTML = "";

  if (!pendingConflicts || pendingConflicts.length === 0) {
    list.innerHTML = "<p>No conflicts to review.</p>";
  } else {
    pendingConflicts.forEach((c, idx) => {
      const row = document.createElement("div");
      row.style.borderBottom = "1px solid #eee";
      row.style.padding = "8px 0";
      row.innerHTML = `
        <div style="font-weight:600;">${c.server.text}</div>
        <div style="font-size:13px; color:#444; margin-top:6px;">
          Local category: <strong>${c.local.category}</strong>
          &nbsp;|&nbsp;
          Server category: <strong>${c.server.category}</strong>
        </div>
      `;
      const btns = document.createElement("div");
      btns.style.marginTop = "8px";
      const keepLocal = document.createElement("button");
      keepLocal.textContent = "Keep Local";
      const acceptServer = document.createElement("button");
      acceptServer.textContent = "Accept Server";
      keepLocal.style.marginRight = "8px";
      keepLocal.addEventListener("click", () => {
        applyLocalResolution(c);
        // remove conflict from pending list
        pendingConflicts = pendingConflicts.filter(x => x !== c);
        saveQuotes();
        populateCategories();
        renderSyncBanner();
        openConflictModal();
      });
      acceptServer.addEventListener("click", () => {
        applyServerResolution(c);
        pendingConflicts = pendingConflicts.filter(x => x !== c);
        saveQuotes();
        populateCategories();
        renderSyncBanner();
        openConflictModal();
      });
      btns.appendChild(keepLocal);
      btns.appendChild(acceptServer);
      row.appendChild(btns);
      list.appendChild(row);
    });
  }

  modalBackdrop.style.display = "flex";
}

// ---------- Initialization & periodic sync ----------
async function initSyncing() {
  // initial render of banner
  renderSyncBanner("Initializing...", 0);

  // initial sync attempt (do not spam user if offline)
  await syncWithServer({ showNotification: true });

  // periodic sync timer
  setInterval(async () => {
    await syncWithServer({ showNotification: false }); // silent periodic sync
    renderSyncBanner("Auto-synced", pendingConflicts.length);
  }, syncIntervalMs);
}

// ---------------------------------------------
// Fetch a single random quote from the server
// ---------------------------------------------
async function fetchQuotesFromServer() {
  try {
    const resp = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=20");
    if (!resp.ok) throw new Error("Failed to fetch from server");

    const data = await resp.json();

    // Pick a random post
    const randomIndex = Math.floor(Math.random() * data.length);
    const post = data[randomIndex];

    // Convert to quote object
    const serverQuote = {
      text: post.title.trim().replace(/\s+/g, " "),
      category: "Server"
    };

    return serverQuote;
  } catch (err) {
    console.error("fetchQuotesFromServer error:", err);
    return null;
  }
}

// Example usage: fetch a server quote and display it
async function showServerQuote() {
  const quote = await fetchQuotesFromServer();
  if (quote) {
    quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
  } else {
    quoteDisplay.textContent = "Failed to fetch server quote.";
  }
}

// ---------------------------------------------
// Send local quote to server (simulate POST)
// ---------------------------------------------
async function postQuoteToServer(quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quote)
    });

    if (!response.ok) throw new Error(`Server POST failed with status ${response.status}`);
    
    const data = await response.json();
    console.log("Quote successfully posted to server:", data);
    return data;

  } catch (error) {
    console.error("postQuoteToServer error:", error);
    return null;
  }
}

// Example usage: post the last added quote
async function syncLatestQuote() {
  if (quotes.length === 0) return;

  const latestQuote = quotes[quotes.length - 1];
  await postQuoteToServer(latestQuote);
}



// ---------- Event listeners ----------
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
categoryFilter.addEventListener("change", () => {
  filterQuotes();
  // remember preference
  localStorage.setItem("lastFilter", categoryFilter.value);
});

// ---------- Boot (populate UI & restore) ----------
populateCategories();
restorePreferences();
renderSyncBanner("Idle", 0);
initSyncing();



