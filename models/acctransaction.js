const sql = require("mssql");
const dbConfig = require("../dbConfig");

class AccTransaction {
    constructor(transaction_id, account_id, transaction_type, amount, transaction_datetime, name) {
        this.transaction_id = transaction_id;                
        this.account_id = account_id;     
        this.transaction_type = transaction_type;        
        this.amount = amount;        
        this.transaction_datetime = transaction_datetime;
        this.name = name;
    }

    static async getAllAccTransactions() {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM AccTransactions`;

        const request = connection.request();
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset.map(
        (row) => new AccTransaction(row.transaction_id, row.account_id, row.transaction_type, row.amount, row.transaction_datetime, row.name)
        ); 
    }

    static async getAccTransactionById(id) {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM AccTransactions WHERE transaction_id = @id`;

        const request = connection.request(); 
        request.input("id", id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset[0]
        ? new AccTransaction (
            result.recordset[0].transaction_id,
            result.recordset[0].account_id,
            result.recordset[0].transaction_type,
            result.recordset[0].amount,
            result.recordset[0].transaction_datetime,
            result.recordset[0].name
            )
        : null; 
    }

    static async createAccTransaction(newAccTransactionData) {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `INSERT INTO AccTransactions (account_id, transaction_type, amount, name) VALUES (@account_id, @transaction_type, @amount, @name); SELECT SCOPE_IDENTITY() AS transaction_id;`; 

        const request = connection.request();
        request.input("account_id", newAccTransactionData.account_id);
        request.input("transaction_type", newAccTransactionData.transaction_type);
        request.input("amount", newAccTransactionData.amount);
        request.input("name", newAccTransactionData.name);

        const result = await request.query(sqlQuery);

        connection.close();

        return this.getAccTransactionById(result.recordset[0].transaction_id);
    }

    // update transaction not possible
    // delete transaction not something user can do on the app
}

module.exports = AccTransaction;