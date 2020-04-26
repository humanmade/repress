import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { maybeHook } from './internal-utilities';

function usePagedArchive( handler, getSubstate, id, page ) {
	const state = useSelector( state => {
		const substate = getSubstate( state );
		const totalPages = handler.getTotalPages( substate, id );

		return {
			page,
			totalPages,
			posts: handler.getArchivePage( substate, id, page ),
			loading: handler.isArchiveLoading( substate, id ),
			hasMore: totalPages ? page < totalPages : true,
			loadingMore: handler.isLoadingMore( substate, id ),
		};
	} );
	const dispatch = useDispatch();
	const data = {
		...state,
		load: () => dispatch( handler.fetchArchive( id, page ) ),
		loadMore: page => dispatch( handler.fetchMore( getSubstate, id, page ) ),
	};

	useEffect( () => {
		if ( state.posts || state.loading ) {
			return;
		}

		data.loadMore( page );
	}, [ id, state.loading, state.posts, page ] );

	return data;
}

export default maybeHook( usePagedArchive );
