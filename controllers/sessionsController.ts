import { Request, Response } from 'express'
import { isSessionExists, createSession, getSession, deleteSession, getSessions } from '../core/whatsapp.js'
import response from '../utils/response.js'

const find = (_: Request, res: Response) => {
    response(res, 200, true, 'Session found.')
}

const status = (_: Request, res: Response) => {
    const states = ['connecting', 'connected', 'disconnecting', 'disconnected']

    const session = getSession(res.locals.sessionId)
    let state = states[session?.ws.readyState]

    const isConnectedValidSession =
        state === 'connected' &&
        typeof (session?.isLegacy ? session.state?.legacy?.user : session?.user) !== 'undefined'
    state = isConnectedValidSession ? 'authenticated' : state

    let phone = null
    if (isConnectedValidSession && session?.user.id !== undefined) {
        phone = session?.user?.id.includes(':') ? session?.user?.id.split(':')[0] : session?.user?.id.split('@')[0]
    }

    response(res, 200, true, '', { status: state, phone })
}

interface SessionResponse {
    id: string
    state: string
    phone: string | null
}

const allStatus = (_: Request, res: Response) => {
    const states = ['connecting', 'connected', 'disconnecting', 'disconnected']
    const allSessions = getSessions()
    const sessions: SessionResponse[] = []

    allSessions.forEach((session, key) => {
        let state = states[session.ws.readyState]

        const isConnectedValidSession =
            state === 'connected' &&
            typeof (session.isLegacy ? session.state?.legacy?.user : session.user) !== 'undefined'
        state = isConnectedValidSession ? 'authenticated' : state

        let phone = null
        if (isConnectedValidSession && session.user.id !== undefined) {
            phone = session.user?.id.includes(':') ? session.user?.id.split(':')[0] : session.user?.id.split('@')[0]
        }

        sessions.push({
            id: key,
            state,
            phone
        })
    })

    response(res, 200, true, '', sessions)
}

const add = (req: Request, res: Response) => {
    const { id, isLegacy } = req.body

    if (isSessionExists(id)) {
        return response(res, 409, false, 'Session already exists, please use another id.')
    }

    createSession(id, isLegacy === 'true', res)
}

const del = async (req: Request, res: Response) => {
    const { id } = req.params
    const session = getSession(id)
    if (session === null) {
        return response(res, 400, false, 'The session not exists.')
    }

    try {
        await session?.logout()
    } catch {
    } finally {
        deleteSession(id, session?.isLegacy)
    }

    response(res, 200, true, 'The session has been successfully deleted.')
}

export { find, status, add, del, allStatus }
