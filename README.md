# Secret backup operator

An operator to backup secrets on a Kubernetes cluster.  
Backup happens when secrets are modified.  
Backup data is stored in an other secret `<secret-name>-backup`, that has a single key `BACKUP` containing the secrets versions in a JSON encoded list.

## Setup

To be able to run this on a cluster ypu need to deploy a deployment that runs an image built using the provided `Dockerfile`, the pods need to run with a `ServiceAccount` that is authorized to read, watch and edit secrets. Eg.:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: secret-operator-service-account
  namespace: some-namepace
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "watch", create", "update", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-secrets
  namespace: default
subjects:
  - kind: ServiceAccount
    name: secret-operator-service-account
    namespace: some-namepace
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```
