// formHandler.js

document.addEventListener("DOMContentLoaded", function () {
    const nextButton = document.querySelector(".next-button");
    nextButton.addEventListener("click", function(event) {
        event.preventDefault(); // Prevent default link behavior

        // Capture form data
        const mobile = document.getElementById("mobile").value;
        const amount = document.getElementById("amount").value;
        const comments = document.getElementById("comments").value;

        // Validate mobile number and amount
        if (!mobile || !amount) {
            alert("Please fill in the required fields: Mobile number and Amount.");
            return;
        }

        // Store data in sessionStorage
        sessionStorage.setItem("mobile", mobile);
        sessionStorage.setItem("amount", amount);
        sessionStorage.setItem("comments", comments);

        // Redirect to the review confirmation page
        window.location.href = "reviewconf-simulation.html";
    });
});
