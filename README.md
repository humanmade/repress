<table width="100%">
	<tr>
		<td align="left" width="70%">
			<strong>Repress</strong><br />
			Connect your Redux store to the WordPress REST API.
		</td>
		<td align="right" width="20%">
			<br />
		</td>
	</tr>
	<tr>
		<td>
			A <strong><a href="https://hmn.md/">Human Made</a></strong> project. Maintained by @rmccue.
		</td>
		<td align="center">
			<img src="https://hmn.md/content/themes/hmnmd/assets/images/hm-logo.svg" width="100" />
		</td>
	</tr>
</table>

Repress is a tiny library which takes control of part of your Redux state and handles talking to the WordPress REST API. Repress only owns a piece of your Redux state (called the **substate**), allowing you to incrementally add it to existing projects and remain in control of your store.

Repress requires Redux and [Redux Thunk](https://github.com/gaearon/redux-thunk).

Keep reading for a simple introduction, or dive into [the documentation](docs/README.md).

## The Basics

This library is a reusable tool that you can gradually add to your codebase. You simply create "handlers" for every top-level object (posts or CPTs, comments, terms, and users) you'd like to keep in your Redux store, and the handler takes care of dispatching.

The handler "owns" a piece of your global Redux state called the **substate**, and handles dispatching and reducing any actions related to it. You can keep the substate wherever you want in your Redux store, allowing you to incrementally adopt the library.

Setting up a handler is a three-step process:

1. Instantiate a handler with options for the type
2. Add the reducer to the store
3. Create actions and helpers using the handler's methods


### A Simple Example

Typically, you'll want to have a single `types.js` file containing the setup for all your types. You can then use in your regular `actions.js` and `reducer.js` files used in Redux.

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

	// `rethrow`: Should we rethrow API errors after dispatching the action? See Actions below.
	// rethrow: true,

	// `actions`: action overrides. See Internals below.
	// actions: {},
} );

// Register any static archives up-front.
posts.registerArchive( 'home', {} );
```

```js
// actions.js

import { posts } from './types';

export const getPost = posts.fetchSingle;
export const getPostArchive = posts.fetchArchive;
export const getFrontPage = () => posts.fetchArchive( 'home' );
```

```js
// reducer.js
import { combineReducers } from 'redux';

import { posts } from './types';

export default combineReducers( {
	// Any regular reducers you have go in here just like normal.

	// Then, create a substate for your handlers.
	posts: posts.reducer,
} );
```

In your connected components, you can use the helpers to pull out data from the substate easily:

```js
// Post.js
import React from 'react';
import { connect } from 'react-redux';

import { posts } from './types';

const Post = props => <div>
	<h1>{ props.post.title.rendered }</h1>
</div>;

const mapStateToProps = ( state, props ) => {
	return {
		// Pass the substate when pulling out data.
		post: posts.getSingle( state.posts, props.id ),
	};
};

export default connect( mapStateToProps )( Post );
```


## About

Copyright Human Made. Licensed under the [ISC License](LICENSE.md).

### Roadmap

* Add delete actions
* Add pagination support for archives
