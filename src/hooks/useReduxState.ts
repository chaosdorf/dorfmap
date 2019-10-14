import { AppState } from '../AppState';
import { TypedUseSelectorHook, useSelector } from 'react-redux';

const useReduxState: TypedUseSelectorHook<AppState> = useSelector;

export default useReduxState;
