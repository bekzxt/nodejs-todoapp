const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const authRoutes = require("./routes/auth");
const todoRoutes = require("./routes/todo");
require("dotenv").config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("MongoDB connection error:", err));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
        cookie: { maxAge: 60000 }
    })
);

app.use(authRoutes);
app.use("/tasks", todoRoutes);

app.get("/", (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    res.redirect("/tasks"); // Redirect to tasks page after login
});

app.get("/tasks", (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    res.render("tasks", { userId: req.session.userId });
});

app.listen(3000, () => console.log("Server running on port 3000"));
