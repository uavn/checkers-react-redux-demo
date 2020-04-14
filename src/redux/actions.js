import { ALERT_MESSAGE, FIGURE_MOVED, SELECT_GAME, SET_GAME_LIST, SHOW_LOADER, HIDE_LOADER } from "./types";
import Message from "../components/Pure/Message";

export function alertMessage(message) {
    return {
        type: ALERT_MESSAGE,
        payload: new Message(message)
    }
}

export function showLoader() {
    return {
        type: SHOW_LOADER
    }
}

export function hideLoader() {
    return {
        type: HIDE_LOADER
    }
}

export function selectGame(game) {
    return {
        type: SELECT_GAME,
        payload: game
    }
}

export function setGameList(games) {
    return {
        type: SET_GAME_LIST,
        payload: games
    }
}

export function moveFigure(cells) {
    return {
        type: FIGURE_MOVED,
        payload: cells
    }
}
