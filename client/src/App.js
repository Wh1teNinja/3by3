import "./App.css";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Home from "./Home";
import Make3by3 from "./Make3by3";
import logo from "./images/logo-light.svg"

function App() {
  return (
    <div className="App">
      <Router>
        <header className="reverse main-nav">
        <span className="logo"><Link to='/'><img src={logo} height="40px" alt="logo"/></Link></span>
          <ul>
            <li>
              <Link to='/'>Home</Link>
            </li>|
            <li>
              <Link to='/Anime'>Anime</Link>
            </li>
            <li>
              <Link to='/Games'>Games</Link>
            </li>
          </ul>
        </header>
        <Switch>
          <Route exact path='/'>
            <Home />
          </Route>
          <Route path='/Anime'>
            <Make3by3 mediaType='Anime' />
          </Route>
          <Route path='/Games'>
            <Make3by3 mediaType='Games' />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
