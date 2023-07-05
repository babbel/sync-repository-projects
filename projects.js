class RepositoryProjectsManager {
  #apiWrapper;

  #clientMutationId;

  #organization;

  #ownerName;

  #projects;

  #repository;

  #repositoryName;

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
    await this.#init();

    await this.#createMissingProjectsFrom(titles);
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

  async #init() {
    // the GitHub Action's event can contain the "old" GraphQL node id.
    // this produces deprecation warnings. as a workaround, look up the "new" ID.
    // https://github.blog/changelog/label/deprecation/
    this.#organization = this.#apiWrapper.fetchOrganiztion({ ownerName: this.#ownerName });

    this.#repository = await this.#apiWrapper.fetchRepository({
      ownerName: this.#ownerName,
      repositoryName: this.#repositoryName,
    });
    this.#projects = this.#repository.projectsV2.nodes;
  }

  async #createMissingProjectsFrom(titles) {
    const titlesToCreate = titles.filter((title) => !this.#projects.map((p) => p.title)
      .includes(title));

    for await (const title of titlesToCreate) {
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
