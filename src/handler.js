import { isFunction } from 'lodash/lang';
import qs from 'qs';

import { parseResponse, mergePosts } from './utilities';

const fetchOptions = { credentials: 'include' };

const DEFAULT_STATE = {
	_initialized:   true,
	archives:       {},
	archivePages:   {},
	archivesByPage: {},
	loadingPost:    [],
	loadingArchive: [],
	loadingMore:    [],
	posts:          [],
	saving:         [],
	deleting:       [],
};

export default class Handler {
	constructor( options ) {
		this.url = options.url;

		this.query = {
			...( options.query || {} ),
			_wpnonce: options.nonce,
		};
		this.archives = {};
		this.fetchOptions = options.fetchOptions || fetchOptions;
		this.rethrow = 'rethrow' in options ? options.rethrow : true;

		const upperType = options.type.toUpperCase();
		this.actions = {
			archiveStart:       `QUERY_${ upperType }_REQUEST`,
			archiveSuccess:     `QUERY_${ upperType }`,
			archiveError:       `QUERY_${ upperType }_ERROR`,
			archiveMoreStart:   `QUERY_${ upperType }_MORE_REQUEST`,
			archiveMoreSuccess: `QUERY_${ upperType }_MORE`,
			archiveMoreError:   `QUERY_${ upperType }_MORE_ERROR`,
			getStart:           `LOAD_${ upperType }_REQUEST`,
			getSuccess:         `LOAD_${ upperType }`,
			getError:           `LOAD_${ upperType }_ERROR`,
			updateStart:        `UPDATE_${ upperType }_REQUEST`,
			updateSuccess:      `UPDATE_${ upperType }`,
			updateError:        `UPDATE_${ upperType }_ERROR`,
			createStart:        `CREATE_${ upperType }_REQUEST`,
			createSuccess:      `CREATE_${ upperType }`,
			createError:        `CREATE_${ upperType }_ERROR`,
			deleteStart:        `DELETE_${ upperType }_REQUEST`,
			deleteSuccess:      `DELETE_${ upperType }`,
			deleteError:        `DELETE_${ upperType }_ERROR`,

			// Allow overrides.
			...( options.actions || {} ),
		};

		this.tempId = 0;
	}

	/**
	 * Register an archive.
	 *
	 * @param {mixed} id Archive key; any scalar.
	 * @param {Object|Function} query Query parameters. Can be a function,
	 *   which receives the state and should return parameters.
	 */
	registerArchive( id, query ) {
		this.archives[ id ] = query;
	}

	fetch( url, query, options = {} ) {
		const args = {
			...this.query,
			...query,
		};

		const opts = {
			...this.fetchOptions,
			...options,

			// Manually merge headers
			headers: {
				...this.fetchOptions.headers,
				...options.headers,
			},
		};

		const fullUrl = url + '?' + qs.stringify( args );
		return fetch( fullUrl, opts )
			.then( parseResponse );
	}

	/**
	 * Action creator to fetch an archive.
	 *
	 * Dispatch this action to fetch a registered archive, then use
	 * `getArchive` to load the results:
	 *
	 *     handler.registerArchive( 'my-archive', { orderby: 'title' } );
	 *     dispatch( handler.fetchArchive( 'my-archive' ) );
	 *     const results = handler.getArchive( state.posts, 'my-archive' );
	 *
	 * @param {mixed} id Archive key.
	 * @return {Function} Action to dispatch.
	 */
	// eslint-disable-next-line no-undef
	fetchArchive = id => ( dispatch, getState ) => {
		if ( ! ( id in this.archives ) ) {
			throw new Error( `Invalid archive ID: ${ id }` );
		}

		dispatch( { type: this.actions.archiveStart, id } );

		const query = this.archives[ id ];
		const queryArgs = isFunction( query ) ? query( getState() ) : query;
		const page = Number( queryArgs.page || 1 );

		this.fetch( this.url, queryArgs )
			.then( results => {
				const pages = results.__wpTotalPages || 1;
				dispatch( { type: this.actions.archiveSuccess, id, results, page, pages } );
				return id;
			} )
			.catch( error => {
				dispatch( { type: this.actions.archiveError, id, error } );

				// Rethrow for other promise handlers.
				if ( this.rethrow ) {
					throw error;
				}
			} );
	}

	/**
	 * Is the archive currently being loaded?
	 *
	 * @param {object} substate Substate registered for the type.
	 * @param {mixed} id Archive ID.
	 * @return {Boolean} True if the archive is currently being loaded, false otherwise.
	 */
	isArchiveLoading( substate, id ) {
		return substate.loadingArchive.indexOf( id ) >= 0;
	}

	/**
	 * Get archive results from the store.
	 *
	 * @param {object} substate Substate registered for the type.
	 * @param {mixed} id Archive ID.
	 * @return {Object[]|null} List of objects in the archive, or null if none loaded.
	 */
	getArchive( substate, id ) {
		if ( ! substate.archives || ! substate.posts ) {
			return null;
		}

		const ids = substate.archives[ id ];
		if ( ! ids ) {
			return null;
		}

		const posts = [];
		substate.posts.forEach( post => {
			const position = ids.indexOf( post.id );
			if ( position === -1 ) {
				return null;
			}

			posts[ position ] = post;
		} );

		return posts;
	}

	/**
	 * Get archive results from the store, restricted to a specific page.
	 *
	 * Retrieves the posts for a given page of an archive.
	 *
	 * @param {object} substate Substate registered for the type.
	 * @param {mixed} id Archive ID.
	 * @param {Number} page Page number.
	 * @return {Object[]|null} List of objects for given page of the archive, or null if none loaded.
	 */
	getArchivePage( substate, id, page ) {
		if ( ! substate.archivesByPage || ! substate.posts ) {
			return null;
		}

		const pages = substate.archivesByPage[ id ];
		if ( ! pages ) {
			return null;
		}

		const ids = pages[ Number( page ) ];
		if ( ! ids ) {
			return null;
		}

		const posts = [];
		substate.posts.forEach( post => {
			const position = ids.indexOf( post.id );
			if ( position === null ) {
				return null;
			}

			posts[ position ] = post;
		} );

		return posts;
	}

	/**
	 * Are there more pages in the archive?
	 *
	 * Compares the currently loaded page against the total pages for
	 * the archive.
	 *
	 * @param {object} substate Substate registered for the type.
	 * @param {mixed} id Archive ID.
	 * @return {Boolean} True if there are more pages to load, false otherwise.
	 */
	hasMore( substate, id ) {
		if ( ! substate.archivePages[ id ] ) {
			return true;
		}

		return ( substate.archivePages[ id ].current || 0 ) < ( substate.archivePages[ id ].total || 1 );
	}

	/**
	 * Fetch the next page of the archive.
	 *
	 * Load the next page of the archive if we can. Automatically tracks the
	 * current page in the state.
	 *
	 * @param {Function} getSubstate Function to get the current substate.
	 * @param {mixed} id Archive ID.
	 * @param {Number} page Page to load. Uses next page if not manually supplied.
	 * @return {[type]} [description]
	 */
	// eslint-disable-next-line no-undef
	fetchMore = ( getSubstate, id, page = null ) => ( dispatch, getState ) => {
		if ( ! ( id in this.archives ) ) {
			throw new Error( `Invalid archive ID: ${ id }` );
		}

		const state = getState();
		const substate = getSubstate( state );
		page = Number( page || ( substate.archivePages[ id ].current || 1 ) + 1 );

		dispatch( { type: this.actions.archiveMoreStart, id, page } );

		const query = this.archives[ id ];
		const queryArgs = isFunction( query ) ? query( state ) : query;
		queryArgs.page = page;

		this.fetch( this.url, queryArgs )
			.then( results => {
				const total = results.__wpTotalPages || 1;
				dispatch( { type: this.actions.archiveMoreSuccess, id, page, results, total } );
				return id;
			} )
			.catch( error => {
				dispatch( { type: this.actions.archiveMoreError, id, page, error } );

				// Rethrow for other promise handlers.
				if ( this.rethrow ) {
					throw error;
				}
			} );
	}

	/**
	 * Is the next page of the archive currently being loaded?
	 *
	 * @param {object} substate Substate registered for the type.
	 * @param {mixed} id Archive ID.
	 * @return {Boolean} True if the next page of the archive is currently being loaded, false otherwise.
	 */
	isLoadingMore( substate, id ) {
		return substate.loadingMore.indexOf( id ) >= 0;
	}

	/**
	 * Action creator to fetch a single post.
	 *
	 * @param {Number} id Post ID.
	 * @param {String} context Context to fetch.
	 * @return {Function} Action to dispatch.
	 */
	// eslint-disable-next-line no-undef
	fetchSingle = ( id, context = 'view' ) => dispatch => {
		dispatch( { type: this.actions.getStart, id } );

		return this.fetch( `${ this.url }/${ id }`, { context } )
			.then( data => {
				dispatch( { type: this.actions.getSuccess, id, data } );
				return id;
			} )
			.catch( error => {
				dispatch( { type: this.actions.getError, id, error } );

				// Rethrow for other promise handlers.
				if ( this.rethrow ) {
					throw error;
				}
			} );
	}

	/**
	 * Is the post currently being loaded?
	 *
	 * @param {object} substate Substate registered for the type.
	 * @param {Number} id Post ID.
	 * @return {Boolean} True if the post is currently being loaded, false otherwise.
	 */
	isPostLoading( substate, id ) {
		return substate.loadingPost.indexOf( id ) >= 0;
	}

	/**
	 * Get a single post from the store.
	 *
	 * @param {object} substate Substate registered for the type.
	 * @param {Number} id Post ID.
	 * @return {Object|null} Post if available, otherwise null.
	 */
	getSingle( substate, id ) {
		if ( ! substate.posts ) {
			return null;
		}

		return substate.posts.find( post => post.id === id );
	}

	/**
	 * Action creator to update a single post.
	 *
	 * @param {object} data Post object to update. Must have `id` property.
	 * @return {Function} Action to dispatch.
	 */
	// eslint-disable-next-line no-undef
	updateSingle = data => dispatch => {
		const { id } = data;
		if ( ! id ) {
			throw new Error( 'Post does not have `id` property.' );
		}

		dispatch( { type: this.actions.updateStart, id, data } );

		const options = {
			method:  'PUT',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify( data ),
		};
		return this.fetch( `${ this.url }/${ id }`, { context: 'edit' }, options )
			.then( data => {
				dispatch( { type: this.actions.updateSuccess, id, data } );
				return id;
			} )
			.catch( error => {
				dispatch( { type: this.actions.updateError, id, error } );

				// Rethrow for other promise handlers.
				if ( this.rethrow ) {
					throw error;
				}
			} );
	}

	/**
	 * Is the post currently being saved?
	 *
	 * @param {object} substate Substate registered for the type.
	 * @param {Number} id Post ID.
	 * @return {Boolean} True if the post is currently being saved, false otherwise.
	 */
	isPostSaving( substate, id ) {
		return substate.saving.indexOf( id ) >= 0;
	}

	/**
	 * Action creator to create a new post.
	 *
	 * @param {object} data Post data.
	 * @return {Function} Action to dispatch.
	 */
	// eslint-disable-next-line no-undef
	createSingle = data => dispatch => {
		// Create temporary ID to allow tracking request.
		const id = '_tmp_' + this.tempId++;

		dispatch( { type: this.actions.createStart, id, data } );

		const options = {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify( data ),
		};
		return this.fetch( this.url, { context: 'edit' }, options )
			.then( data => {
				dispatch( { type: this.actions.createSuccess, id, data } );
				return data.id;
			} )
			.catch( error => {
				dispatch( { type: this.actions.createError, id, error } );

				// Rethrow for other promise handlers.
				if ( this.rethrow ) {
					throw error;
				}
			} );
	}

	/**
	 * Is a post being created?
	 *
	 * @param {object} substate Substate registered for the type.
	 * @return {Boolean} True if a post is being created, false otherwise.
	 */
	isPostCreating( substate ) {
		return !! substate.saving.find( p => p.indexOf( '_tmp_' ) === 0 );
	}

	/**
	 * Action creator to delete a post.
	 *
	 * @param {object} id Post ID.
	 * @return {Function} Action to dispatch.
	 */
	deleteSingle = id => dispatch => {
		dispatch( { type: this.actions.deleteStart, id } );

		const options = {
			method: 'DELETE',
		};
		return this.fetch( `${ this.url }/${ id }`, {}, options )
			.then( data => {
				dispatch( { type: this.actions.deleteSuccess, id, data } );
				return data.id;
			} )
			.catch( error => {
				dispatch( { type: this.actions.deleteError, id, error } );

				// Rethrow for other promise handlers.
				if ( this.rethrow ) {
					throw error;
				}
			} );
	}

	/**
	 * Is a post being deleted?
	 *
	 * @param {object} substate Substate registered for the type.
	 * @param {Number} id Post ID.
	 * @return {Boolean} True if a post is being deleted, false otherwise.
	 */
	isPostDeleting( substate, id ) {
		return substate.deleting.indexOf( id ) >= 0;
	}

	/**
	 * Reducer for the substate.
	 *
	 * This needs to be added to your store to be functional.
	 *
	 * @param {object} state Store state to reduce against.
	 * @param {object} action Action being dispatched.
	 * @return {object} Reduced state.
	 */
	// eslint-disable-next-line no-undef
	reducer = ( state = DEFAULT_STATE, action ) => {
		switch ( action.type ) {
			// Archive actions.
			case this.actions.archiveStart:
				return {
					...state,
					loadingArchive: [
						...state.loadingArchive,
						action.id,
					],
				};

			case this.actions.archiveSuccess: {
				const ids = action.results.map( post => post.id );
				const currentByPage = state.archivesByPage[ action.id ] || [];
				return {
					...state,
					loadingArchive: state.loadingArchive.filter( a => a !== action.id ),
					archives:       {
						...state.archives,
						[ action.id ]: ids,
					},
					archivesByPage: {
						...state.archivesByPage,
						[ action.id ]: {
							...currentByPage,
							[ action.page ]: ids,
						},
					},
					archivePages: {
						...state.archivePages,
						[ action.id ]: {
							current: action.page,
							total:   action.pages,
						},
					},
					posts: mergePosts( state.posts, action.results ),
				};
			}

			case this.actions.archiveError:
				return {
					...state,
					loadingArchive: state.loadingArchive.filter( a => a !== action.id ),
				};

			// Archive pagination actions.
			case this.actions.archiveMoreStart:
				return {
					...state,
					loadingMore: [
						...state.loadingMore,
						action.id,
					],
				};

			case this.actions.archiveMoreSuccess: {
				const ids = action.results.map( post => post.id );
				const currentIds = state.archives[ action.id ] || [];
				const currentByPage = state.archivesByPage[ action.id ] || [];
				return {
					...state,
					loadingMore: state.loadingMore.filter( m => m !== action.id ),
					archives:    {
						...state.archives,
						[ action.id ]: [
							...currentIds,
							...ids,
						],
					},
					archivesByPage: {
						...state.archivesByPage,
						[ action.id ]: {
							...currentByPage,
							[ action.page ]: ids,
						},
					},
					archivePages: {
						...state.archivePages,
						[ action.id ]: {
							current: action.page,
							total:   action.total,
						},
					},
					posts: mergePosts( state.posts, action.results ),
				};
			}

			case this.actions.archiveMoreError:
				return {
					...state,
					loadingMore: state.loadingMore.filter( m => m !== action.id ),
				};

			// Single actions.
			case this.actions.getStart:
				return {
					...state,
					loadingPost: [
						...state.loadingPost,
						action.id,
					],
				};

			case this.actions.getSuccess: {
				return {
					...state,
					loadingPost: state.loadingPost.filter( p => p !== action.id ),
					posts:       mergePosts( state.posts, [ action.data ] ),
				};
			}

			case this.actions.getError:
				return {
					...state,
					loadingPost: state.loadingPost.filter( p => p !== action.id ),
				};

			case this.actions.createStart:
			case this.actions.updateStart:
				return {
					...state,
					saving: [
						...state.saving,
						action.id,
					],
				};

			case this.actions.createSuccess:
			case this.actions.updateSuccess:
				return {
					...state,
					saving: state.saving.filter( p => p !== action.id ),
					posts:  mergePosts( state.posts, [ action.data ] ),
				};

			case this.actions.createError:
			case this.actions.updateError:
				return {
					...state,
					saving: state.saving.filter( p => p !== action.id ),
				};

			case this.actions.deleteStart:
				return {
					...state,
					deleting: [
						...state.deleting,
						action.id,
					],
				};

			case this.actions.deleteSuccess:
				return {
					...state,
					deleting: state.deleting.filter( id => id !== action.id ),
					posts: state.posts.filter( post => post.id !== action.id ),
				};

			case this.actions.deleteError:
				return {
					...state,
					deleting: state.deleting.filter( id => id !== action.id ),
				};

			default:
				if ( ! state._initialized ) {
					return {
						...DEFAULT_STATE,
						...state,
					};
				}

				return state;
		}
	}
}
