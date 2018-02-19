// @flow

import { green, blue } from 'chalk';
import inquirer from 'inquirer';
import R from 'ramda';
import { table } from 'table';
import urlRegex from 'url-regex';

import gql from '../../gql';
import { printGraphQLErrors, printErrors } from '../../printErrors';
import { runGQLQuery } from '../../query';

import type Inquirer from 'inquirer';
import typeof Yargs from 'yargs';
import type { BaseArgs } from '..';

export const command = 'create';
export const description = 'Create new project';

const CUSTOMER: 'customer' = 'customer';
const NAME: 'name' = 'name';
const GIT_URL: 'git_url' = 'git_url';
const OPENSHIFT: 'openshift' = 'openshift';
const ACTIVE_SYSTEMS_DEPLOY: 'active_systems_deploy' = 'active_systems_deploy';
const ACTIVE_SYSTEMS_REMOVE: 'active_systems_remove' = 'active_systems_remove';
const BRANCHES: 'branches' = 'branches';
const PULLREQUESTS: 'pullrequests' = 'pullrequests';
const PRODUCTION_ENVIRONMENT: 'production_environment' =
  'production_environment';

const commandOptions = {
  CUSTOMER,
  NAME,
  GIT_URL,
  OPENSHIFT,
  ACTIVE_SYSTEMS_DEPLOY,
  ACTIVE_SYSTEMS_REMOVE,
  BRANCHES,
  PULLREQUESTS,
  PRODUCTION_ENVIRONMENT,
};

export function builder(yargs: Yargs): Yargs {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .options({
      [CUSTOMER]: {
        describe: 'Customer id to use for new project',
        type: 'number',
        alias: 'c',
      },
      [NAME]: {
        describe: 'Name of new project',
        type: 'string',
        alias: 'n',
      },
      [GIT_URL]: {
        describe: 'Git URL of new project',
        type: 'string',
        alias: 'u',
      },
      [OPENSHIFT]: {
        describe: 'Openshift id to use for new project',
        type: 'number',
        alias: 'o',
      },
      [ACTIVE_SYSTEMS_DEPLOY]: {
        describe: 'Active system for task "deploy" of new project',
        type: 'string',
        alias: 'd',
      },
      [ACTIVE_SYSTEMS_REMOVE]: {
        describe: 'Active system for task "remove" of new project',
        type: 'string',
        alias: 'r',
      },
      [BRANCHES]: {
        describe:
          'Branches to deploy. Possible values include "false" (no branches), "true" (all branches) and a regular expression to match branches.',
        type: 'string',
        alias: 'b',
      },
      [PULLREQUESTS]: {
        describe:
          'Pull requests to deploy. Possible values include "false" (no pull requests) and "true" (all pull requests).',
        type: 'boolean',
        alias: 'prs',
      },
      [PRODUCTION_ENVIRONMENT]: {
        describe: 'Production environment for new project',
        type: 'string',
        alias: 'p',
      },
    })
    .example('$0', 'Create new project\n');
}

export async function getAllowedCustomersAndOpenshifts(cerr: typeof console.error) {
  const customersAndOpenshiftsResults = await runGQLQuery({
    query: gql`
      query AllCustomersAndOpenshiftsForProjectCreate {
        allCustomers {
          value: id
          name
        }
        allOpenshifts {
          value: id
          name
        }
      }
    `,
    cerr,
  });

  return {
    allCustomers: R.path(
      ['data', 'allCustomers'],
      customersAndOpenshiftsResults,
    ),
    allOpenshifts: R.path(
      ['data', 'allOpenshifts'],
      customersAndOpenshiftsResults,
    ),
    errors: R.prop('errors', customersAndOpenshiftsResults),
  };
}

export function answerFromOptionsPropCond(
  option: $Values<typeof commandOptions>,
  answers: Inquirer.answers,
  clog: typeof console.log,
) {
  return [
    R.compose(
      // Option is set
      R.has(option),
      R.prop('options'),
    ),
    (objectWithOptions: { options: Object }) => {
      const propVal = R.path(['options', option], objectWithOptions);
      clog(`${blue('!')} Using "${option}" option from arguments or config`);
      // eslint-disable-next-line no-param-reassign
      answers[option] = propVal;
    },
  ];
}

export function answerFromOptions(
  option: $Values<typeof commandOptions>,
  options: Object,
  clog: typeof console.log,
) {
  return (answers: Inquirer.answers) => {
    const [predicate, transform] = answerFromOptionsPropCond(
      option,
      answers,
      clog,
    );
    return R.ifElse(predicate, transform, R.T)({ options });
  };
}

type createProjectArgs = {
  clog: typeof console.log,
  cerr: typeof console.error,
  options: {
    customer: ?string,
  },
};

type Question = Inquirer.question & {
  name: $Values<typeof commandOptions>,
};

export async function createProject({
  clog,
  cerr,
  options,
}:
createProjectArgs): Promise<number> {
  const {
    allCustomers,
    allOpenshifts,
    errors,
  } = await getAllowedCustomersAndOpenshifts(cerr);

  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  if (R.equals(R.length(allCustomers), 0)) {
    return printErrors(cerr, 'No authorized customers found!');
  }

  if (R.equals(R.length(allOpenshifts), 0)) {
    return printErrors(cerr, 'No authorized openshifts found!');
  }

  const questions: Array<Question> = [
    {
      type: 'list',
      name: CUSTOMER,
      message: 'Customer:',
      choices: allCustomers,
      // Using the `when` method of the question object, decide where to get the customer based on conditions
      // https://github.com/SBoudrias/Inquirer.js/issues/517#issuecomment-288964496
      when(answers) {
        return R.cond([
          // 1. If the `customer` is set in the command line arguments or the config, use that customer
          answerFromOptionsPropCond(CUSTOMER, answers, clog),
          // 2. If only one customer was returned from the allCustomers query, use that customer as the answer to the question and tell the user, not prompting them to choose.
          [
            R.compose(R.equals(1), R.length, R.prop('allCustomers')),
            (customersAndOptions) => {
              const firstCustomer = R.compose(R.head, R.prop('allCustomers'))(customersAndOptions);
              clog(`${blue('!')} Using only authorized customer "${R.prop(
                'name',
                firstCustomer,
              )}"`);
              // eslint-disable-next-line no-param-reassign
              answers.customer = R.prop('value', firstCustomer);
            },
          ],
          // 3. If more than one customer was returned from the allCustomers query, return true to prompt the user to choose from a list
          [R.T, R.T],
        ])({ allCustomers, options });
      },
    },
    {
      type: 'input',
      name: NAME,
      message: 'Project name:',
      validate: input => Boolean(input) || 'Please enter a project name.',
      when: answerFromOptions(NAME, options, clog),
    },
    {
      type: 'input',
      name: GIT_URL,
      message: 'Git URL:',
      validate: input =>
        // Verify that it is a valid URL and...
        (urlRegex({ exact: true }).test(input) &&
          // ...that it is either a URL from the big three git hosts or includes `.git` at the end of the string.
          /(github\.com|bitbucket\.org|gitlab\.com|\.git$)/.test(input)) ||
        // If the input is invalid, prompt the user to enter a valid Git URL
        'Please enter a valid Git URL.',
      when: answerFromOptions(GIT_URL, options, clog),
    },
    {
      type: 'list',
      name: OPENSHIFT,
      message: 'Openshift:',
      choices: allOpenshifts,
      // Using the `when` method of the question object, decide where to get the openshift based on conditions
      // https://github.com/SBoudrias/Inquirer.js/issues/517#issuecomment-288964496
      when(answers) {
        return R.cond([
          // 1. If the `openshift` is set in the command line arguments or the config, use that openshift
          answerFromOptionsPropCond(OPENSHIFT, answers, clog),
          // 2. If only one openshift was returned from the allOpenshifts query, use that openshift as the answer to the question and tell the user, not prompting them to choose.
          [
            R.compose(R.equals(1), R.length, R.prop('allOpenshifts')),
            (openshiftsAndOptions) => {
              const firstOpenshift = R.compose(R.head, R.prop('allOpenshifts'))(openshiftsAndOptions);
              clog(`${blue('!')} Using only authorized openshift "${R.prop(
                'name',
                firstOpenshift,
              )}"`);
              // eslint-disable-next-line no-param-reassign
              answers.openshift = R.prop('value', firstOpenshift);
            },
          ],
          // 3. If more than one openshift was returned from the allOpenshifts query, return true to prompt the user to choose from a list
          [R.T, R.T],
        ])({ allOpenshifts, options });
      },
    },
    {
      type: 'input',
      name: BRANCHES,
      message: 'Deploy branches:',
      default: 'true',
      when: answerFromOptions(BRANCHES, options, clog),
    },
    {
      type: 'input',
      name: PULLREQUESTS,
      message: 'Pull requests:',
      default: null,
      when: answerFromOptions(PULLREQUESTS, options, clog),
    },
    {
      type: 'input',
      name: PRODUCTION_ENVIRONMENT,
      message: 'Production environment:',
      default: null,
      when: answerFromOptions(PRODUCTION_ENVIRONMENT, options, clog),
    },
  ];

  const allOptionsSpecified = R.compose(
    R.all(R.contains(R.__, R.keys(options))),
    R.keys,
  )(commandOptions);

  // Just use the options and don't even go into the prompt if all options are specified. Otherwise inquirer will not set the correct answers.
  // Ref: https://github.com/SBoudrias/Inquirer.js/issues/517#issuecomment-364912436
  const projectInput = allOptionsSpecified
    ? options
    : await inquirer.prompt(questions);

  const addProjectResult = await runGQLQuery({
    query: gql`
      mutation AddProject($input: ProjectInput!) {
        addProject(input: $input) {
          id
          name
          customer {
            name
          }
          git_url
          active_systems_deploy
          active_systems_remove
          branches
          pullrequests
          openshift {
            name
          }
          created
        }
      }
    `,
    cerr,
    variables: {
      input: projectInput,
    },
  });

  const { errors: addProjectErrors } = addProjectResult;
  if (addProjectErrors != null) {
    return printGraphQLErrors(cerr, ...addProjectErrors);
  }

  const project = R.path(['data', 'addProject'], addProjectResult);

  const projectName = R.prop('name', project);

  clog(green(`Project "${projectName}" created successfully:`));

  clog(table([
    ['Project Name', projectName],
    ['Customer', R.path(['customer', 'name'], project)],
    ['Git URL', R.prop('git_url', project)],
    ['Active Systems Deploy', R.prop('active_systems_deploy', project)],
    ['Active Systems Remove', R.prop('active_systems_remove', project)],
    ['Branches', String(R.prop('branches', project))],
    ['Pull Requests', String(R.prop('pullrequests', project))],
    ['Openshift', R.path(['openshift', 'name'], project)],
    ['Created', R.prop('created', project)],
  ]));

  return 0;
}

type Args = BaseArgs & {
  argv: {
    customer: ?string,
  },
};

export async function handler({
  clog,
  cerr,
  config,
  argv,
}:
Args): Promise<number> {
  const notUndefined = R.complement(R.equals(undefined));
  // Dynamic options are options that will likely change every time and shouldn't be specified in the config
  const dynamicOptions = [NAME];

  // Filter options to be only those included in the command options keys
  const options = R.pick(R.values(commandOptions), {
    // Remove options from the config that should require user input every time
    ...R.omit(dynamicOptions, config),
    // Don't overwrite values with non-specified arguments (which yargs sets as `undefined`)
    ...R.filter(notUndefined, argv),
  });

  return createProject({ clog, cerr, options });
}