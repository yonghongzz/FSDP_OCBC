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
const http = require('http');
const { Server } = require('socket.io');
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get('/', (req, res) => {
    res.send('Node-WebRTC Server is running');
});

// account
app.get("/accounts", accountController.getAllAccounts);
app.get("/accounts/:id", accountController.getAccountById);
app.put("/accounts/:id", accountController.updateTransactionLimit);

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

let peers = {};

//extension
io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    const peer = new RTCPeerConnection();
    peers[socket.id] = peer;

    peer.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('candidate', socket.id, event.candidate);
      }
    };

    socket.on('offer', async (id, description) => {
      await peer.setRemoteDescription(new RTCSessionDescription(description));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('answer', id, peer.localDescription);
    });

    socket.on('answer', async (id, description) => {
      await peer.setRemoteDescription(new RTCSessionDescription(description));
    });

    socket.on('candidate', async (id, candidate) => {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('disconnect', () => {
      delete peers[socket.id];
      console.log('A user disconnected:', socket.id);
    });
});

server.listen(port, async () => {
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