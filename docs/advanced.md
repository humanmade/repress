# Advanced Uses

## Custom Keys in the Substate

Repress is designed to allow you to place additional data in the substate if needed. It's extremely rare that you should need to do this, but the option is there to do so if you'd like.

To add additional data, simply wrap the reducer with your own reducer and handle as necessary. Take care to always merge new data with the existing state to avoid wiping out state unnecessarily.

```js
import { posts } from './types';

export default ( state, action ) => {
	switch ( action.type ) {
		case 'MY_CUSTOM_ACTION':
			return {
				...state,
				myKey: true,
			};

		default:
			return posts.reducer( state, action );
	}
}
```

## Batching Requests

If you're loading multiple discrete pieces of data, you might want to avoid dispatching a lot of actions simultaneously. Typically, you want to dispatch actions that are as specific as they can be, and avoid dispatching multiple for a single action. While Repress listens to its built-in actions out of the box, you may want to handle additional batch actions as well.

When listening to custom actions, make sure to match the [substate shape](internals.md) to ensure Repress continues to work with regular actions and helpers. This shape may change across major version bumps, so be careful when upgrading to new major releases.

For example, if you want to load a post and its comments at the same time, you could write an action that looks like this:

```js
const loadPostWithComments = id => dispatch => {
	dispatch( { type: 'LOAD_POST_WITH_COMMENTS_REQUEST', id } );

	const requests = [
		fetch( `${ root }/wp/v2/posts/${ id }` ),
		fetch( `${ root }/wp/v2/comments?id=${ id }` ),
	];

	Promise.all( requests )
		.then( responses => Promise.all( responses.map( response => resp.json() ) ) )
		.then( ( [ post, comments ] ) => {
			dispatch( { type: 'LOAD_POST_WITH_COMMENTS', id, post, comments } );
		} );
}
```

You could write a custom reducer to merge this data into the Repress store:

```js
// reducers/posts.js
import { mergePosts } from '@humanmade/repress';
import { posts } from './types';

export default ( state, action ) => {
	switch ( action.type ) {
		case 'LOAD_POST_WITH_COMMENTS':
			return {
				...state,
				posts: mergePosts( state.posts, [ action.post ] ),
			};

		default:
			return posts.reducer( state, action );
	}
}
```

```js
// reducers/posts.js
import { mergePosts } from '@humanmade/repress';
import { posts } from './types';

export default ( state, action ) => {
	switch ( action.type ) {
		case 'LOAD_POST_WITH_COMMENTS':
			return {
				...state,
				archives: {
					[`posts/${ action.id }`]: action.comments.map( comment => comment.id ),
				},
				posts: mergePosts( state.posts, action.comments ),
			};

		default:
			return posts.reducer( state, action );
	}
}
```

Note that you should always deduplicate posts when merging, as duplicate posts in your store may lead to inconsistent behaviour. The `mergePosts` helper can handle this for you.
