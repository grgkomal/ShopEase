const express = require("express");
const app = express();
app.use(express.json());
// app.use(jwtAuth);

const port = 3000;
app.listen(port, "0.0.0.0", () => {
	console.log("server ready at port", port);
});