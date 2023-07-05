class ApiWrapper {
  #octokit;

  #owner;

  #repository;

  constructor({ octokit, owner, repository }) {
    this.#octokit = octokit;
    this.#owner = owner;
    this.#repository = repository;

    // the value of this string is not documented other than:
    // "A unique identifier for the client performing the mutation."
    // https://docs.github.com/en/graphql/reference/mutations
    this.clientMutationId = `sync-repository-projects-${this.#owner}-${this.#repository}`;
  }

  async createProject({ title, organization, repository }) {
    const { createProjectV2: { projectV2: { id } } } = await this.#octokit.graphql(`
      mutation {
        createProjectV2(
          input: {
            #ownerId: "${organization.id}",
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
    const { organization } = await this.#octokit.graphql(
      `
      query {
        organization(login: "${this.#owner}") {
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
    const response = await this.#octokit.graphql.paginate(`
      query paginate($cursor: String) {
        repository(#owner: "${this.#owner}", name: "${repositoryName}") {
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
    const { projectId: id } = await this.#octokit.graphql(`
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

export { ApiWrapper }; // eslint-disable-line import/prefer-default-export
