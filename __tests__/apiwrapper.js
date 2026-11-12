import { Octokit } from '@octokit/core';  
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql';

import { HttpResponse } from 'msw';
import { graphql } from 'msw/graphql'; // https://mswjs.io/docs/network-behavior/graphql
import { setupServer } from 'msw/node'; // https://mswjs.io/docs/getting-started/integrate/node

import { ApiWrapper } from '../apiwrapper';

const GraphQlOctokit = Octokit.plugin(paginateGraphQL);
const octokit = new GraphQlOctokit({ auth: 'fake-token-value' }); // don't use default GITHUB_TOKEN token from env

const apiWrapper = new ApiWrapper({ octokit });

const github = graphql.link('https://api.github.com/graphql'); // https://mswjs.io/docs/api/graphql#graphqllinkurl

const server = setupServer(); // https://mswjs.io/docs/api/setup-server/
const mock = ({ action, matcher, data }) => {
  const actions = {
    mutation: github.mutation,
    query: github.query,
  };

  server.use(
    actions[action](matcher, () => HttpResponse.json({ data })),
  );
};

describe('ApiWrapper', () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('.createProject()', () => {
    const data = { createProjectV2: { projectV2: { id: 'PVT_000000000000002' } } };

    beforeEach(() => {
      mock({ action: 'mutation', matcher: /createProject/, data });
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

    beforeEach(() => {
      mock({ action: 'query', matcher: /fetchOrgainzation/, data });
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

    beforeEach(() => {
      mock({ action: 'query', matcher: /paginate/, data });
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

  describe('.addStatusOptions()', () => {
    let variables;

    beforeEach(() => {
      server.use(
        github.mutation(/addStatusOptions/, ({ variables: requestVariables }) => {
          variables = requestVariables;
          return HttpResponse.json({ data: { updateProjectV2Field: { projectV2Field: { id: 'F1' } } } });
        }),
      );
    });

    const field = {
      id: 'F1',
      options: [
        {
          id: 'o1', name: 'Todo', color: 'GREEN', description: 'Not started',
        },
        {
          id: 'o2', name: 'In Progress', color: 'YELLOW', description: '',
        },
      ],
    };

    test('keeps the existing options and adds the new ones after the first', async () => {
      await apiWrapper.addStatusOptions({ field, options: [{ name: 'Blocked', color: 'RED' }] });

      expect(variables).toEqual({
        fieldId: 'F1',
        options: [
          field.options[0],
          { name: 'Blocked', color: 'RED', description: '' },
          field.options[1],
        ],
      });
    });
  });

  describe('.deleteProject()', () => {
    const data = { projectId: 'PVT_000000000000001' };

    beforeEach(() => {
      mock({ action: 'mutation', matcher: /deleteProject/, data });
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
