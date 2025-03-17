const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const sessions = {}; // Store connected peers per session

io.on("connection", (socket) => {
    let currentSession = null;

    socket.on("joinSession", (sessionID) => {
        socket.join(sessionID);
        currentSession = sessionID;

        if (!sessions[sessionID]) {
            sessions[sessionID] = new Set();
        }
        sessions[sessionID].add(socket.id);

        updateStatus(sessionID);
    });

    socket.on("rtcSignal", (data) => {
        socket.to(data.sessionID).emit("rtcSignal", data);
    });

    socket.on("disconnect", () => {
        if (currentSession && sessions[currentSession]) {
            sessions[currentSession].delete(socket.id);
            if (sessions[currentSession].size === 0) {
                delete sessions[currentSession];
            }
            updateStatus(currentSession);
        }
    });

    function updateStatus(sessionID) {
        const userCount = sessions[sessionID] ? sessions[sessionID].size : 0;
        io.to(sessionID).emit("statusUpdate", userCount >= 2 ? "green" : "red");
    }
});

app.get("/", (req, res) => {
    res.send("WebRTC Session Tracking is Running!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
