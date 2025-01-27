const sql = require('mssql');
const dbConfig = require("./dbConfig");
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    try {
        await sql.connect(dbConfig);

        // Drop existing tables (optional if you want to recreate them entirely)
        await sql.query(`
            if exists (SELECT * FROM sysobjects 
            WHERE id = object_id('dbo.OverseasTransactionLogs') and sysstat & 0xf = 3)
            DROP TABLE dbo.OverseasTransactionLogs;

            if exists (SELECT * FROM sysobjects 
            WHERE id = object_id('dbo.OverseasTransactions') and sysstat & 0xf = 3)
            DROP TABLE dbo.OverseasTransactions;

            if exists (SELECT * FROM sysobjects
            WHERE id = object_id('dbo.RecurringTransfers') and sysstat & 0xf = 3)
            DROP TABLE dbo.RecurringTransfers;

            if exists (SELECT * FROM sysobjects 
            WHERE id = object_id('dbo.OverseasPayees') and sysstat & 0xf = 3)
            DROP TABLE dbo.OverseasPayees;

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

            if exists (SELECT * FROM sysobjects
            WHERE id = object_id('dbo.BankLocations') and sysstat & 0xf = 3)
            DROP TABLE dbo.BankLocations;

            if exists (SELECT * FROM sysobjects
            WHERE id = object_id('dbo.ATMLocations') and sysstat & 0xf = 3)
            DROP TABLE dbo.ATMLocations;
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

            CREATE TABLE OverseasPayees (
                payee_id INT PRIMARY KEY IDENTITY(1,1),
                user_id INT,                     -- Foreign key to link to Users table
                payee_name VARCHAR(100) NOT NULL, -- Name of the payee (could be a person or company)
                bank_name VARCHAR(100) NOT NULL,  -- Name of the bank where the payee holds an account
                country VARCHAR(50) NOT NULL,     -- Country where the payee's bank is located
                account_number VARCHAR(20) NOT NULL, -- Payee's account number
                currency VARCHAR(10) NOT NULL,    -- Currency used by the payee's bank (e.g., USD, EUR)
                is_pinned BIT DEFAULT 0,          -- Indicates if the payee is pinned as frequent by the user (0 = not pinned, 1 = pinned)
                FOREIGN KEY (user_id) REFERENCES Users(user_id)  -- Links to the Users table
            );

            CREATE TABLE OverseasTransactions (
                transaction_id INT PRIMARY KEY IDENTITY(1,1),
                user_id INT,                     -- Foreign key linking to the Users table
                payee_id INT,                    -- Foreign key linking to the OverseasPayees table
                amount DECIMAL(10, 2) NOT NULL,   -- The amount the user wants to send in their currency
                currency VARCHAR(10) NOT NULL,    -- The currency of the transaction (user's currency)
                converted_amount DECIMAL(10, 2) NOT NULL, -- The amount after currency conversion (to payee's currency)
                transaction_datetime DATETIME DEFAULT GETDATE(), -- The date and time of the transaction
                transaction_fee DECIMAL(10, 2),  -- The transaction fee for sending the money
                transaction_type VARCHAR(50) CHECK (transaction_type IN ('send', 'receive')) NOT NULL, -- Type of transaction (send or receive)
                tags VARCHAR(255),               -- Tags for categorizing the transaction (e.g., "gift", "business")
                FOREIGN KEY (user_id) REFERENCES Users(user_id),  -- Links to the Users table
                FOREIGN KEY (payee_id) REFERENCES OverseasPayees(payee_id)  -- Links to the OverseasPayees table
            );

            CREATE TABLE OverseasTransactionLogs (
                log_id INT PRIMARY KEY IDENTITY(1,1),
                transaction_id INT,              -- Foreign key linking to the OverseasTransactions table
                exchange_rate DECIMAL(10, 6) NOT NULL,  -- Exchange rate used for the transaction
                transaction_fee DECIMAL(10, 2),  -- The fee applied during the transaction
                log_datetime DATETIME DEFAULT GETDATE(), -- The date and time when the log entry was created
                FOREIGN KEY (transaction_id) REFERENCES OverseasTransactions(transaction_id)  -- Links to the OverseasTransactions table
            );

            CREATE TABLE RecurringTransfers (
                recurring_id INT PRIMARY KEY IDENTITY(1,1),
                user_id INT,                     -- Links to Users table
                payee_id INT,                    -- Links to OverseasPayees table
                account_id INT,                  -- Links to Accounts table
                amount DECIMAL(10, 2) NOT NULL,  -- Amount to be transferred
                currency VARCHAR(10) NOT NULL,   -- Currency of the transaction
                frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL, -- Frequency of the transfer
                next_transfer_date DATE NOT NULL, -- Date of the next scheduled transfer
                end_date DATE,                   -- Optional: End date for the recurring transfer
                status VARCHAR(20) CHECK (status IN ('active', 'paused', 'canceled')) DEFAULT 'active', -- Status of the recurring transfer
                FOREIGN KEY (user_id) REFERENCES Users(user_id),
                FOREIGN KEY (payee_id) REFERENCES OverseasPayees(payee_id),
                FOREIGN KEY (account_id) REFERENCES Accounts(account_id)
            );
            CREATE TABLE BankLocations (
                location_id INT PRIMARY KEY IDENTITY(1,1),
                bank_name VARCHAR(100) NOT NULL,  -- Name of the bank
                address VARCHAR(255) NOT NULL,    -- Address of the bank
                operating_hours VARCHAR(255),      -- Operating hours of the bank
                latitude DECIMAL(9, 4),           -- Latitude of the bank location
                longitude DECIMAL(9, 4)           -- Longitude of the bank location
            );
            CREATE TABLE ATMLocations (
                atm_id INT PRIMARY KEY IDENTITY(1,1),
                bank_name VARCHAR(100) NOT NULL,  -- Name of the bank
                address VARCHAR(255) NOT NULL,    -- Address of the ATM location
                latitude DECIMAL(9, 4),           -- Latitude of the ATM location
                longitude DECIMAL(9, 4)           -- Longitude of the ATM location
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

        // Insert data into OverseasPayees table
        await sql.query(`
            INSERT INTO OverseasPayees (user_id, payee_name, bank_name, country, account_number, currency, is_pinned)
            VALUES 
                (1, 'John Doe', 'Bank of America', 'USA', '1234567890123456', 'USD', 1),
                (1, 'Maria Garcia', 'Banco Santander', 'Spain', '2345678901234567', 'EUR', 0),
                (2, 'Emily Davis', 'HSBC', 'UK', '3456789012345678', 'GBP', 1),
                (3, 'Carlos Oliveira', 'Itau', 'Brazil', '4567890123456789', 'BRL', 0);
        `);

        // Insert data into OverseasTransactions table
        await sql.query(`
            INSERT INTO OverseasTransactions (user_id, payee_id, amount, currency, converted_amount, transaction_datetime, transaction_fee, transaction_type, tags)
            VALUES 
                (1, 1, 200.00, 'USD', 200.00, '2025-01-18 10:00:00', 5.00, 'send', 'gift'),
                (1, 2, 150.00, 'USD', 140.00, '2025-01-18 11:00:00', 4.50, 'send', 'business'),
                (2, 3, 100.00, 'GBP', 120.00, '2025-01-18 12:00:00', 3.00, 'send', 'education'),
                (3, 4, 300.00, 'BRL', 320.00, '2025-01-18 13:00:00', 7.00, 'send', 'charity');
        `);

        // Insert data into OverseasTransactionLogs table
        await sql.query(`
            INSERT INTO OverseasTransactionLogs (transaction_id, exchange_rate, transaction_fee, log_datetime)
            VALUES 
                (1, 1.00, 5.00, '2025-01-18 10:01:00'),
                (2, 0.93, 4.50, '2025-01-18 11:01:00'),
                (3, 1.20, 3.00, '2025-01-18 12:01:00'),
                (4, 1.07, 7.00, '2025-01-18 13:01:00');
        `);

        // Insert data into RecurringTransfers table
        await sql.query(`
            -- Insert data into RecurringTransfers table
            INSERT INTO RecurringTransfers (user_id, payee_id, account_id, amount, currency, frequency, next_transfer_date, end_date, status)
            VALUES 
                (1, 1, 1, 100.00, 'USD', 'monthly', '2025-02-01', '2025-12-01', 'active'),
                (1, 2, 2, 50.00, 'EUR', 'weekly', '2025-01-25', NULL, 'active'),
                (2, 3, 3, 200.00, 'GBP', 'daily', '2025-01-23', NULL, 'paused'),
                (3, 4, 4, 300.00, 'BRL', 'yearly', '2026-01-01', '2026-12-31', 'active'),
                (1, 1, 1, 150.00, 'USD', 'monthly', '2025-03-01', NULL, 'canceled');
        `);
        
        await sql.query(`
            INSERT INTO BankLocations (bank_name, address, operating_hours, latitude, longitude)
            VALUES
                ('Jurong East Branch', '50 Jurong Gateway Road #B1-18 Jem, Singapore 608549', 'Mon-Fri: 11.00am to 6.00pm Sat: 11.00am to 4.30pm Sun: 11.00am to 4.30pm Public Holidays: Closed', 1.3331, 103.7437), 
                ('Jurong Point Branch', '1 Jurong West Central 2 #B1-31/32/33/46 Jurong Point Shopping Centre, Singapore 648886', 'Mon-Fri: 11.00am to 6.00pm Sat: 11.00am to 4.30pm Sun: 11.00am to 4.30pm Public Holidays: Closed', 1.3399, 103.7065),
                ('Clementi Branch', '3155 Commonwealth Avenue West #04-52 to 55 The Clementi Mall, Singapore 129588', 'Mon-Fri: 11.00am to 6.00pm Sat: 11.00am to 2.30pm Sun & Public Holidays: Closed', 1.3150, 103.7644),
                ('Bukit Batok Branch', '634 Bukit Batok Central #01-108, Singapore 650634', 'Mon-Fri: 9.30am to 4.30pm Sat: 9.30am to 12.00pm Sun & Public Holidays: Closed', 1.3497, 103.7514),
                ('National University of Singapore FRANK Store', '2 College Avenue West Stephen Riady Centre University Town, #01-01 National University of Singapore, Singapore 138607', 'Mon-Fri: 10.00am to 6.00pm Sat: 10.00am to 2.30pm Sun & Public Holidays: Closed', 1.3043, 103.7727);        
        `);

        await sql.query(`
            INSERT INTO ATMLocations (bank_name, address, latitude, longitude)
            VALUES
                ('Singapore Institute of Management', '461 Clementi Road SIM Headquarters Singapore 599491', 1.3298, 103.7765), 
                ('The Clementi Mall', '3155 Commonwealth Avenue West #04-52 to 55 The Clementi Mall Singapore 129588', 1.3150, 103.7644),
                ('Clementi Avenue 3 - FairPrice', '451 Clementi Avenue 3 #01-307 Singapore 120451', 1.3126, 103.7657),
                ('Clementi Avenue 5', '325 Clementi Avenue 5 #01-137 Singapore 120325', 1.3152, 103.7668),
                ('UOB ATM - UOB Clementi Branch', 'Blk 450 #01-287/289 Clementi Avenue 3 #01-287/289 Singapore 120450', 1.3136, 103.7654);
        `);
        console.log('Sample data inserted successfully.');

    } catch (err) {
        console.error('Error inserting sample data:', err.message);
    } finally {
        await sql.close();
    }
}

module.exports = seedDatabase;