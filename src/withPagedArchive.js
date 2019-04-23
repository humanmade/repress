import React from 'react';
import { connect } from 'react-redux';

import { resolve } from './utilities';

export default ( handler, getSubstate, id, options = {} ) => Component => {
	const mapDataToProps = options.mapDataToProps || ( data => data );
	const mapActionsToProps = options.mapActionsToProps || ( actions => actions );
	const getPage = options.getPage || ( props => props.page );

	class WrappedComponent extends React.Component {
		componentDidMount() {
			if ( ! this.props._data.posts && ! this.props._data.loading ) {
				this.props._actions.onLoad();
			}
		}

		componentDidUpdate( prevProps ) {
			if ( ! this.props._data.posts ) {
				if ( prevProps._data.archiveId !== this.props._data.archiveId ) {
					this.props._actions.onLoad();
				} else if ( prevProps._data.page !== this.props._data.page ) {
					this.props._actions.onLoadMore( this.props._data.page );
				}
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
		const page = getPage( props );
		const totalPages = handler.getTotalPages( substate, resolvedId );

		return {
			_data: {
				archiveId:   resolvedId,
				page,
				totalPages,
				posts:       handler.getArchivePage( substate, resolvedId, page ),
				loading:     handler.isArchiveLoading( substate, resolvedId ),
				hasMore:     totalPages ? page < totalPages : true,
				loadingMore: handler.isLoadingMore( substate, resolvedId ),
			},
		};
	};

	const mapDispatchToProps = ( dispatch, props ) => {
		const resolvedId = resolve( id, props );
		const page = getPage( props );
		return {
			_actions: {
				onLoad:     () => dispatch( handler.fetchArchive( resolvedId, page ) ),
				onLoadMore: page => dispatch( handler.fetchMore( getSubstate, resolvedId, page ) ),
			},
		};
	};

	return connect(
		mapStateToProps,
		mapDispatchToProps
	)( WrappedComponent );
}
