const sql = require("mssql");
const dbConfig = require("../dbConfig");

class Account {
    constructor(account_id, user_id, account_type, balance, transaction_limit) {
        this.account_id = account_id;                
        this.user_id = user_id;     
        this.account_type = account_type;        
        this.balance = balance;        
        this.transaction_limit = transaction_limit;
    }

    static async getAllAccounts() {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM Account`;

        const request = connection.request();
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset.map(
        (row) => new Post(row.account_id, row.user_id, row.account_type, row.balance, row.transaction_limit)
        ); 
    }

    static async getAccountById(id) {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM Account WHERE account_id = @id`;

        const request = connection.request(); 
        request.input("id", id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset[0]
        ? new Account (
            result.recordset[0].account_id,
            result.recordset[0].user_id,
            result.recordset[0].account_type,
            result.recordset[0].balance,
            result.recordset[0].transaction_limit,
            )
        : null; 
    }

    /*
    // edit later, for now no need create account here can create directly using sql queries
    static async createAccount(newAccountData) {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `INSERT INTO Account (user_id, account_type, balance, transaction_limit) VALUES (@user_id, @account_type, @balance, @transaction_limit); SELECT SCOPE_IDENTITY() AS account_id;`; 

        const request = connection.request();
        request.input("user_id", newAccountData.user_id);
        request.input("account_type", newAccountData.account_type);
        request.input("balance", newAccountData.balance);
        request.input("transaction_limit", newAccountData.transaction_limit);

        const result = await request.query(sqlQuery);

        connection.close();

        return this.getAccountById(result.recordset[0].account_id);
    }
    */

    /*
    // update account (also maybe for part 2)
    static async updateAccount(id, newAccountData) {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `UPDATE Account SET account_type = @account_type, balance = @balance, transaction_limit = @transaction_limit WHERE account_id = @id`; 

        const request = connection.request();
        request.input("id", id);
        request.input("account_type", newAccountData.account_type || null); 
        request.input("balance", newAccountData.balance || null); 
        request.input("transaction_limit", newAccountData.transaction_limit);

        await request.query(sqlQuery)

        connection.close();

        return this.getAccountById(id);
    }
    */

    // delete account not something user can do on the app
}

module.exports = Account;