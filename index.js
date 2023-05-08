import core from '@actions/core';
import github from '@actions/github';

import { Octokit } from '@octokit/core';
import { createTokenAuth } from '@octokit/auth-token';
import { paginateGraphql } from '@octokit/plugin-paginate-graphql';

import { RepositoryProjectsManager } from './projects.js'; // eslint-disable-line import/extensions

// assamble auth octokit client
// expecting token with tokenType "installation"
const authentication = createTokenAuth(process.env.GITHUB_TOKEN);
const auth = await authentication();

const GraphQlOctokit = Octokit.plugin(paginateGraphql);

// https://github.com/octokit/authentication-strategies.js
// example: https://github.com/octokit/graphql.js/issues/61#issuecomment-542399763
// for token type installation, pass only the token
const octokit = new GraphQlOctokit({ auth: auth.token });

try {
  const projectsInput = core.getInput('projects');
  const projects = projectsInput.split(/\s+/);

  // Get the JSON webhook payload for the event that triggered the workflow
  const {
    context: {
      payload: {
        repository,
      },
    },
  } = github;

  const rpm = new RepositoryProjectsManager({
    owner: repository.owner.login,
    repository: repository.name,
    octokit,
  });

  await rpm.init();
  await rpm.sync(projects);

  core.setOutput('projects', rpm.projects.map((p) => p.title));
} catch (error) {
  core.setFailed(error.message);
}
