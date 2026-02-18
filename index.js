import { getInput, setFailed, setOutput } from '@actions/core';
import { context } from '@actions/github';

import { Octokit } from '@octokit/core'; // eslint-disable-line import/no-extraneous-dependencies
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql';

import { ApiWrapper } from './apiwrapper.js'; // eslint-disable-line import/extensions
import { RepositoryProjectsManager } from './projects.js'; // eslint-disable-line import/extensions

const GraphQlOctokit = Octokit.plugin(paginateGraphQL);

// https://github.com/octokit/authentication-strategies.js
// example: https://github.com/octokit/graphql.js/issues/61#issuecomment-542399763
// for token type installation, pass only the token
const octokit = new GraphQlOctokit({ auth: process.env.GITHUB_TOKEN });

const hasDuplicates = (array) => new Set(array).size !== array.length;

try {
  const projectTitlesInput = getInput('project-titles');
  const titles = projectTitlesInput.split(/\s+/);

  if (hasDuplicates(titles)) {
    throw new Error(`Duplicate project titles are not allowed: ${titles}`);
  }

  // Get the JSON webhook payload for the event that triggered the workflow
  const {
    payload: {
      repository,
    },
  } = context;

  const apiWrapper = new ApiWrapper({ octokit });

  const rpm = new RepositoryProjectsManager({
    ownerName: repository.owner.login,
    repositoryName: repository.name,
    apiWrapper,
  });

  await rpm.sync(titles);

  setOutput('project-titles', rpm.projects().map((p) => p.title).join(' '));
} catch (error) {
  setFailed(error.message);
}
