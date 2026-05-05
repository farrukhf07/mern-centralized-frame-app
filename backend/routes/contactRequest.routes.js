const express = require('express')
const router = express.Router()
const fetchbearuser = require('../middleware/bearuser');
const Controller = require('../controller/contactRequest.controller')

// Route1: Send Email using: POST "/api/contact/sendMail".
router.post(
    '/sendMail',
    Controller.sendEmail
);

// Route2: getAllrequest using: GET "/api/contact/requests".
router.get('/requests',
    Controller.getAllRequests
);

// Route3: accept request using: PUT "/api/contact/requests/accept/:id".
router.put(
    '/requests/accept/:id',
    fetchbearuser,
    Controller.acceptRequest
);

// Route4: reject request using: PUT "/api/contact/requests/reject/:id".
router.put(
    '/requests/reject/:id',
    fetchbearuser,
    Controller.rejectRequest
);

// Route9: reject request using: PUT "/api/contact/requests/deleteRequest/:id".
router.delete(
    '/requests/deleteRequest/:id',
    fetchbearuser,
    Controller.deleteRequest
);



module.exports = router;