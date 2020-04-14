import { combineReducers } from "redux";
import { gameReducer } from "./game-reducer";
import { messageReducer } from "./message-reducer";
import { loaderReducer } from "./loader-reducer";

export const rootReducer = combineReducers({
    game: gameReducer,
    message: messageReducer,
    loader: loaderReducer
})
