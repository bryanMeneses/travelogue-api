const mongoose = require('mongoose')
const BaseJoi = require('@hapi/joi');
const Extension = require('@hapi/joi-date');
const Joi = BaseJoi.extend(Extension);


const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 50,
        lowercase: true
    },
    birth_date: {
        type: Date,
        required: true
    },
    current_location: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: true
    },
    // Possibly add later
    // profile_picture: {
    //     type: String
    // },
    country: {
        type: String,
    },
    hometown: {
        type: String,
        minlength: 2,
        maxlength: 50
    },
    interests: [String],
    occupation: {
        type: String,
        minlength: 2,
        maxlength: 50
    },
    bio: {
        type: String,
        minlength: 2,
        maxlength: 1000
    },
    fluent_languages: {
        type: [String],
    },
    learning_languages: [
        {
            language: {
                type: String,
                required: true,
                lowercase: true
            },
            level: {
                type: String,
                enum: ['Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Expert']
            }
        }
    ],
    travel_plans: [
        {
            destination: {
                type: String,
                required: true,
                minlength: 2,
                maxlength: 50
            },
            arrival_date: {
                type: Date,
                required: true
            },
            departure_date: {
                type: Date,
                required: true
            },
            number_of_travelers: {
                type: Number,
                required: true,
            },
            description: {
                type: String,
                required: true,
                minlength: 3,
                maxlength: 300
            }
        }
    ],
    wishlist: [String],
    countries_visited: [String],
    social: {
        website: String,
        youtube: String,
        twitter: String,
        facebook: String,
        linkedin: String,
        instagram: String,
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

const Profile = mongoose.model('Profile', profileSchema)

// Joi validation 
// Validate required information
const validateProfile = request => {
    const schema = {
        username: Joi.string().min(3).max(50).required(),
        birth_date: Joi.date().format('YYYY-MM-DD').required(),
        current_location: Joi.string().min(3).max(50).required(),
        gender: Joi.string().required()
    }
    return Joi.validate(request, schema)
}

// Validate optional information
const validateOptionalInfo = request => {
    const schema = {
        country: Joi.string().optional().allow(''),
        hometown: Joi.string().min(2).max(50).optional().allow(''),
        interests: Joi.optional().allow(''),
        occupation: Joi.string().min(2).max(50).optional().allow(''),
        bio: Joi.string().min(2).max(1000).optional().allow(''),
        wishlist: Joi.optional().allow(''),
        countries_visited: Joi.optional().allow(''),
        fluent_languages: Joi.optional().allow(''),
        website: Joi.string().uri().optional().allow(''),
        youtube: Joi.string().uri().optional().allow(''),
        twitter: Joi.string().uri().optional().allow(''),
        facebook: Joi.string().uri().optional().allow(''),
        linkedin: Joi.string().uri().optional().allow(''),
        instagram: Joi.string().uri().optional().allow(''),
    }
    return Joi.validate(request, schema)
}

const validateLearningLanguages = request => {
    const schema = {
        language: Joi.string().min(2).max(50).required(),
        level: Joi.string().optional().allow('')
    }
    return Joi.validate(request, schema)
}

const validateTravelPlans = request => {
    const schema = {
        destination: Joi.string().min(2).max(50).required(),
        arrival_date: Joi.date().format('YYYY-MM-DD').required(),
        departure_date: Joi.date().format('YYYY-MM-DD').required(),
        number_of_travelers: Joi.number().min(1).max(100).required(),
        description: Joi.string().min(3).max(300).required()
    }

    return Joi.validate(request, schema)
}

module.exports = {
    Profile,
    validateProfile,
    validateOptionalInfo,
    validateLearningLanguages,
    validateTravelPlans
}