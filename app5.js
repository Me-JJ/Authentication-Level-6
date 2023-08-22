//jshint esversion:6

// Building a secrets storing app using Nodejs express mongoDb with mongoose
// with LEVEL 5 Authentication - > 
// USING SESSION AND COOKIES using Passport PKG 


import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";

const app=express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret:"iwillnevergiveup",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://jatin:jatin123456@cluster0.mht7oii.mongodb.net/userDB?retryWrites=true&w=majority").then(
    ()=>{console.log("connected succesfully to MongoDB")}
).catch((err)=>
{
    console.log("Error while connecting to DB : ",err);
});

const userSchema=new mongoose.Schema(
    {
        email:String,
        password:String
    }
);

userSchema.plugin(passportLocalMongoose);

const user=mongoose.model("user",userSchema);

passport.use(user.createStrategy());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());


app.get("/",(req,res)=>
{
    res.render("home.ejs");
});

app.get("/login",(req,res)=>
{
    res.render("login.ejs");
});

app.get("/secrets",(req,res)=>
{
    if(req.isAuthenticated())
    {
        res.render("secrets.ejs");
    }
    else
    {
        res.redirect("/login");
    }
});

app.get("/logout",(req,res)=>
{
    req.logout(function(err) {
        if (err) { console.log(err); }
        else
        res.redirect('/');
      });
});

app.get("/register",(req,res)=>
{
    res.render("register.ejs");
});

app.post("/register",(req,res)=>
{
    console.log(req.body.username);
    user.register(({email: req.body.username}), req.body.password, function(err, user){
        if(err)
        {
            console.log("registeration error-->",err,user);
            res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req,res,()=>
            {
                res.redirect("/secrets");
            })
        }
    });
});

app.post("/login",(req,res)=>
{
    const username=req.body.username;
    const pass=req.body.password;
    const newuser=new user({
        username:username,
        password:pass
    })
    // from passport 
    req.login(newuser,(err)=>
    {
        if(err)
        {
            console.log("login error",err);
            res.send("crediatials not found");
        }
        else{
            passport.authenticate("local")(req,res,()=>
            {
                res.redirect("/secrets");
            });
        }
    })
});









app.listen(3000,()=>{console.log("connected to port 3000")});

