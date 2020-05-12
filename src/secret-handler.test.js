const SecretHandler = require("./secret-handler");
const { expect } = require("./test-setup");
const sinon = require("sinon");
const k8s = require("@kubernetes/client-node");

const now = new Date();

describe("secret-handler", () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers(now.getTime());
  });
  afterEach(function () {
    sinon.restore();
    this.clock.restore();
  });
  describe("backup", () => {
    it("should add backupTime timestamp to backup value", async () => {
      const patchNamespacedSecret = sinon.stub();
      const readNamespacedSecret = sinon.stub();
      sinon.stub(k8s, "KubeConfig").returns({
        loadFromDefault: () => {},
        makeApiClient: () => ({
          readNamespacedSecret,
          patchNamespacedSecret
        })
      });
      readNamespacedSecret.resolves({ body: { data: {} } });
      const secretHandler = new SecretHandler();

      await secretHandler.backup("secret-name", "namespace");

      expect(patchNamespacedSecret).to.have.been.calledWith(
        "secret-name-backup",
        "namespace",
        {
          stringData: {
            BACKUP: JSON.stringify([{ data: {}, backupTime: now }])
          }
        }
      );
    });
  });
});
