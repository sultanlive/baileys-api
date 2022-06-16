import pinoToSeq from 'pino-seq'
import pino from 'pino'

const stream = pinoToSeq.createStream({ serverUrl: process.env.SEQ_URL, apiKey: process.env.SEQ_API_KEY })
const seqLogger = pino({ name: 'pino-seq' }, stream)

export default seqLogger
