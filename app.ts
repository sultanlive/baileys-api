import 'dotenv/config'
import express from 'express'
import nodeCleanup from 'node-cleanup'
import routes from './routes/routes.js'
import { init, cleanup } from './core/whatsapp.js'
import seqLogger from './utils/seqLogger.js'
import serverStats from './utils/serverStats.js'

serverStats()

const app = express()
const host = process.env.HOST ?? '127.0.0.1'
const parsedPort = parseInt(process.env.PORT ?? '8888')

const port = isNaN(parsedPort) ? 8888 : parsedPort

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/', routes)

app.listen(port, () => {
    init()
    seqLogger.info(
        { port, version: process.version, v8: process.versions.v8, platform: process.platform },
        `API. Server started. PID: ${process.pid}`
    )
    console.log(`Server is listening on http://${host}:${port}`)
})

nodeCleanup(cleanup)

export default app
