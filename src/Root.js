import React, { Component } from "react";
import { Switch, Route, withRouter } from "react-router-dom";
import { connect } from "react-redux";

import { Home, Login, Register } from "./pages";
import { Spinner } from "./components";
import { Firebase } from "./config";
import { setUser, clearUser } from "./actions";

class Root extends Component {
    componentDidMount() {
        Firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.props.setUser(user);
                this.props.history.push("/");
            } else {
                this.props.history.push("login");
                this.props.clearUser();
            }
        });
    }
    render() {
        return this.props.isLoading ? (
            <Spinner />
        ) : (
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
            </Switch>
        );
    }
}

const mapStateFromProps = (state) => ({
    isLoading: state.user.isLoading,
});

export default withRouter(
    connect(mapStateFromProps, { setUser, clearUser })(Root)
);
