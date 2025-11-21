const express = require("express");
const routes = express.Router();

// Import route modules
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartSchema");
const orderRoutes = require("./routes/orderSchema");
const wishlistRoutes = require("./routes/wishlistRoutes");
const adminRoutes = require("./routes/admin.route");
const couponRoutes = require("./routes/couponRoutes");

// API version info
routes.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Golgappa API v2.0",
    endpoints: {
      users: "/api/user",
      products: "/api/product",
      cart: "/api/cart",
      orders: "/api/order",
      wishlist: "/api/wishlist",
      admin: "/api/admin",
      coupons: "/api/coupon"
    },
    documentation: "See README.md for API documentation"
  });
});

// Mount routes
routes.use("/user", userRoutes);
routes.use("/product", productRoutes);
routes.use("/cart", cartRoutes);
routes.use("/order", orderRoutes);
routes.use("/wishlist", wishlistRoutes);
routes.use("/admin", adminRoutes);
routes.use("/coupon", couponRoutes);

module.exports = routes;