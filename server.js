const { Server } = require("socket.io");
const io = new Server({
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const sessions = {}; // Active session users

io.on("connection", (socket) => {
    let currentSession = null;

    socket.on("joinSession", (sessionID) => {
        currentSession = sessionID;

        if (!sessions[sessionID]) {
            sessions[sessionID] = new Set();
        }

        sessions[sessionID].add(socket.id);
        updateStatus(sessionID);
    });

    socket.on("disconnect", () => {
        if (currentSession && sessions[currentSession]) {
            sessions[currentSession].delete(socket.id);
            if (sessions[currentSession].size === 0) {
                delete sessions[currentSession]; // Remove empty session
            }
            updateStatus(currentSession);
        }
    });

    function updateStatus(sessionID) {
        const userCount = sessions[sessionID] ? sessions[sessionID].size : 0;
        io.to(sessionID).emit("statusUpdate", userCount >= 2 ? "green" : "red");
    }
});

io.listen(3000);
