declare namespace NodeJS {
    interface ImportMeta {
        __dirname: string
    }
    interface ProcessEnv {
        HOST: string
        PORT: string
        MAX_RETRIES: string
        RECONNECT_INTERVAL: string
        SEQ_URL: string
        SEQ_API_KEY: string
        PRINT_TERMINAL: string
    }
}
