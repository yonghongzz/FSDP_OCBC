const sql = require("mssql");
const dbConfig = require("../dbConfig");

class RecurringTransfer {
    constructor(recurring_transfer_id, user_id, payee_id, account_id, amount, currency, frequency, next_transfer_date, end_date, status) {
        this.recurring_transfer_id = recurring_transfer_id;
        this.user_id = user_id;
        this.payee_id = payee_id;
        this.account_id = account_id;
        this.amount = amount;
        this.currency = currency;
        this.frequency = frequency;
        this.next_transfer_date = next_transfer_date;
        this.end_date = end_date;
        this.status = status;
    }

    static async getAllRecurringTransfers() {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM RecurringTransfers`;

        const request = connection.request();
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset.map(
            (row) =>
                new RecurringTransfer(
                    row.recurring_transfer_id,
                    row.user_id,
                    row.payee_id,
                    row.account_id,
                    row.amount,
                    row.currency,
                    row.frequency,
                    row.next_transfer_date,
                    row.end_date,
                    row.status
                )
        );
    }

    static async getRecurringTransferById(id) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM RecurringTransfers WHERE recurring_transfer_id = @id`;

        const request = connection.request();
        request.input("id", sql.Int, id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset[0]
            ? new RecurringTransfer(
                  result.recordset[0].recurring_transfer_id,
                  result.recordset[0].user_id,
                  result.recordset[0].payee_id,
                  result.recordset[0].account_id,
                  result.recordset[0].amount,
                  result.recordset[0].currency,
                  result.recordset[0].frequency,
                  result.recordset[0].next_transfer_date,
                  result.recordset[0].end_date,
                  result.recordset[0].status
              )
            : null;
    }

    static async createRecurringTransfer(newRecurringTransferData) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `
            INSERT INTO RecurringTransfers (user_id, payee_id, account_id, amount, currency, frequency, next_transfer_date, end_date, status)
            VALUES (@user_id, @payee_id, @account_id, @amount, @currency, @frequency, @next_transfer_date, @end_date, @status);
            SELECT SCOPE_IDENTITY() AS recurring_transfer_id;
        `;

        const request = connection.request();
        request.input("user_id", sql.Int, newRecurringTransferData.user_id);
        request.input("payee_id", sql.Int, newRecurringTransferData.payee_id);
        request.input("account_id", sql.Int, newRecurringTransferData.account_id);
        request.input("amount", sql.Decimal(10, 2), newRecurringTransferData.amount);
        request.input("currency", sql.VarChar(10), newRecurringTransferData.currency);
        request.input("frequency", sql.VarChar(50), newRecurringTransferData.frequency);
        request.input("next_transfer_date", sql.Date, newRecurringTransferData.next_transfer_date);
        request.input("end_date", sql.Date, newRecurringTransferData.end_date || null);
        request.input("status", sql.VarChar(50), newRecurringTransferData.status);

        const result = await request.query(sqlQuery);

        connection.close();

        return this.getRecurringTransferById(result.recordset[0].recurring_transfer_id);
    }

    static async updateRecurringTransfer(id, updatedData) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `
            UPDATE RecurringTransfers
            SET
                user_id = @user_id,
                payee_id = @payee_id,
                account_id = @account_id,
                amount = @amount,
                currency = @currency,
                frequency = @frequency,
                next_transfer_date = @next_transfer_date,
                end_date = @end_date,
                status = @status
            WHERE recurring_transfer_id = @id;
        `;

        const request = connection.request();
        request.input("id", sql.Int, id);
        request.input("user_id", sql.Int, updatedData.user_id);
        request.input("payee_id", sql.Int, updatedData.payee_id);
        request.input("account_id", sql.Int, updatedData.account_id);
        request.input("amount", sql.Decimal(10, 2), updatedData.amount);
        request.input("currency", sql.VarChar(10), updatedData.currency);
        request.input("frequency", sql.VarChar(50), updatedData.frequency);
        request.input("next_transfer_date", sql.Date, updatedData.next_transfer_date);
        request.input("end_date", sql.Date, updatedData.end_date || null);
        request.input("status", sql.VarChar(50), updatedData.status);

        await request.query(sqlQuery);

        connection.close();

        return this.getRecurringTransferById(id);
    }

    static async deleteRecurringTransfer(id) {
        const connection = await sql.connect(dbConfig);

        const sqlQuery = `DELETE FROM RecurringTransfers WHERE recurring_transfer_id = @id`;

        const request = connection.request();
        request.input("id", sql.Int, id);

        await request.query(sqlQuery);

        connection.close();
    }
}

module.exports = RecurringTransfer;
