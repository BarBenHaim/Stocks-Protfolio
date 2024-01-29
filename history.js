document.addEventListener("DOMContentLoaded", function () {
  const historyTableBody = document.querySelector("#historyTable tbody");
  const history = JSON.parse(localStorage.getItem("actionHistory")) || [];
  const clearActionsButton = document.querySelector(".clearActions");

  history.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${item.date}</td>
        <td>${item.symbol}</td>
        <td>${item.action}</td>
        <td>${item.quantity}</td>
        <td>${item.totalValue}</td>
      `;
    historyTableBody.appendChild(row);
  });

  clearActionsButton.addEventListener("click", function () {
    localStorage.setItem("actionHistory", JSON.stringify([]));
    location.reload();
    alert("Action history has been cleared.");
  });
});
