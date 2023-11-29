import { Octokit } from '@octokit/core';
import { paginateGraphql } from '@octokit/plugin-paginate-graphql';

import { graphql, HttpResponse } from 'msw'; // https://mswjs.io/docs/getting-started/mocks/graphql-api
import { setupServer } from 'msw/node'; // https://mswjs.io/docs/getting-started/integrate/node

import { ApiWrapper } from '../apiwrapper';
import { RepositoryProjectsManager } from '../projects.js'; // eslint-disable-line import/extensions

const GraphQlOctokit = Octokit.plugin(paginateGraphql);
const octokit = new GraphQlOctokit({ auth: 'fake-token-value' }); // don't use default GITHUB_TOKEN token from env

const apiWrapper = new ApiWrapper({ octokit });

const rpm = new RepositoryProjectsManager({ apiWrapper, ownerName: 'acme', repositoryName: 'example-repository' });

const server = setupServer(); // MSW mock server

describe('RepositoryProjectsManager integration test', () => {
  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    server.use(
      graphql.query(/fetchOrgainzation/, () => HttpResponse.json({
        data: {
          organization: {
            id: 'O_0000000001',
            name: 'ACME Corporation',
          },
        },
      })),
      graphql.query(/paginate/, () => HttpResponse.json({
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
      })),
      graphql.query(/paginate/, () => HttpResponse.json({
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
      })),
    );
  });

  afterAll(() => {
    server.close();
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
