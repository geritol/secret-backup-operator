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

  [
    {
      event: {
        object: {
          metadata: {
            annotations: {
              "cert-manager.io/certificate-name": "tls"
            }
          }
        },
        type: ResourceEventType.Modified
      },
      eventDescription: "has 'cert-manager.io/certificate-name' annotation"
    },
    {
      event: {
        object: {
          metadata: {
            labels: {
              backup: true
            }
          }
        },
        type: ResourceEventType.Modified
      },
      eventDescription: "has backup:true label"
    },
    ...Object.values(ResourceEventType)
      .filter((type) => type !== ResourceEventType.Modified)
      .map((type) => {
        return {
          event: {
            object: {
              metadata: {}
            },
            type
          },
          eventDescription: `has ${type} type`
        };
      })
  ].forEach((testObject) => {
    it(`should not create backup, when event: ${testObject.eventDescription}`, async () => {
      this.watchResourceMock.callsArgWith(3, testObject.event);

      await this.operator.start();

      expect(this.secretHandlerBackupMock).to.not.have.been.called;
    });
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
