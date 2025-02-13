const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

router.get("/login", (req, res) => {
    res.render("login");
});
router.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.trim();
        password = password.trim();
        const user = await User.findOne({ email });
        if (!user) {
            return res.render("login", { error: "No account found with this email. Please sign up." });
        }

        // Check if the account is temporarily locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.send("Account locked. Try again later.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = Date.now() + 1 * 1000;
            }
            await user.save();
            return res.send("Incorrect password.");
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        req.session.userId = user._id;
        req.session.userName = user.name || "User";
        res.redirect("/tasks");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/login"));
});

router.get("/forgot-password", (req, res) => {
    res.render("forgot-password");
});

const nodemailer = require("nodemailer");
const crypto = require("crypto");
require('dotenv').config();


const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


router.post("/forgot-password", async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.send("Email not found.");

    user.resetToken = crypto.randomBytes(32).toString("hex");
    await user.save();

    const resetLink = `https://nodejs-todoapp-1-dzpa.onrender.com/reset/${user.resetToken}`;

    await transporter.sendMail({
        to: user.email,
        subject: "Password Reset",
        text: `Click here to reset your password: ${resetLink}`
    });

    res.send("Check your email for the reset link.");
});


router.get("/signup", (req, res) => {
    res.render("signup"); // This will render views/signup.ejs
});
router.get("/reset/:token", (req, res) => {
    res.render("reset", { token: req.params.token });
});
router.post("/signup", async (req, res) => {
    let { name, email, password } = req.body;
    email = email.trim();
    name = name.trim();
    password = password.trim();
    if (!name || !email || !password) {
        return res.send("All fields are required.");
    }
    if (password.length < 6) {
        return res.send("Password must be at least 6 characters long.");
    }
    try {
        await User.create({ name, email, password: password });
        res.redirect("/login");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});
router.post("/reset/:token", async (req, res) => {
    try {
        const user = await User.findOne({ resetToken: req.params.token });
        if (!user) {
            return res.send("Invalid token.");
        }

        if (!req.body.password || req.body.password.trim().length < 6) {
            return res.send("Password must be at least 6 characters long.");
        }

        user.password = req.body.password;
        user.resetToken = null;
        await user.save();
        return res.redirect("/login");
    } catch (error) {
        console.error(error);
        return res.status(500).send("Server error");
    }
});
module.exports = router;