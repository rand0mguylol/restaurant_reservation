const express = require("express");
const app = express();
const path = require('path');
const morgan = require("morgan")
const AppError = require("./utils/AppError")
const Joi = require("joi")
const methodOverride = require("method-override")
const session = require("express-session")
const flash = require("connect-flash")
// const wrapAsync = require("./utils/wrapAsync")
const { connectionPromise, sql, MSSQLStore } = require("./database/db.js")
const sanitizeHtml = require("sanitize-html");
// const NVarChar = require("tedious/lib/data-types/nvarchar");
// const userRoutes = require('./routes/user');
// const multer  = require('multer')
// const uploadText = multer()
const { reserveSchema} = require("./schemas")
const fs = require("fs")
const { v4: uuidv4 } = require('uuid');
const { time } = require("console");
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
  next();
})

const validateData = (schema, route) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {"abortEarly": false, "allowUnknown": true});
    if (error) {
        const errorList = []
        error.details.forEach(element => {
          errorList.push(element.message)
        });

        req.flash("error", errorList)
        
        return res.redirect(route)
    }
    next()
    
  }
}

// Check if the user has another booking on the same day
const checkIfBooked = async (req, res, next) => {
  const { contactNumber, bookingDate } = req.body;

  const pool = await connectionPromise();
  const ps = new sql.PreparedStatement(pool);

  ps.input("contactNumber", sql.VarChar(15));
  ps.input("status", sql.VarChar(15));
  ps.input("bookingDate", sql.Date());

  const preparedStatement = await ps.prepare(`SELECT bookingDate, bookingTime FROM bookingList WHERE contactNumber = @contactNumber AND status = @status AND bookingDate = @bookingDate`)

  const result = await preparedStatement.execute({contactNumber: contactNumber, status: "BOOKED", bookingDate: bookingDate})

  await ps.unprepare();

  if(result.recordset !== undefined && result.recordset.length === 0) next()
  else{
    req.flash("error", "It seems like you already have a booking on that day. If you would like to make a new booking, please cancel your old booking.")
    res.redirect("/#reservation-section")
  }
}

// Generate new time list
const getTimeList  = (timeList, takenTimeList, result) => {
    takenTimeList = result.recordset.map(t => {
      let newTime = new Date(t.bookingTime);
      let hr = newTime.getUTCHours().toString().padStart(2, "0"); // => 9
      let minute = newTime.getUTCMinutes().toString().padStart(2, "0"); // =>  30

      return `${hr}:${minute}`
    })

    timeList = timeList.filter(slot => !takenTimeList.includes(slot))

    return timeList
}

// Extra validation in the event the user mess with the HTML.
const checkHasTime = async (req, res, next) =>{
  const { bookingDate, bookingTime } = req.body;

  const pool = await connectionPromise();
  const ps = new sql.PreparedStatement(pool);

  ps.input("status", sql.VarChar(15));
  ps.input("bookingDate", sql.Date());
  ps.input("bookingTime", sql.VarChar(30));

  const preparedStatement = await ps.prepare(`SELECT bookingDate, bookingTime FROM bookingList WHERE status = @status AND bookingDate = @bookingDate AND bookingTime = @bookingTime`)

  const result = await preparedStatement.execute({status: "BOOKED", bookingDate: bookingDate, bookingTime: bookingTime})

  await ps.unprepare();

  // If not result means the time is available
  if(result.recordset !== undefined && result.recordset.length === 0) next()
  else{
    next(new AppError("Something went wrong", 500))
  }
}

app.get("/", async (req, res) => {
  let today = new Date();
  let dd = String(today.getDate() + 2).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  let yyyy = today.getFullYear();
  let takenTimeList = []
  let timeList = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

  today = `${yyyy}-${mm}-${dd}`

  const pool = await connectionPromise()
  const ps = new sql.PreparedStatement(pool)

  ps.input("date", sql.Date())

  const preparedStatement = await ps.prepare(`SELECT bookingTime FROM bookingList WHERE bookingDate = @date`)
  const result = await preparedStatement.execute({date: today})
  await ps.unprepare()

  if(result.recordset !== undefined && result.recordset.length !== 0){
    timeList = getTimeList(timeList, takenTimeList, result)
  }


  console.log(timeList)

  res.render("home", { today, timeList })
})


app.post("/reservation", validateData(reserveSchema, "/#reservation-section"), checkIfBooked, checkHasTime, async (req, res) =>{
  console.log(req.body)
  // console.log(typeof req.body.bookingDate)
  let {firstName, lastName, contactNumber, email, pax, bookingDate, bookingTime, specialInstruction}  = req.body;
  const pool = await connectionPromise();
  const ps = new sql.PreparedStatement(pool);

  console.log(bookingTime)
  console.log(typeof bookingTime)

  ps.input("firstName", sql.VarChar(100))
  ps.input("lastName", sql.VarChar(100))
  ps.input("contactNumber", sql.VarChar(15))
  ps.input("email", sql.VarChar(256))
  ps.input("pax", sql.VarChar(256))
  ps.input("bookingDate", sql.Date())
  ps.input("bookingTime", sql.VarChar(30))
  ps.input("specialInstruction", sql.VarChar(256))
  ps.input("status", sql.VarChar(20))
  ps.input("bookingCode", sql.VarChar(256))

  // bookingTime += ":00"
  const preparedStatement = await ps.prepare(`INSERT INTO bookingList (firstName, lastName, contactNumber, email, pax,
                                              bookingDate, bookingTime, specialInstruction, status, bookingCode) VALUES
                                              (@firstName, @lastName, @contactNumber, @email, @pax,
                                                @bookingDate, @bookingTime, @specialInstruction, @status, @bookingCode)`)

await preparedStatement.execute({firstName: firstName, lastName: lastName, contactNumber: contactNumber, email: email, pax: pax, bookingDate: bookingDate, bookingTime: bookingTime, specialInstruction: specialInstruction,
                                  status: "BOOKED", bookingCode: uuidv4()})

await ps.unprepare();

req.flash("success", "Successfully Booked");
res.redirect("/")

})

app.post("/getdatetime", async (req, res) => {
  let takenTimeList = []
  let timeList = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

  const pool = await connectionPromise()
  const ps = new sql.PreparedStatement(pool)

  ps.input("date", sql.Date())

  const preparedStatement = await ps.prepare(`SELECT bookingTime FROM bookingList WHERE bookingDate = @date`)
  const result = await preparedStatement.execute({date: req.body.chosenDate})
  await ps.unprepare()

  if(result.recordset !== undefined && result.recordset.length !== 0){
    timeList = getTimeList(timeList, takenTimeList, result)
  }

  res.send(JSON.stringify({timeList: timeList}))
})

// Error Handling Middleware
app.use((err, req, res, next) =>{

  const { statusCode=500 , message = "Something Went Wrong"} = err
  // if(err.message === "Validation Error") res.redirect("/educatee/register")
  res.send(message)
  console.log(statusCode, message)
})

app.listen(3000, () => {
  console.log("Listening on Port 3000")
})
