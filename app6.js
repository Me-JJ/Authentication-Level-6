//jshint esversion:6

// Building a secrets storing app using Nodejs express mongoDb with mongoose
// with LEVEL 6 Authentication - > 
// USING OAuth Google via Passport  


import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';



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
        password:String,
        googleID:String,
        secret:String
    }
);

userSchema.plugin(passportLocalMongoose);

const user=mongoose.model("user",userSchema);

passport.use(user.createStrategy());

passport.serializeUser((user,done)=>
{
    done(null,user.id);
});
passport.deserializeUser((id,done)=>
{
    user.findById(id).then((result)=>
    {
        done(null,result);
    });
});

// ------------------------------------------// ------------------------------------------

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    //   console.log(profile);
      user.findOne({googleID:profile.id}).then(
          (result)=>
          {
              if(result)
              {
                  console.log("User already in DB : ", result);
                  return done(null,result);
              }
              else
              {
                  const newUser=new user({googleID:profile.id,email:profile.email,
                username:profile.displayName});
                newUser.save().then(
                    (result)=>
                    {
                        console.log("new user created : ", result);
                        return done(null,newUser);
                    }
                )
              }
          }
      )
  }
));

// ------------------------------------------// ------------------------------------------
app.get("/",(req,res)=>
{
    res.render("home.ejs");
});
// ------------------------------------------// ------------------------------------------

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: "/secrets",
        failureRedirect: "/login"
}));


app.get("/auth/google/failure",(req,res)=>
{
    res.send("can't Login ");
});
// ------------------------------------------// ------------------------------------------


app.get("/login",(req,res)=>
{
    res.render("login.ejs");
});

app.get("/secrets",(req,res)=>
{
    if(req.isAuthenticated())
    {
        user.find({"secret":{$ne:null}}).then(
            (result)=>
            {
                res.render("secrets.ejs",{content:result});
            }
        ).catch((err)=>{console.log("cant retrieve secrets",err)});
    }
    else
    {
        res.redirect("/login");
    }
});

app.get("/submit",(req,res)=>
{
    if(req.isAuthenticated())
    {
        res.render("submit.ejs");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/submit",(req,res)=>
{
    const submittedsecret=req.body.secret;
    // console.log(req.user);
    user.findById(req.user.id).then(
        (result)=>
        {
            result.secret=submittedsecret;
            result.save().then(()=>{console.log("secret saved")}).catch((err)=>{console.log("cant save a secret")});
            res.redirect("/secrets");
        }
    ).catch((err)=>{console.log("cant submit a secret: ",err)});
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
    user.register(({username: req.body.username}), req.body.password, function(err, user){
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

