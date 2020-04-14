import React from 'react'
import Moment from 'react-moment'
import {connect} from 'react-redux'
import './GameMessages.css'

/** @class */
class GameMessages extends React.Component {
    render() {
        return (
            <div className="messages">
                {this.props.messages.reverse().map(message => {
                    return (
                        <div className="message" key={message.id}>
                            <Moment date={message.time} format="HH:mm:ss"/>:&nbsp;

                            {message.text}
                        </div>
                    )
                })}
            </div>
        )
    }
}

const mapStateToProps = state => ({
    messages: state.message.messages,
})

export default connect(mapStateToProps, null)(GameMessages);
