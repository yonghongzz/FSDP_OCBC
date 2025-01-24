const sql = require("mssql");
const dbConfig = require("../dbConfig");

class BankLocation{
    constructor(bank_name, address, postal_code, operating_hours){
        this.bank_name = bank_name;
        this.address = address;
        this.postal_code = postal_code;
        this.operating_hours = operating_hours;
    }

    static async getAllBankLocations() {
    
        const connection = await sql.connect(dbConfig);
    
        const sqlQuery = `SELECT * FROM BankLocations`;
    
        const request = connection.request();
        const result = await request.query(sqlQuery);
    
        connection.close();
    
        return result.recordset.map(
        (row) => new BankLocation(row.bank_name, row.address, row.postal_code, row.operating_hours)
        ); 
    }
}

module.exports = BankLocation;