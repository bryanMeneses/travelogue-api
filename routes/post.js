const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { Post, validateCreatePost, validateComment } = require('../models/Post')
const { Profile } = require('../models/Profile')
const passport = require('passport')

// @route GET api/post/all
// @desc Test route
// @access Private
router.get('/all', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const posts = await Post.find().sort({ _id: -1 })
        if (posts.length < 1) return res.status(404).send({ no_posts: 'There are no posts.' })

        res.send(posts)
    }
    catch (err) {
        res.status(500).send({ error: 'Something went wrong.' })
    }
})

// @route POST api/post/
// @desc Create post
// @access Private 
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // validate request
        const { error } = validateCreatePost(req.body)
        if (error) return res.status(400).send({ input_error: error.details[0].message })

        // Get logged in profile to add to username to post
        const profile = await Profile.findOne({ user: req.user._id })

        if (!profile) return res.status(401).send({ no_profile: "You need a profile to create posts." })

        const newPost = new Post({
            user: req.user._id,
            text: req.body.text,
            name: req.user.name,
            username: profile.username,
            gender: profile.gender
        })

        await newPost.save()

        res.send(newPost)
    }
    catch (err) {
        res.status(500).send({ error: "Something went wrong." })
    }
})

// @route DELETE api/post/:_id
// @desc Delete post
// @access Private
router.delete('/:_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Check if the post's _id provided is a valid MongoDB ObjectID
        if (!mongoose.Types.ObjectId.isValid(req.params._id)) return res.status(400).send({ invalid_id: "The post ID you provided is invalid." })

        // Find post by ID and make sure the post.user === the logged in user. Otherwise, you cannot delete the post.
        const post = await Post.findById(req.params._id)

        if (!post) return res.status(404).send({ post_not_found: "That post does not exist." })

        if (post.user.toString() !== req.user._id.toString()) return res.status(401).send({ not_authorized: "You are not authorized to delete this post." })

        // Delete post
        await Post.findByIdAndDelete(req.params._id)

        res.send({ success: true })
    }
    catch (err) {
        res.status(500).send({ error: "Something went wrong." })
    }
})

// @route POST api/post/like/:post_id
// @desc Like a post
// @access Private 
router.post('/like/:post_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Find post
        const post = await Post.findById(req.params.post_id)

        if (!post) return res.status(404).send({ post_not_found: "That post does not exist." })

        // Make sure you cannot like twice
        if (post.likes.filter(cur => cur.user.toString() === req.user._id.toString()).length > 0) return res.status(401).send({ already_liked: "You have already liked this post" })

        // If you haven't liked the post, push user's id into post.likes array
        const newLike = {
            user: req.user._id
        }

        post.likes.push(newLike)

        await post.save()

        res.send(post)

    }
    catch (err) {
        res.status(500).send({ error: err.message })
    }
})

// @route DELETE api/post/unlike/:post_id
// @desc Unlike a post
// @access Private 
router.delete('/unlike/:post_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id)

        if (!post) return res.status(404).send({ post_not_found: "That post does not exist." })

        // Check if user has not liked the post
        if (post.likes.filter(cur => cur.user.toString() === req.user._id.toString()).length === 0) {
            return res.status(400).send({ not_liked: 'You have not liked this post.' })
        }

        // Find logged in user's like in the entire array to find the index
        const removeIndex = post.likes.map(cur => cur.user.toString()).indexOf(req.user._id.toString())

        // Remove likes from post.likes array.
        post.likes.splice(removeIndex, 1)

        await post.save()

        res.send(post)
    }
    catch (err) {
        res.status(500).send({ error: err.message })
    }
})

// @route POST api/post/comment/:post_id
// @desc Comment on a post
// @access Private 
router.post('/comment/:post_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Joi validation
        const { error } = validateComment(req.body)
        if (error) return res.status(400).send({ input_error: error.details[0].message })

        const post = await Post.findById(req.params.post_id)
        if (!post) return res.status(404).send({ post_not_found: "That post does not exist." })

        // Get profile.username of logged in user making comment.
        const profile = await Profile.findOne({ user: req.user._id })
        if (!profile) return res.status(404).send({ no_profile: "Please make a profile first." })

        const newComment = {
            user: req.user._id,
            name: req.user.name,
            text: req.body.text,
            username: profile.username
        }

        // Add comment to post.comments array
        post.comments.unshift(newComment)

        await post.save()

        res.send(post)
    }
    catch (err) {
        res.status(500).send({ error: err.message })
    }
})

// @route DELETE api/post/comment/:post_id/:comment_id
// @desc delete a comment
// @access Private 
router.delete('/comment/:post_id/:comment_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id)
        if (!post) return res.status(404).send({ post_not_found: "That post does not exist." })

        // Return error if comment is not in the post.comments array
        if (post.comments.filter(cur => cur._id.toString() === req.params.comment_id.toString()).length === 0) return res.status(404).send({ comment_not_found: "That comment does not exist." })

        // Find the index to remove from array
        const removeIndex = post.comments.map(cur => cur._id.toString()).indexOf(req.params.comment_id)

        // Before deleting, make sure that comment belongs to the logged in user
        if (post.comments[removeIndex].user.toString() !== req.user._id.toString()) return res.status(401).send({ not_authorized: "You are not authorized to delete this comment." })

        // If comment.user matches req.user._id, delete from array
        post.comments.splice(removeIndex, 1)

        await post.save()

        res.send(post)

    }
    catch (err) {
        console.log(err.message)
        res.status(500).send({ error: "Something went wrong." })
    }
})

module.exports = router