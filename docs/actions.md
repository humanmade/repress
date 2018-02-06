# Actions

The handler contains 4 built-in action creators, which mirror the actions available from the REST API:

* `fetchArchive( id )`: Fetches query results for the type.
* `fetchSingle( id )`: Fetches a single object.
* `updateSingle( id )`: Updates a single object.
* `createSingle( id )`: Creates a single object.

Each of these is an action creator, which returns an action; specifically, a thunk. These thunks each return the request promise.

When dispatching these actions, you can use the promise returned by `dispatch()` to do any non-Redux actions you may need to do:

```js
import { posts } from './types';

class MyComponent extends React.Component {
	// ...
	onSave( data ) {
		this.props.dispatch( posts.updateSingle( data ) )
			.then( id => {
				this.setState( {
					loading: false,
					saved: true,
				} );
			} )
			.catch( error => {
				this.setState( {
					loading: false,
					saved: false,
					error
				})
			});
	}
}
```

Note that errors will be rethrown to allow you to handle them in your promise callbacks. If you'd prefer not to have this behaviour, you can set the `rethrow` option to `false` when instantiating the handler.
