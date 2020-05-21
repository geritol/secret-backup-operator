const { ResourceEventType } = require("@dot-i/k8s-operator");
const sinon = require("sinon");
const { expect } = require("./test-setup");
const Operator = require("./operator");
const SecretHandler = require("./secret-handler");

describe("operator", () => {
  beforeEach(() => {
    this.secretHandlerBackupMock = sinon
      .stub(SecretHandler.prototype, "backup")
      .resolves();

    this.operator = new Operator();

    this.watchResourceMock = sinon.stub(this.operator, "watchResource");
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
      }
    };

    await this.watchResourceMock.callsArgWith(3, invalidTestEvent);

    await this.operator.start();

    expect(this.secretHandlerBackupMock).to.not.have.been.called;
  });

  it("should not call secretHandlerBackupMock if the event type is ResourceEventType.Added", async () => {
    const invalidTestEvent = {
      object: {
        metadata: {}
      },
      type: ResourceEventType.Added
    };

    await this.watchResourceMock.callsArgWith(3, invalidTestEvent);

    await this.operator.start();

    expect(this.secretHandlerBackupMock).to.not.have.been.called;
  });

  it("should not call secretHandlerBackupMock if the event type is ResourceEventType.Deleted", async () => {
    const invalidTestEvent = {
      object: {
        metadata: {}
      },
      type: ResourceEventType.Deleted
    };

    await this.watchResourceMock.callsArgWith(3, invalidTestEvent);

    await this.operator.start();

    expect(this.secretHandlerBackupMock).to.not.have.been.called;
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

    await this.watchResourceMock.callsArgWith(3, invalidTestEvent);

    await this.operator.start();

    expect(this.secretHandlerBackupMock).to.not.have.been.called;
  });

  it("should call secretHandlerBackupMock with the metadata name and namespace", async () => {
    const validTestEvent = {
      object: {
        metadata: {
          name: "name",
          namespace: "namespace"
        }
      },
      type: ResourceEventType.Modified
    };

    await this.watchResourceMock.callsArgWith(3, validTestEvent);

    await this.operator.start();

    expect(this.secretHandlerBackupMock).to.have.been.calledWith(
      "name",
      "namespace"
    );
  });
});
