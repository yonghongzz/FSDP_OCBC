const sql = require("mssql");
const dbConfig = require("../dbConfig");

class OverseasPayee {
    constructor(payee_id, user_id, payee_name, bank_name, country, account_number, currency, is_pinned) {
        this.payee_id = payee_id;
        this.user_id = user_id;
        this.payee_name = payee_name;
        this.bank_name = bank_name;
        this.country = country;
        this.account_number = account_number;
        this.currency = currency;
        this.is_pinned = is_pinned;
    }

    // Fetch all overseas payees for a specific user
    static async getAllPayees(user_id) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM OverseasPayees WHERE user_id = @user_id`;

        const request = connection.request();
        request.input("user_id", user_id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset.map(
            (row) => new OverseasPayee(
                row.payee_id,
                row.user_id,
                row.payee_name,
                row.bank_name,
                row.country,
                row.account_number,
                row.currency,
                row.is_pinned
            )
        );
    }

    // Fetch a specific payee by payee_id
    static async getPayeeById(payee_id) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM OverseasPayees WHERE payee_id = @payee_id`;

        const request = connection.request();
        request.input("payee_id", payee_id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset[0]
            ? new OverseasPayee(
                result.recordset[0].payee_id,
                result.recordset[0].user_id,
                result.recordset[0].payee_name,
                result.recordset[0].bank_name,
                result.recordset[0].country,
                result.recordset[0].account_number,
                result.recordset[0].currency,
                result.recordset[0].is_pinned
            )
            : null;
    }

    // Create a new overseas payee for a user
    static async createPayee(newPayeeData) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `
            INSERT INTO OverseasPayees (user_id, payee_name, bank_name, country, account_number, currency, is_pinned)
            VALUES (@user_id, @payee_name, @bank_name, @country, @account_number, @currency, @is_pinned);
            SELECT SCOPE_IDENTITY() AS payee_id;
        `;

        const request = connection.request();
        request.input("user_id", newPayeeData.user_id);
        request.input("payee_name", newPayeeData.payee_name);
        request.input("bank_name", newPayeeData.bank_name);
        request.input("country", newPayeeData.country);
        request.input("account_number", newPayeeData.account_number);
        request.input("currency", newPayeeData.currency);
        request.input("is_pinned", newPayeeData.is_pinned);

        const result = await request.query(sqlQuery);

        connection.close();

        return this.getPayeeById(result.recordset[0].payee_id);
    }

    // Update a payee's details
    static async updatePayee(id, updatedPayeeData) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `
            UPDATE OverseasPayees
            SET payee_name = @payee_name,
                bank_name = @bank_name,
                country = @country,
                account_number = @account_number,
                currency = @currency,
                is_pinned = @is_pinned
            WHERE payee_id = @id
        `;

        const request = connection.request();
        request.input("id", id);
        request.input("payee_name", updatedPayeeData.payee_name || null);
        request.input("bank_name", updatedPayeeData.bank_name || null);
        request.input("country", updatedPayeeData.country || null);
        request.input("account_number", updatedPayeeData.account_number || null);
        request.input("currency", updatedPayeeData.currency || null);
        request.input("is_pinned", updatedPayeeData.is_pinned);

        await request.query(sqlQuery);

        connection.close();

        return this.getPayeeById(id); // Retrieve and return updated payee using its ID
    }

    // Pin or unpin a payee
    static async togglePin(id, isPinned) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `
            UPDATE OverseasPayees
            SET is_pinned = @is_pinned
            WHERE payee_id = @id
        `;

        const request = connection.request();
        request.input("id", id);
        request.input("is_pinned", isPinned);

        await request.query(sqlQuery);

        connection.close();

        return this.getPayeeById(id);
    }
}

module.exports = OverseasPayee;
