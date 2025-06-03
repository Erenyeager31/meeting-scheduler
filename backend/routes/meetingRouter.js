const express = require('express');
const meetingRouter = express.Router();

const meetingController = require('../controller/meetingController');
const { authenticate } = require('../midleware/auth');

meetingRouter.get('/getBookedSlots',authenticate, meetingController.getBookedSlots);

// GET available slots for a specific day
meetingRouter.get('/getAll',authenticate, meetingController.getAvailableSlots);

// POST to book a new meeting
meetingRouter.post('/book',authenticate, meetingController.bookMeeting);

// PUT to reschedule an existing meeting
meetingRouter.patch('/reschedule/:id',authenticate, meetingController.rescheduleMeeting);

// DELETE to cancel a meeting (if it has not started)
meetingRouter.delete('/cancel/:id',authenticate, meetingController.cancelMeeting);

module.exports = meetingRouter;