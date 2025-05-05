FROM swr.cn-north-1.myhuaweicloud.com/cams-pub/cams-node-runner:ubuntu-22.04-amd64-20240920 as builder
ADD . /opt/app
WORKDIR /opt/app
RUN set -e && npm config set registry https://registry.npmmirror.com && \
    rm -rf .env && yarn && npx tsc && rm -rf ./src ./.npmrc

FROM swr.cn-north-1.myhuaweicloud.com/cams-pub/cams-node-runner:ubuntu-22.04-amd64-20240920
WORKDIR /opt/app-serve
COPY --from=builder /opt/app ./
EXPOSE 8000
ENTRYPOINT ["/opt/app-serve/start.sh"]
