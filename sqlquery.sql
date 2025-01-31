-- init database
USE master;
IF EXISTS (SELECT * FROM sys.databases WHERE name='FSDPAssignment')
DROP DATABASE FSDPAssignment;
GO

CREATE DATABASE FSDPAssignment;
GO

USE FSDPAssignment;
GO

/*
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
    DROP TABLE dbo.Users;
GO

IF OBJECT_ID('dbo.Accounts', 'U') IS NOT NULL
    DROP TABLE dbo.Accounts;
GO

IF OBJECT_ID('dbo.AccTransactions', 'U') IS NOT NULL
    DROP TABLE dbo.AccTransactions;
GO

IF OBJECT_ID('dbo.Cards', 'U') IS NOT NULL
    DROP TABLE dbo.Cards;
GO

IF OBJECT_ID('dbo.Staffs', 'U') IS NOT NULL
    DROP TABLE dbo.Staffs;
GO
*/
CREATE TABLE Passkey (
    cred_id NVARCHAR(255) PRIMARY KEY, 
    cred_public_key NVARCHAR(MAX), 
    internal_user_id INT NOT NULL, 
    webauthn_user_id NVARCHAR(255) UNIQUE, 
    counter INT NOT NULL,
    backup_eligible BIT NOT NULL, 
    backup_status BIT NOT NULL, 
    transports NVARCHAR(MAX), 
    created_at DATETIME DEFAULT GETDATE(), 
    last_used DATETIME NULL,
    FOREIGN KEY (internal_user_id) REFERENCES Users(user_id)
);



CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    points INT DEFAULT 0
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
    points_earned INT,
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

CREATE TABLE RefreshTokens (
    token_id INT PRIMARY KEY IDENTITY(1,1),
    refreshToken VARCHAR(255) NOT NULL UNIQUE
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

/*
CREATE TABLE RecurringOverseasTransactions (
    recurring_transaction_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,                     -- Foreign key linking to the Users table
    payee_id INT,                    -- Foreign key linking to the OverseasPayees table
    amount DECIMAL(10, 2) NOT NULL,   -- The amount to send in each recurring transaction
    currency VARCHAR(10) NOT NULL,    -- Currency used in the recurring transaction
    frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly')) NOT NULL, -- Frequency of the recurring payment
    start_date DATETIME NOT NULL,     -- Start date for the recurring transaction
    end_date DATETIME,                -- End date for the recurring transaction (nullable for indefinite recurrence)
    FOREIGN KEY (user_id) REFERENCES Users(user_id),  -- Links to the Users table
    FOREIGN KEY (payee_id) REFERENCES OverseasPayees(payee_id)  -- Links to the OverseasPayees table
);
*/

CREATE TABLE OverseasTransactionLogs (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    transaction_id INT,              -- Foreign key linking to the OverseasTransactions table
    exchange_rate DECIMAL(10, 6) NOT NULL,  -- Exchange rate used for the transaction
    transaction_fee DECIMAL(10, 2),  -- The fee applied during the transaction
    log_datetime DATETIME DEFAULT GETDATE(), -- The date and time when the log entry was created
    FOREIGN KEY (transaction_id) REFERENCES OverseasTransactions(transaction_id)  -- Links to the OverseasTransactions table
);

CREATE TABLE BankLocations (
    location_id INT PRIMARY KEY IDENTITY(1,1),
    bank_name VARCHAR(100) NOT NULL,  -- Name of the bank
    address VARCHAR(255) NOT NULL,    -- Address of the bank
    postal_code VARCHAR(10) NOT NULL  -- Postal code of the bank location
    operating_hours VARCHAR(255)      -- Operating hours of the bank
)

CREATE TABLE ATMLocations (
    atm_id INT PRIMARY KEY IDENTITY(1,1),
    bank_name VARCHAR(100) NOT NULL,  -- Name of the bank
    address VARCHAR(255) NOT NULL,    -- Address of the ATM location
    postal_code VARCHAR(10) NOT NULL  -- Postal code of the ATM location
)

CREATE TABLE Rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    points_required INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE User_vouchers (
    user_id INT NOT NULL,
    reward_id INT NOT NULL,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reward_id) REFERENCES rewards(id)
);

