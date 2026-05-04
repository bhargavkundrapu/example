// apps/api/src/middlewares/errorHandler.js
function notFound(req, res) {
  if (res.headersSent) return;
  res.status(404).json({
    ok: false,
    error: "Route not found",
    requestId: req.id,
  });
}

// IMPORTANT: 4 params must be there, else Express won't treat as error middleware
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || undefined;

  // Special handling for database connection errors
  if (err.message && err.message.includes("getaddrinfo ENOTFOUND")) {
    message = "Database connection error. Please check your DATABASE_URL in apps/api/.env file.";
    details = {
      originalError: err.message,
      hint: "The DATABASE_URL appears to have a placeholder or invalid hostname. Please update it with a valid PostgreSQL connection string.",
      example: "postgresql://username:password@localhost:5432/database_name"
    };
  } else if (err.message && err.message.includes("connect ECONNREFUSED")) {
    message = "Database connection refused. Please ensure your PostgreSQL database is running.";
    details = {
      originalError: err.message,
      hint: "Check if PostgreSQL is running and the DATABASE_URL in apps/api/.env is correct."
    };
  } else if (err.message && err.message.includes("Missing required env: DATABASE_URL")) {
    message = "Database configuration missing. Please create apps/api/.env file with DATABASE_URL.";
    details = {
      originalError: err.message,
      hint: "Create apps/api/.env file and add: DATABASE_URL=postgresql://username:password@localhost:5432/database_name"
    };
  } else if (err.code === "42703" || (err.message && (err.message.includes("column") && err.message.includes("does not exist")))) {
    message = "Database schema is outdated. Run migrations: cd apps/api && npm run migrate";
    details = {
      originalError: err.message,
      hint: "In the project root, run: npm run migrate (from apps/api) or node scripts/migrate.js from apps/api."
    };
  } else if (err.message && err.message.includes("relation") && err.message.includes("does not exist")) {
    message = "Database schema may be outdated. Run: cd apps/api && npm run migrate";
    details = { originalError: err.message };
  } else if (err.code === "23505" || (err.message && err.message.includes("unique constraint"))) {
    const msg = err.message || "";
    if (err.constraint === "users_phone_key" || msg.includes("users_phone_key")) {
      status = 409;
      message = "Phone number already in use";
    } else if (err.constraint === "users_email_key" || msg.includes("users_email_key")) {
      status = 409;
      message = "Email already in use";
    } else {
      message = "A record with this value already exists";
    }
  }

  // Server-side log (Render logs lo visible)
  console.error("ERROR", {
    requestId: req.id,
    status,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  if (!res.headersSent) {
    res.status(status).json({
      ok: false,
      error: message,
      details: details,
      requestId: req.id,
    });
  }
}

module.exports = { notFound, errorHandler };
