export const parseResponse = resp => {
	return resp.json().then( data => {
		if ( resp.ok ) {
			if ( Array.isArray( data ) && resp.headers.has( 'X-WP-TotalPages' ) ) {
				data.__wpTotalPages = parseInt( resp.headers.get( 'X-WP-TotalPages' ), 10 );
			}

			return data;
		}

		const err = new Error( data.message || 'Unknown server error' );
		err.code = data.code || '__unknown';
		err.response = resp;
		err.data = data;
		throw err;
	} );
};

export const mergePosts = ( existing, next ) => {
	// Remove any existing app so we can replace.
	const newIds = next.map( post => post.id );
	const deduplicated = existing.filter( post => newIds.indexOf( post.id ) === -1 );
	return [
		...deduplicated,
		...next,
	];
};
