import * as crypto from 'crypto'
import { format } from 'date-fns'
import config from "./config";

export function getOriginTaskId(taskId: string): string {
  return taskId.split('_')[0]
}

export function md5(content: string) {
  const md5 = crypto.createHash('md5')
  return md5.update(content).digest('hex').slice(8,24)
}

export function formatTimeToSQL(time: number) {
  return format(time, 'yyyy-MM-dd HH:mm:ss')
}

// 解密获取ak、sk
export function getAkSk() {
    const ak = process.env.AK;
    let sk = '';
    // 硬编码至代码中
    const SK_PART = 'vY9rkkNi6wL26hir6j4ahaPvQHj6vKVf'

    if (!process.env.SK_SALT) {
        sk = process.env.SK;
    } else {
        try {
            let skSalt = process.env.SK_SALT
            const skSaltBuffer = Buffer.from(skSalt, 'base64');
            const key = getContentHash(SK_PART).slice(0, 16);
            const iv = getContentHash(ak).slice(0, 16);
            const appKeyByte = cbcDecrypt(skSaltBuffer, key, iv);
            sk = appKeyByte.toString();
        } catch (err) {
          throw new Error(`plugin SK decrypt error: ${err.message}`)
        }
    }
    return { ak, sk };
}

// AES-CBC解密函数
function cbcDecrypt(encryptedData: Buffer, key: string, iv: string) {
  // 将key和iv从字符串转换为Buffer（字节数组）
  const keyBuffer = Buffer.from(key, 'utf8');
  const ivBuffer = Buffer.from(iv, 'utf8');

  // 创建AES-CBC解密器
  const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuffer, ivBuffer);

  // 解密数据（输入为Hex格式）
  let decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
  ]);

  // 获取填充的字节数
  const padding = decrypted[decrypted.length - 1];

  // 去除填充部分
  if (padding > 0 && padding <= 16) {
      decrypted = decrypted.slice(0, -padding);
  }

  return decrypted.toString('utf8');
}

function getContentHash(content: string) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 若开启字符串大小写敏感开关，则需要将字段内容由16进制转为字符串
 * @param str 字段内容
 */
export function getFieldOriginContent(str: string): string {
    if (config.caseSensitive) {
        // 截取前缀 {Encrypt:hex}
        let str1 = str.substring(13)
        return Buffer.from(str1, 'hex').toString('utf8');
    } else {
        return str
    }
}

export function getFieldOriginContents(strs: string[]): string[] {
    if (config.caseSensitive) {
        return strs.map(str => getFieldOriginContent(str))
    } else {
        return strs
    }
}

/**
 * 根据配置判断是否需要对字段内容进行处理
 * 若开启字符串大小写敏感开关，则需要将字段内容转16进制
 * @param str
 */
export function getFieldDbContent(str: string): string {
    if (config.caseSensitive) {
        return `{Encrypt:hex}${Buffer.from(str, 'utf8').toString('hex')}`
    } else {
        return str
    }
}

export function getFieldDbContents(strs: string[]): string[] {
    if (config.caseSensitive) {
        return strs.map(str => getFieldDbContent(str))
    } else {
        return strs
    }
}
