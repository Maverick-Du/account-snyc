import {Result} from '../../common/type';
import {Context, root} from '../../sdk/cognac/server';


root.get('/api/test/ping', async (ctx: Context) => {
  ctx.body = new Result(Result.SUCCESS_CODE, "success")
  return ctx
})
