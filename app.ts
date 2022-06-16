import 'dotenv/config'
import express from 'express'
import nodeCleanup from 'node-cleanup'
import routes from './routes/routes.js'
import { init, cleanup } from './core/whatsapp'
import seqLogger from './utils/seqLogger'

process.on('uncaughtException', (error) => {
    const { message, stack } = error
    seqLogger.fatal({ message, stack }, `API. Uncaught Error: ${message}`)
})

const app = express()
const host = process.env.HOST ?? '127.0.0.1'
const port = parseInt(process.env.PORT ?? '8000')

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/', routes)

app.listen(port, () => {
    init()
    console.log(`Server is listening on http://${host}:${port}`)
    seqLogger.fatal({ port }, `API. Server start: PORT:${port}`)
})

nodeCleanup(cleanup)

export default app
