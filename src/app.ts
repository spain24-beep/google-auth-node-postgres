/*
 * Express application setup.
 *
 * This file creates and configures the application but does not start
 * the HTTP server. Keeping those responsibilities separate allows the
 * application to be imported by automated tests and by server.ts.
 */

// Node's path module helps us build reliable file paths
// regardless of the operating system.
import path from "node:path";

// Import Express and the Express application type.
import express, { type Request, type Response } from "express";

// Import the PostgreSQL-backed session middleware.
// This allows the application to recognise logged-in users
// across multiple HTTP requests.
import sessionMiddleware from "./config/session";

// Import the middleware that checks the origin of
// state-changing requests to protect against CSRF.
import requireSameOrigin from "./middleware/requireSameOrigin";

// Import the Google authentication routes.
import authRoutes from "./routes/auth";

// Create the Express application instance.
const app = express();

// Tell Express that it runs behind one trusted proxy in production.
// Cloud Run terminates HTTPS before forwarding requests to our app.
// This allows Express to recognise secure requests correctly.
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// Parse incoming JSON request bodies.
// This allows API endpoints to read data sent by the browser.
app.use(express.json());

// Attach session handling before routes.
// This ensures authentication routes can create sessions
// and subsequent routes can read them.
app.use(sessionMiddleware);

// Attach the same-origin security middleware to all state-changing requests.
app.use(requireSameOrigin);

// Serve the files in the public folder directly to the browser.
app.use(express.static(path.join(__dirname, "../public")));

// Mount authentication endpoints under /api/auth.
app.use("/api/auth", authRoutes);

// Basic health-check endpoint.
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "ok",
        message: "Google Auth Starter API is running"
    });
});

// Export the application so the server and automated tests can use it.
export default app;
