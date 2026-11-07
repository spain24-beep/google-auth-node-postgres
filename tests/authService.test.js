// Load environment variables before importing modules
// that initialise database configuration.
require("dotenv").config();

// Import Node's built-in test runner.
const test = require("node:test");

// Import strict assertions for checking expected behaviour.
const assert = require("node:assert/strict");

// Import the real user repository module.
// We will temporarily replace its methods with test doubles.
const usersRepository = require("../dist/repositories/usersRepository").default;

// Import the Google Sheet integration so we can replace its
// response with a controlled test entry.
const publicSheet = require("../dist/integrations/google/publicSheet").default;

// Simulate an authorised Sheet entry for the email used below.
// This allows the service to reach its email-ownership check.
publicSheet.readAuthorisedUsers = async () => [
    {
        email: "existing@example.com",
        multiplier: null
    }
];

// Import the authentication service we want to test.
const { authenticateGoogleUser } = require("../dist/services/authService").default;

// ---------------------------------------------------------
// Test: reject an email already owned by another Google account.
//
// Scenario:
// - The incoming Google identity has a new Google sub.
// - The submitted email already belongs to a different user.
// - Authentication must fail with an email ownership conflict.
// - No login timestamp should be updated.
// ---------------------------------------------------------

test("rejects an email linked to another Google account", async () => {

    // Keep the original repository methods so we can restore
    // them after the test. This prevents the mocks affecting
    // other tests or application code.
    const originalFindByGoogleSub =
        usersRepository.findByGoogleSub;

    const originalFindByEmail =
        usersRepository.findByEmail;

    const originalUpdateLastLogin =
        usersRepository.updateLastLogin;

    // Track whether the login timestamp update was attempted.
    let updateLastLoginCalled = false;

    try {

        // Simulate a Google account that does not yet exist.
        usersRepository.findByGoogleSub = async () => null;

        // Simulate the email already belonging to another user.
        // ID 2 is deliberately different from any incoming user.
        usersRepository.findByEmail = async () => ({
            id: 2,
            email: "existing@example.com",
            role: "user"
        });

        // If the service incorrectly tries to update a login,
        // record that attempt so the test can detect it.
        usersRepository.updateLastLogin = async () => {
            updateLastLoginCalled = true;
        };

        // Attempt authentication with a different Google identity
        // using an email already owned by another database user.
        await assert.rejects(
            authenticateGoogleUser({
                googleSub: "different-google-account",
                email: "existing@example.com"
            }),
            {
                message: "Email address is linked to another account"
            }
        );

        // Confirm that the service did not update a login timestamp.
        assert.equal(updateLastLoginCalled, false);

    } finally {

        // Always restore the real repository methods, even if
        // an assertion fails. This keeps the test isolated.
        usersRepository.findByGoogleSub =
            originalFindByGoogleSub;

        usersRepository.findByEmail =
            originalFindByEmail;

        usersRepository.updateLastLogin =
            originalUpdateLastLogin;
    }
});
