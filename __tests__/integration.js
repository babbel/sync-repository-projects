import fetchMock from 'fetch-mock'; // https://github.com/wheresrhys/fetch-mock

import { Octokit } from '@octokit/core';
import { paginateGraphql } from '@octokit/plugin-paginate-graphql';
import { ApiWrapper } from '../apiwrapper';
import { RepositoryProjectsManager } from '../projects.js'; // eslint-disable-line import/extensions

const GraphQlOctokit = Octokit.plugin(paginateGraphql);
const octokit = new GraphQlOctokit({ auth: 'fake-token-value' }); // don't use default GITHUB_TOKEN token from env

const apiWrapper = new ApiWrapper({ octokit });

const rpm = new RepositoryProjectsManager({ apiWrapper, ownerName: 'acme', repositoryName: 'example-repository' });

describe('RepositoryProjectsManager integration test', () => {
  afterAll(() => {
    fetchMock.reset();
  });

  beforeEach(() => {
    fetchMock
      .postOnce({
        name: '1',
        matcher: 'https://api.github.com/graphql',
        response: {
          status: 200,
          body: {
            data: {
              organization: {
                id: 'O_0000000001',
                name: 'ACME Corporation',
              },
            },
          },
        },
      })
      .postOnce({
        name: '2',
        matcher: 'https://api.github.com/graphql',
        response: {
          status: 200,
          body: {
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
        },
      })
      .postOnce({
        name: '3',
        matcher: 'https://api.github.com/graphql',
        response: {
          status: 200,
          body: {
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
        },
      });
  });

  afterEach(() => {
    fetchMock.reset();
  });

  test('when no change is required', async () => {
    const titles = [
      'layer-200/module-1',
      'layer-100/module-2',
    ];

    await rpm.sync(titles);
    const outputTitles = rpm.projects().map((p) => p.title);
    expect(outputTitles).toEqual(titles);
  });
});
