# Connecting Components

Once your handlers are set up and connected to the store, you'll want to work with that data. To do this, you can either use the helper components, or hook the component up to the store yourself.


## withArchive

The easiest way to do this is to use the `withSingle` higher-order component. This works similiarly to the `connect` HOC from Redux, but provides just the post data and helpers.

Connecting your component is as easy as wrapping it in the function call:

```js
// SinglePost.js
import { withSingle } from '@humanmade/repress';
import React from 'react';

import { posts } from './types';

const TodayArchive = props => <article>
	<h1>{ props.post.title.rendered }</h1>
	<p>Posted { props.post.date_gmt }</p>
	<div
		dangerouslySetInnerHTML={ { __html: props.post.content.rendered } }
	/>
</article>;

export default withSingle(
	// Handler object:
	posts,

	// getSubstate() - returns the substate
	state => state.posts,

	// mapPropsToId - resolve the props to the post ID.
	// (If you already know the post ID, you can pass the number instead of
	// a callback.)
	props => props.id
)( SinglePost );
```

`withSingle` components will automatically load the post if it's not available in the store. Your component receives five props:

* `postId` (mixed): The (resolved) ID for this post.
* `post` (`object`): The post object.
* `loading` (`boolean`): Whether the post is currently being loaded.
* `saving` (`boolean`): Whether the post is currently being updated.
* `onLoad` (`Function`: `(context = 'view') => Promise`): Loader function. Called automatically by the HOC, but you can call this again if needed. (When calling manually, you can also pass the context to fetch.)
* `onUpdate` (`Function`: `data => Promise`): Update the post. Takes the data to send to the backend (`id` is added automatically.)

For convenience, you might want to make your own HOC to simplify this to just an ID:

```js
import { withArchive } from '@humanmade/repress';

import { posts } from './types';

export default id => withArchive( posts, state => state.posts, id );
```


## Manually Connect

If you're already connecting your component to the state, or want to manage the loading yourself, you can instead use the helper methods on the handler:

* `getSingle( substate, id ) => object|null`: Retrieve the post with the given ID from the substate.
* `isPostLoading( substate, id ) => bool`: Is the post with the given ID currently being loaded?
* `isPostSaving( substate, id ) => bool`: Is the post with the given ID currently being updated?

You willl also need to [dispatch the actions](actions.md) yourself, and handle loading in the lifecycle hooks. You can then bring all of this together in your Redux `connect` arguments:

```js
const mapStateToProps = ( state, props ) => {
	return {
		post: posts.getSingle( state.posts, props.id ),
		loading: posts.isPostLoading( state.posts, props.id ),
		saving: posts.isPostLoading( state.posts, props.id ),
	}
};

const mapDispatchToProps = ( dispatch, props ) => {
	return {
		onLoad: ( context = 'view' ) => dispatch( posts.fetchSingle( props.id ) ),
		onUpdatePost: data => dispatch( posts.updateSingle( { id: props.id, ...data } ) ),
	}
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)( SinglePost );
```

## Next Steps

Once you've hooked up your single post components, you'll also want to [set up and connect your archives](archives.md).
