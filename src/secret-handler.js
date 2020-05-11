const k8s = require("@kubernetes/client-node");
const { mapValues } = require("lodash");

module.exports = class SecretHandler {
  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  }

  async get(secretName, namespace) {
    const { body } = await this.k8sApi.readNamespacedSecret(
      secretName,
      namespace
    );

    return mapValues(body.data, (value) =>
      Buffer.from(value, "base64").toString()
    );
  }

  async backup(secretName, namespace) {
    const secretValue = await this.get(secretName, namespace);
    const backupName = `${secretName}-backup`;
    if (!(await this.doesSecretExist(backupName, namespace))) {
      await this.createSecret(backupName, namespace);
    }
    await this.createBackup(backupName, namespace, secretValue);
  }

  async doesSecretExist(secretName, namespace) {
    try {
      await this.k8sApi.readNamespacedSecret(secretName, namespace);
      return true;
    } catch (error) {
      return false;
    }
  }

  async createSecret(secretName, namespace) {
    const backup = {
      metadata: {
        name: secretName,
        labels: {
          backup: "true"
        }
      }
    };

    await this.k8sApi.createNamespacedSecret(namespace, backup);
  }

  async createBackup(backupName, namespace, backupValue) {
    const rawBackup = await this.get(backupName, namespace);
    const previousBackup = rawBackup.backup ? JSON.parse(rawBackup.backup) : [];

    await this.k8sApi.patchNamespacedSecret(
      backupName,
      namespace,
      {
        stringData: {
          BACKUP: JSON.stringify([backupValue, ...previousBackup])
        }
      },
      undefined,
      undefined,
      undefined,
      undefined,
      {
        headers: {
          "Content-Type": "application/merge-patch+json"
        }
      }
    );
  }
};
