const sql = require("mssql");
const dbConfig = require("../dbConfig");

class Card {
    constructor(card_id, account_id, card_number, expiration_date, cvv, card_type) {
        this.card_id = card_id;                
        this.account_id = account_id;     
        this.card_number = card_number;        
        this.expiration_date = expiration_date;        
        this.cvv = cvv;
        this.card_type = card_type;
    }

    static async getAllCards() {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM Card`;

        const request = connection.request();
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset.map(
        (row) => new Card(row.card_id, row.account_id, row.card_number, row.expiration_date, row.cvv, row.card_type)
        ); 
    }

    static async getCardById(id) {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `SELECT * FROM Card WHERE card_id = @id`;

        const request = connection.request(); 
        request.input("id", id);
        const result = await request.query(sqlQuery);

        connection.close();

        return result.recordset[0]
        ? new AccTransaction (
            result.recordset[0].card_id,
            result.recordset[0].account_id,
            result.recordset[0].card_number,
            result.recordset[0].expiration_date,
            result.recordset[0].cvv,
            result.recordset[0].card_type
            )
        : null; 
    }

    /*
    // not sure if we need this also or we just create data directly using queries
    static async createCard(newCardData) {

        const connection = await sql.connect(dbConfig);

        const sqlQuery = `INSERT INTO Card (account_id, card_number, expiration_date, cvv, card_type) VALUES (@account_id, @card_number, @expiration_date, @cvv, @card_type); SELECT SCOPE_IDENTITY() AS card_id;`; 

        const request = connection.request();
        request.input("account_id", newCardData.account_id);
        request.input("card_number", newCardData.card_number);
        request.input("expiration_date", newCardData.expiration_date);
        request.input("cvv", newCardData.cvv);
        request.input("card_type", newCardData.card_type);

        const result = await request.query(sqlQuery);

        connection.close();

        return this.getCardById(result.recordset[0].card_id);
    }
    */

    // update card later
    // delete transaction not something user can do on the app
}

module.exports = Card;