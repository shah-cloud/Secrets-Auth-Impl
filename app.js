//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
var md5 = require('md5');

mongoose.connect('mongodb://localhost/userdb', {useNewUrlParser: true,  useUnifiedTopology: true});

const app = express();

app.set('view engine', 'ejs');

// tis is very imp to get values from post req.
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});


const User = mongoose.model("User",userSchema);

app.get("/",function (req,res){
  res.render("home");
});

app.get("/login",function (req,res){
  res.render("login");
});

app.get("/logout",function (req,res){
  res.redirect("/");
});

app.get("/register",function (req,res){
  res.render("register");
});

app.post("/register",function (req, res){

  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password)
  });

  newUser.save(function(err){
    if(err){
      res.send(err);
    }else {
      res.render("secrets");
    }
  });

});

app.post("/login",function(req, res){
  const email= req.body.username;
  const password= md5(req.body.password);

  User.findOne({email: email},function(err,foundUser){
    if (err){
      res.send(err);
    }else {
      if (foundUser.password === password) {
        res.render("secrets");
      }else {
        res.send("invalid password");
      }
    }
  });
});

app.listen(3000, function (){
  console.log("Server started on port 3000");
})
