const express = require('express')
const router = express.Router();
const passport = require('passport')
const { User } = require('../models/User')
const { Profile, validateProfile, validateOptionalInfo, validateLearningLanguages, validateTravelPlans } = require('../models/Profile')
const _ = require('lodash')

// @route GET api/profile/all
// @desc Get all profiles
// @access Public (possibly make private later)
router.get('/all', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'date'])
        if (profiles.length < 1) return res.status(404).send({ no_profiles: 'There are no profiles.' })

        res.send(profiles)
    }
    catch (err) {
        res.status(500).send({ error: 'Something went wrong.' })
    }
})

// @route GET api/profile/username/:username
// @desc Get profile by username
// @access Public (possibly make private later)
router.get('/username/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const profile = await Profile.findOne({ username: req.params.username }).populate('user', ['name', 'date'])
        if (!profile) return res.status(404).send({ profile_not_found: 'That profile does not exist.' })

        res.send(profile)
    }
    catch (err) {
        res.status(500).send({ error: 'Something went wrong.' })
    }
})

// @route GET api/profile
// @desc Get the current logged in user's profile
// @access Private
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id }).populate('user', ['name', 'date'])

        if (!profile) return res.status(404).send({ profile_not_found: `That profile does not exist.` })

        res.send(profile)
    }
    catch (err) {
        res.status(500).send({ error: 'Something went wrong.' })
    }
})

// @route POST api/profile/required
// @desc Create profile for current logged in user
// @access Private
router.post('/required', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Validate request with Joi
        const { error } = validateProfile(req.body)
        if (error) return res.status(400).send(error.details.map(cur => {
            return { profile_required_error: cur.message }
        }))

        // remove any white spaces from req.body.username
        req.body.username = req.body.username.replace(/\s/g, '')

        // Make profile fields
        const profileFields = {
            user: req.user._id,
            username: req.body.username,
            birth_date: req.body.birth_date,
            gender: req.body.gender,
            current_location: req.body.current_location
        }

        // Check if user already has a profile. If yes, update, if no, create new
        const profile = await Profile.findOne({ user: req.user._id })

        if (profile) {
            // Check if new username is equal to another user's username AND not equal to the logged in user's username
            const isUsernameTaken = await Profile.findOne({ username: req.body.username })
            if (isUsernameTaken && profile.username !== req.body.username) return res.status(400).send([{ profile_required_error: 'That username has already been taken.' }])

            // Update logged in user's profile 
            const updatedProfile = await Profile.findOneAndUpdate(
                { user: req.user._id },
                { $set: profileFields },
                { new: true }
            )
            res.send(updatedProfile)
        } else if (!profile) {
            // Check first if username is already taken before making new profile
            const isUsernameTaken = await Profile.findOne({ username: req.body.username })

            if (isUsernameTaken) return res.status(400).send([{ profile_required_error: 'That username has already been taken.' }])

            const newProfile = new Profile(profileFields);
            await newProfile.save();

            res.send(newProfile);
        }
    }
    catch (err) {
        res.status(500).send({ profile_required_error: 'Something went wrong.' })
    }
})

// @route POST api/profile/info
// @desc Add non-required info to profile
// @access Private
router.post('/info', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Validate request with Joi
        const { error } = validateOptionalInfo(req.body)
        if (error) return res.status(400).send([{ input_error: error.details[0].message }])

        const profile = await Profile.findOne({ user: req.user._id })

        // If no profile, first make profile/required
        if (!profile) return res.status(404).send({ add_required_info: 'You have not added the required information yet. See Account settings to get started with your profile.' })

        // If profile, only add to profile the fields that are in the req.body. This means just update the profile, since it already exists to begin with.

        const profileFields = {}

        if (req.body.country) profileFields.country = req.body.country
        if (req.body.hometown) profileFields.hometown = req.body.hometown
        if (req.body.interests) {
            const array = req.body.interests.toLowerCase().split(/,\s*/)
            profileFields.interests = array
        }
        if (req.body.fluent_languages) {
            const array = req.body.fluent_languages.toLowerCase().split(/,\s*/)
            profileFields.fluent_languages = array
        }
        if (req.body.occupation) profileFields.occupation = req.body.occupation
        if (req.body.bio) profileFields.bio = req.body.bio
        if (req.body.wishlist) {
            const array = req.body.wishlist.split(/,\s*/)
            profileFields.wishlist = array
        }
        if (req.body.countries_visited) {
            const array = req.body.countries_visited.split(/,\s*/)
            profileFields.countries_visited = array
        }

        // Social 
        profileFields.social = {}
        if (req.body.website) profileFields.social.website = req.body.website
        if (req.body.youtube) profileFields.social.youtube = req.body.youtube
        if (req.body.twitter) profileFields.social.twitter = req.body.twitter
        if (req.body.facebook) profileFields.social.facebook = req.body.facebook
        if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin
        if (req.body.instagram) profileFields.social.instagram = req.body.instagram


        const updatedProfile = await Profile.findOneAndUpdate(
            { user: req.user._id },
            { $set: profileFields },
            { new: true }
        ).populate('user', ['name', 'date'])

        // Check if req.body is empty. If yes, do not add empty strings to document.
        if (req.body.country == "") updatedProfile.country = undefined
        if (req.body.hometown === "") updatedProfile.hometown = undefined
        if (req.body.interests === "") updatedProfile.interests = []
        if (req.body.occupation === "") updatedProfile.occupation = undefined
        if (req.body.bio === "") updatedProfile.bio = undefined
        if (req.body.wishlist === "") updatedProfile.wishlist = []
        if (req.body.countries_visited === "") updatedProfile.countries_visited = []
        if (req.body.fluent_languages === "") updatedProfile.fluent_languages = []
        if (req.body.website === "") updatedProfile.social.website = undefined
        if (req.body.youtube === "") updatedProfile.social.youtube = undefined
        if (req.body.twitter === "") updatedProfile.social.twitter = undefined
        if (req.body.facebook === "") updatedProfile.social.facebook = undefined
        if (req.body.linkedin === "") updatedProfile.social.linkedin = undefined
        if (req.body.instagram === "") updatedProfile.social.instagram = undefined


        await updatedProfile.save()
        res.send(updatedProfile)

    }
    catch (err) {
        res.status(500).send({ error: 'Something went wrong.' })
    }
})

// @route POST api/profile/info/learning_languages
// @desc Add learning language object to database
// @access Private
router.post('/info/learning_languages', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Validate request with Joi
        const { error } = validateLearningLanguages(req.body)
        if (error) return res.status(400).send([{ input_error: error.details[0].message }])

        const profile = await Profile.findOne({ user: req.user._id }).populate('user', ['name', 'date'])

        // Check to see if they have already listed that language
        if (profile.learning_languages.filter(cur => cur.language === req.body.language.toLowerCase()).length > 0) return res.status(400).send([{ language_already_added: "You have already added that language before." }])

        const newLanguage = _.pick(req.body, ['language', 'level'])

        // Add to learning_languages array
        profile.learning_languages.push(newLanguage)

        await profile.save()

        res.send(profile)
    }
    catch (err) {
        res.status(500).send({ error: 'Something went wrong.' })
    }
})

// @route DELETE api/profile/info/learning_languages
// @desc Delete single learning language object from array
// @access Private
router.delete('/info/learning_languages/:_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id }).populate('user', ['name', 'date'])

        // Return error if req.params._id is not in the array
        if (profile.learning_languages.filter(cur => cur._id.toString() === req.params._id).length === 0) return res.status(404).send({ language_not_found: 'That does not exist.' })

        // Get the index of the object to delete. Use the ID
        const removeIndex = profile.learning_languages.map(cur => cur._id.toString()).indexOf(req.params._id)

        // Remove language object from the array
        profile.learning_languages.splice(removeIndex, 1)

        await profile.save()

        res.send(profile)

    }
    catch (err) {
        res.status(500).send({ error: 'Something went wrong' })
    }
})

// @route POST api/profile/info/travel_plans
// @desc Add a travel plan object to database
// @access Private
router.post('/info/travel_plans', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Validate incoming information with Joi
        const { error } = validateTravelPlans(req.body)
        if (error) return res.status(400).send([{ input_error: error.details[0].message }])

        // Find profile
        const profile = await Profile.findOne({ user: req.user._id }).populate('user', ['name', 'date'])

        // If no profile, first make profile/required
        if (!profile) return res.status(404).send({ add_required_info: 'You have not added the required information yet. See Account settings to get started with your profile.' })

        // collect info needed for new object
        const newTravelPlan = _.pick(req.body, ['destination', 'arrival_date', 'departure_date', 'number_of_travelers', 'description'])

        // Add to travel_plans array
        profile.travel_plans.unshift(newTravelPlan)

        await profile.save()

        res.send(profile)
    }
    catch (err) {
        res.status(500).send({ error: "Something went wrong." })
    }
})

// @route PUT api/profile/info/travel_plans/:id
// @desc Edit a travel plan
// @access Private
router.put('/info/travel_plans/:_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Validate incoming information with Joi
        const { error } = validateTravelPlans(req.body)
        if (error) return res.status(400).send([{ input_error: error.details[0].message }])

        // Find profile
        const profile = await Profile.findOne({ user: req.user._id }).populate('user', ['name', 'date'])

        // If no profile, first make profile/required
        if (!profile) return res.status(404).send({ add_required_info: 'You have not added the required information yet. See Account settings to get started with your profile.' })

        // Check if req.params._id is in the user's travel_plans array.
        if (profile.travel_plans.filter(cur => cur._id.toString() === req.params._id).length === 0) return res.status(404).send({ travel_not_found: 'That does not exist.' })

        // Find index of travel plan to be edited
        const editIndex = profile.travel_plans.map(cur => cur._id).indexOf(req.params._id)

        // Edit the object
        profile.travel_plans[editIndex].destination = req.body.destination
        profile.travel_plans[editIndex].arrival_date = req.body.arrival_date
        profile.travel_plans[editIndex].departure_date = req.body.departure_date
        profile.travel_plans[editIndex].number_of_travelers = req.body.number_of_travelers
        profile.travel_plans[editIndex].description = req.body.description

        await profile.save()

        res.send(profile)
    }
    catch (err) {
        res.status(500).send({ error: "Something went wrong." })
    }
})

// @route DELETE api/profile/info/travel_plans/:id
// @desc Delete a travel plan
// @access Private
router.delete('/info/travel_plans/:_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Find profile
        const profile = await Profile.findOne({ user: req.user._id }).populate('user', ['name', 'date'])

        // Return error if req.params._id is not in the array
        if (profile.travel_plans.filter(cur => cur._id.toString() === req.params._id).length === 0) return res.status(404).send({ travel_not_found: 'That does not exist.' })

        // Find index of travel plan to be edited
        const removeIndex = profile.travel_plans.map(cur => cur._id).indexOf(req.params._id)

        // Remove it from array
        profile.travel_plans.splice(removeIndex, 1)

        await profile.save()

        res.send(profile)
    }
    catch (err) {
        res.status(500).send({ error: "Something went wrong." })
    }
})

// @route DELETE api/profile/
// @desc Delete user and profile
// @access Private
router.delete('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        await Profile.findOneAndDelete({ user: req.user._id });
        await User.findByIdAndDelete(req.user._id);
        res.send({ success: true })
    }
    catch (err) {
        res.status(500).send({ error: 'Something went wrong' })
    }
})

module.exports = router