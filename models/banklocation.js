const sql = require("mssql");
const dbConfig = require("../dbConfig");

class BankLocation{
    constructor(bank_name, address, operating_hours, latitude, longitude) {
        this.bank_name = bank_name;
        this.address = address;
        this.operating_hours = operating_hours;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    static async getAllBankLocations() {
    
        const connection = await sql.connect(dbConfig);
    
        const sqlQuery = `SELECT * FROM BankLocations`;
    
        const request = connection.request();
        const result = await request.query(sqlQuery);
    
        connection.close();
    
        return result.recordset.map(
        (row) => new BankLocation(row.bank_name, row.address, row.operating_hours, row.latitude, row.longitude)
        ); 
    }
}

module.exports = BankLocation;