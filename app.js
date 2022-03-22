const express = require("express");
const app = express();
const path = require('path');
const morgan = require("morgan")
// const AppError = require("./utils/AppError")
const Joi = require("joi")
const methodOverride = require("method-override")
const session = require("express-session")
const flash = require("connect-flash")
// const wrapAsync = require("./utils/wrapAsync")
// const { connectionPromise, sql, MSSQLStore } = require("./database/db.js")
const sanitizeHtml = require("sanitize-html");
// const NVarChar = require("tedious/lib/data-types/nvarchar");
// const userRoutes = require('./routes/user');
// const multer  = require('multer')
// const uploadText = multer()
// const { threadTextSchema, commentSchema, userPrivacySchema } = require("./schemas")
const fs = require("fs")
const { v4: uuidv4 } = require('uuid');
// const { writeHeapSnapshot } = require("v8");
// const bcrypt = require("bcrypt")


const sessionOption = {
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + (1000 * 60 * 60 * 24 * 7 ),
    maxAge: 1000 * 60 * 60 * 24 * 7
  },
 // store: MSSQLStore, 
  secret: "placeholderSecret"
}


app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true}))
app.use(express.json())
app.use(morgan("tiny"))
app.use(session(sessionOption))
app.use(flash())

// res.locals
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.username = req.session.username;
  res.locals.role = req.session.userRole;
  next();
})


app.get("/", (req, res) => {
  res.render("home")
})

app.listen(3000, () => {
  console.log("Listening on Port 3000")
})
