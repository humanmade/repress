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

`withArchive` components will automatically load the archive if it's not available in the store. Your component receives five data props, and two action props:

* `archiveId` (mixed): The (resolved) ID for this archive.
* `posts` (`object[]`): A list of objects in the archive.
* `loading` (`boolean`): Whether the archive is currently being loaded.
* `hasMore` (`boolean`): Whether there are more pages of the archive to load.
* `loadingMore` (`boolean`): Whether the next page of the archive is being loaded.
* `onLoad` (`Function`: `() => Promise`): Loader function. Called automatically by the HOC, but you can call this again if needed.
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


### Advanced Options

You can pass a fourth parameter called `options` to `withArchive`. This is an object with the following keys:

* `mapDataToProps` (`Function`: `object => object`): Map the data props to props passed to your component. By default, this passes through all data props.
* `mapActionsToProps` (`Function`: `object => object`): Map the action props to props to your component. By default, this passes through all action props.


## Pagination

Pagination support for archives is included out of the box. You can use either infinite scroll style ("more") or manual pagination.

With more pagination, your component will receive all posts Repress has loaded. When you load more posts, it will append these to the list of posts, and your component will receive this via the `posts` prop.

With manual pagination, you specify which page of the archive to load, and your component will only receive posts on that page of the archive. When you load a different page, Repress will only pass the posts for that page. Repress will keep other pages in memory allowing for fast pagination back to already-loaded pages.

Use more pagination when you want an infinite scroll list of posts that expands with additional items, or if you plan on loading the entire archive into memory. Use manual pagination when you want to show a subset of posts rather than the whole archive, or if the page number is externally controlled (e.g. in the URL).


### More Pagination

To load the next page in an archive, simply call the `onLoadMore` prop passed in by `withArchive`. Repress keeps track of which page you're accessing, and appends additional posts to the existing list of posts.

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


### Manual Pagination

For manual pagination, use the `withPagedArchive` HOC instead of `withArchive`. This allows you to manually specify the page of the archive to load, and ignores Repress's internal page counter. Additionally, only the current page of items is passed to your component.

This HOC passes the same props as `withArchive`, with the following differences:

* `posts` (`object[]`): A list of objects on the given page of the archive.
* `page` (`Number`): The current page being viewed.

The archive page to load should be passed via the `page` prop to your component. To override this behaviour, you can pass a `getPage` function in the `options` parameter to the HOC:

* `getPage` (`Function`: `object => Number`): Map passed props to the page number. By default, this is `props => props.page`.

`onLoadMore` is automatically called for you when the page changes. You can use `this.props.hasMore` to determine whether to show navigation to the next page, and you can check `this.props.page > 1` to determine whether to show navigation to the previous page.

For example, the following component renders a simple list of posts with navigation to browse back and forth:

```js
function Blog( props ) {
	const { hasMore, loading, loadingMore, page, posts } = props;

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
		: (
			<div>
				{ hasMore ? (
					<button
						type="button"
						onClick={ () => props.onOlder() }
					>Older Posts</button>
				) : null }
				{ page > 1 ? (
					<button
						type="button"
						onClick={ () => props.onNewer() }
					>Newer Posts</button>
				) : null }
		: null }
	</div>;
}
const PagedBlog = withPagedArchive( posts, state => state.posts, 'blog' )( Blog );

// A higher-level component controls the page.
class App extends React.Component {
	state = {
		page: 1,
	}

	render() {
		const { page } = this.state;
		return (
			<PagedBlog
				page={ page }
				onOlder={ () => this.setState( { page: page + 1 } ) }
				onNewer={ () => this.setState( { page: page - 1 } ) }
			/>
		);
	}
}
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
