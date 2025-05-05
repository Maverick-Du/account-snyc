import {Result} from '../../common/type';
import {Context, root} from '../../sdk/cognac/server';
import testDataService from "../../modules/service/TestDataService";


root.post('/api/test/data', async (ctx: Context) => {
  try {
    const file = ctx.request.files.file; // 获取上传的文件
    let companyId = ctx.state.companyId
    if (!file) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, "file is empty")
      return ctx
    }
    let data = await testDataService.testData(file, companyId)

    ctx.body = new Result(Result.SUCCESS_CODE, "success", data)
    return ctx
  } catch (e) {
    console.log(e)
    ctx.body = new Result(Result.FAIL_CODE, e.message)
    return ctx
  }
})
