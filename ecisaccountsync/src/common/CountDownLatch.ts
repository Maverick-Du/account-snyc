export class CountDownLatch {
    count: number
    resolveFunc: any
    promise: Promise<unknown>

    constructor(count: number) {
        this.count = count;
        this.resolveFunc = null;
        this.promise = new Promise((resolve) => {
            this.resolveFunc = resolve;
        });
    }

    async await() {
        await this.promise;
    }

    countDown() {
        this.count--;
        if (this.count <= 0) {
            this.resolveFunc();
        }
    }
}
