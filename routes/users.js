const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');



// GET Users model
const User = require('../models/user');



/*
* GET register
*/
router.get('/register', (req, res) => {

    res.render('register', {
        title: 'Register'
    });

});



/*
* POST register
*/
router.post('/register', (req, res) => {

    let name = req.body.name;
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;
    let password1 = req.body.password1;

    // validate fields in register.ejs form
    req.checkBody('name', 'Name is required!').notEmpty();
    req.checkBody('email', 'Email is required!').notEmpty();
    req.checkBody('email', 'Email is not valid!').isEmail();
    req.checkBody('username', 'Username is required!').notEmpty();
    req.checkBody('password', 'Password is required!').notEmpty();
    req.checkBody('password1', 'Passwords do not match!').equals(password);

    let errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors,
            user: null,
            title: 'Register'
        });
    } else {
        User.findOne({username: username}, function(err, user) {
            if (err) console.log(err);

            if (user) {
                req.flash('danger', 'Username exists, choose another!');
                res.redirect('/users/register');
            } else {
                let user = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    admin: 0
                });

                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(user.password, salt, function(err, hash) {
                        if (err) console.log(err);

                        user.password = hash;

                        user.save(function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.flash('success', 'You are now registered!');
                                res.redirect('/users/login');
                            }
                        });
                    });
                });
            }

        });
    }

});



/*
* GET login
*/
router.get('/login', (req, res) => {

    if (res.locals.user) {
        return res.redirect('/');
    }

    res.render('login', {
        title: 'Login'
    });

});



/*
* POST login
*/
router.post('/login', (req, res, next) => {
    // console.log(req.session.isLoggedIn)
    req.session.isLoggedIn = true;
    
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);

});



/*
* GET logout
*/
router.get('/logout', (req, res) => {
    
    req.logout();
    req.flash('success', 'You are logged out!');
    res.redirect('/users/login');

    // req.session.destroy((err) => {
    //     if (err) {
    //         console.log(err)
    //     }
    //     // console.log('Destroyed session')
    //  })

});



// Exports
module.exports = router;
