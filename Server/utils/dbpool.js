
//utils/dbpool
const mysql = require("mysql2")

const pool = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "grocery_store",
    password: "grocery",
    database: "grocery_db"
})

module.exports = pool

