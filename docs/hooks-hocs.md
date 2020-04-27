# Hooks vs HOCs

Repress supports both [React Hooks](https://reactjs.org/docs/hooks-overview.html) and [Higher Order Components (HOCs)](https://reactjs.org/docs/higher-order-components.html), so you can use whichever one works better for you.

The available equivalent hooks and HOCs are:

Hooks | HOCs
-- | --
`useSingle` | `withSingle`
`useArchive` | `withArchive`
`usePagedArchive` | `withPagedArchive`

Hooks and HOCs contain equivalent functionality, and have very similar API surfaces. Generally the APIs they expose are only different in two ways (apart from inherent hooks vs HOCs differences):

* HOCs take functions to map props to various inputs. Hooks expect you to do this in your own component.
* HOCs pass props, and name functions accordingly with an `on...` prefix. Hooks return an object, and functions do not have a prefix.

Each API form has its own benefits and detriments, and you should investigate which is best for your use case. Repress is agnostic as to which you should use generally.


## Limitations of Hooks

Note that Repress' APIs are bound by the same limitations as general React APIs, such as the [rules of hooks](https://reactjs.org/docs/hooks-rules.html). Notably, **you cannot call hooks conditionally**.

For example, if you need to fetch a post *and* the author of the post, you cannot conditionally call it after the first piece of data has loaded:

```js
const postData = useSingle( posts, s => s.posts, id );
if ( postData.post ) {
	const author = useSingle( users, s => s.users, postData.post.author );
}
```

To mitigate this, Repress allows passing a falsy value for the ID, which will shortcircuit loading until the ID becomes available. This allows your code to obey the rules of hooks:

```js
const postData = useSingle( posts, s => s.posts, id );
const author = useSingle( users, s => s.users, postDate.post ? postData.post.author : null );
```

This may also be a sign that you should consider refactoring your components to separate behaviour.
