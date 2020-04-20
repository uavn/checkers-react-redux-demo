import { takeEvery, select } from 'redux-saga/effects'
import { ALERT_MESSAGE } from "./types";

export function* watchMessagesActions() {
    yield takeEvery(ALERT_MESSAGE, watchAlertMessage);
}

function watchAlertMessage(action) {
    const game = select(state => state.game.game)
    
    const message = action.payload
    
    if (!game) {
        // Alert for now, when not in game mode
        alert(message.text)
    }
}
