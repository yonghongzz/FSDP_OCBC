// Import/load environment variables from .env file into process.env
require('dotenv').config();

// DB config object
const dbConfig = {
    // DB credentials from environment variables
    user: process.env.DB_USER,            // DB username
    password: process.env.DB_PASSWORD,    // DB password
    server: process.env.DB_SERVER,        // DB server hostname/IP address
    database: process.env.DB_DATABASE,    // DB name
    trustServerCertificate: true,         // Accept self-signed certificates (if applicable)
    options: {
        port: 1433,                       // Port number for SQL server (default port 1433)
        connectionTimeout: 60000,         // Connection timeout in milliseconds (60 seconds)
    },
};

// Export DB config object for external use
module.exports = dbConfig;