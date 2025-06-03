const express = require('express')
const { login, signup } = require('../controller/authController')
const authRouter = express.Router()

authRouter.post('/login',login)
authRouter.post('/signup',signup)

module.exports = authRouter