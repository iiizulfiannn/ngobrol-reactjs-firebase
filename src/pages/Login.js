import React, { Component } from "react";
import {
    Grid,
    Form,
    Segment,
    Button,
    Header,
    Message,
    Icon,
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import { Firebase } from "../config";

export default class Login extends Component {
    state = {
        email: "",
        password: "",
        errors: [],
        loading: false,
    };

    _displayErrors = (errors) =>
        errors.map((error, i) => <p key={i}>{error.message}</p>);

    _handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value });
    };

    _handleSubmit = (event) => {
        event.preventDefault();
        if (this.isFormValid(this.state)) {
            this.setState({ errors: [], loading: true });
            Firebase.auth()
                .signInWithEmailAndPassword(
                    this.state.email,
                    this.state.password
                )
                .then((signedInUser) => {
                    // console.log(signedInUser);
                    this.setState({ loading: false });
                })
                .catch((err) => {
                    console.error(err);
                    this.setState({
                        errors: this.state.errors.concat(err),
                        loading: false,
                    });
                });
        }
    };

    isFormValid = ({ email, password }) => {
        return email && password;
    };

    _handleInputError = (errors, inputName) => {
        return errors.some((error) =>
            error.message.toLowerCase().includes(inputName)
        )
            ? "error"
            : "";
    };

    render() {
        const { email, password, errors, loading } = this.state;

        const columnStyle = {
            maxWidth: 450,
        };

        return (
            <Grid textAlign="center" verticalAlign="middle" className="app">
                <Grid.Column style={columnStyle}>
                    <Header as="h1" icon color="violet" textAlign="center">
                        <Icon name="code branch" color="violet" />
                        Login to Ngobrol
                    </Header>
                    <Form onSubmit={this._handleSubmit} size="large">
                        <Segment stacked>
                            <Form.Input
                                fluid
                                name="email"
                                icon="mail"
                                iconPosition="left"
                                placeholder="Email address"
                                type="email"
                                value={email}
                                className={this._handleInputError(
                                    errors,
                                    "email"
                                )}
                                onChange={this._handleChange}
                            />
                            <Form.Input
                                fluid
                                name="password"
                                icon="lock"
                                iconPosition="left"
                                placeholder="Password"
                                type="password"
                                value={password}
                                className={this._handleInputError(
                                    errors,
                                    "password"
                                )}
                                onChange={this._handleChange}
                            />
                            <Button
                                disabled={loading}
                                className={loading ? "loading" : ""}
                                color="violet"
                                fluid
                                size="large"
                            >
                                Submit
                            </Button>
                        </Segment>
                    </Form>
                    {errors.length > 0 && (
                        <Message error>
                            <h3>Error</h3>
                            {this._displayErrors(errors)}
                        </Message>
                    )}
                    <Message>
                        Don't have an account?{" "}
                        <Link to="/register">Register</Link>
                    </Message>
                </Grid.Column>
            </Grid>
        );
    }
}
