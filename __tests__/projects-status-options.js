import { jest } from '@jest/globals';

import { ApiWrapper } from '../apiwrapper';
import { RepositoryProjectsManager } from '../projects.js';

const statusField = (id, names) => ({
  id,
  options: names.map((name) => ({
    id: `${id}-${name}`, name, color: 'GRAY', description: '',
  })),
});

describe('RepositoryProjectsManager.sync() with status options', () => {
  let apiWrapper;
  let rpm;

  const repository = {
    name: 'example-repository',
    id: 'R_0000000001',
    projectsV2: {
      nodes: [
        {
          id: 'PVT_000000000000001',
          title: 'layer-100/module-1',
          field: statusField('F1', ['Todo', 'In Progress', 'Done']),
        },
        {
          id: 'PVT_000000000000002',
          title: 'layer-100/module-2',
          field: statusField('F2', ['Todo', 'Blocked', 'In Progress', 'Done']),
        },
        {
          id: 'PVT_000000000000003',
          title: 'layer-100/module-3',
          field: null,
        },
      ],
    },
  };
  const titles = repository.projectsV2.nodes.map((p) => p.title);

  beforeEach(() => {
    apiWrapper = new ApiWrapper({ octokit: null });

    jest.spyOn(apiWrapper, 'fetchOrganiztion')
      .mockImplementation(() => ({ id: 'O_0000000001', name: 'Babbel Sandbox' }));
    jest.spyOn(apiWrapper, 'fetchRepository')
      .mockImplementation(() => repository);
    jest.spyOn(apiWrapper, 'addStatusOptions')
      .mockImplementation(() => ({}));

    rpm = new RepositoryProjectsManager({ apiWrapper, ownerName: 'acme', repositoryName: 'example-repository' });
  });

  test('adds the missing options to the projects lacking them', async () => {
    await rpm.sync(titles, [{ name: 'Blocked', color: 'RED' }]);

    expect(apiWrapper.addStatusOptions).toHaveBeenCalledTimes(1);
    expect(apiWrapper.addStatusOptions).toHaveBeenCalledWith({
      field: repository.projectsV2.nodes[0].field,
      options: [{ name: 'Blocked', color: 'RED' }],
    });
  });

  test('changes nothing without status options', async () => {
    await rpm.sync(titles);

    expect(apiWrapper.addStatusOptions).not.toHaveBeenCalled();
  });
});
