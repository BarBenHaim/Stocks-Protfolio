document.addEventListener("DOMContentLoaded", function () {
  const addButton = document.querySelector(".addbtn");
  const deleteButton = document.querySelector(".deletebtn");
  const tableBody = document.querySelector("tbody");
  const stockSymbolInput = document.getElementById("stockSymbol");
  const stockQuantityInput = document.getElementById("stockQuantity");
  const resultArea = document.getElementById("resultArea");
  const totalProt = document.getElementById("totalProt");
  const financialModelingPrepApiKey = "a5a85ae1c0230e052dd25b366c271d13";
  let allStockSymbols = [];
  let totalPortfolioValue = 0;

  function fetchAllStockSymbols() {
    const url = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${financialModelingPrepApiKey}`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => (allStockSymbols = data.map((stock) => stock.symbol)))
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
    resultArea.innerHTML = "";
    const maxResults = 50;
    const filteredSymbols = allStockSymbols
      .filter((symbol) => symbol.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, maxResults);

    filteredSymbols.forEach((symbol) => {
      const resultItem = document.createElement("button");
      resultItem.textContent = symbol;
      resultItem.classList.add("result-item");
      resultItem.onclick = () => {
        stockSymbolInput.value = symbol;
        resultArea.innerHTML = "";
      };
      resultArea.appendChild(resultItem);
    });

    if (filteredSymbols.length === 0) {
      resultArea.innerHTML = "<p>No results found</p>";
    }
  }

  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), timeout);
    };
  }

  stockSymbolInput.addEventListener(
    "input",
    debounce((event) => {
      const query = event.target.value;
      if (query.length > 0) searchStocks(query);
      else resultArea.innerHTML = "";
    })
  );

  function formatQuantity(quantity) {
    return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
  }

  function formatDate(date) {
    return date.toLocaleString();
  }

  function recordAction(action, symbol, quantity, totalValue) {
    const history = JSON.parse(localStorage.getItem("actionHistory")) || [];
    history.push({
      date: formatDate(new Date()),
      action,
      symbol,
      quantity: formatQuantity(quantity),
      totalValue: totalValue.toFixed(2),
    });
    localStorage.setItem("actionHistory", JSON.stringify(history));
  }

  function findRowBySymbol(symbol) {
    return Array.from(tableBody.querySelectorAll("tr")).find(
      (row) => row.cells[0].textContent === symbol
    );
  }

  addButton.addEventListener("click", () => {
    const symbol = stockSymbolInput.value.toUpperCase();
    const quantity = parseFloat(stockQuantityInput.value);

    if (symbol && !isNaN(quantity) && quantity > 0) {
      getStockPrice(symbol)
        .then((price) => {
          const totalValue = quantity * price;
          const existingRow = findRowBySymbol(symbol);

          if (existingRow) {
            const currentQuantity = parseFloat(
              existingRow.cells[1].textContent
            );
            const newQuantity = currentQuantity + quantity;
            const newTotalValue = newQuantity * price;

            existingRow.cells[1].textContent = formatQuantity(newQuantity);
            existingRow.cells[2].textContent = `$${newTotalValue.toFixed(2)}`;
            existingRow.setAttribute("data-value", newTotalValue.toFixed(2));

            totalPortfolioValue += totalValue;
          } else {
            const newRow = document.createElement("tr");
            newRow.innerHTML = `<td>${symbol}</td><td>${formatQuantity(
              quantity
            )}</td><td>$${totalValue.toFixed(2)}</td>`;
            newRow.setAttribute("data-value", totalValue.toFixed(2));
            tableBody.appendChild(newRow);

            totalPortfolioValue += totalValue;
          }

          stockSymbolInput.value = "";
          stockQuantityInput.value = "";
          totalProt.textContent = `${totalPortfolioValue.toFixed(2)}$`;

          recordAction("Buy", symbol, quantity, totalValue);
        })
        .catch((error) => alert(error.message));
    } else {
      alert("Please enter a valid symbol and quantity.");
    }
  });

  deleteButton.addEventListener("click", function () {
    const sellSymbol = document
      .getElementById("stockSymbolsell")
      .value.toUpperCase();
    const sellQuantity = parseFloat(
      document.getElementById("stockQuantitysell").value
    );

    if (sellSymbol && !isNaN(sellQuantity) && sellQuantity > 0) {
      const matchingRow = findRowBySymbol(sellSymbol);

      if (matchingRow) {
        const currentQuantity = parseFloat(matchingRow.cells[1].textContent);
        const pricePerUnit =
          parseFloat(matchingRow.getAttribute("data-value")) / currentQuantity;
        const newQuantity = currentQuantity - sellQuantity;

        if (newQuantity > 0) {
          const newValue = newQuantity * pricePerUnit;

          matchingRow.cells[1].textContent = formatQuantity(newQuantity);
          matchingRow.cells[2].textContent = `$${newValue.toFixed(2)}`;
          matchingRow.setAttribute("data-value", newValue.toFixed(2));

          totalPortfolioValue -= sellQuantity * pricePerUnit;
        } else {
          tableBody.removeChild(matchingRow);
          totalPortfolioValue -= currentQuantity * pricePerUnit;
        }

        // Correct for negative zero
        totalPortfolioValue =
          Math.abs(totalPortfolioValue) < 1e-6 ? 0 : totalPortfolioValue;

        totalProt.textContent = `${totalPortfolioValue.toFixed(2)}$`;
        recordAction(
          "Sell",
          sellSymbol,
          sellQuantity,
          sellQuantity * pricePerUnit
        );
      } else {
        alert("Stock symbol not found in the portfolio.");
      }

      document.getElementById("stockSymbolsell").value = "";
      document.getElementById("stockQuantitysell").value = "";
    } else {
      alert("Please enter a valid symbol and quantity for selling.");
    }
  });

  fetchAllStockSymbols();

  window.onbeforeunload = () => {
    localStorage.setItem("stockSymbolInput", stockSymbolInput.value);
    localStorage.setItem("stockQuantityInput", stockQuantityInput.value);
    localStorage.setItem("allStockSymbols", JSON.stringify(allStockSymbols));
    localStorage.setItem(
      "totalPortfolioValue",
      JSON.stringify(totalPortfolioValue)
    );
    localStorage.setItem("tableBody", tableBody.innerHTML);
  };

  window.onload = () => {
    const savedStockSymbolInput = localStorage.getItem("stockSymbolInput");
    if (savedStockSymbolInput !== null)
      stockSymbolInput.value = savedStockSymbolInput;

    const savedStockQuantityInput = localStorage.getItem("stockQuantityInput");
    if (savedStockQuantityInput !== null)
      stockQuantityInput.value = savedStockQuantityInput;

    const savedAllStockSymbols = localStorage.getItem("allStockSymbols");
    allStockSymbols = savedAllStockSymbols
      ? JSON.parse(savedAllStockSymbols)
      : [];

    const savedTotalPortfolioValue = localStorage.getItem(
      "totalPortfolioValue"
    );
    totalPortfolioValue = savedTotalPortfolioValue
      ? JSON.parse(savedTotalPortfolioValue)
      : 0;

    const savedTableHTML = localStorage.getItem("tableBody");
    if (savedTableHTML) tableBody.innerHTML = savedTableHTML;

    totalProt.textContent = `${totalPortfolioValue.toFixed(2)}$`;
  };
});
