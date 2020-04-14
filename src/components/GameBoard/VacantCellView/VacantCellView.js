import React from 'react'
import './VacantCellView.css'

export default class VacantCellView extends React.Component {
    /** @type {Object} */
    state = {
        top: 0,
        left: 0,
    }

    /** @type {VacantCell} */
    cell = null

    /**
     * @param {Object} props 
     */
    constructor(props) {
        super(props)

        this.cell = props.cell
    }
    
    componentDidMount() {
        this.setState({
            left: this.cell.position.left,
            top: this.cell.position.top
        })
    }

    /**
     * @returns {string}
     */
    _getHighlightedClass() {
        return this.cell.isHighlighted() ? 'cell-highlighted' : ''
    }
    
    render() {
        const classes = `vacant-cell ${this._getHighlightedClass()}`

        const styles = {
            top: this.state.top,
            left: this.state.left
        }

        return (
            <div className={classes} style={styles} onMouseUp={() => this.props.dropOnMe(this.cell)}></div>
        )
    }
}
