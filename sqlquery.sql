-- init database
USE master;
IF EXISTS (SELECT * FROM sys.databases WHERE name='FSDPAssignment')
DROP DATABASE FSDPAssignment;
GO

CREATE DATABASE FSDPAssignment;
GO

USE FSDPAssignment;
GO


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

CREATE TABLE RefreshTokens (
    token_id INT PRIMARY KEY IDENTITY(1,1),
    refreshToken VARCHAR(255) NOT NULL UNIQUE
);
