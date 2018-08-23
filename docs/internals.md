# Internals

## Substate Format

Each handler's substate is an object with the following properties:

* `archives`: An object containing a map from archive ID to list of object IDs.
* `posts`: A flat list of all posts objects.
* `loadingArchive`: A string indicating the currently loading archive. `false` if not loading.
* `loadingPost`: A number indicating the currently loading object ID. `false` if not loading.
* `saving`: A number indicating the currently saving object ID. `false` if not loading.
* `deleting`: An array containing object IDs currently being deleted.

Generally, you should use the helpers on the handler object rather than reaching into the substate directly.

**Note:** The substate may be partially uninitialised if the state was initialised by Redux's `initialState` parameter. Any code that reaches into the substate must be prepared to deal with this.

## Actions

By default, the action names are automatically derived from the type you pass in. These are named `{action}_{type}`, where `{action}` is one of `QUERY` (for `fetchArchive`), `LOAD` (for `fetchSingle`), `CREATE` (for `createSingle`) or `UPDATE` (for `updateSingle`). They are split into three subactions: request (`{action}_{type}_REQUEST`), success (`{action}_{type}`) and error (`{action}_{type}_ERROR`).

For example, for `new handler( { type: 'post' } )`, the actions fired by `fetchArchive` are:

* `QUERY_POST_REQUEST`
* `QUERY_POST` on successful response
* `QUERY_POST_ERROR` on error from the API

Each action includes relevant data and IDs, allowing you to store additional data in the rest of your store. For example, you may want to store the error object for display to the user.

These default actions can be overridden by passing the `actions` option to the constructor.
