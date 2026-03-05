const authService = require("./auth.service");

const allowedRoles = new Set(["patient", "doctor", "admin"]);

async function register(req, res, next) {
  try {
    const { email, password, role = "patient" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const result = await authService.register({ email, password, role });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await authService.login({ email, password });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.body.refreshToken;
    if (!token) {
      return res.status(400).json({ message: "refreshToken is required" });
    }

    const result = await authService.refreshToken(token);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, refreshToken };
