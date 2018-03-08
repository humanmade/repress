# Archives

An archive is any list of objects associated with an ID. For performance, archives are registered up-front, and their results are cached.

Archives can be registered in one of two ways:

```js
// Register archives with static arguments.
posts.registerArchive( 'home', {} );
posts.registerArchive( 'stickied', { sticky: '1' } );
posts.registerArchive( 'oldest', {
	order: 'desc',
	orderby: 'date',
} );

// Or, register a function which returns the arguments:
posts.registerArchive( 'today', () => {
	return {
		after:  moment().startOf( 'day' ).toISOString(),
		before: moment().endOf( 'day' ).toISOString(),
	}
} );

// The function is also passed the full state, if you want to use it:
posts.registerArchive( 'mine', state => {
	return {
		author: state.user.id,
	}
} );
```


## withArchive

You can use the `withArchive` HOC to access your data in your components:

```js
// TodayArchive.js
import { withArchive } from '@humanmade/repress';
import React from 'react';

import { posts } from './types';

const TodayArchive = props => <ul>
	{ props.posts.map( post =>
		<li key={ post.id }>
			{ post.title.rendered }
		</li>
	) }
</ul>;

export default withArchive(
	// Handler object:
	posts,

	// getSubstate() - returns the substate
	state => state.posts,

	// Archive ID
	'today'
)( TodayArchive );
```

`withArchive` components will automatically load the archive if it's not available in the store. Your component receives seven props:

* `archiveId` (mixed): The (resolved) ID for this archive.
* `posts` (`object[]`): A list of objects in the archive.
* `loading` (`boolean`): Whether the archive is currently being loaded.
* `onLoad` (`Function`: `() => Promise`): Loader function. Called automatically by the HOC, but you can call this again if needed.
* `hasMore` (`boolean`): Whether there are more pages of the archive to load.
* `loadingMore` (`boolean`): Whether the next page of the archive is being loaded.
* `onLoadMore` (`Function`: `( page = null ) => Promise`): Loader function. Call this to load the next page of the archive, or pass a page number to load that specific page.

For convenience, you might want to make your own HOC to simplify this to just an ID:

```js
import { withArchive } from '@humanmade/repress';

import { posts } from './types';

export default id => withArchive( posts, state => state.posts, id );
```

Rather than passing a static ID, you can also pass an ID function, which will be called with your props. If you're using React Router, this allows you to easily use your route's `path` as the archive ID:

```js
export const normalizePath = path => path.replace( /^\/+|\/+$/g, '' );
export default withArchive(
	posts,
	state => state.posts,
	props => normalizePath( props.match.path )
)( TodayArchive );
```

(The resolved ID will be passed to your component as `archiveId`.)


## Pagination

Pagination support for archives is included out of the box. To load the next page in an archive, simply call the `onLoadMore` prop passed in by `withArchive`.

You usually only want to call `onLoadMore` if there actually is more to load, so you should check `hasMore` before calling the function. Also, you should typically only call `onLoadMore` based on user input (a button, link, scroll handler, etc); if you need more posts on load, increase the `per_page` parameter in your query instead.

For example, the following component renders a simple list of posts with a button to allow fetching more:

```js
function Blog( props ) {
	const { hasMore, loading, loadingMore, posts } = props;

	if ( loading ) {
		return <div>Loading…</div>;
	}

	if ( ! posts ) {
		return <div>No posts</div>;
	}

	return <div>
		<ol>
			{ posts.map( post =>
				<li key={ post.id }>{ post.title.rendered }</li>
			) }
		</ol>

		{ loadingMore ?
			<p>Loading more…</p>
		: hasMore ?
			<button
				type="button"
				onClick={ () => props.onLoadMore() }
			>Load More</button>
		: null }
	</div>;
}
export default withArchive( posts, state => state.posts, 'blog' )( Blog );
```


## Dynamic Archives

If needed, you can dynamically register archives when needed. Note that you'll need the archive ID to access the results, so make sure it's predictable. You should only do this when you can't determine the ID beforehand (such as in dynamic routes), as it tends to make your code less readable.

```js
export const search = term => {
	posts.registerArchive( `search/${ term }`, {
		search: term,
		orderby: 'relevance',
	} );
	return posts.fetchArchive( `search/${ term }` );
};

export const getYearArchive = year => {
	posts.registerArchive( `years/${ year }`, {
		after:  moment( { year } ).startOf( 'year' ),
		before: moment( { year } ).endOf( 'year' ),
	} );
	return posts.fetchArchive( `years/${ year }` );
};
```
