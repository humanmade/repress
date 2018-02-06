import { isFunction } from 'lodash/lang';
import React from 'react';
import { connect } from 'react-redux';

const resolve = ( maybeFunc, ...args ) => isFunction( maybeFunc ) ? maybeFunc( ...args ) : maybeFunc;

export default ( handler, getSubstate, id ) => Component => {
	class WrappedComponent extends React.Component {
		componentWillMount() {
			if ( ! this.props.posts && ! this.props.loading ) {
				this.props.onLoad();
			}
		}

		componentWillReceiveProps( nextProps ) {
			if ( ! nextProps.posts && this.props.archiveId !== nextProps.archiveId ) {
				nextProps.onLoad();
			}
		}

		render() {
			return <Component { ...this.props } />;
		}
	}

	const mapStateToProps = ( state, props ) => {
		const substate = getSubstate( state );
		const resolvedId = resolve( id, props );
		const posts = handler.getArchive( substate, resolvedId );

		return {
			archiveId: resolvedId,
			posts,
			loading: handler.isArchiveLoading( substate, resolvedId ),
			hasMore: handler.hasMore( substate, resolvedId ),
			loadingMore: handler.isLoadingMore( substate, resolvedId ),
		};
	};

	const mapDispatchToProps = ( dispatch, props ) => {
		const resolvedId = resolve( id, props );
		return {
			onLoad:     () => dispatch( handler.fetchArchive( resolvedId ) ),
			onLoadMore: page => dispatch( handler.fetchMore( getSubstate, resolvedId, page ) ),
		};
	};

	return connect(
		mapStateToProps,
		mapDispatchToProps
	)( WrappedComponent );
}
