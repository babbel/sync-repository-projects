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

describe('when the API initially returns suspiciously few projects', () => {

  describe('when the API then returns a sane number of projects on second retry', () => {
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

      // API returns three projects fewer than actually exist
      jest.spyOn(apiWrapper, 'fetchRepository')
        .mockImplementationOnce(() => ({
          name: 'example-repository',
          id: 'R_0000000001',
          projectsV2: {
            nodes: [
              {
                id: 'PVT_000000000000001',
                title: 'layer-200/module-1',
              },
            ],
          },
        }))

        // on first retry, API agian returns three projects fewer than expected
        .mockImplementationOnce(() => ({
          name: 'example-repository',
          id: 'R_0000000001',
          projectsV2: {
            nodes: [
              {
                id: 'PVT_000000000000001',
                title: 'layer-100/module-1',
              },
            ],
          },
        }))

        // on second retry, API returns all projects
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
              {
                id: 'PVT_000000000000003',
                title: 'layer-100/module-3',
              },
              {
                id: 'PVT_000000000000004',
                title: 'layer-100/module-4',
              },
              {
                id: 'PVT_000000000000005',
                title: 'layer-100/module-5',
              },
            ],
          },
        }))

        // final call - result of sync() method
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
              {
                id: 'PVT_000000000000003',
                title: 'layer-100/module-3',
              },
              {
                id: 'PVT_000000000000004',
                title: 'layer-100/module-4',
              },
              {
                id: 'PVT_000000000000005',
                title: 'layer-100/module-5',
              },
            ],
          },
        }));

      jest.spyOn(apiWrapper, 'createProject')
        .mockImplementation(() => ('PVT_0000000000000001'));

      rpm = new RepositoryProjectsManager({ apiWrapper, ownerName: 'acme', repositoryName: 'example-repository' });
    });

    test('when four projects are missing', async () => {
      const titles = [
        'layer-200/module-1',
        'layer-100/module-2',
        'layer-100/module-3',
        'layer-100/module-4',
        'layer-100/module-5',
      ];

      await rpm.sync(titles);
      const outputTitles = rpm.projects().map((p) => p.title);
      expect(outputTitles).toEqual(titles);
    });
  });

  describe('when the number of suspicously few projects is actually correct', () => {
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

      // API returns suspiciously few projects but this is correct
      jest.spyOn(apiWrapper, 'fetchRepository')
        .mockImplementationOnce(() => ({
          name: 'example-repository',
          id: 'R_0000000001',
          projectsV2: {
            nodes: [
              {
                id: 'PVT_000000000000001',
                title: 'layer-200/module-1',
              },
            ],
          },
        }))

        // first retry
        .mockImplementationOnce(() => ({
          name: 'example-repository',
          id: 'R_0000000001',
          projectsV2: {
            nodes: [
              {
                id: 'PVT_000000000000001',
                title: 'layer-200/module-1',
              },
            ],
          },
        }))

        // second retry
        .mockImplementationOnce(() => ({
          name: 'example-repository',
          id: 'R_0000000001',
          projectsV2: {
            nodes: [
              {
                id: 'PVT_000000000000001',
                title: 'layer-200/module-1',
              },
            ],
          },
        }))

        // third retry
        .mockImplementationOnce(() => ({
          name: 'example-repository',
          id: 'R_0000000001',
          projectsV2: {
            nodes: [
              {
                id: 'PVT_000000000000001',
                title: 'layer-200/module-1',
              },
            ],
          },
        }))

        // final call - result of sync() method
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
              {
                id: 'PVT_000000000000003',
                title: 'layer-100/module-3',
              },
              {
                id: 'PVT_000000000000004',
                title: 'layer-100/module-4',
              },
              {
                id: 'PVT_000000000000005',
                title: 'layer-100/module-5',
              },
            ],
          },
        }));

      jest.spyOn(apiWrapper, 'createProject')
        .mockImplementation(() => ('PVT_0000000000000001'));

      rpm = new RepositoryProjectsManager({ apiWrapper, ownerName: 'acme', repositoryName: 'example-repository' });
    });

    test('when four projects are missing', async () => {
      const titles = [
        'layer-200/module-1',
        'layer-100/module-2',
        'layer-100/module-3',
        'layer-100/module-4',
        'layer-100/module-5',
      ];

      await rpm.sync(titles);
      const outputTitles = rpm.projects().map((p) => p.title);
      expect(outputTitles).toEqual(titles);
    });
  });
});
