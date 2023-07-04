class RepositoryProjectsManager {
  constructor({ apiWrapper }) {
    this.apiWrapper = apiWrapper;
  }

  async sync(titles) {
    await this.#init();

    await this.#createMissingProjectsFrom(titles);
    await this.#deleteProjectsNotGivenBy(titles);

    // refersh local
    this.repository = await this.apiWrapper.fetchRepository({
      repositoryName: this.apiWrapper.repositoryName
    });
    this.projects = this.repository.projectsV2.nodes;
  }

  async #init() {
    // the GitHub Action's event can contain the "old" GraphQL node id.
    // this produces deprecation warnings. as a workaround, look up the "new" ID.
    // https://github.blog/changelog/label/deprecation/
    this.organization = this.apiWrapper.fetchOrganiztion();

    this.repository = await this.apiWrapper.fetchRepository({
      repositoryName: this.apiWrapper.repositoryName
    });
    this.projects = this.repository.projectsV2.nodes;
  }

  async #createMissingProjectsFrom(titles) {
    const titlesToCreate = titles.filter((title) => !this.projects.map((p) => p.title)
      .includes(title));

    for await (const title of titlesToCreate) {
      // call synchronously because more than 5 async requests break API endpoint
      await this.apiWrapper.createProject({
        title,
        organization: this.organization,
        repository: this.repository,
      });
    }
  }

  async #deleteProjectsNotGivenBy(titles) {
    const projectsToDelete = this.projects.filter((p) => !titles.includes(p.title));

    for await (const project of projectsToDelete) {
      await this.apiWrapper.deleteProject(project); // more than 5 breaks API endpoint
    }
  }
}

export { RepositoryProjectsManager }; // eslint-disable-line import/prefer-default-export
