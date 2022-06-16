import 'dotenv/config'
import express from 'express'
import nodeCleanup from 'node-cleanup'
import routes from './routes/routes.js'
import { init, cleanup } from './core/whatsapp.js'
import seqLogger from './utils/seqLogger.js'

process.on('uncaughtException', (error) => {
    const { message, stack } = error
    seqLogger.fatal({ message, stack }, `API. Uncaught Error: ${message}`)
})

const app = express()
const host = process.env.HOST ?? '127.0.0.1'
const parsedPort = parseInt(process.env.PORT ?? '8888')

const port = isNaN(parsedPort) ? 8888 : parsedPort

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/', routes)

app.listen(port, () => {
    init()
    console.log(`Server is listening on http://${host}:${port}`)
    seqLogger.info({ port }, `API. Server start: PORT:${port}`)
})

nodeCleanup(cleanup)

export default app
