class ApiWrapper {
  constructor({ octokit, owner, repository }) {
    this.octokit = octokit;
    this.owner = owner;
    this.repository = repository;

    // the value of this string is not documented other than:
    // "A unique identifier for the client performing the mutation."
    // https://docs.github.com/en/graphql/reference/mutations
    this.clientMutationId = `sync-repository-projects-${this.owner}-${this.repository}`;
  }

  async createProject({ title, organization, repository }) {
    const { createProjectV2: { projectV2: { id } } } = await this.octokit.graphql(`
      mutation {
        createProjectV2(
          input: {
            ownerId: "${organization.id}",
            title: "${title}",
            repositoryId: "${repository.id}",
          }
        ){
          projectV2 {
            id
          }
        }
      }`);

    return id;
  }

  async fetchOrganiztion() {
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

    return organization;
  }

  async fetchRepository({ repositoryName }) {
    // max limit for `first` is 100
    // https://docs.github.com/en/graphql/overview/resource-limitations
    const response = await this.octokit.graphql.paginate(`
      query paginate($cursor: String) {
        repository(owner: "${this.owner}", name: "${repositoryName}") {
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
    return response.repository;
  }

  async deleteProject({ project }) {
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

class RepositoryProjectsManager {
  constructor({ apiWrapper }) {
    this.apiWrapper = apiWrapper;
    this.owner = apiWrapper.owner;
    this.repositoryName = apiWrapper.repository;
  }

  async sync(titles) {
    await this.#init();

    await this.#createMissingProjectsFrom(titles);
    await this.#deleteProjectsNotGivenBy(titles);

    // refersh local
    this.repository = await this.apiWrapper.fetchRepository({
      repositoryName: this.repositoryName,
    });
    this.projects = this.repository.projectsV2.nodes;
  }

  async #init() {
    // the GitHub Action's event can contain the "old" GraphQL node id.
    // this produces deprecation warnings. as a workaround, look up the "new" ID.
    // https://github.blog/changelog/label/deprecation/
    this.organization = this.apiWrapper.fetchOrganiztion();

    this.repository = await this.apiWrapper.fetchRepository({
      repositoryName: this.repositoryName,
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

// eslint-disable-next-line import/prefer-default-export
export { ApiWrapper, RepositoryProjectsManager };
