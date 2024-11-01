const express = require("express");
const accountController = require("./controllers/accountController");
const acctransactionController = require("./controllers/acctransactionController");
const cardController = require("./controllers/cardController");
const userController = require("./controllers/userController");
const sql = require("mssql");
const dbConfig = require("./dbConfig");
const bodyParser = require("body-parser");
const authenticate = require("./middlewares/authenticate");
const validateUser = require("./middlewares/validateUser");
const validateAccTransaction = require("./middlewares/validateAccTransaction")

const app = express();
const port = process.env.PORT || 3000;

const staticMiddleware = express.static("public");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(staticMiddleware);

// account
app.get("/accounts", accountController.getAllAccounts);
app.get("/accounts/:id", accountController.getAccountById);

// acctransaction
app.get("/transactions", acctransactionController.getAllAccTransactions);
app.get("/transactions/:id", acctransactionController.getAccTransactionById);
app.post("/transactions", validateAccTransaction.validateCreateAccTransaction, acctransactionController.createAccTransaction);

// card
app.get("/cards", cardController.getAllCards);
app.get("/cards:id", cardController.getCardById);

// user
app.get("/users", userController.getAllUsers);
app.get("/users/:id", userController.getUserById);
app.post("/users", validateUser.validateCreateUser, userController.createUser);
app.put("/users/:id", validateUser.validateUpdateUser, userController.updateUser);
app.post("/users/login", validateUser.validateLoginUser, userController.loginUser);
app.post("/users/check", authenticate.verifyJWT, userController.checkPassword);
app.post("/token", userController.refreshAccessToken);
app.delete("/logout", userController.logout);

app.listen(port, async () => {
    try {
      // Connect to DB using mssql
      await sql.connect(dbConfig);
  
      // Seed DB with initial data
      // seedDatabase();
  
      console.log("Database connection established successfully");
    } catch (err) {
      console.error("Database connection error:", err);
      // Terminate the application with an error code (optional)
      process.exit(1); // Exit with code 1 indicating an error
    }
  
    console.log(`Server listening on port ${port}`);
});
  