const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/day.js");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

const taskschema = {
    name: String
};

const taskmodel = mongoose.model("Task", taskschema);

const task1 = new taskmodel({
    name: "Welcome to your todolist!"
});
const task2 = new taskmodel({
    name: "Hit the + button to add a new item"
});
const task3 = new taskmodel({
    name: "<-- this is to delete an item"
});

const defaulttask = [task1, task2, task3]

const listSchema = {
    name: String,
    tasks: [taskschema]
}
const newtodo = mongoose.model("List", listSchema);

app.get("/", async (req, res) => {
    try {
        var day = date.getdate();
        const result = await taskmodel.find({});
        if (result.length === 0) {
            await taskmodel.insertMany(defaulttask);
            console.log("Default tasks inserted.");
            res.redirect("/");
        } else {
            res.render("list", { listtitle: day, newwork: result });
        }
    } catch (err) {
        console.error(err);
        res.render("error");
    }
});

app.post("/", async (req, res) => {
    const taskname = req.body.newtask;
    const task = new taskmodel({ name: taskname });
    var day = date.getdate();
    if (req.body.workbtn === day) {
        await task.save();
        res.redirect("/");
    } else {
        try {
            const result = await newtodo.findOne({ name: req.body.workbtn });
            result.tasks.push(task);
            await result.save();
            res.redirect("/" + result.name);
        } catch (err) {
            console.error(err);
            res.render("error");
        }
    }
});

app.post("/delete", async (req, res) => {
    const delid = req.body.check;
    const listname = req.body.listname;
    var day = date.getdate();
    if (listname == day) {
        try {
            await taskmodel.deleteOne({ _id: delid });
            res.redirect("/");
        } catch (err) {
            console.error(err);
            res.render("error");
        }
    } else {
        try {
            await newtodo.findOneAndUpdate({ name: listname }, { $pull: { tasks: { _id: delid } } });
            res.redirect("/" + listname);
        } catch (err) {
            console.error(err);
            res.render("error");
        }
    }
});

app.get("/:newlist", async (req, res) => {
    const newlistname = _.capitalize(req.params.newlist);
    try {
        const result = await newtodo.findOne({ name: newlistname });
        if (!result) {
            const list = new newtodo({ name: newlistname, tasks: defaulttask });
            await list.save();
            res.redirect("/" + newlistname);
        } else {
            res.render("list", { listtitle: result.name, newwork: result.tasks });
        }
    } catch (err) {
        console.error(err);
        res.render("error");
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is hosted on port ${port}`);
});
