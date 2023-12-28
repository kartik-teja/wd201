const express = require("express");
const app = express();
var csrf = require("csurf");
const { Todo } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");
const todo = require("./models/todo");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Using cookies"));
app.use(csrf({ cookie: true }));

app.set("view engine", "ejs");

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (request, response) => {
  const overDue = await Todo.overDue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();
  if (request.accepts("html")) {
    response.render("index", {
      title: "Todo application",
      overDue,
      dueToday,
      dueLater,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      overDue,
      dueToday,
      dueLater,
    });
  }
});

app.post("/todos", async function (request, response) {
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ sucess: true });
  } catch (error) {
    return response.status(422).json(error);
  }
});

module.exports = app;
