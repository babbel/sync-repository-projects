# sync-repository-projects Javascript action

GitHub Action synchronizing GitHub projects required for a repository.


## Context

This GitHub Action deals with [GitHub projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects) (aka Projects V2). It is intended for maintaining projects associated with the repository triggering GitHub action event. Given a list of GitHub Project titles the action ensures that exactly projects matching these titles exists and are associated with the repository. Missing projects are created and associated with the repository. Projects whose titles are not listed but which are existing will be deleted. The changes are idempotent under the same input.


## Requirements

This GitHub action expects an GitHub action event of type [push](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push).

Moreover, the GitHub token of a GitHub App installation is expected as environment variable `GITHUB_TOKEN`. The GitHub App requires the following permissions.

- Read access to administration and metadata
- Read and write access to code and organization projects


## Inputs

| Name             | Description                                          | Type         | Required? |
|------------------|------------------------------------------------------|--------------|-----------|
| `project-titles` | Space-separated list of projects titles to be synced | `string`     | YES       |


## Outputs

| Name             | Description                                                                              | Type    |
|------------------|------------------------------------------------------------------------------------------|---------|
| `project-titles` | Space-separated list of titles of projects associated with this repository after syncing | `string`|



## Build process

Instead of checking in `node_modules` for the [JavaScript action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
we are using [ncc](https://github.com/vercel/ncc). To build the project run `npm run build`.


## Tests

This project is using [Jest](https://jestjs.io/) for testing. Combining Jest and ES modules [requires](https://jestjs.io/docs/ecmascript-modules) setting node flag `--experimental-vm-modules`. Run the tests as follows.

```
NODE_OPTIONS='--experimental-vm-modules' npm run test
```
