import { Octokit } from '@octokit/core';  
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql';

import { HttpResponse } from 'msw';
import { graphql } from 'msw/graphql'; // https://mswjs.io/docs/network-behavior/graphql
import { setupServer } from 'msw/node'; // https://mswjs.io/docs/getting-started/integrate/node

import { ApiWrapper } from '../apiwrapper';
import { RepositoryProjectsManager } from '../projects.js';  

const GraphQlOctokit = Octokit.plugin(paginateGraphQL);
const octokit = new GraphQlOctokit({ auth: 'fake-token-value' }); // don't use default GITHUB_TOKEN token from env

const apiWrapper = new ApiWrapper({ octokit });

const rpm = new RepositoryProjectsManager({ apiWrapper, ownerName: 'acme', repositoryName: 'example-repository' });

const github = graphql.link('https://api.github.com/graphql'); // https://mswjs.io/docs/api/graphql#graphqllinkurl

const server = setupServer(); // MSW mock server

describe('RepositoryProjectsManager integration test', () => {
  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    server.use(
      github.query(/fetchOrgainzation/, () => HttpResponse.json({
        data: {
          organization: {
            id: 'O_0000000001',
            name: 'ACME Corporation',
          },
        },
      })),
      github.query(/paginate/, () => HttpResponse.json({
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
      github.query(/paginate/, () => HttpResponse.json({
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
