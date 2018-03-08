# Getting Started

Before starting, you should already have a Redux store set up. You'll also need to have [Redux Thunk](https://github.com/gaearon/redux-thunk) added as middleware:

```js
// index.js
import { applyMiddleware, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

const store = createStore(
	rootReducer,
	applyMiddleware( thunkMiddleware )
);
```

To get started, add the npm package to your project:

```sh
npm install --save @humanmade/repress

# Or, if using Yarn:
yarn add @humanmade/repress
```

Once you've added the library, you'll want to instantiate the handlers for any types you want to use. Typically, you'll want a types file to instantiate handlers in once central place, but you can place them wherever and however you'd like. These need to be instantiated before you create your store however, as you need to register the reducers.

```js
// types.js
import { handler } from '@humanmade/repress';

export const posts = new handler( {
	// `type` (required): used to derive the action names, and typically should
	// match the object type (post type, taxonomy, etc).
	type: 'posts',

	// `url` (required): base URL for the type.
	url:   window.wpApiSettings.url + 'wp/v2/posts',

	// `nonce`: REST API nonce. Only required if you want to write data.
	nonce: window.wpApiSettings.nonce,

	// `fetchOptions`: default options to pass to fetch().
	// fetchOptions: { credentials: 'include' },

	// `query`: default query arguments to include in every request.
	// query: {},

	// `rethrow`: Should we rethrow API errors after dispatching the action? See Actions.
	// rethrow: true,

	// `actions`: action overrides. See Internals.
	// actions: {},
} );

// Register any static archives up-front.
posts.registerArchive( 'home', {} );
```

As usual with a Redux store, you should carefully consider the design of your state and how exactly you want to store your data. Repress takes control of whatever "substate" you assign it, and this can be top-level keys (e.g. `{ pages, posts }`) or at any depth (e.g. `{ apiData: { pages, posts } }`).

Once you've worked out where your Repress substates should live, add the reducers. Typically, this means adding them to your `combineReducers` call:

```js
// reducer.js
import { combineReducers } from 'redux';

import { posts } from './types';

export default combineReducers( {
	// Any regular reducers you have go in here just like normal.
	ui: ( state, action ) => { /* ... */ },
	otherData: ( state, action ) => { /* ... */ },

	// Then, add the reducer method of your handler instance.
	posts: posts.reducer,
} );
```

You should now see the reducers registered in your state, and the default state for each substate (use the [Redux Devtools Extension](https://github.com/zalmoxisus/redux-devtools-extension) to view your state).

Now that your store is set up, you can start [loading data by dispatching actions](actions.md).
