import React from 'react'
import './Loader.css'

export default class Loader extends React.Component {
    render() {
        return (
            <div className="lds-overflow"><div className="lds-circle"><div></div></div></div>
        )
    }
}