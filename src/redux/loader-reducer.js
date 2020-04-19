import { SHOW_LOADER, HIDE_LOADER } from "./types"

const initialState = {
    isVisible: false,
}

export const loaderReducer = (state = initialState, action) => {
    switch (action.type) {
        case SHOW_LOADER:
            return {...state, isVisible: true}
        
        case HIDE_LOADER:
            return {...state, isVisible: false}

        default:
            return state
    }
}
