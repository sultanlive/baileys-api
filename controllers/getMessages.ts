/* eslint-disable capitalized-comments */
// import makeWASocket, { WASocket } from '@adiwajshing/baileys'
// import { Request, Response } from 'express'
// import { getSession } from '../core/whatsapp.js'
// import { SessionMap } from '../types/index.js'
// import response from '../utils/response.js'

// interface Cursor {
//     before?: {
//         id: unknown
//         fromMe: boolean
//     }
// }

// const getMessages = async (req: Request, res: Response) => {
//     const session: SessionMap & WASocket = getSession(res.locals.sessionId)

//     /* eslint-disable camelcase */
//     const { jid } = req.params
//     const { limit = 25, cursor_id = null, cursor_fromMe = null } = req.query

//     const cursor: Cursor = {}

//     if (cursor_id) {
//         cursor.before = {
//             id: cursor_id,
//             fromMe: Boolean(cursor_fromMe && cursor_fromMe === 'true'),
//         }
//     }
//     /* eslint-enable camelcase */

//     try {
//         let messages
//         const useCursor = 'before' in cursor ? cursor : null

//         if (session.isLegacy) {
//             messages = await session.fetchMessagesFromWA(jid, limit, useCursor)
//         } else {
//             messages = await session.store.loadMessages(jid, limit, useCursor)
//         }

//         response(res, 200, true, '', messages)
//     } catch {
//         response(res, 500, false, 'Failed to load messages.')
//     }
// }

// export default getMessages
