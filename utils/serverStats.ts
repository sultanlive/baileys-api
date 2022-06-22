import seqLogger from './seqLogger'

const serverStats = () => {
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
                cpu
            },
            `API. Server log resources, uptime ${appUpTime / 60} min. PID: ${process.pid}`
        )
    }, ONE_MINUTE)
}

export default serverStats
