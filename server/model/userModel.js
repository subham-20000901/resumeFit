import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:[true,"username already taken"],
        reuired:true,
    },
       email:{
        type:String,
        unique:[true,"Account already exists with this email address"],
        reuired:true,
    },
       password:{
        type:String,
        reuired:true,
    },
},{timestamps:true})

const User = mongoose.model("User",userSchema);

export default User;