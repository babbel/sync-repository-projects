import { Octokit } from '@octokit/core';
import fetchMock from 'fetch-mock'; // https://github.com/wheresrhys/fetch-mock

import { paginateGraphql } from '@octokit/plugin-paginate-graphql';
import { ApiWrapper } from '../apiwrapper';

const GraphQlOctokit = Octokit.plugin(paginateGraphql);
const octokit = new GraphQlOctokit({ auth: 'fake-token-value' }); // don't use default GITHUB_TOKEN token from env

const apiWrapper = new ApiWrapper({ octokit });

const mockResponse = (name, data) => {
  fetchMock.postOnce({
    name,
    matcher: 'https://api.github.com/graphql',
    response: {
      status: 200,
      body: { data },
    },
  });
};

describe('ApiWrapper', () => {
  afterAll(() => {
    fetchMock.reset();
  });

  describe('.createProject()', () => {
    const data = { createProjectV2: { projectV2: { id: 'PVT_000000000000002' } } };
    const input = {
      title: 'example-project-title',
      organization: { id: 'O_0000000001' },
      repository: { id: 'R_0000000001' },
    };

    beforeEach(() => { mockResponse('createProject', data); });
    afterEach(() => { fetchMock.reset(); });

    test('returns id', async () => {
      const id = await apiWrapper.fetchOrganiztion(input);
      expect(id).toEqual(data.id);
    });
  });

  describe('.fetchOrganiztion()', () => {
    const data = { organization: { id: 'O_0000000001' } };

    beforeEach(() => { mockResponse('fetchOrganiztion', data); });
    afterEach(() => { fetchMock.reset(); });

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

    const input = {
      ownerName: 'acme',
      repositoryName: 'example-repository-name',
    };

    beforeEach(() => { mockResponse('fetchRepository', data); });
    afterEach(() => { fetchMock.reset(); });

    test('returns object containing id', async () => {
      const repository = await apiWrapper.fetchRepository(input);
      expect({ repository }).toEqual(data); // checks deep
    });
  });

  describe('.deleteProject()', () => {
    const data = { projectId: 'PVT_000000000000001' };

    const input = {
      project: { id: 'PVT_000000000000001' },
      clientMutationId: 'example-client-mutation-id',
    };

    beforeEach(() => { mockResponse('deleteProject', data); });
    afterEach(() => { fetchMock.reset(); });

    test('returns object containing id', async () => {
      const id = await apiWrapper.deleteProject(input);
      expect(id).toEqual(data.projectId); // checks deep
    });
  });
});
