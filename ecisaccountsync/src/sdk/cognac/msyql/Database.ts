import {
  DeleteResult,
  IDatabase,
  InsertResult,
  SelectResult,
  UpdateResult
} from '../orm'
import * as mysql from 'mysql2'

export class Database implements IDatabase {
  name: string
  retryCount: number
  private pool: mysql.Pool

  init(config: mysql.PoolOptions, retryCount: number = 0): Promise<void> {
    let newConfig = {
      connectionLimit: 10,
      enableKeepAlive: true, // 开启keepAlive
      keepAliveInitialDelay: 10000, // 10s发送一个心跳
      waitForConnections: true, // 没有可用连接时等待
      idleTimeout: 30000,// 30秒
      ...config
    } as mysql.PoolOptions
    this.pool = mysql.createPool(newConfig)
    this.retryCount = retryCount

    // 监听单个连接的异常
    this.pool.on('connection', (connection) => {
      connection.on('error', (err) => {
        console.error('数据库连接错误:', err);
      });
    });

    return new Promise<void>((resolve, reject) => {
      this.pool.query('select 1;', err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  unint() {
    return new Promise<void>((resolve, reject) => {
      if (this.pool) {
        this.pool.end(e => (e ? resolve() : reject(e)))
        this.pool = null
      }
    })
  }

  select(sql: string, values: any[], retryCount: number = this.retryCount): Promise<SelectResult> {
    return new Promise((resolve, reject) => {
      // 获取单独的连接
      this.pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }

        connection.query(sql, values, (err: any, rows: any, fields: any) => {
          // 检测连接错误
          if (err && (
              err.code === 'PROTOCOL_CONNECTION_LOST' ||
              err.code === 'ECONNRESET' ||
              err.message.includes('disconnected by the server because of inactivity')
          )) {
            console.info(`检测到连接断开，销毁有问题的连接, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`);

            // 销毁有问题的连接而不是释放
            try {
              connection.destroy();
            } catch (e) {
              console.error('销毁连接出错', e);
            }

            if (retryCount <= 0) {
              return reject(new Error(`数据库连接失败，超过最大重试次数, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`));
            }

            // 延迟后重试
            return setTimeout(() => {
              console.info(`数据库重试第${this.retryCount - retryCount + 1}次重试, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`)
              this.select(sql, values, retryCount - 1).then(resolve).catch(reject);
            }, 1000);
          }

          // 正常情况下，释放连接回连接池
          try {
            connection.release();
          } catch (e) {
            console.error('释放连接出错', e);
          }

          if (err) {
            reject(err);
          } else {
            resolve({ code: 'ok', data: { rows } });
          }
        });
      });
    });
  }

  update(sql: string, values: any[], retryCount: number = this.retryCount): Promise<UpdateResult> {
    return new Promise((resolve, reject) => {
      // 获取单独的连接
      this.pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }

        connection.query(sql, values, (err: any, rows: any, fields: any) => {
          // 检测连接错误
          if (err && (
              err.code === 'PROTOCOL_CONNECTION_LOST' ||
              err.code === 'ECONNRESET' ||
              err.message.includes('disconnected by the server because of inactivity')
          )) {
            console.info(`检测到连接断开，销毁有问题的连接, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`);

            // 销毁有问题的连接
            try {
              connection.destroy();
            } catch (e) {
              console.error('销毁连接出错', e);
            }

            if (retryCount <= 0) {
              return reject(new Error(`数据库连接失败，超过最大重试次数, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`));
            }

            // 延迟后重试
            return setTimeout(() => {
              console.info(`数据库重试第${this.retryCount - retryCount + 1}次重试, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`)
              this.update(sql, values, retryCount - 1).then(resolve).catch(reject);
            }, 1000);
          }

          // 正常情况下释放连接
          try {
            connection.release();
          } catch (e) {
            console.error('释放连接出错', e);
          }

          if (err) {
            reject(err);
          } else {
            resolve({ code: 'ok', data: { affect: rows } });
          }
        });
      });
    });
  }

  insert(sql: string, values: any[], retryCount: number = this.retryCount): Promise<InsertResult> {
    return new Promise((resolve, reject) => {
      // 获取单独的连接
      this.pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }

        connection.query(sql, values, (err: any, rows: any, fields: any) => {
          // 检测连接错误
          if (err && (
              err.code === 'PROTOCOL_CONNECTION_LOST' ||
              err.code === 'ECONNRESET' ||
              err.message.includes('disconnected by the server because of inactivity')
          )) {
            console.info(`检测到连接断开，销毁有问题的连接, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`);

            // 销毁有问题的连接
            try {
              connection.destroy();
            } catch (e) {
              console.error('销毁连接出错', e);
            }

            if (retryCount <= 0) {
              return reject(new Error(`数据库连接失败，超过最大重试次数, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`));
            }

            // 延迟后重试
            return setTimeout(() => {
              console.info(`数据库重试第${this.retryCount - retryCount + 1}次重试, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`)
              this.insert(sql, values, retryCount - 1).then(resolve).catch(reject);
            }, 1000);
          }

          // 正常情况下释放连接
          try {
            connection.release();
          } catch (e) {
            console.error('释放连接出错', e);
          }

          if (err) {
            reject(err);
          } else {
            resolve({ code: 'ok', data: { affect: rows.insertId } });
          }
        });
      });
    });
  }

  delete(sql: string, values: any[], retryCount: number = this.retryCount): Promise<DeleteResult> {
    return new Promise((resolve, reject) => {
      // 获取单独的连接
      this.pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }

        connection.query(sql, values, (err: mysql.QueryError, rows: any, fields: any) => {
          // 检测连接错误
          if (err && (
              err.code === 'PROTOCOL_CONNECTION_LOST' ||
              err.code === 'ECONNRESET' ||
              err.message.includes('disconnected by the server because of inactivity')
          )) {
            console.info(`检测到连接断开，销毁有问题的连接, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`);

            // 销毁有问题的连接
            try {
              connection.destroy();
            } catch (e) {
              console.error('销毁连接出错', e);
            }

            if (retryCount <= 0) {
              return reject(new Error(`数据库连接失败，超过最大重试次数, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`));
            }

            // 延迟后重试
            return setTimeout(() => {
              console.info(`数据库重试第${this.retryCount - retryCount + 1}次重试, sql: ${sql}, values: ${values}, code: ${err.code}, message: ${err.message}`)
              this.delete(sql, values, retryCount - 1).then(resolve).catch(reject);
            }, 1000);
          }

          // 正常情况下释放连接
          try {
            connection.release();
          } catch (e) {
            console.error('释放连接出错', e);
          }

          if (err) {
            reject(err);
          } else {
            resolve({ code: 'ok', data: { affect: rows } });
          }
        });
      });
    });
  }
}
