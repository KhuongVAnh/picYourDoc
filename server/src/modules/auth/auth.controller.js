const authService = require("./auth.service");

const allowedRoles = new Set(["patient", "doctor", "admin"]);

// Xử lý API đăng ký tài khoản mới.
async function register(req, res, next) {
  try {
    const { email, password, role = "patient", displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const result = await authService.register({ email, password, role, displayName });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API đăng nhập bằng email/password.
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

// Xử lý API cấp mới token từ refresh token.
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

// Xử lý API lấy profile hiện tại để FE bootstrap session.
async function getMe(req, res, next) {
  try {
    const user = await authService.getMyProfile(req.user.userId);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

// Xử lý API cập nhật thông tin profile cơ bản.
async function updateMeProfile(req, res, next) {
  try {
    const user = await authService.updateMyProfile(req.user.userId, req.body);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  updateMeProfile,
};
