const R = require('ramda');
const { makeExecutableSchema } = require('graphql-tools');

const typeDefs = `
  enum SshKeyType {
    SSH_RSA
    SSH_ED25519
  }

  enum DeployType {
    BRANCH
    PULLREQUEST
    PROMOTE
  }

  enum EnvType {
    PRODUCTION
    DEVELOPMENT
  }

  type SshKey {
    id: Int
    name: String
    keyValue: String
    keyType: String
    created: String
  }

  type Customer {
    id: Int
    name: String
    comment: String
    private_key: String
    sshKeys: [SshKey]
    created: String
  }

  type Openshift {
    id: Int
    name: String
    console_url: String
    token: String
    router_pattern: String
    project_user: String
    ssh_host: String
    ssh_port: String
    created: String
  }

  type NotificationSlack {
    id: Int
    name: String
    webhook: String
    channel: String
  }

  union Notification = NotificationSlack

  type Project {
    id: Int
    name: String
    customer: Customer
    git_url: String
    notifications(type: String): [Notification]
    active_systems_deploy: String
    active_systems_promote: String
    active_systems_remove: String
    branches: String
    production_environment: String
    auto_idle: Int
    pullrequests: String
    openshift: Openshift
    sshKeys: [SshKey]
    environments(type: EnvType): [Environment]
    created: String
  }

  type Environment {
    id: Int
    name: String
    project: Project
    deploy_type: String
    environment_type: String
    openshift_projectname: String
    updated: String
    created: String
  }

  input DeleteEnvironmentInput {
    name: String!
    project: String!
  }

  type Query {
    customerByName(name: String!): Customer
    projectByName(name: String!): Project
    projectByGitUrl(gitUrl: String!): Project
    environmentByOpenshiftProjectName(openshiftProjectName: String!): Environment
    allProjects(createdAfter: String, gitUrl: String): [Project]
    allCustomers(createdAfter: String): [Customer]
    allOpenshifts: [Openshift]
    allEnvironments(createdAfter: String): [Environment]
  }

  input SshKeyInput {
    id: Int
    name: String!
    keyValue: String!
    keyType: SshKeyType
  }

  input DeleteSshKeyInput {
    name: String!
  }

  input ProjectInput {
    id: Int
    name: String!
    customer: Int!
    git_url: String!
    openshift: Int!
    active_systems_deploy: String
    active_systems_promote: String
    active_systems_remove: String
    branches: String
    pullrequests: String
    production_environment: String
    auto_idle: Int
  }

  input EnvironmentInput {
    name: String!
    project: Int!
    deploy_type: DeployType!
    environment_type: EnvType!
    openshift_projectname: String!
  }

  input CustomerInput {
    id: Int
    name: String!
    comment: String
    private_key: String
  }

  input OpenshiftInput {
    id: Int
    name: String!
    console_url: String!
    token: String
    router_pattern: String
    project_user: String
    ssh_host: String
    ssh_port: String
  }

  input DeleteOpenshiftInput {
    name: String!
  }

  input DeleteCustomerInput {
    name: String!
  }

  input NotificationSlackInput {
    name: String!
    webhook: String!
    channel: String!
  }

  input DeleteNotificationSlackInput {
    name: String!
  }

  input NotificationToProjectInput {
    project: String!
    notificationType: String!
    notificationName: String!
  }

  input RemoveNotificationFromProjectInput {
    project: String!
    notificationType: String!
    notificationName: String!
  }

  input SshKeyToProjectInput {
    project: String!
    sshKey: String!
  }

  input RemoveSshKeyFromProjectInput {
    project: String!
    sshKey: String!
  }

  input SshKeyToCustomerInput {
    customer: String!
    sshKey: String!
  }

  input RemoveSshKeyFromCustomerInput {
    customer: String!
    sshKey: String!
  }

  input DeleteProjectInput {
    id: Int!
  }

  input UpdateProjectPatchInput {
    name: String
    customer: Int
    git_url: String
    active_systems_deploy: String
    active_systems_remove: String
    branches: String
    production_environment: String
    auto_idle: Int
    pullrequests: String
    openshift: Int
  }

  input UpdateProjectInput {
    id: Int!
    patch: UpdateProjectPatchInput!
  }

  input UpdateCustomerPatchInput {
    name: String
    comment: String
    private_key: String
    created: String
  }

  input UpdateCustomerInput {
    id: Int!
    patch: UpdateCustomerPatchInput!
  }

  input UpdateOpenshiftPatchInput {
    name: String
    console_url: String
    token: String
    router_pattern: String
    project_user: String
    ssh_host: String
    ssh_port: String
  }

  input UpdateOpenshiftInput {
    id: Int!
    patch: UpdateOpenshiftPatchInput!
  }

  input UpdateNotificationSlackPatchInput {
    name: String
    webhook: String
    channel: String
  }

  input UpdateNotificationSlackInput {
    name: String!
    patch: UpdateNotificationSlackPatchInput
  }

  input UpdateSshKeyPatchInput {
    name: String
    keyValue: String
    keyType: SshKeyType
  }

  input UpdateSshKeyInput {
    id: Int!
    patch: UpdateSshKeyPatchInput!
  }

  input UpdateEnvironmentPatchInput {
    project: Int
    deploy_type: DeployType
    environment_type: EnvType
    openshift_projectname: String
  }

  input UpdateEnvironmentInput {
    name: String!
    patch: UpdateEnvironmentPatchInput
  }

  type Mutation {
    updateEnvironment(input: UpdateEnvironmentInput!): Environment
    updateSshKey(input: UpdateSshKeyInput!): SshKey
    updateNotificationSlack(input: UpdateNotificationSlackInput!): NotificationSlack
    updateOpenshift(input: UpdateOpenshiftInput!): Openshift
    updateCustomer(input: UpdateCustomerInput!): Customer
    updateProject(input: UpdateProjectInput!): Project
    addProject(input: ProjectInput!): Project
    deleteProject(input: DeleteProjectInput!): String
    addOrUpdateEnvironment(input: EnvironmentInput!): Environment
    deleteEnvironment(input: DeleteEnvironmentInput!): String
    addSshKey(input: SshKeyInput!): SshKey
    deleteSshKey(input: DeleteSshKeyInput!): String
    addCustomer(input: CustomerInput!): Customer
    deleteCustomer(input: DeleteCustomerInput!): String
    addOpenshift(input: OpenshiftInput!): Openshift
    deleteOpenshift(input: DeleteOpenshiftInput!): String
    addNotificationSlack(input: NotificationSlackInput!): NotificationSlack
    deleteNotificationSlack(input: DeleteNotificationSlackInput!): String
    addNotificationToProject(input: NotificationToProjectInput!): Project
    removeNotificationFromProject(input: RemoveNotificationFromProjectInput!): Project
    addSshKeyToProject(input: SshKeyToProjectInput!): Project
    removeSshKeyFromProject(input: RemoveSshKeyFromProjectInput!): Project
    addSshKeyToCustomer(input: SshKeyToCustomerInput!): Customer
    removeSshKeyFromCustomer(input: RemoveSshKeyFromCustomerInput!): Customer
    truncateTable(tableName: String!): String
  }
`;

// Useful for transforming Enums on input.patch objects
// If an operation on input.patch[key] returns undefined,
// then the input.patch[key] will be ommitted for the result
const omitPatchKeyIfUndefined = (key) => R.ifElse(
  R.compose(notUndefined, R.path(['patch', key])),
  R.identity,
  R.over(R.lensPath(['patch']), R.omit([key])),
);

const notUndefined = R.compose(R.not, R.equals(undefined));

const sshKeyTypeToString = R.cond([
  [R.equals('SSH_RSA'), R.always('ssh-rsa')],
  [R.equals('SSH_ED25519'), R.always('ssh-ed25519')],
  [R.T, R.identity],
]);

const deployTypeToString = R.cond([
  [R.equals('BRANCH'), R.toLower],
  [R.equals('PULLREQUEST'), R.toLower],
  [R.equals('PROMOTE'), R.toLower],
  [R.T, R.identity],
]);

const envTypeToString = R.cond([
  [R.equals('PRODUCTION'), R.toLower],
  [R.equals('DEVELOPMENT'), R.toLower],
  [R.T, R.identity],
]);

const getCtx = req => req.app.get('context');
const getDao = req => getCtx(req).dao;

const resolvers = {
  Project: {
    customer: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getCustomerByProjectId(req.credentials, project.id);
    },
    sshKeys: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getSshKeysByProjectId(req.credentials, project.id);
    },
    notifications: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getNotificationsByProjectId(
        req.credentials,
        project.id,
        args,
      );
    },
    openshift: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getOpenshiftByProjectId(req.credentials, project.id);
    },
    environments: async (project, args, req) => {
      const dao = getDao(req);
      const input = R.compose(R.over(R.lensProp('type'), envTypeToString))(
        args,
      );
      return await dao.getEnvironmentsByProjectId(
        req.credentials,
        project.id,
        input,
      );
    },
  },
  Environment: {
    project: async (environment, args, req) => {
      const dao = getDao(req);
      return await dao.getProjectByEnvironmentId(
        req.credentials,
        environment.id,
      );
    },
  },
  Notification: {
    __resolveType(obj, context, info) {
      switch (obj.type) {
        case 'slack':
          return 'NotificationSlack';
        default:
          return null;
      }
    },
  },
  Customer: {
    sshKeys: async (customer, args, req) => {
      const dao = getDao(req);
      return await dao.getSshKeysByCustomerId(req.credentials, customer.id);
    },
  },
  Query: {
    customerByName: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getCustomerByName(req.credentials, args);
    },
    projectByGitUrl: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getProjectByGitUrl(req.credentials, args);
    },
    projectByName: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getProjectByName(req.credentials, args);
    },
    environmentByOpenshiftProjectName: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getEnvironmentByOpenshiftProjectName(req.credentials, args);
    },
    allProjects: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getAllProjects(req.credentials, args);
    },
    allCustomers: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getAllCustomers(req.credentials, args);
    },
    allOpenshifts: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getAllOpenshifts(req.credentials, args);
    },
    allEnvironments: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getAllEnvironments(req.credentials, args);
    },
  },
  Mutation: {
    updateEnvironment: async (root, args, req) => {
      const input = R.compose(
        omitPatchKeyIfUndefined('deploy_type'),
        omitPatchKeyIfUndefined('environment_type'),
        R.over(R.lensPath(['patch', 'environment_type']), envTypeToString),
        R.over(R.lensPath(['patch', 'deploy_type']), deployTypeToString),
      )(args.input);

      const dao = getDao(req);
      const ret = await dao.updateEnvironment(req.credentials, input);
      return ret;
    },

    updateSshKey: async (root, args, req) => {
      // There is a possibility the sshKeyTypeToString transformation
      // sets patch.keyType = undefined. This is not acceptable, therefore
      // we need to omit the key from the patch object completely
      // (null will still be accepted, since it should signal erasal of a field)
      const input = R.compose(
        omitPatchKeyIfUndefined('keyType'),
        R.over(R.lensPath(['patch', 'keyType']), sshKeyTypeToString),
      )(args.input);

      // TODO: should we validate the ssh-key / value format?

      const dao = getDao(req);
      const ret = await dao.updateSshKey(req.credentials, input);
      return ret;
    },
    updateNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateNotificationSlack(
        req.credentials,
        args.input,
      );
      return ret;
    },
    updateOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateOpenshift(req.credentials, args.input);
      return ret;
    },

    updateCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateCustomer(req.credentials, args.input);
      return ret;
    },
    updateProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateProject(req.credentials, args.input);
      return ret;
    },
    addProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addProject(req.credentials, args.input);
      return ret;
    },
    deleteProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteProject(req.credentials, args.input);
      return ret;
    },
    addSshKey: async (root, args, req) => {
      const dao = getDao(req);
      const input = R.over(R.lensProp('keyType'), sshKeyTypeToString)(
        args.input,
      );
      const ret = await dao.addSshKey(req.credentials, input);
      return ret;
    },
    deleteSshKey: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteSshKey(req.credentials, args.input);
      return ret;
    },
    addCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addCustomer(req.credentials, args.input);
      return ret;
    },
    deleteCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteCustomer(req.credentials, args.input);
      return ret;
    },
    addOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addOpenshift(req.credentials, args.input);
      return ret;
    },
    deleteOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteOpenshift(req.credentials, args.input);
      return ret;
    },
    addNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addNotificationSlack(req.credentials, args.input);
      return ret;
    },
    deleteNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteNotificationSlack(
        req.credentials,
        args.input,
      );
      return ret;
    },
    addNotificationToProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addNotificationToProject(
        req.credentials,
        args.input,
      );
      return ret;
    },
    removeNotificationFromProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeNotificationFromProject(
        req.credentials,
        args.input,
      );
      return ret;
    },
    addSshKeyToProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addSshKeyToProject(req.credentials, args.input);
      return ret;
    },
    removeSshKeyFromProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeSshKeyFromProject(
        req.credentials,
        args.input,
      );
      return ret;
    },
    addSshKeyToCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addSshKeyToCustomer(req.credentials, args.input);
      return ret;
    },
    removeSshKeyFromCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeSshKeyFromCustomer(
        req.credentials,
        args.input,
      );
      return ret;
    },
    addOrUpdateEnvironment: async (root, args, req) => {
      const dao = getDao(req);

      const input = R.compose(
        R.over(R.lensProp('environment_type'), envTypeToString),
        R.over(R.lensProp('deploy_type'), deployTypeToString),
      )(args.input);

      const ret = await dao.addOrUpdateEnvironment(req.credentials, input);
      return ret;
    },
    deleteEnvironment: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteEnvironment(req.credentials, args.input);
      return ret;
    },
    truncateTable: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.truncateTable(req.credentials, args);
      return ret;
    },
  },
};

module.exports = {
  deployTypeToString,
  envTypeToString,
  schema: makeExecutableSchema({ typeDefs, resolvers }),
};
