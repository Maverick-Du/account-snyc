import * as dotenv from 'dotenv'
import * as crypto from 'crypto'

dotenv.config()

const algorithm = [97, 101, 115, 45, 49, 50, 56, 45, 99, 98, 99]
const key = [
  57, 118, 65, 112, 120, 76, 107, 53, 71, 51, 80, 64, 101, 99, 105, 115
]
const iv = [
  101, 99, 105, 115, 35, 80, 51, 71, 53, 107, 76, 120, 112, 65, 118, 57
]

export function configuration<T>(): T {
  if (process.env.CNC_DEBUG) {
    return JSON.parse(process.env.CNC_SETTINGS)
  }

  const cfg = decrypt(process.env.CNC_SETTINGS)
  //向前兼容
  cfg.port = process.env.HTTP_KPORT ? process.env.HTTP_KPORT : 8000
  cfg.appId = process.env.AK
  cfg.appKey = process.env.SK
  return cfg as T
}

export function encrypt(cfg: object) {
  const txt = JSON.stringify(cfg)
  const k = Buffer.from(key)
  const v = Buffer.from(iv)
  const a = Buffer.from(algorithm)
  const cipher = crypto.createCipheriv(a.toString('utf-8'), k, v)
  return [cipher.update(txt, 'utf8', 'hex'), cipher.final('hex')].join('')
}

export function decrypt(cfg: string) {
  const k = Buffer.from(key)
  const v = Buffer.from(iv)
  const a = Buffer.from(algorithm)
  const cipher = crypto.createDecipheriv(a.toString('utf-8'), k, v)
  const txt = [cipher.update(cfg, 'hex', 'utf8'), cipher.final('utf-8')].join('')
  return JSON.parse(txt)
}
