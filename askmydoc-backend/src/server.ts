import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()

import documentRoutes from './routes/documents'
import chatRoutes from './routes/chat'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://askmydoc.com' : 'http://localhost:4200',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}))

app.use(express.json({ limit: '10mb'}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/documents', documentRoutes)
app.use('/api/chat', chatRoutes)

app.get('/api/health', (req, res)=>{
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    })
})


const startServer = async () => {
    try{
        const mongoUri = process.env.MONGODB_URI
        if(!mongoUri){
            throw new Error('MONGODB_URI is not defined in environment variables')
        }
        await mongoose.connect(mongoUri)
        console.log('Connected to MongoDB')
        app.listen(PORT, ()=>{
            console.log(`Server is running on port ${PORT}`)
            console.log('Environment:', process.env.NODE_ENV)
        })
    } catch (error){
        console.error('Error starting server:', error)
        process.exit(1) 
    }
}

startServer()