import React, { Component } from 'react';
import {
    Sidebar,
    Menu,
    Divider,
    Button,
    Modal,
    Icon,
    Label,
    Segment,
} from 'semantic-ui-react';
import { SliderPicker } from 'react-color';
import { connect } from 'react-redux';
import { setColors } from '../actions';
import { Firebase } from '../config';

class ColorPanel extends Component {
    state = {
        modal: false,
        primary: '',
        secondary: '',
        user: this.props.currentUser,
        usersRef: Firebase.database().ref('users'),
        userColors: [],
    };

    componentDidMount = () => {
        const { user } = this.state;
        if (user) {
            this.addListeners(user.uid);
        }
    };

    componentWillMount() {
        this.removeListener();
    }

    removeListener = () => {
        this.state.usersRef.child(`${this.state.user.uid}/colors`).off();
    };

    addListeners = (userId) => {
        let userColors = [];
        this.state.usersRef
            .child(`${userId}/colors`)
            .on('child_added', (snap) => {
                userColors.unshift(snap.val());
                this.setState({ userColors });
            });
    };

    _openModal = () => this.setState({ modal: true });
    _closeModal = () => this.setState({ modal: false });

    _handleChangePrimary = (color) => this.setState({ primary: color.hex });
    _handleChangeSecondary = (color) => this.setState({ secondary: color.hex });

    _handleSaveColors = () => {
        const { primary, secondary } = this.state;
        if (primary && secondary) {
            this.saveColors(primary, secondary);
        }
    };

    _displayUserColors = (colors) => {
        return (
            colors.length > 0 &&
            colors.map((color, index) => {
                return (
                    <React.Fragment key={index}>
                        <Divider />
                        <div
                            className="color__container"
                            onClick={() =>
                                this.props.setColors(
                                    color.primary,
                                    color.secondary
                                )
                            }
                        >
                            <div
                                className="color__square"
                                style={{ background: color.primary }}
                            >
                                <div
                                    className="color__overlay"
                                    style={{ background: color.secondary }}
                                ></div>
                            </div>
                        </div>
                    </React.Fragment>
                );
            })
        );
    };

    saveColors = (primary, secondary) => {
        this.state.usersRef
            .child(`${this.state.user.uid}/colors`)
            .push()
            .update({
                primary,
                secondary,
            })
            .then((data) => {
                console.log('Colors added');
                this._closeModal();
            })
            .catch((err) => {
                console.error(err);
            });
    };

    render() {
        const { modal, primary, secondary, userColors } = this.state;

        return (
            <Sidebar
                as={Menu}
                icon="labeled"
                inverted
                vertical
                visible
                width="very thin"
            >
                <Divider />
                <Button
                    icon="add"
                    size="tiny"
                    color="blue"
                    onClick={this._openModal}
                />
                {this._displayUserColors(userColors)}

                {/* Color modal picker */}
                <Modal basic open={modal} onClose={this._closeModal}>
                    <Modal.Header>Choose App Colors</Modal.Header>
                    <Modal.Content>
                        <Segment inverted>
                            <Label content="Primary Color" />
                            <SliderPicker
                                color={primary}
                                onChange={this._handleChangePrimary}
                            />
                        </Segment>
                        <Segment inverted>
                            <Label content="Secondary Color" />
                            <SliderPicker
                                color={secondary}
                                onChange={this._handleChangeSecondary}
                            />
                        </Segment>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            color="green"
                            inverted
                            onClick={this._handleSaveColors}
                        >
                            <Icon name="checkmark" />
                            Save Colors
                        </Button>
                        <Button color="red" inverted onClick={this._closeModal}>
                            <Icon name="remove" />
                            Cancel
                        </Button>
                    </Modal.Actions>
                </Modal>
            </Sidebar>
        );
    }
}

export default connect(null, { setColors })(ColorPanel);
