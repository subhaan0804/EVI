const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/users");

const userDetails = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    dob: {
        type: String,
        required: true,
    },
    roll10: {
        type: String,
        required: true,
    },
    passYear10: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phoneno: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    aadhar: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    }
});

const user = mongoose.model("login_details", userDetails);

module.exports = user;