const express = require("express");
const path = require("path");
const accountController = require("./controllers/accountController");
const acctransactionController = require("./controllers/acctransactionController");
const cardController = require("./controllers/cardController");
const userController = require("./controllers/userController");
const staffController = require("./controllers/staffController");
const sql = require("mssql");
const dbConfig = require("./dbConfig");
const bodyParser = require("body-parser");
const authenticate = require("./middlewares/authenticate");
const validateUser = require("./middlewares/validateUser");
const validateStaff = require("./middlewares/validateStaff");
const validateAccTransaction = require("./middlewares/validateAccTransaction");
const seedDatabase = require("./seed");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");


const app = express();
const port = process.env.PORT || 3000;

// Read the certificate and key files
const privateKey = fs.readFileSync("key.pem");
const certificate = fs.readFileSync("cert.pem");
const credentials = { key: privateKey, cert: certificate };

// Create an HTTPS server
const server = https.createServer(credentials, app);
const io = new Server(server, {
    cors: {
        origin: "*",  // Allow all origins for testing; restrict this in production
        methods: ["GET", "POST"]
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.use(express.static(path.join(__dirname, "public")));



// account
app.get("/accounts", accountController.getAllAccounts);
app.get("/accounts/:id", accountController.getAccountById);
app.put("/accounts/:id", accountController.updateTransactionLimit);
app.put("/accounts/balance/:id", accountController.updateBalance);

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

// staff
app.get("/staffs", staffController.getAllStaffs);
app.get("/staffs/:id", staffController.getStaffById);
app.post("/staffs/login", validateStaff.validateLoginStaff, staffController.loginStaff);
app.post("/staffs/check", authenticate.verifyJWT, staffController.checkPassword);
app.post("/token", staffController.refreshAccessToken);
app.delete("/logout", staffController.logout);

let callQueue = {};

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User initiates a call
    socket.on("initiate-call", (data) => {
        socket.join(data.callId);
        callQueue[data.callId] = socket.id;
        io.emit("new-call", data);
    });

    // Staff accepts call
    socket.on("accept-call", (data) => {
        const userSocketId = callQueue[data.callId];
        if (userSocketId) {
            socket.join(data.callId);
            io.to(userSocketId).emit("call-accepted", data.callId);
            delete callQueue[data.callId];
        }
    });

    // Handle WebRTC signaling messages
    socket.on("offer", ({ callId, offer }) => {
        socket.to(callId).emit("offer", { callId, offer });
    });

    socket.on("answer", ({ callId, answer }) => {
        socket.to(callId).emit("answer", { answer });
    });

    socket.on("ice-candidate", ({ callId, candidate }) => {
        socket.to(callId).emit("ice-candidate", { candidate });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
    
    socket.on('reject-call', (data) => {
        io.to(data.callId).emit('call-rejected');
    });

    socket.on('staff-end-call', () => {
        socket.broadcast.emit('call-ended-by-staff');
    });

    socket.on('share-screen', ({ callId }) => {
        io.to(callId).emit('share-screen', { callId });
    }); 

    // Handle user stopping screen share
    socket.on('stop-share-screen', ({ callId }) => {
        io.to(callId).emit('stop-share-screen', { callId });
    });
    
});

server.listen(port, '0.0.0.0', async () => {
    try {
      // Connect to DB using mssql
      await sql.connect(dbConfig);
  
      // Seed DB with initial data
      seedDatabase();
  
      console.log("Database connection established successfully");
    } catch (err) {
      console.error("Database connection error:", err);
      // Terminate the application with an error code (optional)
      process.exit(1); // Exit with code 1 indicating an error
    }
  
    console.log(`Server listening on port ${port}`);
});

// Gracefully handle shutdown by closing DB connection pool on SIGINT signal
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  // Perform cleanup tasks (e.g., close database connections)
  await sql.close();
  console.log("Database connection closed");
  process.exit(0); // Exit with code 0 indicating successful shutdown
});


