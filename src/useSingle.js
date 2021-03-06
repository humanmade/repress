import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { maybeHook } from './internal-utilities';

function useSingle( handler, getSubstate, id ) {
	const state = useSelector( state => {
		const substate = getSubstate( state );

		if ( ! id ) {
			return {
				post: null,
				loading: false,
				saving: false,
			};
		}

		return {
			post: handler.getSingle( substate, id ),
			loading: handler.isPostLoading( substate, id ),
			saving: handler.isPostSaving( substate, id ),
		};
	} );
	const dispatch = useDispatch();

	const data = {
		...state,
		load: ( context = 'view' ) => dispatch( handler.fetchSingle( id, context ) ),
		update: data => dispatch( handler.updateSingle( {
			id,
			...data,
		} ) ),
	};

	useEffect( () => {
		if ( state.post || state.loading || ! id ) {
			return;
		}

		data.load();
	}, [ id, state.loading, state.post ] );

	return data;
}

export default maybeHook( useSingle );
