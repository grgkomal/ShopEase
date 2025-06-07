const express = require("express");
const app = express();
const userRouter = require("./routes/users");
const categoryRouter = require("./routes/category");
const productRouter = require("./routes/product");

const { jwtAuth } = require("./utils/jwtauth");

app.use(express.json());
app.use(jwtAuth);
app.use("/users", userRouter);
app.use("/category", categoryRouter);
app.use("/product", productRouter);

const port = 3000;
app.listen(port, "0.0.0.0", () => {
	console.log("server ready at port", port);
});