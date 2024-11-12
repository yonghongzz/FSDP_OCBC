// reviewHandler.js

document.addEventListener("DOMContentLoaded", function() {
    // Retrieve the data from sessionStorage
    const mobile = sessionStorage.getItem("mobile");
    const amount = sessionStorage.getItem("amount");
    const comments = sessionStorage.getItem("comments");

    const formattedAmount = amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SGD' }).format(amount) : "$0.00";

    const formattedMobile = mobile ? (mobile.startsWith("+65") ? mobile : `+65 ${mobile}`) : "N/A";

    // Display the data in the HTML (assuming elements with these IDs exist)
    document.getElementById("displayAmount").textContent = formattedAmount;
    document.getElementById("displayComments").textContent = comments || "N/A";
    document.getElementById("displayMobile").textContent = formattedMobile;
});
