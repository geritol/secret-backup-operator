const { ResourceEventType } = require("@dot-i/k8s-operator");
const K8sOperator = require("@dot-i/k8s-operator").default;
const sinon = require("sinon");
const { expect } = require("./test-setup");
const Operator = require("./operator");
const SecretHandler = require("./secret-handler");

describe("operator", () => {
  beforeEach(() => {
    this.secretHandlerBackupMock = sinon
      .stub(SecretHandler.prototype, "backup")
      .resolves();

    this.watchResourceMock = sinon.stub(K8sOperator.prototype, "watchResource");

    this.operator = new Operator();
  });
  afterEach(() => {
    this.operator.stop();
    sinon.restore();
  });

  it("should not call secretHandlerBackupMock if the secret has 'cert-manager.io/certificate-name' annotation", async () => {
    const invalidTestEvent = {
      object: {
        metadata: {
          annotations: {
            "cert-manager.io/certificate-name": "tls"
          }
        }
      },
      type: ResourceEventType.Modified
    };

    this.watchResourceMock.callsArgWith(3, invalidTestEvent);

    await this.operator.start();

    expect(this.secretHandlerBackupMock).to.not.have.been.called;
  });

  [ResourceEventType.Added, ResourceEventType.Deleted].forEach((type) => {
    it(`should not create a backup when the event type is ResourceEventType.${type}`, async () => {
      const invalidTestEvent = {
        object: {
          metadata: {}
        },
        type
      };

      this.watchResourceMock.callsArgWith(3, invalidTestEvent);

      await this.operator.start();

      expect(this.secretHandlerBackupMock).to.not.have.been.called;
    });
  });

  it("should not call secretHandlerBackupMock if the secret has backup label", async () => {
    const invalidTestEvent = {
      object: {
        metadata: {
          labels: {
            backup: true
          }
        }
      },
      type: ResourceEventType.Modified
    };

    this.watchResourceMock.callsArgWith(3, invalidTestEvent);

    await this.operator.start();

    expect(this.secretHandlerBackupMock).to.not.have.been.called;
  });

  it("should call secretHandlerBackupMock with the metadata name and namespace", async () => {
    const validObjectMetadata = {
      name: "name",
      namespace: "namespace"
    };

    const validTestEvent = {
      object: {
        metadata: validObjectMetadata
      },
      type: ResourceEventType.Modified
    };

    this.watchResourceMock.callsArgWith(3, validTestEvent);

    await this.operator.start();

    expect(this.secretHandlerBackupMock).to.have.been.calledWith(
      validObjectMetadata.name,
      validObjectMetadata.namespace
    );
  });
});
