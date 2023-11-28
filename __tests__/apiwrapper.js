import { Octokit } from '@octokit/core';
import { paginateGraphql } from '@octokit/plugin-paginate-graphql';

import { graphql, HttpResponse } from 'msw'; // https://mswjs.io/docs/getting-started/mocks/graphql-api
import { setupServer } from 'msw/node'; // https://mswjs.io/docs/getting-started/integrate/node

import { ApiWrapper } from '../apiwrapper';

const GraphQlOctokit = Octokit.plugin(paginateGraphql);
const octokit = new GraphQlOctokit({ auth: 'fake-token-value' }); // don't use default GITHUB_TOKEN token from env

const apiWrapper = new ApiWrapper({ octokit });

let server; // MSW mock server

describe('ApiWrapper', () => {
  afterEach(() => {
    server.close();
  });

  describe('.createProject()', () => {
    const data = { createProjectV2: { projectV2: { id: 'PVT_000000000000002' } } };

    beforeAll(() => {
      server = setupServer(
        graphql.mutation(/createProject/, () => HttpResponse.json({ data })),
      );
      server.listen();
    });

    const input = {
      title: 'example-project-title',
      organization: { id: 'O_0000000001' },
      repository: { id: 'R_0000000001' },
    };

    test('returns id', async () => {
      const id = await apiWrapper.createProject(input);
      expect(id).toEqual(data.createProjectV2.projectV2.id);
    });
  });

  describe('.fetchOrganiztion()', () => {
    const data = { organization: { id: 'O_0000000001' } };

    beforeAll(() => {
      server = setupServer(
        graphql.query(/fetchOrgainzation/, () => HttpResponse.json({ data })),
      );
      server.listen();
    });

    test('returns object containing id', async () => {
      const { id } = await apiWrapper.fetchOrganiztion({ owner: 'acme' });
      expect(id).toEqual(data.organization.id);
    });
  });

  describe('.fetchRepository()', () => {
    const data = {
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
    };

    beforeAll(() => {
      server = setupServer(
        graphql.query(/paginate/, () => HttpResponse.json({ data })),
      );
      server.listen();
    });

    const input = {
      ownerName: 'acme',
      repositoryName: 'example-repository-name',
    };

    test('returns object containing id', async () => {
      const repository = await apiWrapper.fetchRepository(input);
      expect({ repository }).toEqual(data); // checks deep
    });
  });

  describe('.deleteProject()', () => {
    const data = { projectId: 'PVT_000000000000001' };

    beforeAll(() => {
      server = setupServer(
        graphql.mutation(/deleteProject/, () => HttpResponse.json({ data })),
      );
      server.listen();
    });

    const input = {
      project: { id: 'PVT_000000000000001' },
      clientMutationId: 'example-client-mutation-id',
    };

    test('returns object containing id', async () => {
      const id = await apiWrapper.deleteProject(input);
      expect(id).toEqual(data.projectId); // checks deep
    });
  });
});
