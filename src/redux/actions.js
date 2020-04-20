import { 
    ALERT_MESSAGE,
    FIGURE_MOVED,
    SELECT_GAME,
    SET_GAME_LIST,
    SHOW_LOADER,
    HIDE_LOADER,
    MULTIPLAYER_LIST_HEARTBEAT,
    MULTIPLAYER_FLAG_GAME,
    MULTIPLAYER_CREATE_GAME,
    MULTIPLAYER_START_GAME,
    MULTIPLAYER_GAME_HEARTBEAT,
    MULTIPLAYER_GAME_SEND_STEP,
    SET_GAME_STEPS,
} from "./types";

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

export function multiplayerListHeartbeat() {
    return {
        type: MULTIPLAYER_LIST_HEARTBEAT,
    }
}

export function multiplayerFlagGame(game) {
    return {
        type: MULTIPLAYER_FLAG_GAME,
        payload: game
    }
}

export function multiplayerCreateGame(name) {
    return {
        type: MULTIPLAYER_CREATE_GAME,
        payload: name
    }
}

export function multiplayerStartGame(game) {
    return {
        type: MULTIPLAYER_START_GAME,
        payload: game
    }
}

export function multiplayerGameHeartbeat() {
    return {
        type: MULTIPLAYER_GAME_HEARTBEAT,
    }
}

export function multiplayerGameSendStep(step) {
    return {
        type: MULTIPLAYER_GAME_SEND_STEP,
        payload: step
    }
}

export function setGameSteps(steps) {
    return {
        type: SET_GAME_STEPS,
        payload: steps
    }
}
