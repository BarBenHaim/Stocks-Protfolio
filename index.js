document.addEventListener("DOMContentLoaded", function () {
  const addButton = document.querySelector(".addbtn");
  const deleteButton = document.querySelector(".deletebtn");
  const tableBody = document.querySelector("tbody");
  const stockSymbolInput = document.getElementById("stockSymbol");
  const stockQuantityInput = document.getElementById("stockQuantity");
  const resultArea = document.getElementById("resultArea");
  const totalProt = document.getElementById("totalProt");
  const financialModelingPrepApiKey = "f763dc4a01703e3ae743d829dde8c122"; // Replace with your API Key
  let allStockSymbols = [];
  let totalPortfolioValue = 0;

  // Fetch all stock symbols once and store them
  function fetchAllStockSymbols() {
    const url = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${financialModelingPrepApiKey}`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        allStockSymbols = data.map((stock) => stock.symbol);
      })
      .catch((error) => console.error("Error fetching stock symbols:", error));
  }

  function getStockPrice(symbol) {
    const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${financialModelingPrepApiKey}`;
    return fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.length > 0 && data[0].price) {
          return parseFloat(data[0].price);
        } else {
          throw new Error("Stock symbol not found");
        }
      });
  }

  function searchStocks(query) {
    resultArea.innerHTML = ""; // Clear previous results
    const maxResults = 50; // Maximum number of results to display
    const filteredSymbols = allStockSymbols
      .filter((symbol) => symbol.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, maxResults);

    filteredSymbols.forEach((symbol) => {
      const resultItem = document.createElement("button");
      resultItem.textContent = symbol;
      resultItem.classList.add("result-item");
      resultItem.onclick = function () {
        stockSymbolInput.value = symbol;
        resultArea.innerHTML = ""; // Clear results after selection
      };
      resultArea.appendChild(resultItem);
    });

    if (filteredSymbols.length === 0) {
      resultArea.innerHTML = "<p>No results found</p>";
    }
  }

  // Debouncing function
  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  }

  // Debounced input event listener
  stockSymbolInput.addEventListener(
    "input",
    debounce(function (event) {
      const query = event.target.value;
      if (query.length > 0) {
        searchStocks(query);
      } else {
        resultArea.innerHTML = "";
      }
    })
  );

  addButton.addEventListener("click", function () {
    const symbol = stockSymbolInput.value.toUpperCase();
    const quantity = stockQuantityInput.value;

    if (symbol && quantity) {
      getStockPrice(symbol)
        .then((price) => {
          const totalValue = parseFloat(quantity) * price;
          const newRow = document.createElement("tr");
          newRow.innerHTML = `<td>${symbol}</td><td>${quantity}</td><td>$${totalValue.toFixed(
            2
          )}</td>`;
          newRow.setAttribute("data-value", totalValue.toFixed(2)); // Store the value in the row
          tableBody.appendChild(newRow);
          stockSymbolInput.value = "";
          stockQuantityInput.value = "";

          // Update total portfolio value
          totalPortfolioValue += totalValue;
          totalProt.textContent = `${totalPortfolioValue.toFixed(2)}$`;
        })
        .catch((error) => alert(error.message));
    } else {
      alert("Please enter both symbol and quantity.");
    }
  });

  deleteButton.addEventListener("click", function () {
    const sellSymbol = document
      .getElementById("stockSymbolsell")
      .value.toUpperCase();
    const sellQuantity = parseInt(
      document.getElementById("stockQuantitysell").value,
      10
    );

    if (!sellSymbol || isNaN(sellQuantity) || sellQuantity <= 0) {
      alert("Please enter a valid symbol and quantity for selling.");
      return;
    }

    const rows = Array.from(tableBody.querySelectorAll("tr"));
    const matchingRow = rows.find(
      (row) => row.cells[0].textContent === sellSymbol
    );

    if (matchingRow) {
      const currentQuantity = parseInt(matchingRow.cells[1].textContent, 10);
      if (sellQuantity >= currentQuantity) {
        // If selling quantity is greater than or equal to current, remove the row
        tableBody.removeChild(matchingRow);
        totalPortfolioValue -= parseFloat(
          matchingRow.getAttribute("data-value")
        );
      } else {
        // Update the quantity and total value in the row
        const newQuantity = currentQuantity - sellQuantity;
        const pricePerUnit =
          parseFloat(matchingRow.getAttribute("data-value")) / currentQuantity;
        const newValue = pricePerUnit * newQuantity;

        matchingRow.cells[1].textContent = newQuantity;
        matchingRow.cells[2].textContent = `$${newValue.toFixed(2)}`;
        matchingRow.setAttribute("data-value", newValue.toFixed(2));

        totalPortfolioValue -= pricePerUnit * sellQuantity;
      }

      totalProt.textContent = `${totalPortfolioValue.toFixed(2)}$`;
    } else {
      alert("Stock symbol not found in the portfolio.");
    }

    // Clear the input fields
    document.getElementById("stockSymbolsell").value = "";
    document.getElementById("stockQuantitysell").value = "";
  });

  // Fetch symbols when the page loads
  fetchAllStockSymbols();
});
