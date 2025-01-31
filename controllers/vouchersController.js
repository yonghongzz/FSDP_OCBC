const sql = require("mssql");

// Fetch user's redeemed vouchers
exports.getUserVouchers = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await sql.query`
            SELECT uv.user_voucher_id, r.name, r.image_url, uv.redeemed_at 
            FROM User_vouchers uv
            JOIN Rewards r ON uv.reward_id = r.reward_id
            WHERE uv.user_id = ${userId}
            ORDER BY uv.redeemed_at DESC
        `;

        console.log("Backend Fetched User Vouchers:", result.recordset);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching user vouchers:", err);
        res.status(500).json({ error: "Failed to fetch vouchers" });
    }
};



// Fetch user's points
exports.getUserPoints = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await sql.query`SELECT points FROM Users WHERE user_id = ${userId}`;
        if (result.recordset.length > 0) {
            res.json({ points: result.recordset[0].points });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        console.error("Error fetching points:", err);
        res.status(500).json({ error: "Failed to fetch user points" });
    }
};

exports.getVoucherById = async (req, res) => {
    const { userId, userVoucherId } = req.params;

    try {
        const result = await sql.query`
            SELECT uv.user_voucher_id, r.name, r.image_url, uv.redeemed_at 
            FROM User_vouchers uv
            JOIN Rewards r ON uv.reward_id = r.reward_id
            WHERE uv.user_id = ${userId} AND uv.user_voucher_id = ${userVoucherId}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Voucher not found" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Error fetching voucher:", error);
        res.status(500).json({ error: "Failed to fetch voucher" });
    }
};




// Remove voucher when barcode is scanned
exports.removeVoucher = async (req, res) => {
    const { userId, userVoucherId } = req.body;

    try {
        const result = await sql.query`
            DELETE FROM User_vouchers WHERE user_id = ${userId} AND user_voucher_id = ${userVoucherId}
        `;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Voucher not found" });
        }

        res.json({ message: "Voucher removed successfully!" });
    } catch (error) {
        console.error("Error removing voucher:", error);
        res.status(500).json({ error: "Failed to remove voucher" });
    }
};


