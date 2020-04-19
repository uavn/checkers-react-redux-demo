import React from 'react';
import {connect} from 'react-redux'
import Loader from './components/Loader/Loader'
import GameList from './components/GameList/GameList'
import GameBoard from './components/GameBoard/GameBoard'
import GameMessages from './components/GameMessages/GameMessages'

function App({game, loading}) {
  let content

  if (game) {
    content = (<>
      <GameBoard />
      <GameMessages />
    </>)
  } else {
    content = <GameList />
  }

  return (
    <div className="wrapper">
      {loading && <Loader/>}

      {content}

      <div className="credits">
        <h4>Checkers Game</h4>
        JS Demo project.<br/>
        JavaScript, React & Redux<br/>
        MongoDB Atlas/MongoDB Stitch<br/>
        Single Player/Multiplayer<br/>

        <br/>

        Web: <a href="https://uartema.com" target="_blank" rel="noopener noreferrer">uartema.com</a> <br/>
        GitHub: <a href="https://github.com/uavn/checkers-react-redux-demo" target="_blank" rel="noopener noreferrer">github.com/uavn/checkers-react-redux-demo</a> <br/>
        Mail: <a href="mailto:artbonvic@gmail.com">artbonvic@gmail.com</a>
      </div>
    </div>
  );
}

const mapStateToProps = state => ({
  game: state.game.game,
  loading: state.loader.isVisible,
})

export default connect(mapStateToProps, null)(App);
