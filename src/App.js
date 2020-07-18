import React, { Component } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { createStore } from "redux";
import { Provider } from "react-redux";
import { composeWithDevTools } from "redux-devtools-extension";

import "./App.css";
import RootAuth from "./Root";
import rootReducer from "./reducers";

const store = createStore(rootReducer, composeWithDevTools());

class App extends Component {
    render() {
        return (
            <Provider store={store}>
                <Router>
                    <RootAuth />
                </Router>
            </Provider>
        );
    }
}

export default App;
