import * as crypto from 'crypto'

/**
 * decryptKey 用于解密ecis加密的key
 * @param decodeKey ecis加密key
 * @param sk ecis app sk
 * @returns decodeValue
 */
export function decryptKey(decodeKey: string, sk: string) {
  const key = crypto.createHash('md5').update(sk).digest('hex')
  const iv = Buffer.from(key, 'utf8').slice(0, 16).toString('utf8')

  const crypts = Buffer.from(decodeKey, 'base64').toString('binary')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decodeValue = decipher.update(crypts, 'binary', 'utf8')
  decodeValue += decipher.final('utf8')
  return decodeValue
}
