import React from 'react'
import './FigureView.css'

export default class FigureView extends React.Component {
    /** @type {Object} */
    state = {
        top: 0,
        left: 0,
    }

    /** @type {Figure} */
    figure = null

    /**
     * @param {Object} props 
     */
    constructor(props) {
        super(props)
        this.figure = props.figure
    }
    
    componentDidMount() {
        this.setState({
            left: this.figure.position.left,
            top: this.figure.position.top
        })
    }
    
    /**
     * @returns {string}
     */
    getColorClass() {
        return `figure-${this.figure.color}`;
    }

    /**
     * @returns {string}
     */
    getTypeClass() {
        return this.figure.isQueen() ? 'figure-queen' : ''
    }

    /**
     * @returns {string}
     */
    getHighlightedClass() {
        return this.figure.isHighlighted() ? 'figure-highlighted' : ''
    }

    render() {
        const classes = `figure ${this.getColorClass()} ${this.getTypeClass()} ${this.getHighlightedClass()}`

        const styles = {
            top: this.state.top,
            left: this.state.left
        }

        return (
            <div className={classes} style={styles} onMouseDown={() => this.props.takeMe(this.figure)}></div>
        )
    }
}
