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
import md5 from "md5";

export default class Register extends Component {
    state = {
        username: "",
        email: "",
        password: "",
        passwordConfirmation: "",
        errors: [],
        loading: false,
        userRef: Firebase.database().ref("users"),
    };

    isFormValid = () => {
        let errors = [];
        let error;

        if (this.isFormEmpty(this.state)) {
            error = { message: "Fill in all fields" };
            this.setState({ errors: errors.concat(error) });
            return false;
        } else if (!this.isPasswordValid(this.state)) {
            error = { message: "Password is invalid" };
            this.setState({ errors: errors.concat(error) });
            return false;
        } else {
            // form valid
            return true;
        }
    };

    isFormEmpty = ({ username, email, password, passwordConfirmation }) => {
        return (
            !username.length ||
            !email.length ||
            !password.length ||
            !passwordConfirmation.length
        );
    };

    isPasswordValid = ({ password, passwordConfirmation }) => {
        if (password.length < 6 || passwordConfirmation.length < 6) {
            return false;
        } else if (password !== passwordConfirmation) {
            return false;
        } else {
            return true;
        }
    };

    _displayErrors = (errors) =>
        errors.map((error, i) => <p key={i}>{error.message}</p>);

    _handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value });
    };

    _handleSubmit = (event) => {
        event.preventDefault();
        if (this.isFormValid()) {
            this.setState({ errors: [], loading: true });
            Firebase.auth()
                .createUserWithEmailAndPassword(
                    this.state.email,
                    this.state.password
                )
                .then((createdUser) => {
                    console.log(createdUser);
                    createdUser.user
                        .updateProfile({
                            displayName: this.state.username,
                            photoURL: `http://gravatar.com/avatar/${md5(
                                createdUser.user.email
                            )}?d=identicon`,
                        })
                        .then(() => {
                            this.saveUser(createdUser).then(() => {
                                console.log("user saved");
                                this.setState({ loading: false });
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            this.setState({
                                errors: this.state.errors.concat(err),
                                loading: false,
                            });
                        });
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

    saveUser = (createdUser) => {
        return this.state.userRef.child(createdUser.user.uid).set({
            name: createdUser.user.displayName,
            avatar: createdUser.user.photoURL,
        });
    };

    _handleInputError = (errors, inputName) => {
        return errors.some((error) =>
            error.message.toLowerCase().includes(inputName)
        )
            ? "error"
            : "";
    };

    render() {
        const {
            username,
            email,
            password,
            passwordConfirmation,
            errors,
            loading,
        } = this.state;

        const columnStyle = {
            maxWidth: 450,
        };

        return (
            <Grid textAlign="center" verticalAlign="middle" className="app">
                <Grid.Column style={columnStyle}>
                    <Header as="h1" icon color="orange" textAlign="center">
                        <Icon name="puzzle piece" color="orange" />
                        Register for Ngobrol
                    </Header>
                    <Form onSubmit={this._handleSubmit} size="large">
                        <Segment stacked>
                            <Form.Input
                                fluid
                                name="username"
                                icon="user"
                                iconPosition="left"
                                placeholder="Username"
                                type="text"
                                value={username}
                                onChange={this._handleChange}
                            />
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
                            <Form.Input
                                fluid
                                name="passwordConfirmation"
                                icon="repeat"
                                iconPosition="left"
                                placeholder="Password confirmation"
                                type="password"
                                value={passwordConfirmation}
                                className={this._handleInputError(
                                    errors,
                                    "password"
                                )}
                                onChange={this._handleChange}
                            />
                            <Button
                                disabled={loading}
                                className={loading ? "loading" : ""}
                                color="orange"
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
                        Already a user? <Link to="/login">Login</Link>
                    </Message>
                </Grid.Column>
            </Grid>
        );
    }
}
