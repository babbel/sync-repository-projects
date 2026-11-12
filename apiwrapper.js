class ApiWrapper {
  #octokit;

  constructor({ octokit }) {
    this.#octokit = octokit;
  }

  async createProject({ title, organization, repository }) {
    const { createProjectV2: { projectV2: { id } } } = await this.#octokit.graphql(`
      mutation createProject {
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
      query fetchOrgainzation {
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
              field(name: "Status") {
                ... on ProjectV2SingleSelectField {
                  id
                  options {
                    id
                    name
                    color
                    description
                  }
                }
              }
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

  async addStatusOptions({ field, options }) {
    const existing = field.options.map(({
      id, name, color, description,
    }) => ({
      id, name, color, description,
    }));
    const added = options.map(({ name, color }) => ({ name, color, description: '' }));

    const { updateProjectV2Field: { projectV2Field } } = await this.#octokit.graphql(
      `
      mutation addStatusOptions($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
        updateProjectV2Field(input: { fieldId: $fieldId, singleSelectOptions: $options }) {
          projectV2Field {
            ... on ProjectV2SingleSelectField {
              id
              options {
                id
                name
              }
            }
          }
        }
      }`,
      {
        fieldId: field.id,
        options: [...existing.slice(0, 1), ...added, ...existing.slice(1)],
      },
    );

    return projectV2Field;
  }

  async deleteProject({ project, clientMutationId }) {
    const { projectId: id } = await this.#octokit.graphql(`
      mutation deleteProject {
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

export { ApiWrapper };  
