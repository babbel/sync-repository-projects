class ApiWrapper {
  #octokit;

  constructor({ octokit }) {
    this.#octokit = octokit;
  }

  async createProject({ title, organization, repository }) {
    const { createProjectV2: { projectV2: { id } } } = await this.#octokit.graphql(`
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

  async fetchOrganiztion({ ownerName }) {
    const { organization } = await this.#octokit.graphql(
      `
      query {
        organization(login: "${ownerName}") {
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

  async fetchRepository({ ownerName, repositoryName }) {
    // max limit for `first` is 100
    // https://docs.github.com/en/graphql/overview/resource-limitations
    const response = await this.#octokit.graphql.paginate(`
      query paginate($cursor: String) {
        repository(owner: "${ownerName}", name: "${repositoryName}") {
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

  async deleteProject({ project, clientMutationId }) {
    const { projectId: id } = await this.#octokit.graphql(`
      mutation{
        deleteProjectV2(
          input: {
            clientMutationId: "${clientMutationId}"
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
