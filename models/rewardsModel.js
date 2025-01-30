const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Ensure connection is established
async function connectDB() {
    if (!sql.connected) await sql.connect(dbConfig);
}

// Fetch all available rewards
exports.getAllRewards = async () => {
    try {
        await connectDB();
        const result = await sql.query("SELECT * FROM Rewards");
        return result.recordset;
    } catch (err) {
        throw new Error("Database error: " + err.message);
    }
};

// Get user points
exports.getUserPoints = async (userId) => {
    try {
        await connectDB();
        const result = await sql.query`SELECT points FROM Users WHERE user_id = ${userId}`;
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (err) {
        throw new Error("Database error: " + err.message);
    }
};

// Get reward cost
exports.getRewardCost = async (rewardId) => {
    try {
        await connectDB();
        const result = await sql.query`SELECT points_required FROM Rewards WHERE reward_id = ${rewardId}`;
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (err) {
        throw new Error("Database error: " + err.message);
    }
};

// Redeem reward
exports.redeemReward = async (userId, rewardId, pointsRequired) => {
    try {
        await connectDB();
        await sql.query`
            UPDATE Users SET points = points - ${pointsRequired} WHERE user_id = ${userId}`;
        await sql.query`
            INSERT INTO User_vouchers (user_id, reward_id, redeemed_at) 
            VALUES (${userId}, ${rewardId}, GETDATE())`;
        return { message: "Reward redeemed successfully!" };
    } catch (err) {
        throw new Error("Database error: " + err.message);
    }
};
