-- init database
USE master;
IF EXISTS (SELECT * FROM sys.databases WHERE name='FSDPAssignment')
DROP DATABASE FSDPAssignment;
GO

CREATE DATABASE FSDPAssignment;
GO

USE FSDPAssignment;
GO


IF OBJECT_ID('dbo.User', 'U') IS NOT NULL
    DROP TABLE dbo.[User];
GO

IF OBJECT_ID('dbo.Account', 'U') IS NOT NULL
    DROP TABLE dbo.Account;
GO

IF OBJECT_ID('dbo.AccTransaction', 'U') IS NOT NULL
    DROP TABLE dbo.AccTransaction;
GO

IF OBJECT_ID('dbo.Card', 'U') IS NOT NULL
    DROP TABLE dbo.Card;
GO

IF OBJECT_ID('dbo.Staff', 'U') IS NOT NULL
    DROP TABLE dbo.Staff;
GO


CREATE TABLE [User] (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20)
);

CREATE TABLE Account (
    account_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    transaction_limit DECIMAL(10, 2) DEFAULT 1000.00,
    FOREIGN KEY (user_id) REFERENCES [User](user_id)
);

CREATE TABLE AccTransaction (
    transaction_id INT PRIMARY KEY IDENTITY(1,1),
    account_id INT,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'payment', 'refund')) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_datetime DATETIME DEFAULT GETDATE(),
    name VARCHAR(100),
    FOREIGN KEY (account_id) REFERENCES Account(account_id)
);

CREATE TABLE Card (
    card_id INT PRIMARY KEY IDENTITY(1,1),
    account_id INT,
    card_number VARCHAR(16) NOT NULL,
    expiration_date DATE NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    card_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (account_id) REFERENCES Account(account_id)
);

CREATE TABLE Staff (
    staff_id INT PRIMARY KEY IDENTITY(1,1),
    username VARCHAR(50) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE RefreshTokens (
    token_id INT PRIMARY KEY IDENTITY(1,1),
    refreshToken VARCHAR(255) NOT NULL UNIQUE
);
