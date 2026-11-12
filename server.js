require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/database')
const errorHandler = require('./middleware/errorHandler')
const app = express()
// Connect DB
connectDB()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auto-jira-tickets', require('./routes/AutoJiraTicketRoutes'))

// Handle unmatched routes and application errors
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
})
app.use(errorHandler)

// Server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))