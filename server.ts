import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";

const db = new Database("twin-tracker.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT,
    color TEXT
  );
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    twinId TEXT,
    timestamp INTEGER,
    type TEXT,
    amount INTEGER,
    menu TEXT,
    status TEXT,
    medicineName TEXT,
    note TEXT
  );
`);

// Seed profiles if empty
const profileCount = db.prepare("SELECT COUNT(*) as count FROM profiles").get() as { count: number };
if (profileCount.count === 0) {
  const insertProfile = db.prepare("INSERT INTO profiles (id, name, color) VALUES (?, ?, ?)");
  insertProfile.run("twin1", "시원이", "bg-blue-100 text-blue-800 border-blue-200");
  insertProfile.run("twin2", "서원이", "bg-pink-100 text-pink-800 border-pink-200");
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });
  const PORT = 3000;

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  io.on("connection", (socket) => {
    // Send initial data
    const profiles = db.prepare("SELECT * FROM profiles").all();
    const events = db.prepare("SELECT * FROM events ORDER BY timestamp DESC").all();
    socket.emit("init", { profiles, events });

    socket.on("add_event", (event) => {
      const stmt = db.prepare(
        "INSERT INTO events (id, twinId, timestamp, type, amount, menu, status, medicineName, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run(
        event.id,
        event.twinId,
        event.timestamp,
        event.type,
        event.amount || null,
        event.menu || null,
        event.status || null,
        event.medicineName || null,
        event.note || null
      );
      // Broadcast to all clients EXCEPT the sender
      socket.broadcast.emit("event_added", event);
    });

    socket.on("delete_event", (id) => {
      db.prepare("DELETE FROM events WHERE id = ?").run(id);
      socket.broadcast.emit("event_deleted", id);
    });

    socket.on("update_profile", ({ id, name }) => {
      db.prepare("UPDATE profiles SET name = ? WHERE id = ?").run(name, id);
      socket.broadcast.emit("profile_updated", { id, name });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
