const sql = require("mssql");
const dbConfig = require("../dbConfig");

class OverseasTransaction {
    constructor(transaction_id, user_id, payee_id, amount, currency, converted_amount, transaction_datetime, transaction_fee, transaction_type, tags) {
        this.transaction_id = transaction_id;
        this.user_id = user_id;
        this.payee_id = payee_id;
        this.amount = amount;
        this.currency = currency;
        this.converted_amount = converted_amount;
        this.transaction_datetime = transaction_datetime;
        this.transaction_fee = transaction_fee;
        this.transaction_type = transaction_type;
        this.tags = tags;
    }

    // Get all overseas transactions for a specific user
    static async getAllTransactions(user_id) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM OverseasTransactions WHERE user_id = @user_id`;

        const request = connection.request();
        request.input("user_id", user_id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset.map(
            (row) => new OverseasTransaction(
                row.transaction_id,
                row.user_id,
                row.payee_id,
                row.amount,
                row.currency,
                row.converted_amount,
                row.transaction_datetime,
                row.transaction_fee,
                row.transaction_type,
                row.tags
            )
        );
    }

    // Get a specific overseas transaction by transaction_id
    static async getTransactionById(transaction_id) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM OverseasTransactions WHERE transaction_id = @transaction_id`;

        const request = connection.request();
        request.input("transaction_id", transaction_id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset[0]
            ? new OverseasTransaction(
                result.recordset[0].transaction_id,
                result.recordset[0].user_id,
                result.recordset[0].payee_id,
                result.recordset[0].amount,
                result.recordset[0].currency,
                result.recordset[0].converted_amount,
                result.recordset[0].transaction_datetime,
                result.recordset[0].transaction_fee,
                result.recordset[0].transaction_type,
                result.recordset[0].tags
            )
            : null;
    }

    // Create a new overseas transaction
    static async createTransaction(newTransactionData) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `
            INSERT INTO OverseasTransactions (user_id, payee_id, amount, currency, converted_amount, transaction_fee, transaction_type, tags)
            VALUES (@user_id, @payee_id, @amount, @currency, @converted_amount, @transaction_fee, @transaction_type, @tags);
            SELECT SCOPE_IDENTITY() AS transaction_id;
        `;

        const request = connection.request();
        request.input("user_id", newTransactionData.user_id);
        request.input("payee_id", newTransactionData.payee_id);
        request.input("amount", newTransactionData.amount);
        request.input("currency", newTransactionData.currency);
        request.input("converted_amount", newTransactionData.converted_amount);
        request.input("transaction_fee", newTransactionData.transaction_fee);
        request.input("transaction_type", newTransactionData.transaction_type);
        request.input("tags", newTransactionData.tags);

        const result = await request.query(sqlQuery);

        connection.close();

        return this.getTransactionById(result.recordset[0].transaction_id);
    }
}

module.exports = OverseasTransaction;
