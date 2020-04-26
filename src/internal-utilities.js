import { useDispatch } from 'react-redux';

function fallbackHook() {
	throw new Error( 'react-redux does not support hooks. Update to react-redux 7.1+' );
}

export const supportsReduxHooks = useDispatch !== undefined;
export const maybeHook = hook => supportsReduxHooks ? hook : fallbackHook;
