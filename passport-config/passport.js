const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { User } = require('../models/User')
const config = require('config')

const opts = {}


opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.get('jwtPrivateKey');

module.exports = passport => {
    passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const user = await User.findById(jwt_payload._id)
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
                // or you could create a new account
            }

        } catch (err) {
            console.log(err)
        }
    }));
}