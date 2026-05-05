const express = require('express')
const router = express.Router()
const fetchbearuser = require('../middleware/bearuser');
const Controller = require('../controller/user.controller')

// Route1: Get loggedin User Details using: GET "/api/user/all-user". Login required
router.get(
    '/all-users', 
    fetchbearuser,
    Controller.getAllUsers
);

// Route4: Update User using: PUT "/api/user/users/:userId".
router.put(
    '/users/:userId',
    fetchbearuser,
    Controller.updateUser
);

// Route5: Get User Role using: GET "/api/user/me".
router.get(
    '/me',
    fetchbearuser,
    Controller.fetchRole
);


module.exports = router;