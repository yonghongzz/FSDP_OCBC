document.addEventListener("DOMContentLoaded", async () => {
    const userId = sessionStorage.getItem("loginUserId");

    if (!userId) {
        console.error("User ID not found. Please log in.");
        window.location.href = "login.html";
        return;
    }

    const vouchersList = document.getElementById("vouchers-list");

    async function fetchUserVouchers() {
        try {
            const response = await fetch(`/user/vouchers/${userId}`);
            if (!response.ok) throw new Error("Failed to fetch vouchers");
    
            const vouchers = await response.json();
            console.log("Fetched Vouchers from Backend:", vouchers);

            vouchersList.innerHTML = vouchers.length === 0
                ? `<p>No vouchers redeemed yet.</p>`
                : vouchers.map(voucher => `
                    <div class="voucher-item" data-user-voucher-id="${voucher.user_voucher_id}">
                        <div class="voucher-image">
                            <img src="${voucher.image_url}" alt="${voucher.name}">
                        </div>
                        <div class="voucher-details">
                            <h4>${voucher.name}</h4>
                            <p>Redeemed: ${new Date(voucher.redeemed_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                `).join("");

            document.querySelectorAll(".voucher-item").forEach(item => {
                item.addEventListener("click", () => {
                    const userVoucherId = item.getAttribute("data-user-voucher-id");
                    console.log("Clicked Voucher user_voucher_id:", userVoucherId);

                    if (!userVoucherId || userVoucherId === "undefined" || userVoucherId === "null") {
                        console.error("Error: userVoucherId is missing or invalid!");
                        alert("Error: Invalid voucher selection!");
                        return;
                    }

                    window.location.href = `voucherDetails.html?userVoucherId=${encodeURIComponent(userVoucherId)}`;
                });
            });

        } catch (error) {
            console.error("Error fetching vouchers:", error);
            vouchersList.innerHTML = `<p>Error loading vouchers.</p>`;
        }
    }

    fetchUserVouchers();
});
