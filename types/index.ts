import { AuthenticationState, Contact, makeInMemoryStore, WASocket } from '@adiwajshing/baileys'
import { MessageRetryHandler } from '../controllers/messageController'

interface LegacyState {
    legacy?: {
        user: Contact
    }
}

type SessionState = AuthenticationState & LegacyState

export interface SessionMap extends WASocket {
    state?: SessionState
    isLegacy: boolean
    store?: ReturnType<typeof makeInMemoryStore>
    handler?: MessageRetryHandler
}
