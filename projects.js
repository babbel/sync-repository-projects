import { setTimeout } from 'node:timers/promises';

const FetchProjectDelayMillies = 500;
const FetchProjectMaxRuns = 4;

// retry fetching projects when planning to create more than two projects
const FetchProjectRetryLength = 2;

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

  async #fetchProjects(titles, run = 1) {
    this.#repository = await this.#apiWrapper.fetchRepository({
      ownerName: this.#ownerName,
      repositoryName: this.#repositoryName,
    });

    this.#projects = this.#repository.projectsV2.nodes;

    // eslint-disable-next-line no-console
    console.log(`fetched projects, run ${run}: ${JSON.stringify(this.#projects, null, 2)}`);

    this.#titlesToCreate = titles.filter((title) => !this.#projects.map((p) => p.title)
      .includes(title));

    // we suspect that in rare cases the API does not return all projects.
    // try fetching them again when there are suspiciously few projects.
    if (run < FetchProjectMaxRuns && this.#titlesToCreate.length > FetchProjectRetryLength) {
      await setTimeout(FetchProjectDelayMillies);
      return this.#fetchProjects(titles, run + 1);
    }

    return this.#projects;
  }

  async #createMissingProjectsFrom() {
    // eslint-disable-next-line no-console
    console.log(`creating projects ${JSON.stringify(this.#titlesToCreate, null, 2)}`);

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

    // eslint-disable-next-line no-console
    console.log(`deleting projects: ${JSON.stringify(projectsToDelete, null, 2)}`);

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
