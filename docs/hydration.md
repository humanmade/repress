# Hydration

Hydration is the process of initialising your state from the server. Since your page is being rendered by WordPress, it makes sense to reuse the data from WordPress' query rather than send a HTTP request on page load.


## Data Format

Generally, there are two pieces of data you need to hydrate: the post objects, and the archives. These need to be placed into the [correct places in the store](internals.md) so that Repress can use them.

The post objects are JSON objects in the same format as the REST API, and should be placed into the `posts` property of the substate. The archives are the IDs for the posts corresponding to the current archive.

When designing your archives, keep hydration in mind. If your archive IDs correspond to the current path, this makes generating the archive data much easier.

Once you have this data, the easiest way to hydrate the store is to use Redux's `initialState` parameter. For example, assuming you have `window.MyData.archives` and `window.MyData.posts` with the archives and posts respectively:

```js
const initialState = {
	posts: {
		archives: window.MyData.archives,
		posts: window.MyData.posts,
	},
};

const store = createStore(
	rootReducer,
	initialState,
	applyMiddleware( thunkMiddleware )
);
```

(Repress' reducer will automatically add the rest of the default state for you.)

Note that you can also dispatch the [success actions](internals.md) if you'd prefer, but this can run into performance issues quickly. In most cases, prefer using the initial state instead.


## Server-Side Preparation

In order to hydrate a Repress substate, you need the data from the backend in the same format as the REST API. There are numerous ways to do this, but the best way is to convert the data from the main query.

This typically looks something like this:

```php
<?php

function get_script_data() {
	global $wp_query;

	$current_path = trim( explode( '?', $_SERVER['REQUEST_URI'] )[0], '/' );

	return [
		// Typical data required for talking to the API.
		'site' => [
			'api'   => rest_url(),
			'nonce' => wp_create_nonce( 'wp_rest' ),
			// ...
		],

		// Hydration data
		'posts' => [
			'archives' => [
				// Assuming you are using the current path as the archive ID:
				$current_path => wp_list_pluck( $wp_query->posts, 'ID' ),
			],
			'posts' => get_post_data( $wp_query ),
		],
	];
}

function get_post_data( $query ) {
	$data = [];

	$server = rest_get_server();
	$request = new WP_REST_Request();
	$post_controller = new WP_REST_Posts_Controller( 'post' );
	foreach ( $query->posts as $post ) {
		if ( $post->post_type !== 'post' ) {
			continue;
		}

		$response = $post_controller->prepare_item_for_response( $post, $request );

		if ( ! $response || is_wp_error( $response ) || $response->is_error() ) {
			continue;
		}

		$data[] = $server->response_to_data( $response, true );
	}

	return $data;
}
```

Note that this is only example code; on real projects, you'll likely need to add handling for other post types.
