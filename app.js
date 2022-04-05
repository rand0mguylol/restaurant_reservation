const express = require("express");
const app = express();
const path = require('path');
const morgan = require("morgan")
const AppError = require("./utils/AppError")
const methodOverride = require("method-override")
const session = require("express-session")
const flash = require("connect-flash")
const { connectionPromise, sql, MSSQLStore } = require("./database/db.js")
const { reserveSchema} = require("./schemas")
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcrypt")
const wrapAsync = require("./utils/wrapAsync")


const sessionOption = {
  resave: false, //Forces the session to be saved back to the session store, 
                // even if the session was never modified during the request.
  saveUninitialized: true, //Forces a session that is "uninitialized" to be saved to the store
  cookie: {
    httpOnly: true,
    expires: Date.now() + (1000 * 60 * 60 * 24 * 7 ),
    maxAge: 1000 * 60 * 60 * 24 * 7 // How long the cookie is stored before it expires
  },
 store: MSSQLStore,  // Database Store
  secret: process.env.SECRET  //used to sign the session ID cookie
}

// The templating language
app.set("view engine", "ejs");

// the directory where the template files are located.
app.set('views', path.join(__dirname, 'views'));

// Direcotry where static folders are stored
app.use(express.static(path.join(__dirname, 'public')))

// Lets you use HTTP verbs such as PUT or DELETE in places
//  where the client doesn't support it.
app.use(methodOverride('_method'));

app.use(express.urlencoded({ extended: true}))
app.use(express.json())

// For logging
app.use(morgan("tiny"))
app.use(session(sessionOption))
app.use(flash())

// res.locals
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.admin = req.session.admin
  next();
})

// Sire to see if the user is an admin before allowing the user to access certain routes
const checkIfAdmin = wrapAsync(async (req, res, next) => {
  const pool = await connectionPromise()
  const ps = new sql.PreparedStatement(pool)

  ps.input("sid", sql.VarChar(255))

  const preparedStatement = await ps.prepare(`SELECT admin.name FROM admin, sessions 
                                              WHERE sessions.adminId = admin.adminId 
                                              AND sessions.sid =  @sid`)

  const result = await preparedStatement.execute({sid: req.sessionID})

  if(result.recordset === undefined || result.recordset.length === 0) return next(new AppError("Not Authorized", 401))

  return next()
})

// Validate a form against a schema
// Route: Redirect to if validation of form against the schema fails
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
const checkIfBooked = wrapAsync(async (req, res, next) => {
  const { contactNumber, bookingDate } = req.body;

  const pool = await connectionPromise();
  const ps = new sql.PreparedStatement(pool);

  ps.input("contactNumber", sql.VarChar(15));
  ps.input("status", sql.VarChar(15));
  ps.input("bookingDate", sql.Date());

  const preparedStatement = await ps.prepare(`SELECT bookingDate, bookingTime FROM bookingList 
                                              WHERE contactNumber = @contactNumber 
                                              AND status = @status AND bookingDate = @bookingDate`)

  const result = await preparedStatement.execute({contactNumber: contactNumber, status: "BOOKED", bookingDate: bookingDate})

  await ps.unprepare();

  if(result.recordset !== undefined && result.recordset.length === 0) next()
  else{
    req.flash("error", "It seems like you already have a booking on that day. If you would like to make a new booking, please cancel your old booking.")
    res.redirect("/#reservation-section")
  }
})

// Generate new time list
// @params
// timeList : The complete timelist
// takenTimeLines: Time List that have been booked
// result: result return from executed prepares statement
// exception: time list has been booked but still include in the availabletimelist. Is used during editing booking so selected time list will still appear.
const getTimeList  = (timeList, takenTimeList, result, exception = false) => {
    takenTimeList = result.recordset.map(t => {
      let newTime = new Date(t.bookingTime);
      let hr = newTime.getUTCHours().toString().padStart(2, "0"); // => 9
      let minute = newTime.getUTCMinutes().toString().padStart(2, "0"); // =>  30

      return `${hr}:${minute}`
    })

    timeList = timeList.filter(slot => !takenTimeList.includes(slot) || slot === exception)

    return timeList
}

// Extra validation in the event the user mess with the HTML.
const checkHasTime = wrapAsync(async (req, res, next) =>{
  const { bookingDate, bookingTime } = req.body;

  const pool = await connectionPromise();
  const ps = new sql.PreparedStatement(pool);

  ps.input("status", sql.VarChar(15));
  ps.input("bookingDate", sql.Date());
  ps.input("bookingTime", sql.VarChar(30));

  const preparedStatement = await ps.prepare(`SELECT bookingDate, bookingTime FROM bookingList 
                                                WHERE status = @status AND bookingDate = @bookingDate AND bookingTime = @bookingTime`)

  const result = await preparedStatement.execute({status: "BOOKED", bookingDate: bookingDate, bookingTime: bookingTime})

  await ps.unprepare();

  // If not result means the time is available
  if(result.recordset !== undefined && result.recordset.length === 0) next()
  else{
    next(new AppError("Something went wrong", 500))
  }
})

// Return today's date
const getToday = () => {
  let today = new Date();
  let dd = String(today.getDate() + 2).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0');
  let yyyy = today.getFullYear();

  return`${yyyy}-${mm}-${dd}`

}

// Renders the landing page
// Gets the available time list for current date
app.get("/", wrapAsync(async (req, res) => {
  let today = getToday()
  let takenTimeList = []
  let timeList = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];


  const pool = await connectionPromise()
  const ps = new sql.PreparedStatement(pool)

  ps.input("date", sql.Date())

  const preparedStatement = await ps.prepare(`SELECT bookingTime FROM bookingList WHERE bookingDate = @date`)
  const result = await preparedStatement.execute({date: today})
  await ps.unprepare()

  if(result.recordset !== undefined && result.recordset.length !== 0){
    timeList = getTimeList(timeList, takenTimeList, result)
  }

  
  // console.log(timeList)

  res.render("home", { today, timeList,  })
}))

// Renders booking page for admin
app.get("/booking", checkIfAdmin,  (req, res) => {
  res.render("booking")
})

// Sends the booking details when the admin searches for booking use booking code or mobile number
app.post("/booking", wrapAsync(async (req, res, next) => {
  const {searchBooking } = req.body;

  const pool = await connectionPromise();
  const ps = new sql.PreparedStatement(pool);
  ps.input("searchBooking", sql.VarChar(256));

  const preparedStatement = await ps.prepare(`SELECT firstName, lastName, contactNumber, email, bookingDate, 
                                              bookingTime, specialInstruction, status, bookingCode
                                              FROM bookingList WHERE bookingCode = @searchBooking  OR contactNumber = @searchBooking`);

  const result = await preparedStatement.execute({searchBooking: searchBooking });
    
  if(result.recordset === undefined){
    next(new AppError("Something Went Wrong", 500))
  }

  res.send(JSON.stringify({bookingDetail: result.recordset}))
}))


// Delete a booking
app.delete("/booking/:bookingCode", wrapAsync(async(req, res) => {
  const { bookingCode } = req.params

  const pool = await connectionPromise()
  const ps = new sql.PreparedStatement(pool)

  ps.input("bookingCode", sql.VarChar(256));
  ps.input("status", sql.VarChar(20));

  const preparedStatement = await ps.prepare(`UPDATE bookingList SET status = @status WHERE bookingCode = @bookingCode`);
  await preparedStatement.execute({status: "CANCELLED", bookingCode: bookingCode})

  req.flash("success", "Booking Cancelled")
  res.redirect("/booking")
}))

// Updates a booking
app.get("/edit/:bookingCode", wrapAsync(async(req, res, next) => {
  let today = getToday()
  let takenTimeList = []
  let timeList = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];


  const { bookingCode } = req.params;
  const {date, time} =req.query

  const pool = await connectionPromise()
  const ps = new sql.PreparedStatement(pool);

  ps.input("bookingCode", sql.VarChar(256))
  ps.input("status", sql.VarChar(15))

  const preparedStatement = await ps.prepare(`SELECT bookingTime FROM bookingList WHERE bookingCode = @bookingCode AND status = @status`)

  const result = await preparedStatement.execute({bookingCode: bookingCode, status: "BOOKED"})
  
  // Either the booking has been cancelled, deleted or the booking code is not in the table.
  if(result.recordset === undefined || result.recordset.length === 0){
    next(new AppError("Page Not Found", 404))
  }

  timeList = getTimeList(timeList, takenTimeList, result, time)

  res.render("edit", {date, time, today, timeList, bookingCode})
}))

// Edits a booking
app.put("/edit/:bookingCode", wrapAsync(async (req, res) => {
  const { bookingDate, bookingTime } = req.body;
  const { bookingCode } = req.params

  const pool = await connectionPromise();
  const ps = new sql.PreparedStatement(pool)

  ps.input("bookingCode", sql.VarChar(256))
  ps.input("bookingTime", sql.VarChar(20))
  ps.input("bookingDate", sql.Date())

  const preparedStatement = await ps.prepare(`UPDATE bookingList SET bookingDate = @bookingDate, bookingTime = @bookingTime 
                                              WHERE bookingCode = @bookingCode`)

  await preparedStatement.execute({bookingCode: bookingCode, bookingDate: bookingDate, bookingTime: bookingTime})

  req.flash("success", "Booking Updated")
  res.redirect("/booking")
}))


// Creates a booking
app.post("/reservation", validateData(reserveSchema, "/#reservation-section"), checkIfBooked, checkHasTime, wrapAsync(async (req, res) =>{

  let {firstName, lastName, contactNumber, email, pax, bookingDate, bookingTime, specialInstruction}  = req.body;
  const pool = await connectionPromise();
  const ps = new sql.PreparedStatement(pool);

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

  const preparedStatement = await ps.prepare(`INSERT INTO bookingList (firstName, lastName, contactNumber, email, pax,
                                              bookingDate, bookingTime, specialInstruction, status, bookingCode) VALUES
                                              (@firstName, @lastName, @contactNumber, @email, @pax,
                                                @bookingDate, @bookingTime, @specialInstruction, @status, @bookingCode)`)

await preparedStatement.execute({firstName: firstName, lastName: lastName, contactNumber: contactNumber, email: email, pax: pax, bookingDate: bookingDate, bookingTime: bookingTime, specialInstruction: specialInstruction,
                                  status: "BOOKED", bookingCode: uuidv4()})

await ps.unprepare();

req.flash("success", "Successfully Booked");
res.redirect("/")

}))

// Sends back the available time slot when user selects the date
// Axios request
app.post("/getdatetime", wrapAsync(async (req, res) => {
  let takenTimeList = []
  let timeList = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

  const pool = await connectionPromise()
  const ps = new sql.PreparedStatement(pool)

  ps.input("date", sql.Date())
  ps.input("status", sql.VarChar(20))

  const preparedStatement = await ps.prepare(`SELECT bookingTime FROM bookingList WHERE bookingDate = @date AND status = @status`)
  const result = await preparedStatement.execute({date: req.body.chosenDate, status: "BOOKED"})
  await ps.unprepare()

  if(result.recordset !== undefined && result.recordset.length !== 0){
    timeList = getTimeList(timeList, takenTimeList, result)
  }


  res.send(JSON.stringify({timeList: timeList}))
}))

// Renders admin login page
app.get("/admin", (req, res) => {
  res.render("admin")
})

// Login admin
app.post("/admin/login", wrapAsync(async (req, res) => {
  const { name, password } = req.body

  const pool = await connectionPromise()
  const ps = new sql.PreparedStatement(pool)
  
  ps.input("name", sql.VarChar(100))

  const preparedStatement = await ps.prepare(`SELECT adminId, password FROM admin WHERE name = @name`);

  const result = await preparedStatement.execute({name: name})
  await ps.unprepare()

  if(result.recordset === undefined || result.recordset.length === 0){
    req.flash("error", "Invalid Details")
    res.redirect("/admin")
  }

  const { password:adminPassword, adminId} = result.recordset[0]
  const isValidPassword = await bcrypt.compare(password, adminPassword)

  if(!isValidPassword) {
    req.flash("error", "Invalid Details")
    return res.redirect("/admin")
  }

  const psStore = new sql.PreparedStatement(pool)
  psStore.input("sid", sql.NVarChar(255))
  psStore.input("adminId", sql.Int())

  const preparedStatementStore = await psStore.prepare("UPDATE sessions SET adminId = @adminId WHERE sid = @sid")
  await preparedStatementStore.execute({adminId: adminId, sid: req.sessionID})
  await psStore.unprepare();

  req.session.admin = true
  res.redirect("/")
}))

// Log Out admin
app.post("/admin/logout", (req, res) => {
  req.session.destroy((err) =>{
    if(err) return next(err)

    req.session = null;
    res.redirect("/")
  })
})

// Error Handling Middleware
app.use((err, req, res, next) =>{

  const { statusCode=500 , message = "Something Went Wrong"} = err
  res.render("error", {message})
})

app.listen(3000, () => {
  console.log("Listening on Port 3000")
})
