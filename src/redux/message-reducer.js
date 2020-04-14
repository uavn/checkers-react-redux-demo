import { ALERT_MESSAGE } from "./types"

const initialState = {
    messages: []
}

export const messageReducer = (state = initialState, action) => {
    switch (action.type) {
        case ALERT_MESSAGE:
            return { ...state, messages: [...state.messages, action.payload] }
    }

    return state
}
