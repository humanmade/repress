import React from 'react';
import { connect } from 'react-redux';

import { resolve } from './utilities';

export default ( handler, getSubstate, mapPropsToId ) => Component => {
	class WrappedComponent extends React.Component {
		componentWillMount() {
			if ( ! this.props.posts && ! this.props.loading ) {
				this.props.onLoad();
			}
		}

		componentWillReceiveProps( nextProps ) {
			if ( ! nextProps.posts && this.props.postId !== nextProps.postId ) {
				nextProps.onLoad();
			}
		}

		render() {
			return <Component { ...this.props } />;
		}
	}

	const mapStateToProps = ( state, props ) => {
		const substate = getSubstate( state );
		const resolvedId = resolve( mapPropsToId, props );
		const post = handler.getSingle( substate, resolvedId );

		return {
			post,
			postId:  resolvedId,
			loading: handler.isPostLoading( substate, resolvedId ),
			saving:  handler.isPostSaving( substate, resolvedId ),
		};
	};

	const mapDispatchToProps = ( dispatch, props ) => {
		const resolvedId = resolve( mapPropsToId, props );
		return {
			onLoad:       ( context = 'view' ) => dispatch( handler.fetchSingle( resolvedId, context ) ),
			onUpdatePost: data => dispatch( handler.updateSingle( { id: resolvedId, ...data } ) ),
		};
	};

	return connect(
		mapStateToProps,
		mapDispatchToProps
	)( WrappedComponent );
}
