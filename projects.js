import { setTimeout } from 'node:timers/promises';

const FetchProjectMaxRuns = 3;
const FetchProjectDelayMillies = 500;

class RepositoryProjectsManager {
  #apiWrapper;

  #clientMutationId;

  #organization;

  #ownerName;

  #projects;

  #repository;

  #repositoryName;

  #titlesToCreate;

  constructor({ apiWrapper, ownerName, repositoryName }) {
    this.#apiWrapper = apiWrapper;
    this.#ownerName = ownerName;
    this.#repositoryName = repositoryName;

    // the value of this string is not documented other than:
    // "A unique identifier for the client performing the mutation."
    // https://docs.github.com/en/graphql/reference/mutations
    this.#clientMutationId = `sync-repository-projects-${this.#ownerName}-${this.#repositoryName}`;
  }

  async sync(titles) {
    await this.#init(titles);

    await this.#createMissingProjectsFrom();
    await this.#deleteProjectsNotGivenBy(titles);

    // refersh local
    this.#repository = await this.#apiWrapper.fetchRepository({
      ownerName: this.#ownerName,
      repositoryName: this.#repositoryName,
    });
    this.#projects = this.#repository.projectsV2.nodes;
  }

  projects() {
    return this.#projects;
  }

  async #init(tiles) {
    // the GitHub Action's event can contain the "old" GraphQL node id.
    // this produces deprecation warnings. as a workaround, look up the "new" ID.
    // https://github.blog/changelog/label/deprecation/
    this.#organization = await this.#apiWrapper.fetchOrganiztion({ ownerName: this.#ownerName });

    await this.#fetchProjects(tiles);
  }

  async #fetchProjects(titles, run = 0) {
    this.#repository = await this.#apiWrapper.fetchRepository({
      ownerName: this.#ownerName,
      repositoryName: this.#repositoryName,
    });

    this.#projects = this.#repository.projectsV2.nodes;

    this.#titlesToCreate = titles.filter((title) => !this.#projects.map((p) => p.title)
      .includes(title));

    // sometimes the API does not return all projects.
    // try fetching them again when there are suspiciously few projects.
    if (run < FetchProjectMaxRuns && this.#titlesToCreate.length > 2) {
      await setTimeout(FetchProjectDelayMillies);
      return this.#fetchProjects(titles, run + 1);
    }

    return this.#projects;
  }

  async #createMissingProjectsFrom() {
    for await (const title of this.#titlesToCreate) {
      // call synchronously because more than 5 async requests break API endpoint
      await this.#apiWrapper.createProject({
        title,
        organization: this.#organization,
        repository: this.#repository,
      });
    }
  }

  async #deleteProjectsNotGivenBy(titles) {
    const projectsToDelete = this.#projects.filter((p) => !titles.includes(p.title));

    for await (const project of projectsToDelete) {
      // more than 5 breaks API endpoint
      await this.#apiWrapper.deleteProject({
        project,
        clientMutationId: this.#clientMutationId,
      });
    }
  }
}

export { RepositoryProjectsManager }; // eslint-disable-line import/prefer-default-export
