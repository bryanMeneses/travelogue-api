const Joi = require('@hapi/joi')
const mongoose = require('mongoose')



const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    text: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    username: {
        type: String
    }, // From profile
    likes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            text: {
                type: String,
                required: true,
            },
            name: {
                type: String
            },
            username: {
                type: String
            },
            date: {
                type: Date,
                default: Date.now()
            }
        }
    ],
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

const Post = mongoose.model('Post', postSchema)

const validateCreatePost = request => {
    const schema = {
        text: Joi.string().min(2).max(1000).required()
    }

    return Joi.validate(request, schema)
}

const validateComment = request => {
    const schema = {
        text: Joi.string().min(1).max(300).required()
    }

    return Joi.validate(request, schema)
}

module.exports = {
    Post,
    validateCreatePost,
    validateComment
}

