const SecretHandler = require("./secret-handler");
const { expect } = require("./test-setup");
const sinon = require("sinon");
const k8s = require("@kubernetes/client-node");

const now = new Date();

const stubK8s = () => {
  const patchNamespacedSecret = sinon.stub();
  const readNamespacedSecret = sinon.stub();
  sinon.stub(k8s, "KubeConfig").returns({
    loadFromDefault: () => {},
    makeApiClient: () => ({
      readNamespacedSecret,
      patchNamespacedSecret
    })
  });

  return { patchNamespacedSecret, readNamespacedSecret };
};

const encodeSecretValue = (value) => Buffer.from(value).toString("base64");

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
      const { readNamespacedSecret, patchNamespacedSecret } = stubK8s();
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

    it("should extend existing backup", async () => {
      const backedUpSecrets = [
        { data: { key: "value1" } },
        { data: { key: "value0" } }
      ];
      const newSecretValue = "value2";
      const { readNamespacedSecret, patchNamespacedSecret } = stubK8s();
      readNamespacedSecret.withArgs("secret-name", "namespace").resolves({
        body: {
          data: { key: encodeSecretValue(newSecretValue) }
        }
      });
      readNamespacedSecret
        .withArgs("secret-name-backup", "namespace")
        .resolves({
          body: {
            data: {
              BACKUP: encodeSecretValue(JSON.stringify(backedUpSecrets))
            }
          }
        });

      const secretHandler = new SecretHandler();

      await secretHandler.backup("secret-name", "namespace");

      const parsedBackup = JSON.parse(
        patchNamespacedSecret.getCall(0).args[2].stringData.BACKUP
      );
      expect(parsedBackup).to.containSubset([
        { data: { key: newSecretValue } },
        ...backedUpSecrets
      ]);
    });
  });
});
