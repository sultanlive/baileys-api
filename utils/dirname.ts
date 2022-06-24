import { dirname, resolve } from "path";
import { fileURLToPath } from 'url'

const __dirname = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export default __dirname
