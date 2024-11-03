const sql = require('mssql');
const dbConfig = require("./dbConfig");
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    try {
        await sql.connect(dbConfig);

        // Drop existing tables (optional if you want to recreate them entirely)
        await sql.query(`
            if exists (SELECT * FROM sysobjects 
            WHERE id = object_id('dbo.AccTransactions') and sysstat & 0xf = 3)
            DROP TABLE dbo.AccTransactions;

            if exists (SELECT * FROM sysobjects 
            WHERE id = object_id('dbo.Cards') and sysstat & 0xf = 3)
            DROP TABLE dbo.Cards;

            if exists (SELECT * FROM sysobjects 
            WHERE id = object_id('dbo.Accounts') and sysstat & 0xf = 3)
            DROP TABLE dbo.Accounts;

            if exists (SELECT * FROM sysobjects 
            WHERE id = object_id('dbo.Staffs') and sysstat & 0xf = 3)
            DROP TABLE dbo.Staffs;

            if exists (SELECT * FROM sysobjects 
            WHERE id = object_id('dbo.Users') and sysstat & 0xf = 3)
            DROP TABLE dbo.Users;
        `);

        // Create tables
        await sql.query(`
            CREATE TABLE Users (
                user_id INT PRIMARY KEY IDENTITY(1,1),
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                phone_number VARCHAR(20)
            );

            CREATE TABLE Accounts (
                account_id INT PRIMARY KEY IDENTITY(1,1),
                user_id INT,
                account_type VARCHAR(50) NOT NULL,
                account_number VARCHAR(20) NOT NULL UNIQUE,
                balance DECIMAL(10, 2) DEFAULT 0.00,
                transaction_limit DECIMAL(10, 2) DEFAULT 1000.00,
                FOREIGN KEY (user_id) REFERENCES Users(user_id)
            );

            CREATE TABLE AccTransactions (
                transaction_id INT PRIMARY KEY IDENTITY(1,1),
                account_id INT,
                transaction_type VARCHAR(50) CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'payment', 'refund')) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                transaction_datetime DATETIME DEFAULT GETDATE(),
                name VARCHAR(100),
                FOREIGN KEY (account_id) REFERENCES Accounts(account_id)
            );

            CREATE TABLE Cards (
                card_id INT PRIMARY KEY IDENTITY(1,1),
                account_id INT,
                card_number VARCHAR(16) NOT NULL,
                expiration_date DATE NOT NULL,
                cvv VARCHAR(4) NOT NULL,
                card_type VARCHAR(50) NOT NULL,
                FOREIGN KEY (account_id) REFERENCES Accounts(account_id)
            );

            CREATE TABLE Staffs (
                staff_id INT PRIMARY KEY IDENTITY(1,1),
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL
            );
        `);

        // Hash passwords
        let salt = await bcrypt.genSalt(10);
        const hashedPassword1 = await bcrypt.hash('abcd1234', salt);
        salt = await bcrypt.genSalt(10);
        const hashedPassword2 = await bcrypt.hash('abcd1234', salt);
        salt = await bcrypt.genSalt(10);
        const hashedPassword3 = await bcrypt.hash('abcd1234', salt);

        const hashedPassword4 = await bcrypt.hash('abcd1234', salt);
        salt = await bcrypt.genSalt(10);
        const hashedPassword5 = await bcrypt.hash('abcd1234', salt);
        salt = await bcrypt.genSalt(10);
        const hashedPassword6 = await bcrypt.hash('abcd1234', salt);

        // Insert data into User table
        await sql.query(`
            INSERT INTO Users(username, password_hash, email, phone_number)
            VALUES ('Anna', '${hashedPassword1}', 'anna@gmail.com', '12345678'),  
                   ('Brian','${hashedPassword2}', 'brian@gmail.com', '23456789'),
                   ('Charlie', '${hashedPassword3}', 'charlie@gmail.com', '34567890');
        `);

        // Insert data into Account table
        await sql.query(`
            INSERT INTO Accounts(user_id, account_type, account_number, balance, transaction_limit)
            VALUES (1, 'Savings Account', '1111111111111111', 500.00, 1000.00),  
                   (1, 'Current Account', '2222222222222222', 1000.00, 1000.00),
                   (2, 'Savings Account', '3333333333333333', 2000.00, 1000.00),
                   (3, 'Savings Account', '4444444444444444', 3000.00, 1000.00);
        `);

        // Insert data into Card table
        await sql.query(`
            INSERT INTO Cards(account_id, card_number, expiration_date, cvv, card_type)
            VALUES (1, '1234567812345678', '2026-12-31', '123', 'Visa'),  
                   (2, '2345678923456789', '2025-05-15', '456', 'MasterCard'),
                   (3, '3456789034567890', '2027-08-20', '789', 'Visa'),
                   (4, '4567890145678901', '2025-11-30', '321', 'MasterCard');
        `);

        // Insert data into AccTransaction table
        await sql.query(`
            INSERT INTO AccTransactions(account_id, transaction_type, amount, transaction_datetime, name)
            VALUES (1, 'deposit', 100.00, '2024-05-25 17:43:00', 'ATM'),  
                   (1, 'transfer', 200.00, '2024-05-26 13:12:19', 'Sarah Ng'),
                   (2, 'withdrawal', 50.00, '2024-05-26 16:32:43', 'ATM'),
                   (2, 'payment', 100.00, '2024-05-27 18:54:34', 'Restaurant X'),
                   (3, 'deposit', 200.00, '2024-05-28 11:23:56', 'ATM'),
                   (3, 'payment', 50.00, '2024-05-28 18:43:23', 'Bob Wong'),
                   (4, 'deposit', 300.00, '2024-05-28 18:43:23', 'ATM'),
                   (4, 'deposit', 300.00, '2024-05-28 11:23:56', 'ATM');
        `);

        // Insert data into Staff table
        await sql.query(`
            INSERT INTO Staffs(username, password_hash)
            VALUES ('John', '${hashedPassword4}'),  
                   ('Jane','${hashedPassword5}'),
                   ('Jim', '${hashedPassword6}');
        `);

        console.log('Sample data inserted successfully.');

    } catch (err) {
        console.error('Error inserting sample data:', err.message);
    } finally {
        await sql.close();
    }
}

module.exports = seedDatabase;