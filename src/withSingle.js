import React from 'react';
import { connect } from 'react-redux';

import { resolve } from './utilities';

export default ( handler, getSubstate, mapPropsToId ) => Component => {
	class WrappedComponent extends React.Component {
		componentWillMount() {
			if ( ! this.props._data.posts && ! this.props._data.loading ) {
				this.props._actions.onLoad();
			}
		}

		componentWillReceiveProps( nextProps ) {
			if ( ! nextProps._data.posts && this.props._data.postId !== nextProps._data.postId ) {
				nextProps._actions.onLoad();
			}
		}

		render() {
			const { _data, _actions, ...props } = this.props;

			const childProps = {
				..._data,
				..._actions,
				...props,
			};
			return <Component { ...childProps } />;
		}
	}

	const mapStateToProps = ( state, props ) => {
		const substate = getSubstate( state );
		const resolvedId = resolve( mapPropsToId, props );
		const post = handler.getSingle( substate, resolvedId );

		return {
			_data: {
				post,
				postId:  resolvedId,
				loading: handler.isPostLoading( substate, resolvedId ),
				saving:  handler.isPostSaving( substate, resolvedId ),
			},
		};
	};

	const mapDispatchToProps = ( dispatch, props ) => {
		const resolvedId = resolve( mapPropsToId, props );
		return {
			_actions: {
				onLoad:       ( context = 'view' ) => dispatch( handler.fetchSingle( resolvedId, context ) ),
				onUpdatePost: data => dispatch( handler.updateSingle( { id: resolvedId, ...data } ) ),
			},
		};
	};

	return connect(
		mapStateToProps,
		mapDispatchToProps
	)( WrappedComponent );
}
