const express = require('express')
const router = express.Router()
const AutoJiraTicketController = require('../controllers/AutoJiraTicketController');

router.post('/create-ticket', AutoJiraTicketController.createTicket);

module.exports = router