# sync-repository-projects
Github Action synchronizing GitHub projects required for a repository

Checking in `node_modules` is required for [JavaScript actions](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action).
When updating node.js dependendies, run `npm install --omit=dev` locallay to commit only the production dependencies.
