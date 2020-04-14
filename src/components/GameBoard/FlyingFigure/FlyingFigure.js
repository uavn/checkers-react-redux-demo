import React from 'react'
import './FlyingFigure.css'

export default class FlyingFigure extends React.Component {
    /** @type {Object} */
    state = {
        top: 0,
        left: 0,
    }

    /**
     * Function should be assigned to variable for correct unbinding
     * 
     * @type {Function}
     */
    moveFigureCallback = null

    componentDidMount() {
        this.moveFigureCallback = this.moveFigure.bind(this)

        window.addEventListener('mousemove', this.moveFigureCallback)
    }

    componentWillUnmount() {
        window.removeEventListener('mousemove', this.moveFigureCallback)
    }

    /**
     * @param {Object} e 
     */
    moveFigure(e) {
        this.setState({
            left: e.pageX,
            top: e.pageY
        })
    }
    
    render() {
        const styles = {
            top: this.state.top - 10,
            left: this.state.left - 10
        }

        return (
            this.state.top && 
            this.state.left && 
            <div className="flying-figure" style={styles}></div>
        )
    }
}
