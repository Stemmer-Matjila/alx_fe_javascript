// Array to store quotes with categories
let quotes = [
    { text: "The best way to predict the future is to invent it.", category: "Motivation" },
    { text: "Simplicity is the soul of efficiency.", category: "Technology" },
    { text: "Do or do not. There is no try.", category: "Wisdom" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Technology" },
  ];
  
  // DOM Elements
  const quoteDisplay = document.getElementById("quoteDisplay");
  const newQuoteBtn = document.getElementById("newQuote");
  const addQuoteBtn = document.getElementById("addQuoteBtn");
  const categorySelect = document.getElementById("categorySelect");
  const newQuoteText = document.getElementById("newQuoteText");
  const newQuoteCategory = document.getElementById("newQuoteCategory");
  
  // --- Initialize Categories in Dropdown ---
  function populateCategories() {
    const categories = [...new Set(quotes.map(q => q.category))]; // unique categories
    categorySelect.innerHTML = "";
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }
  
  // --- Random Quote from Selected Category ---
  function showRandomQuote() {
    const selectedCategory = categorySelect.value;
    const filteredQuotes = quotes.filter(q => q.category === selectedCategory);
    
    if (filteredQuotes.length === 0) {
      quoteDisplay.textContent = "No quotes found in this category.";
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    quoteDisplay.textContent = filteredQuotes[randomIndex].text;
  }
  
  // --- Add a New Quote ---
  function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();
  
    if (!text || !category) {
      alert("Please enter both a quote and a category.");
      return;
    }
  
    quotes.push({ text, category });
    populateCategories();
    newQuoteText.value = "";
    newQuoteCategory.value = "";
  
    alert("Quote added successfully!");
  }
  
  // --- Event Listeners ---
  newQuoteBtn.addEventListener("click", showRandomQuote);
  addQuoteBtn.addEventListener("click", addQuote);
  
  // Initialize
  populateCategories();
  createAddQuoteForm(); 

  
