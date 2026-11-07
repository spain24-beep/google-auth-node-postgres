/*
 * REQUIRE AUTHENTICATION MIDDLEWARE
 *
 * Purpose:
 * Protect routes so only authenticated users can access them.
 *
 * How it works:
 * 1. Check whether the session contains a user ID.
 * 2. Retrieve that user from PostgreSQL.
 * 3. Attach the current user record to req.user.
 * 4. Allow the request to continue.
 *
 * Important security decision:
 * We retrieve the user and their role from PostgreSQL rather
 * than trusting information stored in the browser or relying
 * on a role saved in the session.
 */

import type { RequestHandler } from "express";
import usersRepository from "../repositories/usersRepository";


// Define the middleware using Express's RequestHandler type.
// The shared Express declarations provide req.user and req.session.userId.
const requireAuth: RequestHandler = async (req, res, next) => {
    try {

        // Check whether the session contains a user ID.
        // If it doesn't, the visitor has not authenticated.
        if (!req.session.userId) {
            res.status(401).json({
                error: "Not authenticated"
            });
            return;
        }

        // Retrieve the latest user record from PostgreSQL.
        // This also ensures that the account still exists.
        const user = await usersRepository.findById(
            req.session.userId
        );

        // If the user no longer exists, the session is invalid.
        if (!user) {

            // Destroy the invalid server-side session.
            req.session.destroy((error) => {

                if (error) {
                    console.error(
                        "Invalid session cleanup failed:",
                        error.message
                    );

                    res.status(500).json({
                        error: "Could not verify authentication"
                    });
                    return;
                }

                // Clear the corresponding browser cookie.
                res.clearCookie("google_auth_starter.sid", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    path: "/"
                });

                res.status(401).json({
                    error: "Not authenticated"
                });
            });

            return;
        }

        // Attach the current database record to the request.
        // Subsequent middleware and route handlers can now use
        // req.user.id, req.user.email and req.user.role.
        req.user = user;

        // Authentication succeeded.
        // Continue to the next middleware or route handler.
        next();

    } catch (error: unknown) {

        // Log only safe diagnostic information.
        // Do not expose database details to the browser.
        const databaseError = error instanceof Error
            ? error as Error & { code?: string }
            : null;

        console.error(
            "Authentication middleware failed:",
            {
                name: error instanceof Error ? error.name : "UnknownError",
                code: databaseError?.code || "NO_ERROR_CODE"
            }
        );

        res.status(500).json({
            error: "Could not verify authentication"
        });
    }
};


// Export the middleware for use by protected routes.
export default requireAuth;
