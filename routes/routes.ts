import { Request, Response, Router } from 'express'
import sessionsRoute from './sessionsRoute.js'
import chatsRoute from './chatsRoute.js'
import groupsRoute from './groupsRoute.js'
import response from '../utils/response.js'

const router = Router()

router.use('/sessions', sessionsRoute)
router.use('/chats', chatsRoute)
router.use('/groups', groupsRoute)

router.all('*', (_: Request, res: Response) => {
    response(res, 404, false, 'The requested url cannot be found.')
})

export default router
