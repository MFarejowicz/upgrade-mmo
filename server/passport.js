const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (_accessToken, _refreshToken, profile, done) => {
      let user = await User.findOne({
        google_id: profile.id
      });
      if (!user) {
        user = new User({
          name: profile.displayName,
          google_id: profile.id,
          gold: 0
        });
        user = await user.save();
      }
      done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

module.exports = passport;
