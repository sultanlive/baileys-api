import { NextFunction, Request, Response } from 'express'
import { isSessionExists } from '../core/whatsapp.js'
import response from '../utils/response.js'

const validate = (req: Request, res: Response, next: NextFunction) => {
    const sessionId = String(req.query.id ?? req.params.id)

    if (!isSessionExists(sessionId)) {
        return response(res, 404, false, 'Session not found.')
    }

    res.locals.sessionId = sessionId
    next()
}

export default validate
