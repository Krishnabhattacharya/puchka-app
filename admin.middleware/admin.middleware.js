const jwt = require("jsonwebtoken");
const JWT_SECRET = "golgappa_admin";

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    req.adminId = decoded.id;
    next();

  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
