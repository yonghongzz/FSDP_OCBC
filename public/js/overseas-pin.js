document.addEventListener("DOMContentLoaded", async () => {
    // Retrieve the recipient data from sessionStorage
    const recipientData = JSON.parse(sessionStorage.getItem("theRecipient"));

    if (!recipientData) {
        console.error("No recipient data found.");
        return;
    }

    // Populate recipient details on the page
    document.querySelector(".recipient-details").innerHTML = `
        <p><strong>Recipient Name:</strong> ${recipientData.payee_name}</p>
        <p><strong>Bank Name:</strong> ${recipientData.bank_name}</p>
        <p><strong>Account Number:</strong> ${recipientData.account_number}</p>
        <p><strong>Country:</strong> ${recipientData.country}</p>
    `;

    // Set checkbox state based on is_pinned value
    const pinCheckbox = document.getElementById("pin-checkbox");
    pinCheckbox.checked = recipientData.is_pinned;

    // Handle checkbox toggle event
    pinCheckbox.addEventListener("change", async () => {
        const isPinned = pinCheckbox.checked; // Get new state

        try {
            const response = await fetch(`/overseas-payees/${recipientData.payee_id}/pin`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ is_pinned: isPinned }),
            });

            if (response.ok) {
                console.log(`Payee pin status updated: ${isPinned}`);
                recipientData.is_pinned = isPinned; // Update local data
                sessionStorage.setItem("theRecipient", JSON.stringify(recipientData)); // Store updated data
            } else {
                console.error("Failed to update pin status");
                pinCheckbox.checked = !isPinned; // Revert checkbox if update fails
            }
        } catch (error) {
            console.error("Error updating pin status:", error);
            pinCheckbox.checked = !isPinned; // Revert checkbox on error
        }
    });

    // Handle save button click
    document.getElementById("save-btn").addEventListener("click", () => {
        window.location.href = "overseas-transaction-menu.html"; // Redirect after saving
    });
});
