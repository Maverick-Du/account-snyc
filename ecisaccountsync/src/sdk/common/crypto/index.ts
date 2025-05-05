import * as crypto from 'crypto'
import config from "../../../common/config";

const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH  = 16;

export function encryptCBC(encodeContent: string, sk: string) {
    const key = crypto.createHash('md5').update(sk).digest('hex')
    let iv = Buffer.from(key, 'utf8').slice(0, 16).toString('utf8')

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encodeValue = cipher.update(encodeContent, 'utf8', 'base64')
    encodeValue += cipher.final('base64')
    return encodeValue
}

export function decryptCBC(decodeKey: string, sk: string) {
    const key = crypto.createHash('md5').update(sk).digest('hex')
    const iv = Buffer.from(key, 'utf8').slice(0, 16).toString('utf8')

    const crypts = Buffer.from(decodeKey, 'base64').toString('binary')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decodeValue = decipher.update(crypts, 'binary', 'utf8')
    decodeValue += decipher.final('utf8')
    return decodeValue
}

export function getEncryptKey(uid: string) {
    return crypto.createHash('sha256').update(`${uid}${config.salt}`).digest('hex').slice(0, 32)
}

// 加密函数
export function encrypt(text: string, key: string) {
    const iv = crypto.randomBytes(GCM_IV_LENGTH); // 生成随机的初始化向量
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag(); // 获取认证标签

    const bufferLength = iv.length + encrypted.length + tag.length;
    const bufferResult = Buffer.concat([iv, encrypted, tag], bufferLength)
    return bufferResult.toString('base64')
}

// 解密函数
export function decrypt(encryptedData: string, key: string) {
    let bufferData: Buffer = Buffer.from(encryptedData, 'base64');

    const IV = bufferData.subarray(0, GCM_IV_LENGTH);
    const auth = bufferData.subarray(-GCM_TAG_LENGTH);
    bufferData = bufferData.subarray(IV.length, bufferData.length - GCM_TAG_LENGTH);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, IV);
    decipher.setAuthTag(auth)
    let receivedPlaintext: string = decipher.update(bufferData.toString('base64'), 'base64', 'utf8');
    receivedPlaintext += decipher.final('utf8');
    return receivedPlaintext;

}

