const mongoose = require('mongoose')
const Joi = require('@hapi/joi')
const jwt = require('jsonwebtoken')
const config = require('config')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        minlength: 3,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 500
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

// Method to generate token on request to private route. This is returned to client
// Uses jsonwebtoken package
// Expires in 2 hours from time of creation
userSchema.methods.generateAuthToken = function () {
    const payload = {
        _id: this._id,
        name: this.name,
        email: this.email,
        date: this.date
    }
    const token = jwt.sign(payload, config.get('jwtPrivateKey'), { expiresIn: 7200 })

    return token
}

const User = mongoose.model('User', userSchema)

const validateRegister = request => {
    const schema = {
        name: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().min(3).max(50).required(),
        password: Joi.string().min(5).max(500).required(),
        confirmpw: Joi.string().min(5).max(500).required(),
    }
    return Joi.validate(request, schema, { abortEarly: false })
}

const validateLogin = request => {
    const schema = {
        email: Joi.string().email().min(3).max(50).required(),
        password: Joi.string().min(5).max(500).required(),
    }
    return Joi.validate(request, schema, { abortEarly: false })
}

module.exports = {
    User,
    validateRegister,
    validateLogin
}