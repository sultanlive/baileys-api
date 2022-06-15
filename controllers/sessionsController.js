import { isSessionExists, createSession, getSession, deleteSession, getSessions } from './../whatsapp.js'
import response from './../response.js'

const find = (req, res) => {
    response(res, 200, true, 'Session found.')
}

const status = (req, res) => {
    const states = ['connecting', 'connected', 'disconnecting', 'disconnected']

    const session = getSession(res.locals.sessionId)
    let state = states[session.ws.readyState]

    const isConnectedValidSession =
        state === 'connected' && typeof (session.isLegacy ? session.state.legacy.user : session.user) !== 'undefined'
    state = isConnectedValidSession ? 'authenticated' : state

    let phone = null
    if (isConnectedValidSession && session.user.id !== undefined) {
        phone = session.user?.id.includes(':') ? session.user?.id.split(':')[0] : session.user?.id.split('@')[0]
    }

    response(res, 200, true, '', { status: state, phone })
}

const allStatus = (req, res) => {
    const states = ['connecting', 'connected', 'disconnecting', 'disconnected']
    const allSessions = getSessions()
    let sessions = []

    allSessions.forEach((session, key) => {
        let state = states[session.ws.readyState]

        const isConnectedValidSession =
            state === 'connected' && typeof (session.isLegacy ? session.state.legacy.user : session.user) !== 'undefined'
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
    });


    response(res, 200, true, '', sessions)
}

const add = (req, res) => {
    const { id, isLegacy } = req.body

    if (isSessionExists(id)) {
        return response(res, 409, false, 'Session already exists, please use another id.')
    }

    createSession(id, isLegacy === 'true', res)
}

const del = async (req, res) => {
    const { id } = req.params
    const session = getSession(id)

    try {
        await session.logout()
    } catch {
    } finally {
        deleteSession(id, session.isLegacy)
    }

    response(res, 200, true, 'The session has been successfully deleted.')
}

export { find, status, add, del, allStatus }
