    const sql = require("mssql");
    const dbConfig = require("../dbConfig");
    const bcrypt = require("bcryptjs");
    const jwt = require("jsonwebtoken");

    class User {

        constructor(user_id, username, password_hash, email, phone_number) {
            this.user_id = user_id;                  
            this.username = username;      
            this.password_hash = password_hash;           
            this.email = email;              
            this.phone_number = phone_number;                             
        }

        static async getAllUsers() {

            const connection = await sql.connect(dbConfig);

            const sqlQuery = `SELECT * FROM Users`;

            const request = connection.request();
            const result = await request.query(sqlQuery);

            connection.close();

            return result.recordset.map(
            (row) => new User(row.user_id, row.username, row.password_hash, row.email, row.phone_number)
            ); 
        }

        static async getUserById(id) {

            const connection = await sql.connect(dbConfig);

            const sqlQuery = `SELECT * FROM Users WHERE user_id = @id`;

            const request = connection.request();
            request.input("id", id); // Add parameter for user ID
            const result = await request.query(sqlQuery);

            connection.close();

            return result.recordset[0]
            ? new User(
                result.recordset[0].user_id,
                result.recordset[0].username,
                result.recordset[0].password_hash,
                result.recordset[0].email,
                result.recordset[0].phone_number
                )
            : null; 
        }

        static async getUserId(username) {

            const connection = await sql.connect(dbConfig);

            const sqlQuery = `SELECT * FROM Users WHERE username = @username`;

            const request = connection.request();
            request.input("username",username); 
            const result = await request.query(sqlQuery);

            connection.close();

            return result.recordset[0].user_id;
        }

        static async createUser(newUserData) {

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newUserData.password_hash, salt);

            const connection = await sql.connect(dbConfig);

            const sqlQuery = `INSERT INTO Users (username, password_hash, email, phone_number) VALUES (@username, @password_hash, @email, @phone_number); SELECT SCOPE_IDENTITY() AS user_id;`; 

            const request = connection.request();
            request.input("username", newUserData.username);
            request.input("password_hash", hashedPassword);
            request.input("email", newUserData.email);
            request.input("phone_number", newUserData.phone_number);

            const result = await request.query(sqlQuery);

            connection.close();

            return this.getUserById(result.recordset[0].user_id);
        }

        static async updateUser(id, newUserData) {

            // allows for dynamic input data, eg name + email + pass, name + email only, name only
            let connection;

            try {
                connection = await sql.connect(dbConfig);

                let sqlQuery = 'UPDATE Users SET ';
                const params = [];

                if (newUserData.username) {
                    sqlQuery += 'username = @username, ';
                    params.push({ name: 'username', type: sql.VarChar, value: newUserData.username });
                }

                if (newUserData.email) {
                    sqlQuery += 'email = @email, ';
                    params.push({ name: 'email', type: sql.VarChar, value: newUserData.email });
                }

                if (newUserData.phone_number) {
                    sqlQuery += 'phone_number = @phone_number, ';
                    params.push({ name: 'phone_number', type: sql.VarChar, value: newUserData.phone_number });
                }

                if (newUserData.password_hash) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(newUserData.password_hash, salt);
                    sqlQuery += 'password_hash = @password_hash, ';
                    params.push({ name: 'password_hash', type: sql.VarChar, value: hashedPassword });
                }

                // Remove the last comma and add the WHERE clause
                sqlQuery = sqlQuery.slice(0, -2) + ' WHERE user_id = @id';
                params.push({ name: 'id', type: sql.Int, value: id });

                const request = connection.request();
                params.forEach(param => {
                    request.input(param.name, param.type, param.value);
                });

                await request.query(sqlQuery);

                return await this.getUserById(id);

            } catch (err) {

                console.error("SQL error", err);
                throw err;

            } finally {

                if (connection) {
                    await connection.close();
                }
            }
        }

        static async loginUser(loginUserData) {

            const connection = await sql.connect(dbConfig);

            const sqlQuery = `SELECT * FROM Users WHERE username = @username`;

            const request = connection.request();
            request.input("username", loginUserData.username);

            const result = await request.query(sqlQuery);

            connection.close();

            if (result.recordset[0]) {
                const passwordMatch = await bcrypt.compare(loginUserData.password_hash, result.recordset[0].password_hash);
                if (passwordMatch) {
                    const user = new User(
                        result.recordset[0].user_id,
                        result.recordset[0].username,
                        result.recordset[0].password_hash,
                        result.recordset[0].email,
                        result.recordset[0].phone_number
                    );

                    const token = await this.generateAccessToken({ user_id: user.user_id.toString() });
                    

                    const refreshToken = jwt.sign({ user_id: user.user_id.toString() }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
                    const salt = await bcrypt.genSalt(10);
                    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

                    const connection = await sql.connect(dbConfig);
                    const sqlQuery = `INSERT INTO RefreshTokens (refreshToken) VALUES (@refreshToken);`;
                    const request = connection.request();
                    request.input("refreshToken", hashedRefreshToken);
                    await request.query(sqlQuery);
                    connection.close();
                    
                    return { token: token, refreshToken: refreshToken };
                }
            }
            return null;
        }

        static async generateAccessToken(payload) {
            
            return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
        }

        static async refreshAccessToken(refreshToken) {
            
            try {
                let payload;
                const connection = await sql.connect(dbConfig);
                const sqlQuery = `SELECT * FROM RefreshTokens WHERE refreshToken IS NOT NULL`;
                const request = connection.request();
                const result = await request.query(sqlQuery);
                connection.close();

                if (result.recordset.length === 0) {
                    return null;
                }

                let match = null;

                for (const tokenRecord of result.recordset) {
                    const isMatch = await bcrypt.compare(refreshToken, tokenRecord.refreshToken);
                    if (isMatch) {
                        match = true;
                        break;
                    }
                }

                if (!match) {
                    return null;
                }

                jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                    if (err) {
                        return null
                    }
                    payload = { user_id: decoded.user_id }
                });

                const accessToken = await this.generateAccessToken(payload);
                return accessToken;

            } catch (err) {

                console.error(err);
                return null;
            }
        }

        static async logout(refreshToken) {
        
            try {
            const connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM RefreshTokens WHERE refreshToken IS NOT NULL`;
            const request = connection.request();
            const result = await request.query(sqlQuery);
        
            if (result.recordset.length === 0) {
                return null;
            }
        
            let tokenToDelete = null;
        
            for (const tokenRecord of result.recordset) {
                const isMatch = await bcrypt.compare(refreshToken, tokenRecord.refreshToken);
                if (isMatch) {
                tokenToDelete = tokenRecord.refreshToken;
                break;
                }
            }
        
            if (!tokenToDelete) {
                return null;
            }
        
            const deleteQuery = `DELETE FROM RefreshTokens WHERE refreshToken = @refreshToken`;
            request.input("refreshToken", tokenToDelete);
            await request.query(deleteQuery);
        
            connection.close();
        
            return result.rowsAffected[0] > 0; // Return true if at least one row was affected

            } catch (err) {

                console.error("Error logging out:", err);
                connection.close();
                return false;
            }
        }

        // for checking create account
        static async getUserByEmail(email) {
            const connection = await sql.connect(dbConfig);

            const sqlQuery = `SELECT * FROM Users WHERE email = @email`;

            const request = connection.request();
            request.input("email", email);
            const result = await request.query(sqlQuery);

            connection.close();

            return result.recordset[0]
                ? new User(
                    result.recordset[0].user_id,
                    result.recordset[0].username,
                    result.recordset[0].password_hash,
                    result.recordset[0].email,
                    result.recordset[0].phone_number
                )
                : null;
        }

        static async getUserByName(name) {
            const connection = await sql.connect(dbConfig);

            const sqlQuery = `SELECT * FROM Users WHERE username = @username`;

            const request = connection.request();
            request.input("username", name);
            const result = await request.query(sqlQuery);

            connection.close();

            return result.recordset[0]
                ? new User(
                    result.recordset[0].user_id,
                    result.recordset[0].username,
                    result.recordset[0].password_hash,
                    result.recordset[0].email,
                    result.recordset[0].phone_number
                )
                : null;
        }
    }

    module.exports = User;