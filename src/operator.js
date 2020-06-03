const Operator = require("@dot-i/k8s-operator").default;
const { ResourceEventType } = require("@dot-i/k8s-operator");
const SecretHandler = require("./secret-handler");

module.exports = class SecretBackupOperator extends Operator {
  async init() {
    const secretHandler = new SecretHandler();

    await this.watchResource("", "v1", "secrets", async (e) => {
      const object = e.object;

      if (
        object.metadata.annotations &&
        object.metadata.annotations["cert-manager.io/certificate-name"]
      ) {
        return;
      }

      if (e.type !== ResourceEventType.Modified) {
        return;
      }

      if (object.metadata.labels && object.metadata.labels.backup) {
        return;
      }

      console.log(`${e.type} ${object.metadata.name}`);

      await secretHandler
        .backup(object.metadata.name, object.metadata.namespace)
        .catch((error) => {
          console.log(error.message);
        });
    });
  }
};
