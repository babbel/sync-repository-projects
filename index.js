import core from '@actions/core';
import github from '@actions/github';

import { Octokit } from '@octokit/core';
import { paginateGraphql } from '@octokit/plugin-paginate-graphql';

import { ApiWrapper } from './apiwrapper.js'; // eslint-disable-line import/extensions
import { RepositoryProjectsManager } from './projects.js'; // eslint-disable-line import/extensions

const GraphQlOctokit = Octokit.plugin(paginateGraphql);

// https://github.com/octokit/authentication-strategies.js
// example: https://github.com/octokit/graphql.js/issues/61#issuecomment-542399763
// for token type installation, pass only the token
const octokit = new GraphQlOctokit({ auth: process.env.GITHUB_TOKEN });

try {
  const projectTitlesInput = core.getInput('project-titles');
  const titles = projectTitlesInput.split(/\s+/);

  // Get the JSON webhook payload for the event that triggered the workflow
  const {
    context: {
      payload: {
        repository,
      },
    },
  } = github;

  const apiWrapper = new ApiWrapper({
    octokit,
    owner: repository.owner.login,
    repository: repository.name,
  });

  const rpm = new RepositoryProjectsManager({ apiWrapper });

  await rpm.sync(titles);

  core.setOutput('project-titles', rpm.projects.map((p) => p.title).join(' '));
} catch (error) {
  core.setFailed(error.message);
}
