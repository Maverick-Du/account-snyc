export const injectSdk = () => {

  const { EcisNode, inject, createNode } = ecissdk;

  class SlotWidget extends EcisNode { }

  class IncrementSetting extends EcisNode {
    static key = "AccountSyncWeb.SyncInfo.IncrementSetting"

    get Slot() {
      return createNode(SlotWidget, {
        key: 'Slot',
        parent: this.key
      })
    }
  }

  class SyncInfo extends EcisNode {
    static key = "AccountSyncWeb.SyncInfo";

    get IncrementSetting() {
      return createNode(IncrementSetting);
    }
  }

  class AccountSyncWeb extends EcisNode {
    static key = "AccountSyncWeb";

    get SyncInfo() {
      return createNode(SyncInfo);
    }
  }

  inject('accountsyncweb', AccountSyncWeb);
}

