const express = require("express");
const routes = express.Router();

const User = require("./routes/userRoutes");
const Product = require("./routes/productRoutes");
const Cart = require("./routes/cartSchema");
const Order = require("./routes/orderSchema");
const Wishlist = require("./routes/wishlistRoutes");
const refRoute = require("./routes/refCodeRoutes");
const affiliateRoute = require("./routes/affiliateRoutes");
const coupon = require("./routes/couponRoutes");

routes.use("/user", User); // Starting endpoint-> /api/user
routes.use("/product", Product);
routes.use("/cart", Cart);
routes.use("/order", Order);
routes.use("/wishlist", Wishlist);
routes.use("/refCode", refRoute);
routes.use("/affiliate", affiliateRoute);
routes.use("/coupon", coupon);

module.exports = routes;
