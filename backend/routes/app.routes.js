const express = require('express');
const router = express.Router();
// const fetchbearuser = require('../middleware/bearuser');
const Controller = require('../controller/appSchema.controller');

// Route1: Create new App using: POST "api/app/create-new-app"
router.post(
    '/create-new-app',
    // fetchbearuser,
    Controller.createApp
);

// Route2: Get All App using: GET "api/app/get-all-app"
router.get(
    '/get-all-app',
    Controller.getAllApp
);

// Route3: Update App using: PUT "api/app/update-app"
router.put(
    '/update-app/:id',
    // fetchbearuser,
    Controller.editApp
);

// Route4: Delete App using: DELETE "api/app/delete-app"
router.delete(
    '/delete-app/:id',
    // fetchbearuser,
    Controller.deleteApp
);


module.exports = router;