const rewardsModel = require("../models/rewardsModel");

exports.getAllRewards = async (req, res) => {
    try {
        const rewards = await rewardsModel.getAllRewards();
        res.json(rewards);
    } catch (err) {
        console.error("Error fetching rewards:", err.message);
        res.status(500).json({ error: "Failed to fetch rewards" });
    }
};

exports.redeemReward = async (req, res) => {
    const { userId, rewardId } = req.body;

    try {
        // Check if user exists
        const user = await rewardsModel.getUserPoints(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Check if reward exists
        const reward = await rewardsModel.getRewardCost(rewardId);
        if (!reward) return res.status(404).json({ error: "Reward not found" });

        // Check if user has enough points
        if (user.points < reward.points_required) {
            return res.status(400).json({ error: "Not enough points" });
        }

        // Process reward redemption
        const result = await rewardsModel.redeemReward(userId, rewardId, reward.points_required);
        res.json(result);
    } catch (err) {
        console.error("Redemption error:", err.message);
        res.status(500).json({ error: "Failed to redeem reward" });
    }
};
