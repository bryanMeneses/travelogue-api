// Dependencies
const express = require('express')
const mongoose = require('mongoose')
const config = require('config')
const passport = require('passport')

// Routes
const users = require('./routes/users')
const profile = require('./routes/profile')
const post = require('./routes/post')


// Initalize Express server
const app = express();

// Get MongoDB URI for privacy
const mongoURI = config.get('mongoURI')


// Connect to MongoDB
mongoose.connect("mongodb+srv://bryan:bryan123@cluster0-kfrgg.mongodb.net/test?retryWrites=true&w=majority",
    { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false })
    .then(() => console.log('You have connected to MongoDB...'))
    .catch(err => console.error(`Error: ${err}. Could not connect to MongoDB`))



// ---- BEGIN MIDDLEWARE ---- 
// Parse incoming requests
app.use(express.json())

// Initiate passport for authentication - authenticates incoming requests to private routes
app.use(passport.initialize())
// Passport Configuration
require('./passport-config/passport')(passport)

// ---- END MIDDLEWARE ----

// Endpoints/Routes
app.use('/api/users', users)
app.use('/api/profile', profile)
app.use('/api/post', post)

// Port and listen on port
const port = process.env.PORT || 5000

app.get("/", function (req, res) {
    res.send(JSON.stringify({ Hello: "World" }));
});

app.listen(port, () => console.log(`Server listening on port ${port}...`))
