import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/app/lifecycle/callback', async (ctx: Context) => {
  try {
    ctx.body = {
      code: 0,
      msg: 'success'
    }
  } catch (err) {
    log.error(err);
    ctx.body = {
      code: 500,
      msg: err?.message
    }
  }
  return ctx
})
