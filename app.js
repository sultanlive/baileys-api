import 'dotenv/config'
import express from 'express'
import nodeCleanup from 'node-cleanup'
import routes from './routes.js'
import { init, cleanup } from './whatsapp.js'
import seqLogger from './utils/seqLogger.js'

process.on('uncaughtException', (error) => {
    const { message, stack } = error
    seqLogger.fatal({ message, stack }, `API. Uncaught Error: ${message}. PID: ${process.pid}`)
})

process.on('uncaughtExceptionMonitor', (error) => {
    const { message, stack } = error
    seqLogger.fatal({ message, stack }, `API. Uncaught Error Monitor: ${message}. PID: ${process.pid}`)
})

process.on('beforeExit', (code) => {
    seqLogger.warn({ code }, `API. Server exit with code ${code}. PID: ${process.pid}`)
})

process.on('unhandledRejection', (reason, promise) => {
    seqLogger.fatal(
        { reason, promise },
        `API. Unhandled Rejection at ${promise}, reason: ${reason}. PID: ${process.pid}`
    )
})

process.on('warning', (warning) => {
    seqLogger.warn({ warning }, `API. Server warning - ${warning.message}. PID: ${process.pid}`)
})

const ONE_MINUTE = 1000 * 60

setInterval(() => {
    const memory = process.memoryUsage()
    const cpu = process.cpuUsage()
    const appUpTime = Math.floor(process.uptime())
    seqLogger.info(
        {
            memory,
            cpu,
        },
        `API. Server log resources, uptime ${appUpTime / 60} min. PID: ${process.pid}`
    )
}, ONE_MINUTE)

const app = express()
const host = process.env.HOST ?? '127.0.0.1'
const port = parseInt(process.env.PORT ?? 8000)

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
