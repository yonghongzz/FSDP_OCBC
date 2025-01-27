const express = require("express");
const path = require("path");

const accountController = require("./controllers/accountController");
const acctransactionController = require("./controllers/acctransactionController");
const cardController = require("./controllers/cardController");
const userController = require("./controllers/userController");
const staffController = require("./controllers/staffController");
const overseaspayeeController = require("./controllers/overseaspayeeController");
const overseastransactionController = require("./controllers/overseastransactionController");
const overseastransactionlogController = require("./controllers/overseastransactionlogController");
const recurringTransferController = require("./controllers/recurringtransferController");

const sql = require("mssql");
const dbConfig = require("./dbConfig");
const bodyParser = require("body-parser");

const authenticate = require("./middlewares/authenticate");
const validateUser = require("./middlewares/validateUser");
const validateStaff = require("./middlewares/validateStaff");
const validateAccTransaction = require("./middlewares/validateAccTransaction");
const biometricController = require("./controllers/biometricController");
const validateOverseasPayee = require("./middlewares/validateOverseasPayee");
const validateOverseasTransaction = require("./middlewares/validateOverseasTransaction");
const validateOverseasTransactionLog = require("./middlewares/validateOverseasTransactionLog");
const validateRecurringTransfer = require("./middlewares/validateRecurringTransfer");

const seedDatabase = require("./seed");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const {Buffer} = require("buffer");
const {Base64} = require("js-base64");
const nodemailer = require("nodemailer");
require('dotenv').config();
const cors = require('cors');

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

app.use(cors());
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

// overseas payee
app.get("/overseas-payees/:userId", overseaspayeeController.getAllOverseasPayees);
app.get("/overseas-payees/details/:id", overseaspayeeController.getOverseasPayeeById);
app.post("/overseas-payees", validateOverseasPayee.validateCreateOverseasPayee, overseaspayeeController.createOverseasPayee);
app.put("/overseas-payees/:id", validateOverseasPayee.validateUpdateOverseasPayee, overseaspayeeController.updateOverseasPayee);
app.patch("/overseas-payees/:id/pin", overseaspayeeController.toggleOverseasPayeePin);

// overseas transaction
app.get("/overseas-transactions/:userId", overseastransactionController.getAllOverseasTransactions);
app.get("/overseas-transactions/id/:id", overseastransactionController.getOverseasTransactionById);
app.post("/overseas-transactions", validateOverseasTransaction.validateCreateOverseasTransaction, overseastransactionController.createOverseasTransaction);

// overseas transaction logs
app.get("/overseas-transaction-logs/:transactionId", overseastransactionlogController.getAllOverseasTransactionLogs);
app.get("/overseas-transaction-logs/id/:id", overseastransactionlogController.getOverseasTransactionLogById);
app.post("/overseas-transaction-logs", validateOverseasTransactionLog.validateCreateOverseasTransactionLog, overseastransactionlogController.createOverseasTransactionLog);

// Recurring Transfer
app.get("/recurring-transfers/user/:userId", recurringTransferController.getAllRecurringTransfers);
app.get("/recurring-transfers/:id", recurringTransferController.getRecurringTransferById);
app.post("/recurring-transfers", validateRecurringTransfer.validateCreateRecurringTransfer, recurringTransferController.createRecurringTransfer);
app.put("/recurring-transfers/:id", validateRecurringTransfer.validateUpdateRecurringTransfer, recurringTransferController.updateRecurringTransfer);
app.delete("/recurring-transfers/:id", recurringTransferController.deleteRecurringTransfer);

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

// Knowledge base endpoint
app.get('/api/knowledge', (req, res) => {
    try {
        // Use readFileSync for synchronous reading
        const knowledgeBase = fs.readFileSync(
            path.join(__dirname, 'data', 'knowledge.txt'),
            { encoding: 'utf8' }  // Proper way to specify encoding
        );
        res.json({ knowledge: knowledgeBase });
    } catch (error) {
        console.error('Error reading knowledge base:', error);
        res.status(500).json({ 
            error: 'Failed to load knowledge base',
            details: error.message 
        });
    }
});

// Chat endpoint
app.post('/api/chat', (req, res) => {
    try {
        const { message } = req.body;
        const knowledgeBase = fs.readFileSync(
            path.join(__dirname, 'data', 'knowledge.txt'),
            { encoding: 'utf8' }
        );
        
        // Simple response logic (you can enhance this)
        const response = findResponse(message, knowledgeBase);
        
        res.json({ response });
    } catch (error) {
        console.error('Error processing chat:', error);
        res.status(500).json({ 
            error: 'Failed to process message',
            details: error.message 
        });
    }
});

function findResponse(message, knowledgeBase) {
    if (!message || !knowledgeBase) {
        return "I'm sorry, I couldn't process your request.";
    }
    try {
        // Split the knowledge base into QA pairs
        const pairs = knowledgeBase.split('\n').filter(line => line.trim());
        let bestMatch = {
            answer: "I'm sorry, I don't have an answer for that question.",
            score: 0
        };
        // Process each pair of lines (question and answer)
        for (let i = 0; i < pairs.length - 1; i += 2) {
            const question = pairs[i].toLowerCase();
            const answer = pairs[i + 1];
            // Skip if we don't have a complete QA pair
            if (!answer) continue;
            // Calculate match score
            let score = 0;
            const messageWords = message.toLowerCase().split(/\W+/).filter(word => word.length > 2);
            const questionWords = question.split(/\W+/).filter(word => word.length > 2);
            // Check for word matches
            messageWords.forEach(word => {
                if (questionWords.includes(word)) {
                    score += 1;
                }
            });
            // Boost score for exact matches
            if (question.includes(message.toLowerCase())) {
                score += 5;
            }
            // Update best match if we found a better score
            if (score > bestMatch.score) {
                bestMatch = {
                    answer: answer,
                    score: score
                };
            }
        }
        return bestMatch.score > 0 ? bestMatch.answer : "I'm sorry, I don't have enough information to answer that question.";
    } catch (error) {
        console.error('Error in findResponse:', error);
        return "I'm sorry, I encountered an error processing your question.";
    }
}

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
    console.log(passkey);
    console.log(asseResp);

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

app.post('/send-email',async(req,res)=>{
    const {user,amount} = req.body;
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',  // Specify host instead of 'service'
        port: 587,               // Port for TLS
        secure: false,           // Set to true for SSL
        auth: {
            user: process.env.SERVER_EMAIL,
            pass: process.env.SERVER_PASSWORD
        },
        connectionTimeout: 10000, // 10 seconds timeout for connection
        socketTimeout: 10000, // 10 seconds timeout for socket activity
    });
    const mailOptions = {
        from:process.env.SERVER_EMAIL,
        to:user.email,
        subject: "Your Transaction Was Successfully Processed",
        text: `
            Dear ${user.username},

            This is a confirmation that your recent transaction of $${amount} has been successfully processed.

            ---

            If you did not authorize this transaction or if you notice any discrepancies, please contact us immediately. Our team is available to assist you 24/7.

            ---

            **Important Security Reminder:**
            To ensure the safety of your account, please review your recent transactions and verify that everything is in order. If you believe your account has been compromised, please follow the steps in our [Fraud Protection Center] or contact us directly.

            Thank you for choosing OCBC. We value your trust and are here to support you.

            Best regards,  
            OCBC  
            `,
    };
    console.log("OK");
    transporter.sendMail(mailOptions, function(error,info){
        if(error){
            console.log(error);
        }else{
            console.log('Email sent: '+info.response);
        }
    });
})


