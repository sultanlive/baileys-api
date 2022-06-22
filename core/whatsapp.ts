/* eslint-disable prettier/prettier */
/* eslint-disable capitalized-comments */
import { existsSync, readdir, rmSync } from 'fs'
import { join } from 'path'
import pino from 'pino'
import seqLogger from '../utils/seqLogger.js'
import makeWASocket, {
    useMultiFileAuthState,
    Browsers,
    DisconnectReason,
    delay,
    WASocket,
    UserFacingSocketConfig,
    AnyMessageContent,
    GroupMetadata,
} from '@adiwajshing/baileys'
import { toDataURL } from 'qrcode'
import __dirname from '../utils/dirname.js'
import response from '../utils/response.js'
import { SessionMap } from '../types'
import { Response } from 'express'
import { MessageRetryHandler } from '../controllers/messageController.js'

const sessions: Map<string, SessionMap> = new Map()
const retries = new Map()

const sessionsDir = (sessionId?: string) => {
    return join(__dirname, 'sessions_multi', sessionId ? `${sessionId}` : '')
}

const isSessionDirectoryExists = (sessionId: string) => {
    return existsSync(sessionsDir(sessionId))
}

const isSessionExists = (sessionId: string) => {
    return sessions.has(sessionId)
}

const shouldReconnect = (sessionId: string) => {
    let maxRetries = parseInt(process.env.MAX_RETRIES ?? '0') ?? 0
    let attempts = retries.get(sessionId) ?? 0

    maxRetries = maxRetries < 1 ? 1 : maxRetries

    if (attempts < maxRetries) {
        ++attempts

        console.log('Reconnecting...', { attempts, sessionId })
        retries.set(sessionId, attempts)

        return true
    }

    return false
}

const createSession = async (sessionId: string, isLegacy = false, res: Response | null = null) => {
    const logger = pino({ level: 'warn' })

    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir(sessionId))

    const handler = new MessageRetryHandler();
    /**
     * @type {import('@adiwajshing/baileys').CommonSocketConfig}
     */
    const waConfig: UserFacingSocketConfig = {
        auth: state,
        printQRInTerminal: process.env.PRINT_TERMINAL === 'true',
        logger,
        getMessage: handler.messageRetryHandler,
        browser: Browsers.ubuntu('Chrome'),
    }

    /**
     * @type {import('@adiwajshing/baileys').AnyWASocket}
     */
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Property 'default' does not exist on type
    const wa: WASocket = makeWASocket.default(waConfig)

    // Store.readFromFile(sessionsDir(`${sessionId}_store`))
    // store.bind(wa.ev)

    sessions.set(sessionId, { ...wa, isLegacy, handler })
    seqLogger.info({ sessionId }, `API. Session created. ID: ${sessionId}. StatusCode: ${200}`)

    wa.ev.on('creds.update', saveCreds)

    // Wa.ev.on('chats.set', ({ chats }) => {
    //     if (isLegacy) {
    //         store.chats.insertIfAbsent(...chats)
    //     }
    // })

    // Automatically read incoming messages, uncomment below codes to enable this behaviour
    /*
    wa.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0]

        if (!message.key.fromMe && m.type === 'notify') {
            await delay(1000)

            if (isLegacy) {
                await wa.chatRead(message.key, 1)
            } else {
                await wa.sendReadReceipt(message.key.remoteJid, message.key.participant, [message.key.id])
            }
        }
    })
    */

    interface ErrorOutput extends Error {
        output?: {
            statusCode: number
        }
    }

    interface LastDisconnect {
        error: ErrorOutput
        date: Date
    }

    wa.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        const last: LastDisconnect | undefined = lastDisconnect
        const statusCode: number | undefined = last?.error?.output?.statusCode

        if (connection === 'open') {
            retries.delete(sessionId)
            const session = getSession(sessionId)
            session?.sendPresenceUpdate('unavailable')
        }

        if (connection === 'close') {
            seqLogger.info(
                { sessionId, statusCode },
                `API. Session closed. ID: ${sessionId}. StatusCode: ${statusCode}`
            )

            if (statusCode === DisconnectReason.loggedOut || !shouldReconnect(sessionId)) {
                if (res && !res.headersSent) {
                    response(res, 500, false, 'Unable to create session.')
                }

                return deleteSession(sessionId, isLegacy)
            }

            setTimeout(
                () => {
                    createSession(sessionId, isLegacy, res)
                },
                statusCode === DisconnectReason.restartRequired
                    ? 0
                    : parseInt(process.env.RECONNECT_INTERVAL ?? '0') ?? 0
            )
        }

        if (update.qr) {
            if (res && !res.headersSent) {
                try {
                    const qr = await toDataURL(update.qr)

                    response(res, 200, true, 'QR code received, please scan the QR code.', { qr })

                    return
                } catch {
                    response(res, 500, false, 'Unable to create QR code.')
                }
            }

            try {
                await wa.logout()
            } catch {
            } finally {
                deleteSession(sessionId, isLegacy)
            }
        }
    })
}

/**
 * @returns {(import('@adiwajshing/baileys').AnyWASocket|null)}
 */
const getSession = (sessionId: string) => {
    return sessions.get(sessionId) ?? null
}

const getSessions = () => {
    return sessions
}

const deleteSession = (sessionId: string, isLegacy = false) => {
    if (isSessionDirectoryExists(sessionId)) {
        rmSync(sessionsDir(sessionId), { recursive: true, force: true })
    }

    if (isLegacy) {
        console.log('legacy')
    }

    sessions.delete(sessionId)
    retries.delete(sessionId)
}

/**
 * @description Method is not working, store disabled
 */

const getChatList = (sessionId: string, isGroup = false) => {
    const filter = isGroup ? '@g.us' : '@s.whatsapp.net'

    if (sessionId === null) {
        return []
    }

    return getSession(sessionId)?.store?.chats.filter((chat) => {
        return chat.id.endsWith(filter)
    })
}

/**
 * @param {import('@adiwajshing/baileys').AnyWASocket} session
 */
const isExists = async (session: SessionMap, jid: string, isGroup = false): Promise<boolean> => {
    try {
        interface PhoneMetadata {
            exists: boolean
            jid?: string
            id?: number | null
        }
        let result: PhoneMetadata | GroupMetadata = { exists: false, id: null }

        if (isGroup) {
            result = await session.groupMetadata(jid)

            return Boolean(result.id)
        }

        if (session.isLegacy) {
            [result] = await session.onWhatsApp(jid)
        } else {
            [result] = await session.onWhatsApp(jid)
        }

        return result.exists
    } catch {
        return false
    }
}

/**
 * @param {import('@adiwajshing/baileys').AnyWASocket} session
 */
const sendMessage = async (session: SessionMap, receiver: string, message: AnyMessageContent) => {
    try {
        await delay(1000)

        return session.sendMessage(receiver, message).then(session.handler?.addMessage);
    } catch {
        return Promise.reject(null) // eslint-disable-line prefer-promise-reject-errors
    }
}

const formatPhone = (phone: string) => {
    if (phone.endsWith('@s.whatsapp.net')) {
        return phone
    }

    let formatted = phone.replace(/\D/g, '')

    return (formatted += '@s.whatsapp.net')
}

const formatGroup = (group: string) => {
    if (group.endsWith('@g.us')) {
        return group
    }

    let formatted = group.replace(/[^\d-]/g, '')

    return (formatted += '@g.us')
}

const cleanup = () => {
    console.log('Running cleanup before exit.')

    // sessions.forEach((session, sessionId) => {
    //     if (!session.isLegacy) {
    //         Session.store.writeToFile(sessionsDir(`${sessionId}_store`))
    //     }
    // })
}

const init = () => {
    readdir(sessionsDir(), (err, directories) => {
        if (err) {
            throw err
        }

        for (const directoryName of directories) {
            if (!directoryName.includes('.')) {
                createSession(directoryName, false)
            }
        }
    })
}

export {
    isSessionExists,
    createSession,
    getSession,
    deleteSession,
    getChatList,
    isExists,
    sendMessage,
    formatPhone,
    formatGroup,
    cleanup,
    init,
    getSessions,
}
