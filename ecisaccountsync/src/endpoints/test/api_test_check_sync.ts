import {Result} from '../../common/type';
import {Context, root} from '../../sdk/cognac/server';
import testDataService from "../../modules/service/TestDataService";


root.post('/api/test/check', async (ctx: Context) => {
  try {
    let {companyId, taskId} = ctx.request.body
    if (!companyId || !taskId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, "companyId or taskId is empty")
      return ctx
    }
    let data = await testDataService.checkSync(companyId, taskId)
    ctx.body = new Result(Result.SUCCESS_CODE, "success", data)
    return ctx
  } catch (e) {
    console.log(e)
    ctx.body = new Result(Result.FAIL_CODE, e.message)
    return ctx
  }
})
