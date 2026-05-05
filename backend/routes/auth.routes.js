const express = require('express');
const router = express.Router()
const { body } = require('express-validator');
const Controller = require('../controller/auth.controller')

// Route1: create user POST: "/api/auth/createuser".
router.post(
    '/createuser',
    [
        body('name', 'Enter a valid name').isLength({min:3}),
        body('email', 'Enter a valid email').isEmail(),
        body('password', 'Passwrod must be greater than 5 characters').isLength({min:3})
    ],
    Controller.createUser
);

// Route2: Authenticate the user and Login POST "api/auth/login",
router.post(
    '/login',
    [
        body('email', 'Enter a valid email').isEmail(),
        body('password', 'Password cannot be empty').exists()
    ],
    Controller.loginUser
);

// Route3: Delete the user and Login DELETE "api/auth/delete/:id",
router.delete(
    '/delete/:id',
    Controller.deleteUser
);

module.exports = router;