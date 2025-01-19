const sql = require("mssql");
const dbConfig = require("../dbConfig");

class OverseasTransactionLog {
    constructor(log_id, transaction_id, exchange_rate, transaction_fee, log_datetime) {
        this.log_id = log_id;
        this.transaction_id = transaction_id;
        this.exchange_rate = exchange_rate;
        this.transaction_fee = transaction_fee;
        this.log_datetime = log_datetime;
    }

    // Get all logs for a specific overseas transaction
    static async getLogsByTransactionId(transaction_id) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM OverseasTransactionLogs WHERE transaction_id = @transaction_id`;

        const request = connection.request();
        request.input("transaction_id", transaction_id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset.map(
            (row) => new OverseasTransactionLog(
                row.log_id,
                row.transaction_id,
                row.exchange_rate,
                row.transaction_fee,
                row.log_datetime
            )
        );
    }

    // Get a specific overseas transaction log by log_id
    static async getLogById(log_id) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM OverseasTransactionLogs WHERE log_id = @log_id`;

        const request = connection.request();
        request.input("log_id", log_id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset[0]
            ? new OverseasTransactionLog(
                result.recordset[0].log_id,
                result.recordset[0].transaction_id,
                result.recordset[0].exchange_rate,
                result.recordset[0].transaction_fee,
                result.recordset[0].log_datetime
            )
            : null;
    }

    // Create a new transaction log entry
    static async createTransactionLog(newLogData) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `
            INSERT INTO OverseasTransactionLogs (transaction_id, exchange_rate, transaction_fee)
            VALUES (@transaction_id, @exchange_rate, @transaction_fee);
            SELECT SCOPE_IDENTITY() AS log_id;
        `;

        const request = connection.request();
        request.input("transaction_id", newLogData.transaction_id);
        request.input("exchange_rate", newLogData.exchange_rate);
        request.input("transaction_fee", newLogData.transaction_fee);

        const result = await request.query(sqlQuery);

        connection.close();

        return this.getLogById(result.recordset[0].log_id);
    }
}

module.exports = OverseasTransactionLog;
