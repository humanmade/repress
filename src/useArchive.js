import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { maybeHook } from './internal-utilities';

function useArchive( handler, getSubstate, id ) {
	const state = useSelector( state => {
		const substate = getSubstate( state );
		if ( ! id ) {
			return {
				posts: null,
				loading: false,
				hasMore: false,
				loadingMore: false,
			};
		}

		const posts = handler.getArchive( substate, id );

		return {
			posts,
			loading: handler.isArchiveLoading( substate, id ),
			hasMore: handler.hasMore( substate, id ),
			loadingMore: handler.isLoadingMore( substate, id ),
		};
	} );
	const dispatch = useDispatch();
	const data = {
		...state,
		load: () => dispatch( handler.fetchArchive( id ) ),
		loadMore: page => dispatch( handler.fetchMore( getSubstate, id, page ) ),
	};

	useEffect( () => {
		if ( state.posts || state.loading || ! id ) {
			return;
		}

		data.load();
	}, [ id, state.loading, state.posts ] );

	return data;
}

export default maybeHook( useArchive );
