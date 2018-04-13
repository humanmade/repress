import React from 'react';
import { connect } from 'react-redux';

import { resolve } from './utilities';

export default ( handler, getSubstate, id, options = {} ) => Component => {
	const mapDataToProps = options.mapDataToProps || ( data => data );
	const mapActionsToProps = options.mapActionsToProps || ( actions => actions );

	class WrappedComponent extends React.Component {
		componentWillMount() {
			if ( ! this.props._data.posts && ! this.props._data.loading ) {
				this.props._actions.onLoad();
			}
		}

		componentWillReceiveProps( nextProps ) {
			if ( ! nextProps._data.posts && this.props._data.archiveId !== nextProps._data.archiveId ) {
				nextProps._actions.onLoad();
			}
		}

		render() {
			const { _data, _actions, ...props } = this.props;

			const childProps = {
				...props,
				...mapDataToProps( _data, props ),
				...mapActionsToProps( _actions, props ),
			};
			return <Component { ...childProps } />;
		}
	}

	const mapStateToProps = ( state, props ) => {
		const substate = getSubstate( state );
		const resolvedId = resolve( id, props );
		const posts = handler.getArchive( substate, resolvedId );

		return {
			_data: {
				archiveId:   resolvedId,
				posts,
				loading:     handler.isArchiveLoading( substate, resolvedId ),
				hasMore:     handler.hasMore( substate, resolvedId ),
				loadingMore: handler.isLoadingMore( substate, resolvedId ),
			},
		};
	};

	const mapDispatchToProps = ( dispatch, props ) => {
		const resolvedId = resolve( id, props );
		return {
			_actions: {
				onLoad:     () => dispatch( handler.fetchArchive( resolvedId ) ),
				onLoadMore: page => dispatch( handler.fetchMore( getSubstate, resolvedId, page ) ),
			},
		};
	};

	return connect(
		mapStateToProps,
		mapDispatchToProps
	)( WrappedComponent );
}
