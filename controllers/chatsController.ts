import { Request, Response } from 'express'
import { getSession, getChatList, isExists, sendMessage, formatPhone } from '../core/whatsapp.js'
import response from '../utils/response.js'

const getList = (_: Request, res: Response) => {
    return response(res, 200, true, '', getChatList(res.locals.sessionId))
}

const send = async (req: Request, res: Response) => {
    const session = getSession(res.locals.sessionId)
    const receiver = formatPhone(req.body.receiver)
    const { message } = req.body

    if (session === null) {
        return response(res, 400, false, 'The session not exists.')
    }

    try {
        const exists = await isExists(session, receiver)

        if (!exists) {
            return response(res, 400, false, 'The receiver number is not exists.')
        }

        await session.sendPresenceUpdate('available')

        await sendMessage(session, receiver, message)

        response(res, 200, true, 'The message has been successfully sent.')
    } catch {
        response(res, 500, false, 'Failed to send the message.')
    } finally {
        session.sendPresenceUpdate('unavailable')
    }
}

const sendBulk = async (req: Request, res: Response) => {
    const session = getSession(res.locals.sessionId)
    const errors = []

    if (session === null) {
        return response(res, 400, false, 'The session not exists.')
    }

    for (const [key, data] of req.body.entries()) {
        if (!data.receiver || !data.message) {
            errors.push(key)

            continue
        }

        data.receiver = formatPhone(data.receiver)

        try {
            const exists = await isExists(session, data.receiver)

            if (!exists) {
                errors.push(key)

                continue
            }

            await sendMessage(session, data.receiver, data.message)
        } catch {
            errors.push(key)
        }
    }

    if (errors.length === 0) {
        return response(res, 200, true, 'All messages has been successfully sent.')
    }

    const isAllFailed = errors.length === req.body.length

    response(
        res,
        isAllFailed ? 500 : 200,
        !isAllFailed,
        isAllFailed ? 'Failed to send all messages.' : 'Some messages has been successfully sent.',
        { errors }
    )
}

export { getList, send, sendBulk }
