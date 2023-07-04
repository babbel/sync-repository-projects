import nock from 'nock'; // https://github.com/nock/nock

import { Octokit } from '@octokit/core';
import { paginateGraphql } from '@octokit/plugin-paginate-graphql';
import { ApiWrapper } from '../apiwrapper';
import { RepositoryProjectsManager } from '../projects.js'; // eslint-disable-line import/extensions

const GraphQlOctokit = Octokit.plugin(paginateGraphql);
const octokit = new GraphQlOctokit({ auth: 'fake-token-value' }); // don't use default GITHUB_TOKEN token from env

const apiWrapper = new ApiWrapper({ octokit, owner: 'acme', repository: 'example-repository' });

const rpm = new RepositoryProjectsManager({ apiWrapper });

describe('RepositoryProjectsManager.sync() posts requests to the API', () => {
  beforeEach(() => {
    nock.restore();
    nock.activate();
  });

  afterEach(() => {
    nock.restore();
  });

  test('when no change is required', async () => {
    const titles = [
      'layer-200/module-1',
      'layer-100/module-2',
    ];

    nock('https://api.github.com')
      .post('/graphql', (body) => /.*organization.login:.*/.test(body.query))
      .reply(200, {
        data: {
          organization: {
            id: 'O_0000000001',
            name: 'ACME Corporation',
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
              name: 'example-repository',
              id: 'R_0000000001',
              projectsV2: {
                nodes: [
                  {
                    id: 'PVT_kwDOAnsQgs4AP9Qq',
                    title: 'layer-200/module-1',
                  },
                  {
                    id: 'PVT_000000000000002',
                    title: 'layer-100/module-2',
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
      'layer-200/module-1',
      'layer-100/module-2',
    ];

    nock('https://api.github.com')
      .post('/graphql', (body) => /organization.login:/.test(body.query))
      .reply(200, {
        data: {
          organization: {
            id: 'O_0000000001',
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
              name: 'example-repository',
              id: 'R_0000000001',
              projectsV2: {
                nodes: [
                  {
                    id: 'PVT_000000000000002',
                    title: 'layer-100/module-2',
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
                id: 'PVT_0000000000000001',
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
              name: 'example-repository',
              id: 'R_0000000001',
              projectsV2: {
                nodes: [
                  {
                    id: 'PVT_0000000000000001',
                    title: 'layer-200/module-1',
                  },
                  {
                    id: 'PVT_000000000000002',
                    title: 'layer-100/module-2',
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
