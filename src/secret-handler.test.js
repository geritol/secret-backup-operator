const SecretHandler = require("./secret-handler");
const { expect } = require("./test-setup");
const sinon = require("sinon");
const k8s = require("@kubernetes/client-node");

const now = new Date();

const stubK8s = () => {
  const replaceNamespacedSecret = sinon.stub();
  const readNamespacedSecret = sinon.stub();
  sinon.stub(k8s, "KubeConfig").returns({
    loadFromDefault: () => {},
    makeApiClient: () => ({
      readNamespacedSecret,
      replaceNamespacedSecret
    })
  });

  return { replaceNamespacedSecret, readNamespacedSecret };
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
      const { readNamespacedSecret, replaceNamespacedSecret } = stubK8s();
      readNamespacedSecret.resolves({ body: { data: {} } });
      const secretHandler = new SecretHandler();

      await secretHandler.backup("secret-name", "namespace");

      expect(replaceNamespacedSecret).to.have.been.calledWith(
        "secret-name-backup",
        "namespace",
        {
          metadata: { name: "secret-name-backup", labels: { backup: "true" } },
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
      const { readNamespacedSecret, replaceNamespacedSecret } = stubK8s();
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
        replaceNamespacedSecret.getCall(0).args[2].stringData.BACKUP
      );
      expect(parsedBackup).to.containSubset([
        { data: { key: newSecretValue } },
        ...backedUpSecrets
      ]);
    });

    it("should limit the backup size to 1mb", async () => {
      const oneMbString = "1".repeat(1024 * 1024);

      const { readNamespacedSecret, replaceNamespacedSecret } = stubK8s();
      readNamespacedSecret.resolves({ body: { data: { key: oneMbString } } });
      const secretHandler = new SecretHandler();

      await secretHandler.backup("secret-name", "namespace");

      expect(replaceNamespacedSecret).to.have.been.calledWith(
        "secret-name-backup",
        "namespace",
        {
          metadata: { name: "secret-name-backup", labels: { backup: "true" } },
          stringData: {
            BACKUP: JSON.stringify([])
          }
        }
      );
    });
  });
});
