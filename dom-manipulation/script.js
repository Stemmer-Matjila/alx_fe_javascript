// ---------------------------------------------
// Dynamic Quote Generator with Filtering + Storage
// ---------------------------------------------

// Retrieve quotes from localStorage or use defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Simplicity is the soul of efficiency.", category: "Technology" },
  { text: "Do or do not. There is no try.", category: "Wisdom" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "Technology" },
  { text: "Believe you can and you're halfway there.", category: "Inspiration" },
];

// --- DOM Elements ---
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const categorySelect = document.getElementById("categorySelect");
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");

// ---------------------------------------------
// Step 2: Populate Categories Dynamically
// ---------------------------------------------
function populateCategories() {
  // Use map() to get all categories and Set to remove duplicates
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

  // Save quotes with updated categories
  saveQuotes();
}

// ---------------------------------------------
// Show a Random Quote from Selected Category
// ---------------------------------------------
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filteredQuotes = quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  quoteDisplay.textContent = filteredQuotes[randomIndex].text;

  // Save the user's last selected category
  localStorage.setItem("lastCategory", selectedCategory);
}

// ---------------------------------------------
// Step 3: Add New Quote + Update Dropdown
// ---------------------------------------------
function addQuote() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  // Add new quote and update dropdowns
  quotes.push({ text, category });
  saveQuotes();
  populateCategories();

  newQuoteText.value = "";
  newQuoteCategory.value = "";

  alert("Quote added successfully!");
}

// ---------------------------------------------
// Step 2 (cont.): Filter Quotes by Category
// ---------------------------------------------
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem("lastFilter", selectedCategory); // Remember last filter

  let filtered = quotes;
  if (selectedCategory !== "all") {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
  } else {
    const randomIndex = Math.floor(Math.random() * filtered.length);
    quoteDisplay.textContent = filtered[randomIndex].text;
  }
}

// ---------------------------------------------
// Save & Load Quotes in Local Storage
// ---------------------------------------------
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ---------------------------------------------
// Restore Last Selected Category & Filter
// ---------------------------------------------
function restorePreferences() {
  const lastCategory = localStorage.getItem("lastCategory");
  const lastFilter = localStorage.getItem("lastFilter");

  if (lastCategory && [...categorySelect.options].some(o => o.value === lastCategory)) {
    categorySelect.value = lastCategory;
  }

  if (lastFilter && [...categoryFilter.options].some(o => o.value === lastFilter)) {
    categoryFilter.value = lastFilter;
  }
}

// ---------------------------------------------
// Event Listeners
// ---------------------------------------------
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);

// ---------------------------------------------
// Initialize on Page Load
// ---------------------------------------------
populateCategories();
restorePreferences();
