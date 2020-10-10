//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

// tis is very imp to get values from post req.
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Its my secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost/userdb', {useNewUrlParser: true,  useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

userSchema.index({
  email: 1,
  password:1,
  googleId:1
},{
    unique: true,
    sparse: true  //N.B:(sparse:true) is not a must for the compound unique indexing to work
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);

// passport.use(User.createStrategy());
//
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function( user, done ) {
    done( null, user.id);
});

passport.deserializeUser(function( user, done ) {
    done( null, user );
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    const doc = {
      email: profile.emails[0].value,
      googleId: profile.id
    }
    User.findOrCreate({ googleId: profile.id },doc, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function (req,res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["email","profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login",function (req,res){
  res.render("login");
});

app.get("/logout",function (req,res){
  req.logout();
  res.redirect("/");
});

app.get("/register",function (req,res){
  res.render("register");
});

app.post("/register",function (req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user) {
  if (err) {
    res.redirect("/register");
  }else{
    passport.authenticate("local")(req, res, function (){
      res.redirect("/secrets");
    });
  }
  });

});

app.get("/secrets",function (req, res){
  if (req.isAuthenticated()){
    res.render("secrets");
  }else {
    res.redirect("/login");
  }
});

app.post("/login",function(req, res){

  const user = new User({
    email: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
  if (err) { console.log(err); }
  else {
    passport.authenticate("local")(req, res, function (){
      res.redirect("/secrets");
    });
  }
  });
});

app.listen(3000, function (){
  console.log("Server started on port 3000");
})
