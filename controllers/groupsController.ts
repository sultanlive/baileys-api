import { Request, Response } from 'express'
import { getSession, getChatList, isExists, sendMessage, formatGroup } from '../core/whatsapp.js'
import response from '../utils/response.js'

const getList = (_: Request, res: Response) => {
    return response(res, 200, true, '', getChatList(res.locals.sessionId, true))
}

const getGroupMetaData = async (req: Request, res: Response) => {
    const session = getSession(res.locals.sessionId)
    const { jid } = req.params

    try {
        const data = await session.groupMetadata(jid)

        if (!data.id) {
            return response(res, 400, false, 'The group is not exists.')
        }

        response(res, 200, true, '', data)
    } catch {
        response(res, 500, false, 'Failed to get group metadata.')
    }
}

const send = async (req: Request, res: Response) => {
    const session = getSession(res.locals.sessionId)
    const receiver = formatGroup(req.body.receiver)
    const { message } = req.body

    try {
        const exists = await isExists(session, receiver, true)

        if (!exists) {
            return response(res, 400, false, 'The group is not exists.')
        }

        await sendMessage(session, receiver, message)

        response(res, 200, true, 'The message has been successfully sent.')
    } catch {
        response(res, 500, false, 'Failed to send the message.')
    }
}

export { getList, getGroupMetaData, send }
