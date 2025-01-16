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
const biometricController = require("./controllers/biometricController");
const seedDatabase = require("./seed");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const {Buffer} = require("buffer");
const {Base64} = require("js-base64");

const {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,
    verifyAuthenticationResponse,} = require("@simplewebauthn/server");
const cookieParser = require("cookie-parser")

const app = express();
const port = process.env.PORT || 3000;
const RPID = "localhost";
const origin = "https://localhost:3000";


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
app.use(cookieParser());



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
app.get("/userId/:username",userController.getUserId);
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

app.post("/save-passkey",biometricController.createPasskey);
app.get("/get-passkey",biometricController.getPasskey);
app.put("/update-counter",biometricController.updateCounter);

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
      //seedDatabase();
  
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

app.get('/generate-auth',async(req,res)=>{
    const email = req.query.email;
    if(!email){
        return res.status(400).json({error:"Email is required"});
    }
    const options = await generateRegistrationOptions({
        rpID: RPID,
        rpName: "FSDP",
        userName: email,
    });
    res.cookie(
        "regInfo",
        JSON.stringify({
            userId: options.user.id,
            email,
            challenge: options.challenge,
        }),
        {httpOnly:true,maxAge:60000,secure:true}
    );
    res.json(options);
});

app.post('/verify-auth',async(req,res)=>{
    let verification;
    const regInfo = JSON.parse(req.cookies.regInfo);
    verification = await verifyRegistrationResponse({
        response: req.body,
        expectedChallenge: regInfo.challenge,
        expectedOrigin: origin,
        expectedRPID: RPID,
    });
    res.json(verification);
});

app.post('/generate-authentication-options',async(req,res)=>{
    const passkey = req.body;
    const options = await generateAuthenticationOptions({
        rpID: RPID,
        allowCredentials: [
            {
                id: passkey.cred_id,
                transports: passkey.transports,
            }
        ]
    });
    res.cookie(
        "authInfo",
        JSON.stringify({
            challenge: options.challenge,
        }),
        {httpOnly:true,maxAge:60000,secure:true}
    );
    const transports = options.allowCredentials[0].transports;
    options.allowCredentials[0].transports = JSON.parse(transports);
    res.json(options);
});

app.post('/verify-authentication',async(req,res)=>{
    const authInfo = JSON.parse(req.cookies.authInfo);
    const { asseResp, passkey } = req.body;

    if(!passkey){
        throw new Error(`Could not find passkey for user`);
    }
    let verification;
    try{
        verification = await verifyAuthenticationResponse({
            response: asseResp,
            expectedChallenge: authInfo.challenge,
            expectedOrigin: origin,
            expectedRPID: RPID,
            credential: {
                id: passkey.cred_id,
                publicKey: new Uint8Array(Buffer.from(passkey.cred_public_key, 'base64')),
                counter: passkey.counter,
                transports: passkey.transports,
            },
        });
        res.json(verification);
    }catch(error){
        console.error(error);
        return res.status(400).send({error:error.message});
    }
});



