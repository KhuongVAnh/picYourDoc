const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../../lib/prisma");
const { env } = require("../../config/env");

function signTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );

  return { accessToken, refreshToken };
}

async function register({ email, password, role }) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const tokens = signTokens(user);

  return { user, ...tokens };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  const tokens = signTokens(safeUser);
  return { user: safeUser, ...tokens };
}

async function refreshToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtRefreshSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const tokens = signTokens(user);
    return { user, ...tokens };
  } catch (error) {
    const authError = new Error("Invalid refresh token");
    authError.statusCode = 401;
    throw authError;
  }
}

module.exports = { register, login, refreshToken };
