const mongoose = require('mongoose');


// User Schema 
const UserSchema = mongoose.Schema({
  
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Number
    }

}, { timestamps: true });




const User = mongoose.model('User', UserSchema);
module.exports = User;