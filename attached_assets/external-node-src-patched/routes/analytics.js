const express = require('express');
const router = express.Router();
const analyticsController = require("../controllers/analytics")
const passport = require("passport");
router.get('/', analyticsController.getSellerAnalytics);

module.exports = router;