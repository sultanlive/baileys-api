import { Response } from 'express'

const response = (res: Response, statusCode = 200, success = false, message = '', data = {}) => {
    res.status(statusCode)
    res.json({
        success,
        message,
        data
    })

    res.end()
}

export default response
