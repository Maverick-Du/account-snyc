import {Registry, Gauge, Pushgateway} from 'prom-client'
import {FullSyncMetricData, FullSyncTaskMetricTitle, IncrementSyncMetricData, IncrementSyncMetricTitle} from "./types";
import config from "../../common/config";
import {IncrementSyncContext} from "../increment_sync/strategy/types";
import { log } from '../../sdk/cognac';

// 创建一个 Gauge 指标
const fullSyncGauge = new Gauge({
    name: 'ECIS_ACCOUNT_SYNC_ERROR',
    help: 'ECIS_ACCOUNT_SYNC_ERROR METRIC',
    labelNames: ['service', 'taskId', 'companyId', 'title', 'msg'],
});

const incrementSyncGauge = new Gauge({
    name: 'ECIS_ACCOUNT_SYNC_INCREMENT_ERROR',
    help: 'ECIS_ACCOUNT_SYNC_INCREMENT_ERROR METRIC',
    labelNames: ['service', 'companyId', 'startTime', 'endTime', 'user_fail', 'dept_fail', 'dept_user_fail', 'title', 'msg'],
});

class MetricService {

    async fullSyncTaskMetric(taskId: string, companyId: string, title: FullSyncTaskMetricTitle, msg: string) {
        try {
            let data: FullSyncMetricData = {
                service: config.componentId,
                taskId: taskId,
                companyId: companyId,
                title: title,
                msg: msg
            }

            const registry = new Registry()
            // 将 Gauge 数据推送到 Prometheus Pushgateway
            const pushGatewayUrl = `http://${config.metric.pushGateway_host}:${config.metric.pushGateway_port}`;

            registry.registerMetric(fullSyncGauge);

            // 将 JSON 结构的 Gauge 数据设置到 Gauge 指标中
            fullSyncGauge.labels(data).set(1)

            const gateway = new Pushgateway(pushGatewayUrl, { timeout: 5000, auth: `${config.metric.pgw_user}:${config.metric.pgw_passwd}` }, registry);
            const prefix = 'ecis-account-sync';

            return gateway
                .push({ jobName: prefix })
                .then(({ resp, body }) => {
                    log.i({info: `MetricService.fullSyncTaskMetric body: ${body}, response: ${resp}`})
                })
                .catch(err => {
                    err.msg = `MetricService.fullSyncTaskMetric throw error. message: ${err.message}`
                    log.e(err)
                })
        }catch (e) {
            e.msg = `MetricService.fullSyncTaskMetric throw error. message: ${e.message}`
            log.e(e)
        }
    }

    async incrementSyncMetric(ctx: IncrementSyncContext, title: IncrementSyncMetricTitle, msg: string) {
        try {
            let data = {
                service: config.componentId,
                companyId: ctx.cfg.companyId,
                startTime: ctx.startTime,
                endTime: ctx.endTime,
                title: title,
                user_fail: ctx.statistics.user_fail,
                dept_fail: ctx.statistics.dept_fail,
                dept_user_fail: ctx.statistics.user_dept_fail,
                msg: msg
            } as IncrementSyncMetricData

            const registry = new Registry()
            // 将 Gauge 数据推送到 Prometheus Pushgateway
            const pushGatewayUrl = `http://${config.metric.pushGateway_host}:${config.metric.pushGateway_port}`;

            registry.registerMetric(incrementSyncGauge);

            // 将 JSON 结构的 Gauge 数据设置到 Gauge 指标中
            incrementSyncGauge.labels(data).set(1)

            const gateway = new Pushgateway(pushGatewayUrl, { timeout: 5000, auth: `${config.metric.pgw_user}:${config.metric.pgw_passwd}` }, registry);
            const prefix = 'ecis-account-sync';

            return gateway
                .push({ jobName: prefix })
                .then(({ resp, body }) => {
                    log.i({info: `MetricService.incrementSyncMetric body: ${body}, response: ${resp}`})
                })
                .catch(err => {
                    err.msg = `MetricService.incrementSyncMetric throw error. message: ${err.message}`
                    log.e(err)
                })
        } catch (e) {
            e.msg = `MetricService.incrementSyncMetric throw error. message: ${e.message}`
            log.e(e)
        }
    }
}

export default new MetricService()
