const express = require('express')
const router = express.Router();
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const { User, validateRegister, validateLogin } = require('../models/User')

// @route GET api/users/test
// @desc Tests users endpoint
// @access Public
router.get('/test', (req, res) => {
    res.send({ msg: "This test works" })
})

// @route POST api/users/register
// @desc Creates a new user
// @access Public
router.post('/register', async (req, res) => {
    try {
        // Validate request with Joi
        const { error } = validateRegister(req.body)
        if (error) return res.status(400).send({ register_error: error.details[0].message })

        // Check if the user/email already exists
        const userAlreadyExists = await User.findOne({ email: req.body.email })
        if (userAlreadyExists) {
            return res.status(400).send({ register_error: 'That user already exists.' })
        }

        // Check if both passwords match
        if (req.body.confirmpw !== req.body.password) {
            return res.status(400).send({ register_error: 'Passwords do not match.' })
        }

        // Make the new user with only the info needed
        const newUser = new User(_.pick(req.body, ['name', 'email', 'password']))

        // Hash password and set in newUser object
        const salt = await bcrypt.genSalt(10)
        newUser.password = await bcrypt.hash(newUser.password, salt)

        // Save newUser in MongoDB
        await newUser.save()

        res.send(_.pick(newUser, ['_id', 'name', 'email']))

    }
    catch (err) {
        console.log(err.message)
        res.status(500).send({ register_error: 'Something went wrong' })
    }
})

// @route POST api/users/login
// @desc Login user
// @access Public
router.post('/login', async (req, res) => {
    try {
        // Validate request with Joi
        const { error } = validateLogin(req.body)
        if (error) return res.status(400).send({ signin_error: error.details[0].message })

        // Check if user doesn't exist 
        const user = await User.findOne({ email: req.body.email })
        if (!user) return res.status(404).send({ signin_error: 'That user doesn\'t exist' })

        // Check if the password matches the user.password using bcrypt.compare()
        const validPassord = await bcrypt.compare(req.body.password, user.password)
        if (!validPassord) return res.status(400).send({ signin_error: 'Incorrect password' })

        // Use jsonwebtoken to make token for clients to access private routes
        const token = user.generateAuthToken()

        res.send({
            success: true,
            token: `Bearer ${token}`
        })
    }
    catch (err) {
        res.status(500).send({ signin_error: 'Something went wrong.' })
    }
})


module.exports = router