import React, { Component } from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import { Firebase } from '../../config';
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../../actions';

class DirectMessages extends Component {
    state = {
        activeChannel: '',
        user: this.props.currentUser,
        users: [],
        userRef: Firebase.database().ref('users'),
        connectedRef: Firebase.database().ref('.info/connected'),
        presenceRef: Firebase.database().ref('presence'),
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
        this.state.userRef.off();
        this.state.presenceRef.off();
        this.state.connectedRef.off();
    };

    addListeners = (currentUserUid) => {
        let loadedUsers = [];
        this.state.userRef.on('child_added', (snap) => {
            if (currentUserUid !== snap.key) {
                let user = snap.val();
                user['uid'] = snap.key;
                user['status'] = 'offline';
                loadedUsers.push(user);
                this.setState({ users: loadedUsers });
            }
        });

        this.state.connectedRef.on('value', (snap) => {
            if (snap.val() === true) {
                const ref = this.state.presenceRef.child(currentUserUid);
                ref.set(true);
                ref.onDisconnect().remove((err) => {
                    if (err !== null) {
                        console.error(err);
                    }
                });
            }
        });

        this.state.presenceRef.on('child_added', (snap) => {
            if (currentUserUid !== snap.key) {
                this.addStatusToUser(snap.key);
            }
        });

        this.state.presenceRef.on('child_removed', (snap) => {
            if (currentUserUid !== snap.key) {
                this.addStatusToUser(snap.key, false);
            }
        });
    };

    addStatusToUser = (userId, connected = true) => {
        const updateUsers = this.state.users.reduce((acc, user) => {
            if (user.uid === userId) {
                user['status'] = `${connected ? 'online' : 'offline'}`;
            }
            return acc.concat(user);
        }, []);
        this.setState({ users: updateUsers });
    };

    _changeChannel = (user) => {
        const channelId = this.getChannelId(user.uid);
        const channelData = {
            id: channelId,
            name: user.name,
        };
        this.props.setCurrentChannel(channelData);
        this.props.setPrivateChannel(true);
        this.setActiveChannel(user.uid);
    };

    setActiveChannel = (userId) => {
        this.setState({ activeChannel: userId });
    };

    getChannelId = (userId) => {
        const currentUserId = this.state.user.uid;
        return userId < currentUserId
            ? `${userId}/${currentUserId}`
            : `${currentUserId}/${userId}`;
    };

    render() {
        const { users, activeChannel } = this.state;

        return (
            <Menu.Menu className="menu">
                <Menu.Item>
                    <span>
                        <Icon name="mail" /> Direct Messages
                    </span>{' '}
                    ({users.length})
                </Menu.Item>
                {users.map((user) => {
                    return (
                        <Menu.Item
                            key={user.uid}
                            active={user.uid === activeChannel}
                            onClick={() => this._changeChannel(user)}
                            style={{ opacity: 0.7, fontStyle: 'italic' }}
                        >
                            <Icon
                                name="circle"
                                // prettier-ignore
                                color={user.status === "online" ? "green" : "red"}
                            />
                            @ {user.name}
                        </Menu.Item>
                    );
                })}
            </Menu.Menu>
        );
    }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(
    DirectMessages
);
