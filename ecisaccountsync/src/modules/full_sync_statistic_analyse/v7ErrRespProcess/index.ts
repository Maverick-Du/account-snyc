import { CustomAxiosError } from "../../../sdk/common/wps4";
import { StatisticAnalyseErrType, StatisticAnalyseTbType } from "../../db/types";

class V7ErrRespProcess {
  private ErrCodeToErrTypeMap: Map<number, StatisticAnalyseErrType> = new Map([
    [400002002, StatisticAnalyseErrType.UserAccountDisabled],
    [400002021, StatisticAnalyseErrType.UserParamFormatError],
    [400002022, StatisticAnalyseErrType.UserValueInvalidError],
    [400002023, StatisticAnalyseErrType.UserParamUnsupported],
    [400002027, StatisticAnalyseErrType.UserAccountInvalid],
    [400002028, StatisticAnalyseErrType.UserNickNameInvalid],
    [400002029, StatisticAnalyseErrType.UserGenderInvalid],
    [400002032, StatisticAnalyseErrType.UserEmployeeIdInvalid],
    [400002033, StatisticAnalyseErrType.UserMobilePhoneInvalid],
    [400002036, StatisticAnalyseErrType.UserEmailInvalid],
    [400002035, StatisticAnalyseErrType.UserTelephoneInvalid],
    [400002034, StatisticAnalyseErrType.UserTitleInvalid],
    [400002037, StatisticAnalyseErrType.UserEmploymentTypeInvalid],
    [400002038, StatisticAnalyseErrType.UserEmploymentStatusInvalid],
    [400002041, StatisticAnalyseErrType.UserPasswordWeak],
    [400002042, StatisticAnalyseErrType.UserExistCheckMemberUnionId],
    [400002043, StatisticAnalyseErrType.UserUnionIdAlreadyExist],
    [400002051, StatisticAnalyseErrType.UserFieldNameAlreadyExist],
    [400002052, StatisticAnalyseErrType.UserCustomFieldLimitExceeded],
    [400002053, StatisticAnalyseErrType.UserCustonFieldValueLimitExceeded],
    [400002054, StatisticAnalyseErrType.UserCustomFieldValueExistSpeChar],
    [400002055, StatisticAnalyseErrType.UserLoginNameExists],
    [400002056, StatisticAnalyseErrType.UserAvatarInvalid],
    [400002057, StatisticAnalyseErrType.UserLeaderInvalid],
    [400002070, StatisticAnalyseErrType.UserMemberNumLimit],
    [400002082, StatisticAnalyseErrType.UserTitleNameAlreadyExist],
    [400002006, StatisticAnalyseErrType.DeptIsNotEmpty],
    [400002007, StatisticAnalyseErrType.DeptRootDeptExists],
    [400002008, StatisticAnalyseErrType.DeptNameInvalid],
    [400002009, StatisticAnalyseErrType.DeptAliasInvalid],
    [400002010, StatisticAnalyseErrType.DeptNameExists],
    [400002013, StatisticAnalyseErrType.DeptOrderISRefactoring],
    [400002021, StatisticAnalyseErrType.DeptParamFormatError],
    [400002022, StatisticAnalyseErrType.DeptValueInvalidError],
    [400002023, StatisticAnalyseErrType.DeptMaxDepthLimit],
    [400002044, StatisticAnalyseErrType.DeptExistCheckDeptUnionId],
    [400002045, StatisticAnalyseErrType.DeptUnionIdAlreadyExist],
    [400002014, StatisticAnalyseErrType.DeptUserOrderISRefactoring],
    [400002046, StatisticAnalyseErrType.DeptUserAccountDeptNumLimit],
    [400000002, StatisticAnalyseErrType.UserParamFormatError]
  ])

  errProcess(tbType: StatisticAnalyseTbType, err: any) {
    if (!err) {
      return this.unknownErr(tbType)
    }
    if (err instanceof CustomAxiosError) {
      try {
        if (err.response && err.response.data) {
          let data = err.response.data
          if (data.code) {
            const errType = this.ErrCodeToErrTypeMap.get(data.code)
            if (errType) {
              return errType
            }
          }
        }
        return this.unknownErr(tbType)
      } catch (error) {
        return this.unknownErr(tbType)
      }
    }
    return this.unknownErr(tbType)
  }

  unknownErr(tbType: StatisticAnalyseTbType) {
    switch (tbType) {
      case StatisticAnalyseTbType.User:
        return StatisticAnalyseErrType.UserUnknownError
      case StatisticAnalyseTbType.Dept:
        return StatisticAnalyseErrType.DeptUnknownError
      case StatisticAnalyseTbType.DeptUser:
        return StatisticAnalyseErrType.DeptUserUnknownError
    }
  }
}    

export default new V7ErrRespProcess()