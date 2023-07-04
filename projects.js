class ApiWrapper {
  constructor({ octokit }) {
    this.octokit = octokit;
  }

}

class RepositoryProjectsManager {
  constructor({ owner, repository, apiWrapper }) {
    this.owner = owner;
    this.repositoryName = repository;
    this.apiWrapper = apiWrapper;

    // the value of this string is not documented other than:
    // "A unique identifier for the client performing the mutation."
    // https://docs.github.com/en/graphql/reference/mutations
    this.clientMutationId = `sync-repository-projects-${owner}-${repository}`;
  }

  async sync(titles) {
    await this.#init();

    await this.#createMissingProjectsFrom(titles);
    await this.#deleteProjectsNotGivenBy(titles);

    await this.#fetchRepositoryAndProjects(); // refresh local
  }

  async #init() {
    // the GitHub Action's event can contain the "old" GraphQL node id.
    // this produces deprecation warnings. as a workaround, look up the "new" ID.
    // https://github.blog/changelog/label/deprecation/
    const { organization } = await this.octokit.graphql(
      `
      query {
        organization(login: "${this.owner}") {
          id
          name
        }
      }`,
      {
        headers: {
          'X-Github-Next-Global-ID': '1',
        },
      },
    );
    this.organization = organization;

    await this.#fetchRepositoryAndProjects();
  }

  async #fetchRepositoryAndProjects() {
    // max limit for `first` is 100
    // https://docs.github.com/en/graphql/overview/resource-limitations
    const response = await this.octokit.graphql.paginate(`
      query paginate($cursor: String) {
        repository(owner: "${this.owner}", name: "${this.repositoryName}") {
          name
          id
          projectsV2(first: 100, after: $cursor) {
            nodes {
              id
              title
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`);
    this.repository = response.repository;
    this.projects = response.repository.projectsV2.nodes;
  }

  async #createMissingProjectsFrom(titles) {
    const titlesToCreate = titles.filter((title) => !this.projects.map((p) => p.title)
      .includes(title));

    for await (const title of titlesToCreate) {
      // call synchronously because more than 5 async requests break API endpoint
      await this.#createProject(title);
    }
  }

  async #deleteProjectsNotGivenBy(titles) {
    const projectsToDelete = this.projects.filter((p) => !titles.includes(p.title));

    for await (const project of projectsToDelete) {
      await this.#deleteProject(project); // more than 5 breaks API endpoint
    }
  }

  async #createProject(title) {
    const { createProjectV2: { projectV2: { id } } } = await this.octokit.graphql(`
      mutation{
        createProjectV2(
          input: {
            ownerId: "${this.organization.id}",
            title: "${title}",
            repositoryId: "${this.repository.id}",
          }
        ){
          projectV2 {
            id
          }
        }
      }`);

    return id;
  }

  async #deleteProject(project) {
    const { projectId: id } = await this.octokit.graphql(`
      mutation{
        deleteProjectV2(
          input: {
            clientMutationId: "${this.clientMutationId}"
            projectId: "${project.id}",
          }
        ){
          projectV2 {
            id
          }
        }
      }`);

    return id;
  }
}

export { RepositoryProjectsManager }; // eslint-disable-line import/prefer-default-export
