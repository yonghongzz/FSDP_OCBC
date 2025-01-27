const sql = require("mssql");
const dbConfig = require("../dbConfig");

class AtmLocation{
    constructor(bank_name, address, latitude, longitude){
        this.bank_name = bank_name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    static async getAllAtmLocations() {
    
        const connection = await sql.connect(dbConfig);
    
        const sqlQuery = `SELECT * FROM AtmLocations`;
    
        const request = connection.request();
        const result = await request.query(sqlQuery);
    
        connection.close();
    
        return result.recordset.map(
        (row) => new AtmLocation(row.bank_name, row.address, row.latitude, row.longitude)
        ); 
    }
}

module.exports = AtmLocation;