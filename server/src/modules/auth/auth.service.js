const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../../lib/prisma");
const { env } = require("../../config/env");

// Ký cặp access/refresh token dựa trên thông tin user hiện tại.
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

// Chuẩn hóa user object trả ra ngoài để tránh lộ dữ liệu nhạy cảm.
function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

// Đăng ký user mới và trả token ngay sau khi tạo.
async function register({ email, password, role, displayName }) {
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
      displayName: displayName?.trim() || null,
    },
  });

  const safeUser = toSafeUser(user);
  const tokens = signTokens(safeUser);

  return { user: safeUser, ...tokens };
}

// Đăng nhập bằng email/password và trả access/refresh token.
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

  const safeUser = toSafeUser(user);
  const tokens = signTokens(safeUser);
  return { user: safeUser, ...tokens };
}

// Cấp mới token từ refresh token hợp lệ.
async function refreshToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtRefreshSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const safeUser = toSafeUser(user);
    const tokens = signTokens(safeUser);
    return { user: safeUser, ...tokens };
  } catch (error) {
    const authError = new Error("Invalid refresh token");
    authError.statusCode = 401;
    throw authError;
  }
}

// Lấy profile hiện tại từ DB để FE bootstrap chính xác sau reload.
async function getMyProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return toSafeUser(user);
}

// Cập nhật profile cơ bản của user đăng nhập.
async function updateMyProfile(userId, payload = {}) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: payload.displayName?.trim() || null,
      phone: payload.phone?.trim() || null,
      avatarUrl: payload.avatarUrl?.trim() || null,
    },
  });
  return toSafeUser(updated);
}

module.exports = {
  register,
  login,
  refreshToken,
  getMyProfile,
  updateMyProfile,
};
