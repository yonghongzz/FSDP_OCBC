document.addEventListener("DOMContentLoaded", async () => {
    const userId = sessionStorage.getItem("loginUserId");

    if (!userId) {
        console.error("User ID not found. Please log in.");
        window.location.href = "login.html";
        return;
    }

    const userPointsElement = document.getElementById("user-points"); // Target the correct element
    const rewardsList = document.getElementById("rewards-list");

    if (!userPointsElement) {
        console.error("Error: Could not find the user points container.");
        return;
    }

    if (!rewardsList) {
        console.error("Error: Could not find the rewards list container.");
        return;
    }

    async function fetchUserPoints() {
        try {
            const response = await fetch(`/user/points/${userId}`);
            if (!response.ok) throw new Error("Failed to fetch user points");

            const data = await response.json();
            userPointsElement.textContent = `${data.points} points`; // Update UI with user's points
        } catch (error) {
            console.error("Error fetching user points:", error);
            userPointsElement.textContent = "Error loading points";
        }
    }

    async function fetchAvailableRewards() {
        try {
            const response = await fetch("/rewards");
            if (!response.ok) throw new Error("Failed to fetch rewards");

            const rewards = await response.json();
            if (rewards.length === 0) {
                rewardsList.innerHTML = `<p>No rewards available.</p>`;
                return;
            }

            rewardsList.innerHTML = rewards.map(reward => `
                <div class="reward-item">
                    <img src="${reward.image_url}" alt="${reward.name}">
                    <div class="reward-details">
                        <h4>${reward.name}</h4>
                        <p>Points Required: ${reward.points_required}</p>
                        <button class="redeem-button" data-reward-id="${reward.reward_id}">Redeem</button>
                    </div>
                </div>
            `).join("");

            document.querySelectorAll(".redeem-button").forEach(button => {
                button.addEventListener("click", async (e) => {
                    const rewardId = e.target.getAttribute("data-reward-id");
                    await redeemReward(userId, rewardId);
                });
            });
        } catch (error) {
            console.error("Error fetching rewards:", error);
            rewardsList.innerHTML = `<p>Error loading rewards.</p>`;
        }
    }

    async function redeemReward(userId, rewardId) {
        try {
            const response = await fetch("/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, rewardId })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to redeem reward");

            alert("Reward redeemed successfully!");
            await fetchUserPoints(); // Update points after redemption
            fetchAvailableRewards(); // Refresh rewards list
        } catch (error) {
            console.error("Error redeeming reward:", error);
            alert(error.message);
        }
    }

    // Fetch both user points and available rewards on page load
    fetchUserPoints();
    fetchAvailableRewards();
});
