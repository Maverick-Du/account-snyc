// import {StatisticAnalyseOperateType }

import { StatisticAnalyseOperateType, StatisticAnalyseTbType, StatisticAnalyseErrType, FullSyncUpdateType } from "../modules/db/types";

export const ANALYSE_OPERATE_TYPES = [
  StatisticAnalyseOperateType.UserAdd,
  StatisticAnalyseOperateType.UserDelete,
  StatisticAnalyseOperateType.UserUpdate,
  StatisticAnalyseOperateType.UserEnable,
  StatisticAnalyseOperateType.UserDisable,
  StatisticAnalyseOperateType.DeptAdd,
  StatisticAnalyseOperateType.DeptDelete,
  StatisticAnalyseOperateType.DeptUpdate,
  StatisticAnalyseOperateType.DeptMove,
  StatisticAnalyseOperateType.DeptUserAdd,
  StatisticAnalyseOperateType.DeptUserDelete,
  StatisticAnalyseOperateType.UserOrderOrMainDeptUpdate
]

export const ANALYSE_TB_TYPES = [
  StatisticAnalyseTbType.Dept,
  StatisticAnalyseTbType.User,
  StatisticAnalyseTbType.DeptUser
]

export const ANALYSE_ERR_TYPES = [
  StatisticAnalyseErrType.UserUnknownError,
  StatisticAnalyseErrType.DeptUnknownError,
  StatisticAnalyseErrType.DeptUserUnknownError,
  StatisticAnalyseErrType.UserAccountDisabled,
  StatisticAnalyseErrType.DeptIsNotEmpty,
  StatisticAnalyseErrType.DeptRootDeptExists,
  StatisticAnalyseErrType.DeptNameInvalid,
  StatisticAnalyseErrType.DeptAliasInvalid,
  StatisticAnalyseErrType.DeptNameExists,
  StatisticAnalyseErrType.DeptOrderISRefactoring,
  StatisticAnalyseErrType.DeptUserOrderISRefactoring,
  StatisticAnalyseErrType.UserParamFormatError,
  StatisticAnalyseErrType.DeptParamFormatError,
  StatisticAnalyseErrType.UserValueInvalidError,
  StatisticAnalyseErrType.DeptValueInvalidError,
  StatisticAnalyseErrType.UserParamUnsupported,
  StatisticAnalyseErrType.UserAccountInvalid,
  StatisticAnalyseErrType.UserNickNameInvalid,
  StatisticAnalyseErrType.UserGenderInvalid,
  StatisticAnalyseErrType.UserEmployeeIdInvalid,
  StatisticAnalyseErrType.UserMobilePhoneInvalid,
  StatisticAnalyseErrType.UserEmailInvalid,
  StatisticAnalyseErrType.UserTelephoneInvalid,
  StatisticAnalyseErrType.UserTitleInvalid,
  StatisticAnalyseErrType.UserEmploymentTypeInvalid,
  StatisticAnalyseErrType.UserEmploymentStatusInvalid,
  StatisticAnalyseErrType.DeptMaxDepthLimit,
  StatisticAnalyseErrType.UserPasswordWeak,
  StatisticAnalyseErrType.UserExistCheckMemberUnionId,
  StatisticAnalyseErrType.UserUnionIdAlreadyExist,
  StatisticAnalyseErrType.DeptExistCheckDeptUnionId,
  StatisticAnalyseErrType.DeptUnionIdAlreadyExist,
  StatisticAnalyseErrType.DeptUserAccountDeptNumLimit,
  StatisticAnalyseErrType.UserFieldNameAlreadyExist,
  StatisticAnalyseErrType.UserCustomFieldLimitExceeded,
  StatisticAnalyseErrType.UserCustonFieldValueLimitExceeded,
  StatisticAnalyseErrType.UserCustomFieldValueExistSpeChar,
  StatisticAnalyseErrType.UserLoginNameExists,
  StatisticAnalyseErrType.UserAvatarInvalid,
  StatisticAnalyseErrType.UserLeaderInvalid,
  StatisticAnalyseErrType.UserMemberNumLimit,
  StatisticAnalyseErrType.UserTitleNameAlreadyExist,
]

export const FULL_SYNC_UPDAET_TYPES = [
  FullSyncUpdateType.DeptAdd,
  FullSyncUpdateType.DeptDel,
  FullSyncUpdateType.DeptMove,
  FullSyncUpdateType.DeptUpdate,
  FullSyncUpdateType.MainDeptUpdate,
  FullSyncUpdateType.UserAdd,
  FullSyncUpdateType.UserDel,
  FullSyncUpdateType.UserDeptAdd,
  FullSyncUpdateType.UserDeptDel,
  FullSyncUpdateType.UserEnable,
  FullSyncUpdateType.UserDisable,
  FullSyncUpdateType.UserOrderUpdate,
  FullSyncUpdateType.UserUpdate
]