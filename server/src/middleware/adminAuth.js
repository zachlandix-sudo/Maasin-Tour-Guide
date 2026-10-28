import crypto from "node:crypto";

// A login pass lasts 8 hours, then the admin must log in again.
const TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000;

// After 10 wrong tries, logins are blocked for 15 minutes.
const MAX_FAILED_ATTEMPTS = 10;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map();

// Compares two texts safely (hides how close a wrong guess was).
function safeEqual(a, b) {
  const hashA = crypto.createHash("sha256").update(String(a)).digest();
  const hashB = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function sign(text) {
  return crypto
    .createHmac("sha256", process.env.ADMIN_TOKEN_SECRET)
    .update(text)
    .digest("base64url");
}

function createAdminToken() {
  const expires = String(Date.now() + TOKEN_LIFETIME_MS);
  return `${expires}.${sign(expires)}`;
}

function isValidToken(token) {
  if (!token || !process.env.ADMIN_TOKEN_SECRET) return false;

  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires))) return false;

  return Number(expires) > Date.now();
}

// POST /api/admin/login
export function adminLogin(req, res) {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass || !process.env.ADMIN_TOKEN_SECRET) {
    return res.status(503).json({
      message: "Admin login is not set up on the server yet.",
    });
  }

  const now = Date.now();
  const record = failedAttempts.get(req.ip);

  if (record && record.resetAt > now && record.count >= MAX_FAILED_ATTEMPTS) {
    return res.status(429).json({
      message: "Too many failed tries. Please wait 15 minutes.",
    });
  }

  const { username, password } = req.body || {};
  const userOk = safeEqual(username ?? "", adminUser);
  const passOk = safeEqual(password ?? "", adminPass);

  if (!userOk || !passOk) {
    const current = record && record.resetAt > now ? record : null;
    failedAttempts.set(req.ip, {
      count: (current ? current.count : 0) + 1,
      resetAt: current ? current.resetAt : now + LOCK_WINDOW_MS,
    });
    return res.status(401).json({ message: "Wrong username or password." });
  }

  failedAttempts.delete(req.ip);
  return res.status(200).json({ token: createAdminToken() });
}

// Put this in front of any route that only the admin may use.
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!isValidToken(token)) {
    return res.status(401).json({ message: "Admin login required." });
  }

  next();
}