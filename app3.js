//jshint esversion:6

// Building a secrets storing app using Nodejs express mongoDb with mongoose
// with LEVEL 3 Authentication - > Using MD5 as encryption pkg 
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";
import md5 from 'md5';


const app=express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


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

const user=mongoose.model("user",userSchema);

app.get("/",(req,res)=>
{
    res.render("home.ejs");
});

app.get("/login",(req,res)=>
{
    res.render("login.ejs");
});

app.get("/register",(req,res)=>
{
    res.render("register.ejs");
});

app.post("/register",(req,res)=>
{
    const newuser=new user({
        email:req.body.username,
        password:md5(req.body.password)
    });

    newuser.save().then(()=>
    {
        console.log("saved :" , req.body.username);
        res.render("secrets.ejs");
    }
    ).catch((err)=>{console.log(err)});
});

app.post("/login",async (req,res)=>
{
    const username=req.body.username;
    const pass=md5(req.body.password);
    try{   
        // db.inventory.find( { $and: [ { price: { $ne: 1.99 } }, { price: { $exists: true } } ] } )
        const query=await user.findOne({email:username});
        // console.log(query);
        if(query.password===pass)
        {
            res.render("secrets.ejs");
        }
        else 
        {
            res.send("Data don't match");
        }
    }
    catch(err)
    {
        res.send("Data not found");
    }


});









app.listen(3000,()=>{console.log("connected to port 3000")});

