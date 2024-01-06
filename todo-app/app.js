/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStratergy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
app.set("views", path.join(__dirname, "views"));

const saltRounds = 10;

app.use(bodyParser.json());
app.use(flash());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Using cookies"));
app.use(csrf("1234qwertyuioplkjhgfdsazxcvbnm@#", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");

// eslint-disable-next-line no-undef
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "This-is-a-super-secret-key-753698456321458",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStratergy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, {
            message: "Account doesn't exist",
          });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async (request, response) => {
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const logedInUser = request.user.id;

    const overDue = await Todo.overDue(logedInUser);
    const dueToday = await Todo.dueToday(logedInUser);
    const dueLater = await Todo.dueLater(logedInUser);
    const completedItems = await Todo.completedItems(logedInUser);
    if (request.accepts("html")) {
      response.render("todos", {
        title: "Todo application",
        overDue,
        dueToday,
        dueLater,
        completedItems,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        overDue,
        dueToday,
        dueLater,
        completedItems,
      });
    }
  }
);

app.get("/signup", (request, response) => {
  if (request.accepts("html")) {
    return response.render("signup", {
      csrfToken: request.csrfToken(),
    });
  }
});

app.post("/users", async (request, response) => {
  if (request.body.email.length === 0) {
    request.flash("error", "Please enter email");
    return response.redirect("/signup");
  }
  if (request.body.firstName.length === 0) {
    request.flash("error", "Please enter name");
    return response.redirect("/signup");
  }
  if (request.body.password.length < 8) {
    request.flash("error", "Password length should be >= 8 characters");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/");
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const errorMessages = error.errors.map((e) => e.message);
      request.flash("error", errorMessages);
      response.redirect("/signup");
    } else {
      console.log(error);
      response.status(500).json(error);
    }
  }
});

app.get("/login", (request, response) => {
  if (request.accepts("html")) {
    return response.render("login", {
      title: "Login",
      csrfToken: request.csrfToken(),
    });
  }
});

app.get("/signout", (request, response, next) => {
  request.logOut((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Invalid email or password. Please try again.",
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/todos");
  }
);

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const receivedCsrfToken = request.body.csrfToken; // Adjust this based on your form submission method
    console.log("Received CSRF Token:", receivedCsrfToken);
    try {
      if (!request.body.title || !request.body.dueDate) {
        request.flash(
          "error",
          "Validation error: Please provide a valid title and due date."
        );
        return response.redirect("/todos");
      }
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      request.flash("error", "An error occurred while adding a todo.");
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodo = await todo.setCompletionStatus(
        !request.body.completed
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    try {
      await Todo.remove(request.params.id, request.user.id);
      return response.json({ sucess: true });
    } catch (error) {
      return response.status(500).json(error);
    }
  }
);

module.exports = app;
