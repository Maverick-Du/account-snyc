import {log, Ticker} from '../../../cognac/common';
import {
    IUpdateUserContext, IUpdateUserResult, IUpdateUserStrategy,
    LocalUser,
    SyncStrategyType,
    WpsGenderType,
    WpsSource,
    WPSUser,
} from '../../sync'
import {UpdateCompanyUser} from '../../../v7/org/dev/v1'
import {decrypt, getEncryptKey} from '../../../common/crypto'


export class UpdateUserStrategy implements IUpdateUserStrategy {
    name: string = SyncStrategyType.UpdateUser

    async exec(ctx: IUpdateUserContext): Promise<IUpdateUserResult> {
        const { engine, task, user, from } = ctx
        const tick = new Ticker()
        let u: WPSUser
        if (this.checkNeedUpdate(task.taskId, from, user)) {
            log.debug({ info: `full sync ${task.taskId} updateUser start, userId: ${user.user_id} fromId: ${from.uid}, account: ${user.login_name}` })
            let update = {
                avatar: from.avatar,
                custom_fields: from.custom_fields,
                email: from.email,
                employee_id: from.employer,
                employment_type: from.employment_type,
                gender: from.gender,
                mobile_phone: from.phone,
                nick_name: from.nick_name,
                login_name: from.name,
                source: from.source,
                telephone: from.telephone,
                title: from.title,
                work_place: from.work_place
            } as UpdateCompanyUser

            await engine.was.updateUser(user.company_id, user.user_id, update)
            user.nick_name = from.nick_name
            u = user

            log.i({ info: `full sync ${task.taskId} updateUser end[${tick.end()}]. userId: ${user.user_id} fromId: ${from.uid}, account: ${user.login_name}` })
        }

        return { code: 'ok', user: u }
    }

    checkNeedUpdate(taskId: string, from: LocalUser, user: WPSUser) {
        // '' 云文档会置空该字段
        // 全量同步以表中数据为准，没传就是要置空
        from.avatar = from.avatar ? from.avatar : null
        from.email = from.email ? from.email : null
        from.employer = from.employer ? from.employer : null
        from.employment_type = from.employment_type ? from.employment_type : "unknow"
        from.gender = from.gender ? from.gender : WpsGenderType.Secrecy
        from.phone = from.phone ? this.getOriginContent(taskId, from.uid, from.phone, "phone") : null
        from.telephone = from.telephone ? this.getOriginContent(taskId, from.uid, from.telephone, "telephone") : null
        from.nick_name = from.nick_name ? from.nick_name : null
        from.source = from.source ? from.source : WpsSource.SYNC
        from.title = from.title ? from.title : null
        from.work_place = from.work_place ? from.work_place : null

        user.avatar = user.avatar ? user.avatar : null
        if (user.avatar && user.avatar.startsWith("/avatar/u/v1/avatar?name=")){
            user.avatar = null
        }
        user.email = user.email ? user.email : null
        user.employee_id = user.employee_id ? user.employee_id : null
        user.employment_type = user.employment_type ? user.employment_type : null
        user.gender = user.gender ? user.gender : null
        user.mobile_phone = user.mobile_phone ? user.mobile_phone : null
        user.telephone = user.telephone ? user.telephone : null
        user.nick_name = user.nick_name ? user.nick_name : null
        user.source = user.source ? user.source : WpsSource.SYNC
        user.title = user.title ? user.title : null
        user.work_place = user.work_place ? user.work_place : null

        if (from.avatar !== user.avatar || from.email !== user.email
            || from.employer !== user.employee_id || from.employment_type !== user.employment_type
            || from.gender !== user.gender || from.phone !== user.mobile_phone
            || from.telephone !== user.telephone || from.nick_name !== user.nick_name
            || from.source !== user.source || from.title !== user.title
            || from.work_place !== user.work_place || from.name !== user.login_name
        ) {
            if (Math.random() < 0.1) {
                log.i({ info: `full sync ${taskId} updateUser checkNeedUpdate. from.avatar: ${from.avatar} user.avatar: ${user.avatar}, 
            from.email: ${from.email} user.email: ${user.email}, from.employer: ${from.employer} user.employee_id: ${user.employee_id}, 
            from.employment_type: ${from.employment_type} user.employment_type: ${user.employment_type}, 
            from.phone: ${from.phone} user.mobile_phone: ${user.mobile_phone}, from.telephone: ${from.telephone} user.telephone: ${user.telephone}, 
            from.nick_name: ${from.nick_name} user.nick_name: ${user.nick_name}, from.source: ${from.source} user.source: ${user.source}, 
            from.title: ${from.title} user.title: ${user.title}, from.work_place: ${from.work_place} user.work_place: ${user.work_place}, from.name: ${from.name} user.login_name: ${user.login_name}` })
            }
            return true
        }
        if (!from.custom_fields && !user.custom_fields) {
            return false
        } else {
            return true
        }
    }

    getOriginContent(taskId: string, uid: string, content: string, field: string) {
        try {
            return decrypt(content, getEncryptKey(uid))
        } catch (err) {
            err.message = `full sync ${taskId} updateUser decrypt ${field} error, taskId: ${taskId}, uid: ${uid}, content: ${content}, msg: ${err.message}`
            throw err
        }
    }
}
