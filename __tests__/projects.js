import nock from 'nock';

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

describe('sync', () => {
  test('when no change is required', async () => {
    const titles = [
      'layer-200/foo',
      'layer-100/grogu',
    ];

    nock('https://api.github.com')
      .post('/graphql', (body) => {
        const regex = /.*organization.login:.*/;
        return regex.test(body.query);
      })
      .reply(200, {
        data: {
          organization: {
            id: 'O_kgDOAnsQgg',
            name: 'Babbel Sandbox',
          },
        },
      })
      .post('/graphql', (body) => {
        const regex = /.*projectsV2.first:.*/;
        const result = regex.test(body.query);
        return result;
      })
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
});
