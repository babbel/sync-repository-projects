import nock from 'nock'; // https://github.com/nock/nock

import { Octokit } from '@octokit/core';
import { paginateGraphql } from '@octokit/plugin-paginate-graphql';
import { RepositoryProjectsManager } from '../projects.js'; // eslint-disable-line import/extensions

const GraphQlOctokit = Octokit.plugin(paginateGraphql);
const octokit = new GraphQlOctokit({ auth: 'fake-token-value' }); // dont' use default GITHUB_TOKEN token from env

const rpm = new RepositoryProjectsManager({
  owner: 'babbel-sandbox',
  repository: 'test-repo-jsaito-3',
  octokit,
});

describe('RepositoryProjectsManager.sync() posts requests to the API', () => {
  beforeEach(() => {
    if (!nock.isActive()) {
      nock.restore();
      nock.activate();
    }
  });

  afterEach(() => {
    nock.restore();
  });

  test('when no change is required', async () => {
    const titles = [
      'layer-200/foo',
      'layer-100/grogu',
    ];

    nock('https://api.github.com')
      .post('/graphql', (body) => /.*organization.login:.*/.test(body.query))
      .reply(200, {
        data: {
          organization: {
            id: 'O_kgDOAnsQgg',
            name: 'Babbel Sandbox',
          },
        },
      })
      .post('/graphql', (body) => /projectsV2.first:/.test(body.query))
      .twice()
      .reply(
        200,
        {
          data: {
            repository: {
              name: 'test-repo-jsaito-3',
              id: 'R_kgDOJSgWug',
              projectsV2: {
                nodes: [
                  {
                    id: 'PVT_kwDOAnsQgs4AP9Qq',
                    title: 'layer-200/foo',
                  },
                  {
                    id: 'PVT_kwDOAnsQgs4AP9Qo',
                    title: 'layer-100/grogu',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'Nw',
                },
              },
            },
          },
        },
      );

    await rpm.sync(titles);
    const outputTitles = rpm.projects.map((p) => p.title);
    expect(outputTitles).toEqual(titles);
  });

  test('when one project is missing', async () => {
    const titles = [
      'layer-200/foo',
      'layer-100/grogu',
    ];

    nock('https://api.github.com')
      .post('/graphql', (body) => /organization.login:/.test(body.query))
      .reply(200, {
        data: {
          organization: {
            id: 'O_kgDOAnsQgg',
            name: 'Babbel Sandbox',
          },
        },
      })
      .post('/graphql', (body) => /projectsV2.first:/.test(body.query))
      .reply(
        200,
        {
          data: {
            repository: {
              name: 'test-repo-jsaito-3',
              id: 'R_kgDOJSgWug',
              projectsV2: {
                nodes: [
                  {
                    id: 'PVT_kwDOAnsQgs4AP9Qo',
                    title: 'layer-100/grogu',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'Mq',
                },
              },
            },
          },
        },
      )
      .post('/graphql', (body) => /createProjectV2/.test(body.query))
      .reply(
        200,
        {
          data: {
            createProjectV2: {
              projectV2: {
                id: 'PVT_kwDOAnsQgs4AQD1t',
              },
            },
          },
        },
      )
      .post('/graphql', (body) => /projectsV2.first:/.test(body.query))
      .reply(
        200,
        {
          data: {
            repository: {
              name: 'test-repo-jsaito-3',
              id: 'R_kgDOJSgWug',
              projectsV2: {
                nodes: [
                  {
                    id: 'PVT_kwDOAnsQgs4AQD1t',
                    title: 'layer-200/foo',
                  },
                  {
                    id: 'PVT_kwDOAnsQgs4AP9Qo',
                    title: 'layer-100/grogu',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'Mq',
                },
              },
            },
          },
        },
      );

    await rpm.sync(titles);
    const outputTitles = rpm.projects.map((p) => p.title);
    expect(outputTitles).toEqual(titles);
  });
});
