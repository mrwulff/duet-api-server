// Imports
import passport from 'passport';
import { BasicStrategy } from 'passport-http';
require('dotenv').config();

// basic auth (admin only, for now)
const duet_admin_username = process.env.DUET_API_ADMIN_USERNAME;
const duet_admin_password = process.env.DUET_API_ADMIN_PASSWORD;

// configure basic auth
passport.use(new BasicStrategy(
  function (username, password, done) {
    if (username !== duet_admin_username) {
      return done(null, false, { message: "Incorrect username" });
    }
    if (password !== duet_admin_password) {
      return done(null, false, { message: "Incorrect password" });
    }
    const admin_user = {
      username: duet_admin_username,
      password: duet_admin_password
    };
    return done(null, admin_user, { scope: 'all' });
  }
));

export {
  passport
}
