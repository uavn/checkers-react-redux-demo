import { FIGURE_MOVED, SELECT_GAME, SET_GAME_LIST, SET_GAME_STEPS } from "./types"

const initialState = {
    cells: {},
    gameList: [],
    game: null,
    steps: [],
}

export const gameReducer = (state = initialState, action) => {
    switch (action.type) {
        case FIGURE_MOVED:
            return {...state, cells: action.payload}

        case SELECT_GAME:
            return {...state, game: action.payload}
        
        case SET_GAME_LIST:
            return {...state, gameList: action.payload}
            
        case SET_GAME_STEPS:
            return {...state, steps: action.payload}

        default:
            return state
    }
}
