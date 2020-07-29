import React, { Component } from 'react';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
import { Menu, Icon } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { Firebase } from '../../config';

class Starred extends Component {
    state = {
        user: this.props.currentUser,
        userRef: Firebase.database().ref('users'),
        activeChannel: '',
        starredChannels: [],
    };

    componentDidMount() {
        if (this.state.user) {
            this.addListeners(this.state.user.uid);
        }
    }

    componentWillUnmount() {
        this.removeListeners();
    }

    removeListeners = () => {
        this.state.userRef.child(`${this.state.user.uid}/starred`).off();
    };

    addListeners = (userId) => {
        this.state.userRef
            .child(userId)
            .child('starred')
            .on('child_added', (snap) => {
                const starredChannel = { id: snap.key, ...snap.val() };
                this.setState({
                    starredChannels: [
                        ...this.state.starredChannels,
                        starredChannel,
                    ],
                });
            });

        this.state.userRef
            .child(userId)
            .child('starred')
            .on('child_removed', (snap) => {
                const channelToRemove = { id: snap.key, ...snap.val() };
                const filteredChannels = this.state.starredChannels.filter(
                    (channel) => {
                        return channel.id !== channelToRemove.id;
                    }
                );
                this.setState({ starredChannels: filteredChannels });
            });
    };

    setActiveChannel = (channel) => {
        this.setState({ activeChannel: channel.id });
    };

    changeChannel = (channel) => {
        this.setActiveChannel(channel);
        this.props.setCurrentChannel(channel);
        this.props.setPrivateChannel(false);
    };

    _displayChannels = (starredChannels) => {
        return (
            starredChannels.length > 0 &&
            starredChannels.map((channel) => {
                return (
                    <Menu.Item
                        key={channel.id}
                        onClick={() => this.changeChannel(channel)}
                        name={channel.name}
                        style={{ opacity: 0.7 }}
                        active={channel.id === this.state.activeChannel}
                    >
                        # {channel.name}
                    </Menu.Item>
                );
            })
        );
    };

    render() {
        const { starredChannels } = this.state;

        return (
            <Menu.Menu className="menu">
                <Menu.Item>
                    <span>
                        <Icon name="star" /> STARRED
                    </span>{' '}
                    ({starredChannels.length})
                </Menu.Item>
                {this._displayChannels(starredChannels)}
            </Menu.Menu>
        );
    }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(Starred);
