import { validationResult } from 'express-validator'
import { NextFunction, Request, Response } from 'express'
import response from '../utils/response.js'

const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return response(res, 400, false, 'Please fill out all required input.')
    }

    next()
}

export default validate
