import React, { Component } from 'react';
import {
    Menu,
    Icon,
    Modal,
    Form,
    Input,
    Button,
    Label,
} from 'semantic-ui-react';
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
import { Firebase } from '../../config';

class Channels extends Component {
    state = {
        activeChannel: '',
        user: this.props.currentUser,
        channel: null,
        channels: [],
        channelName: '',
        channelDetails: '',
        channelsRef: Firebase.database().ref('channels'),
        messagesRef: Firebase.database().ref('messages'),
        typingRef: Firebase.database().ref('typing'),
        notifications: [],
        modal: false,
        firstLoad: true,
    };

    componentDidMount() {
        this.addListeners();
    }

    componentWillUnmount() {
        this.removeListeners();
    }

    removeListeners = () => {
        this.state.channelsRef.off();
        this.state.channels.forEach((channel) => {
            this.state.messagesRef.child(channel.id).off();
        });
    };

    addListeners = () => {
        let loadedChannels = [];
        this.state.channelsRef.on('child_added', (snap) => {
            loadedChannels.push(snap.val());
            this.setState({ channels: loadedChannels }, () =>
                this.setFirstChannel()
            );
            this.addNotificationListener(snap.key);
        });
    };

    addNotificationListener = (channelId) => {
        this.state.messagesRef.child(channelId).on('value', (snap) => {
            if (this.state.channel) {
                this.handleNotifications(
                    channelId,
                    this.state.channel.id,
                    this.state.notifications,
                    snap
                );
            }
        });
    };

    handleNotifications = (
        channelId,
        currentChannelId,
        notifications,
        snap
    ) => {
        let lastTotal = 0;
        let index = notifications.findIndex(
            (notification) => notification.id === channelId
        );
        if (index !== -1) {
            if (channelId !== currentChannelId) {
                lastTotal = notifications[index].total;
                if (snap.numChildren() - lastTotal > 0) {
                    notifications[index].count = snap.numChildren() - lastTotal;
                }
            }
            notifications[index].lastKnownTotal = snap.numChildren();
        } else {
            notifications.push({
                id: channelId,
                total: snap.numChildren(),
                lastKnownTotal: snap.numChildren(),
                count: 0,
            });
        }

        this.setState({ notifications });
    };

    setFirstChannel = () => {
        const firstChannel = this.state.channels[0];
        if (this.state.firstLoad && this.state.channels.length > 0) {
            this.props.setCurrentChannel(firstChannel);
            this.setActiveChannel(firstChannel);
            this.setState({ channel: firstChannel });
        }
        this.setState({ firstLoad: false });
    };

    isFormValid = ({ channelName, channelDetails }) =>
        channelName && channelDetails;

    addChannel = () => {
        const { channelsRef, channelName, channelDetails, user } = this.state;
        const key = channelsRef.push().key;

        const newChannel = {
            id: key,
            name: channelName,
            details: channelDetails,
            createdBy: {
                name: user.displayName,
                avatar: user.photoURL,
            },
        };

        channelsRef
            .child(key)
            .update(newChannel)
            .then(() => {
                this.setState({ channelName: '', channelDetails: '' });
                this._closeModal();
                console.log('channel added');
            })
            .catch((err) => {
                console.error(err);
            });
    };

    changeChannel = (channel) => {
        this.setActiveChannel(channel);
        this.state.typingRef
            .child(this.state.channel.id)
            .child(this.state.user.uid)
            .remove();
        this.clearNotifications();
        this.props.setCurrentChannel(channel);
        this.props.setPrivateChannel(false);
        this.setState({ channel });
    };

    clearNotifications = () => {
        let index = this.state.notifications.findIndex(
            (notification) => notification.id === this.state.channel.id
        );

        if (index !== -1) {
            let updateNotifications = [...this.state.notifications];
            updateNotifications[index].total = this.state.notifications[
                index
            ].lastKnownTotal;
            updateNotifications[index].count = 0;
            this.setState({ notifications: updateNotifications });
        }
    };

    setActiveChannel = (channel) => {
        this.setState({ activeChannel: channel.id });
    };

    _closeModal = () => this.setState({ modal: false });
    _openModal = () => this.setState({ modal: true });

    _handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value });
    };

    _handleSubmit = (event) => {
        event.preventDefault();
        if (this.isFormValid(this.state)) {
            this.addChannel();
        }
    };

    _displayChannels = (channels) => {
        return (
            channels.length > 0 &&
            channels.map((channel) => {
                return (
                    <Menu.Item
                        key={channel.id}
                        onClick={() => this.changeChannel(channel)}
                        name={channel.name}
                        style={{ opacity: 0.7 }}
                        active={channel.id === this.state.activeChannel}
                    >
                        {this.getNotificationCount(channel) && (
                            <Label color="red">
                                {this.getNotificationCount(channel)}
                            </Label>
                        )}
                        # {channel.name}
                    </Menu.Item>
                );
            })
        );
    };

    getNotificationCount = (channel) => {
        let count = 0;
        this.state.notifications.forEach((notification) => {
            if (notification.id === channel.id) {
                count = notification.count;
            }
        });
        if (count > 0) return count;
    };

    render() {
        const { channels, modal } = this.state;

        return (
            <>
                <Menu.Menu className="menu">
                    <Menu.Item>
                        <span>
                            <Icon name="exchange" /> CHANNELS
                        </span>{' '}
                        ({channels.length}){' '}
                        <Icon name="add" onClick={this._openModal} />
                    </Menu.Item>
                    {this._displayChannels(channels)}
                </Menu.Menu>

                {/* Add channel modal */}
                <Modal basic open={modal} onClose={this._closeModal}>
                    <Modal.Header>Add a channel</Modal.Header>
                    <Modal.Content>
                        <Form onSubmit={this._handleSubmit}>
                            <Form.Field>
                                <Input
                                    fluid
                                    label="Name of Channel"
                                    name="channelName"
                                    onChange={this._handleChange}
                                />
                            </Form.Field>

                            <Form.Field>
                                <Input
                                    fluid
                                    label="About the Channel"
                                    name="channelDetails"
                                    onChange={this._handleChange}
                                />
                            </Form.Field>
                        </Form>
                    </Modal.Content>

                    <Modal.Actions>
                        <Button
                            color="green"
                            inverted
                            onClick={this._handleSubmit}
                        >
                            <Icon name="checkmark" />
                            Add
                        </Button>
                        <Button color="red" inverted onClick={this._closeModal}>
                            <Icon name="remove" />
                            Cancel
                        </Button>
                    </Modal.Actions>
                </Modal>
            </>
        );
    }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(
    Channels
);
