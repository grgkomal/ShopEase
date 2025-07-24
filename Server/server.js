const express = require("express");
const app = express();
const userRouter = require("./routes/users");
const categoryRouter = require("./routes/category");
const productRouter = require("./routes/product");
const addressesRouter = require("./routes/addresses");
const cartRouter = require("./routes/cart");
const ordersRouter = require("./routes/orders");
const orderSummaryRouter = require("./routes/order_summary");
const adminRouter = require("./routes/admin");
const notificationsRouter = require("./routes/notifications");

const { jwtAuth } = require("./utils/jwtauth");

const cors = require('cors');
app.use(cors());
  
app.use(express.json());
app.use(jwtAuth);
app.use("/users", userRouter);
app.use("/category", categoryRouter);
app.use("/product", productRouter);
app.use("/addresses", addressesRouter);
app.use("/cart", cartRouter);
app.use("/orders", ordersRouter);
app.use("/order_summary", orderSummaryRouter);
app.use("/admin", adminRouter);
app.use("/notifications", notificationsRouter);


const port = 3000;
app.listen(port, "0.0.0.0", () => {
	console.log("server ready at port", port);
});