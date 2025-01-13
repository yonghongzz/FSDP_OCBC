const sql = require("mssql");
const dbConfig = require("../dbConfig");

class Passkey {
    constructor(cred_id,cred_public_key,internal_user_id,webauthn_user_id,counter,backup_eligible,backup_status,transports,created_at,last_used) {
        this.cred_id = cred_id,
        this.cred_public_key = cred_public_key,
        this.internal_user_id = internal_user_id,
        this.webauthn_user_id = webauthn_user_id,
        this.counter = counter,
        this.backup_eligible = backup_eligible,
        this.backup_status = backup_status,
        this.transports = transports,
        this.created_at = created_at,
        this.last_used = last_used
    }


    static async createPasskey(passkey) {

        const connection = await sql.connect(dbConfig);
        const publicKey = Buffer.from(Object.values(passkey.publicKey)).toString('base64');
        const transports = JSON.stringify(passkey.transports);

        const sqlQuery = `INSERT INTO Passkey (cred_id,cred_public_key,internal_user_id,webauthn_user_id,counter,backup_eligible,backup_status,transports) VALUES (@cred_id,@cred_public_key,@internal_user_id,@webauthn_user_id,@counter,@backup_eligible,@backup_status,@transports); SELECT SCOPE_IDENTITY() AS internal_user_id;`; 

        const request = connection.request();
        request.input("cred_id",passkey.credId);
        request.input("cred_public_key",publicKey);
        request.input("internal_user_id",passkey.userId);
        request.input("webauthn_user_id",passkey.webAuthnUserId);
        request.input("counter",passkey.counter);
        request.input("backup_eligible",passkey.backedUp);
        request.input("backup_status",passkey.backedUp);
        request.input("transports",transports);

        const result = await request.query(sqlQuery);

        connection.close();

        return result;
    }

    static async getPasskey(userId){
        const connection = await sql.connect(dbConfig);
        const sqlQuery = `SELECT * FROM Passkey WHERE internal_user_id = @userId`;
        const request = connection.request();
        request.input("userId",userId);
        const result = await request.query(sqlQuery);
        connection.close();
        return result.recordset[0];
    }

}

module.exports = Passkey;