import { jest } from '@jest/globals'; // eslint-disable-line import/no-extraneous-dependencies

import { ApiWrapper } from '../apiwrapper';
import { RepositoryProjectsManager } from '../projects.js'; // eslint-disable-line import/extensions

describe('RepositoryProjectsManager.sync() posts requests to the API', () => {
  let rpm;

  beforeEach(() => {
    const apiWrapper = new ApiWrapper({ octokit: null });

    jest.spyOn(apiWrapper, 'fetchOrganiztion')
      .mockImplementation(() => ({
        organization: {
          id: 'O_0000000001',
          name: 'Babbel Sandbox',
        },
      }));

    jest.spyOn(apiWrapper, 'fetchRepository')
      .mockImplementationOnce(() => ({
        name: 'example-repository',
        id: 'R_0000000001',
        projectsV2: {
          nodes: [
            {
              id: 'PVT_000000000000002',
              title: 'layer-100/module-2',
            },
          ],
        },
      }))
      .mockImplementationOnce(() => ({
        name: 'example-repository',
        id: 'R_0000000001',
        projectsV2: {
          nodes: [
            {
              id: 'PVT_000000000000001',
              title: 'layer-200/module-1',
            },
            {
              id: 'PVT_000000000000002',
              title: 'layer-100/module-2',
            },
          ],
        },
      }));

    jest.spyOn(apiWrapper, 'createProject')
      .mockImplementation(() => ('PVT_0000000000000001'));

    rpm = new RepositoryProjectsManager({ apiWrapper, ownerName: 'acme', repositoryName: 'example-repository' });
  });

  test('when one project is missing', async () => {
    const titles = [
      'layer-200/module-1',
      'layer-100/module-2',
    ];

    await rpm.sync(titles);
    const outputTitles = rpm.projects().map((p) => p.title);
    expect(outputTitles).toEqual(titles);
  });
});
