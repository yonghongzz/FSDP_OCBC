const sql = require("mssql");
const dbConfig = require("../dbConfig");

class Account {
    constructor(account_id, user_id, account_type, account_number, balance, transaction_limit) {
        this.account_id = account_id;                
        this.user_id = user_id;     
        this.account_type = account_type;
        this.account_number = account_number;   
        this.balance = balance;        
        this.transaction_limit = transaction_limit;
    }

    static async getAllAccounts() {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM Accounts`;

        const request = connection.request();
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset.map(
        (row) => new Account(row.account_id, row.user_id, row.account_type, row.account_number, row.balance, row.transaction_limit)
        ); 
    }

    static async getAccountById(id) {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM Accounts WHERE account_id = @id`;

        const request = connection.request(); 
        request.input("id", id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset[0]
        ? new Account (
            result.recordset[0].account_id,
            result.recordset[0].user_id,
            result.recordset[0].account_type,
            result.recordset[0].account_number,
            result.recordset[0].balance,
            result.recordset[0].transaction_limit,
            )
        : null; 
    }

    static async updateTransactionLimit(id, newLimitData) {
        const connection = await sql.connect(dbConfig); // Establish DB connection

        // SQL query to update post
        const sqlQuery = `UPDATE Accounts SET transaction_limit = @transaction_limit WHERE account_id = @id`; 

        const request = connection.request(); // Create new request
        request.input("id", id);
        request.input("transaction_limit", parseFloat(newLimitData.transaction_limit) || null);

        try {
            await request.query(sqlQuery); // Execute query
        } catch (error) {
            console.error('SQL Error:', error); // Log SQL error
            throw error; // Rethrow to be caught in the controller
        } finally {
            connection.close(); // Close DB connection
        }

        return this.getAccountById(id); // Retrieve and return updated post using its ID
    }

    // Updates existing post in DB with new data
    static async updateBalance(id, newBalanceData) {
        const connection = await sql.connect(dbConfig); // Establish DB connection

        // SQL query to update post
        const sqlQuery = `UPDATE Accounts SET balance = @balance WHERE account_id = @id`; 

        const request = connection.request(); // Create new request
        request.input("id", id);
        request.input("balance", parseFloat(newBalanceData.balance) || null);

        try {
            await request.query(sqlQuery); // Execute query
        } catch (error) {
            console.error('SQL Error:', error); // Log SQL error
            throw error; // Rethrow to be caught in the controller
        } finally {
            connection.close(); // Close DB connection
        }

        return this.getAccountById(id); // Retrieve and return updated post using its ID
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