const express = require("express");
const Task = require("../models/Task");
const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) return res.redirect("/login");
    next();
};


router.get("/", isAuthenticated, async (req, res) => {
    const tasks = await Task.find({ userId: req.session.userId });
    res.render("tasks", { tasks , userName: req.session.userName});
});

router.post("/", isAuthenticated, async (req, res) => {
    await Task.create({ userId: req.session.userId, title: req.body.title });
    res.redirect("/tasks");
});


router.post("/:id/complete", isAuthenticated, async (req, res) => {
    await Task.findByIdAndUpdate(req.params.id, { completed: true });
    res.redirect("/tasks");
});


router.post("/:id/delete", isAuthenticated, async (req, res) => {
    await Task.findByIdAndDelete(req.params.id);
    res.redirect("/tasks");
});

module.exports = router;
