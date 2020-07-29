import React, { Component } from 'react';
import { Segment, Comment } from 'semantic-ui-react';
import { connect } from 'react-redux';

import { setUserPosts } from '../../actions';

import MessagesHeader from './MessagesHeader';
import MessageForm from './MessageForm';
import Message from './Message';
import Skeleton from './Skeleton';

import { Firebase } from '../../config';
import Typing from './Typing';

class Messages extends Component {
    state = {
        privateChannel: this.props.isPrivateChannel,
        privateMessagesRef: Firebase.database().ref('privateMessages'),
        messagesRef: Firebase.database().ref('messages'),
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        messages: [],
        messagesLoading: true,
        progressBar: false,
        numUniqueUsers: '',
        searchTerm: '',
        searchLoading: false,
        searchResults: [],
        isChannelStarred: false,
        usersRef: Firebase.database().ref('users'),
        typingRef: Firebase.database().ref('typing'),
        typingUsers: [],
        connectedRef: Firebase.database().ref('.info/connected'),
        listeners: [],
    };

    componentDidMount() {
        const { channel, user, listeners } = this.state;

        if (channel && user) {
            this.removeListeners(listeners);
            this.addListeners(channel.id);
            this.addUserStarsListener(channel.id, user.uid);
        }
    }

    componentWillUnmount() {
        this.removeListeners(this.state.listeners);
        this.state.connectedRef.off();
    }

    removeListeners = (listeners) => {
        listeners.forEach((listener) => {
            listener.ref.child(listener.id).off(listener.event);
        });
    };

    componentDidUpdate(prevProps, prevState) {
        if (this.messagesEnd) {
            this.scrollToBottom();
        }
    }

    addToListeners = (id, ref, event) => {
        const index = this.state.listeners.findIndex((listener) => {
            return (
                listener.id === id && listener.ref && listener.event === event
            );
        });

        if (index === -1) {
            const newListener = { id, ref, event };
            this.setState({
                listeners: this.state.listeners.concat(newListener),
            });
        }
    };

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
    };

    addListeners = (channelId) => {
        this.addMessageListListener(channelId);
        this.addTypingListeners(channelId);
    };

    addTypingListeners = (channelId) => {
        let typingUsers = [];
        this.state.typingRef.child(channelId).on('child_added', (snap) => {
            if (snap.key !== this.state.user.uid) {
                typingUsers = typingUsers.concat({
                    id: snap.key,
                    name: snap.val(),
                });
                this.setState({ typingUsers });
            }
        });
        this.addToListeners(channelId, this.state.typingRef, 'child_added');

        this.state.typingRef.child(channelId).on('child_removed', (snap) => {
            const index = typingUsers.findIndex((user) => user.id === snap.key);
            if (index !== -1) {
                typingUsers = typingUsers.filter(
                    (user) => user.id !== snap.key
                );
                this.setState({ typingUsers });
            }
        });
        this.addToListeners(channelId, this.state.typingRef, 'child_removed');

        this.state.connectedRef.on('value', (snap) => {
            this.state.typingRef
                .child(channelId)
                .child(this.state.user.uid)
                .onDisconnect()
                .remove((err) => {
                    if (err !== null) {
                        console.error(err);
                    }
                });
        });
    };

    addUserStarsListener = (channelId, userId) => {
        this.state.usersRef
            .child(userId)
            .child('starred')
            .once('value')
            .then((data) => {
                if (data.val() !== null) {
                    const channelIds = Object.keys(data.val());
                    const prevStarred = channelIds.includes(channelId);
                    this.setState({
                        isChannelStarred: prevStarred,
                    });
                }
            });
    };

    addMessageListListener = (channelId) => {
        let loadedMessages = [];
        const ref = this.getMessagesRef();
        ref.child(channelId).on('child_added', (snap) => {
            loadedMessages.push(snap.val());
            this.setState({
                messages: loadedMessages,
                messagesLoading: false,
            });
            this.countUniqueUsers(loadedMessages);
            this.countUserPosts(loadedMessages);
        });
        this.addToListeners(channelId, ref, 'child_added');
    };

    getMessagesRef = () => {
        const { messagesRef, privateMessagesRef, privateChannel } = this.state;
        return privateChannel ? privateMessagesRef : messagesRef;
    };

    countUniqueUsers = (messages) => {
        const uniqueUsers = messages.reduce((acc, message) => {
            if (!acc.includes(message.user.name)) {
                acc.push(message.user.name);
            }
            return acc;
        }, []);
        const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
        const numUniqueUsers = `${uniqueUsers.length} user${plural ? 's' : ''}`;
        this.setState({
            numUniqueUsers,
        });
    };

    countUserPosts = (messages) => {
        let userPosts = messages.reduce((acc, message) => {
            if (message.user.name in acc) {
                acc[message.user.name].count += 1;
            } else {
                acc[message.user.name] = {
                    avatar: message.user.avatar,
                    count: 1,
                };
            }
            return acc;
        }, {});
        this.props.setUserPosts(userPosts);
    };

    _displayMessages = (messages) =>
        messages.length > 0 &&
        messages.map((message) => (
            <Message
                key={message.timestamp}
                message={message}
                user={this.state.user}
            />
        ));

    _isProgressBarVIsible = (percent) => {
        if (percent > 0) {
            this.setState({
                progressBar: true,
            });
        }
    };

    _displayChannelName = (channel) => {
        return channel
            ? `${this.state.privateChannel ? '@' : '#'}${channel.name}`
            : '';
    };

    _handleSearchChange = (event) => {
        this.setState(
            {
                searchTerm: event.target.value,
                searchLoading: true,
            },
            () => this.handleSearchMessages()
        );
    };

    handleStar = () => {
        this.setState(
            (prevState) => ({
                isChannelStarred: !prevState.isChannelStarred,
            }),
            () => this.starChannel()
        );
    };

    starChannel = () => {
        const { isChannelStarred, usersRef, user, channel } = this.state;

        if (isChannelStarred) {
            usersRef.child(`${user.uid}/starred`).update({
                [channel.id]: {
                    name: channel.name,
                    details: channel.details,
                    createdBy: {
                        name: channel.createdBy.name,
                        avatar: channel.createdBy.avatar,
                    },
                },
            });
        } else {
            usersRef
                .child(`${user.uid}/starred`)
                .child(channel.id)
                .remove((err) => {
                    if (err !== null) {
                        console.error(err);
                    }
                });
        }
    };

    handleSearchMessages = () => {
        const channelMessages = [...this.state.messages];
        const regex = new RegExp(this.state.searchTerm, 'gi');
        const searchResults = channelMessages.reduce((acc, message) => {
            if (
                (message.content && message.content.match(regex)) ||
                message.user.name.match(regex)
            ) {
                acc.push(message);
            }
            return acc;
        }, []);

        this.setState({
            searchResults,
        });
        setTimeout(() => {
            this.setState({
                searchLoading: false,
            });
        }, 1000);
    };

    _displayTypingUsers = (users) => {
        return (
            users.length > 0 &&
            users.map((user) => (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '0.2em',
                    }}
                    key={user.id}
                >
                    <span className="user__typing">{user.name} is typing</span>
                    <Typing />
                </div>
            ))
        );
    };

    displayMessagesSkeleton = (loading) =>
        loading ? (
            <>
                {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} />
                ))}
            </>
        ) : null;

    render() {
        const {
            messagesRef,
            messages,
            channel,
            user,
            progressBar,
            numUniqueUsers,
            searchTerm,
            searchResults,
            searchLoading,
            privateChannel,
            isChannelStarred,
            typingUsers,
            messagesLoading,
        } = this.state;

        return (
            <>
                <MessagesHeader
                    channelName={this._displayChannelName(channel)}
                    numUniqueUsers={numUniqueUsers}
                    handleSearchChange={this._handleSearchChange}
                    searchLoading={searchLoading}
                    isPrivateChannel={privateChannel}
                    handleStar={this.handleStar}
                    isChannelStarred={isChannelStarred}
                />
                <Segment>
                    <Comment.Group className="messages">
                        {this.displayMessagesSkeleton(messagesLoading)}
                        {searchTerm
                            ? this._displayMessages(searchResults)
                            : this._displayMessages(messages)}
                        {this._displayTypingUsers(typingUsers)}
                        <div ref={(node) => (this.messagesEnd = node)}></div>
                    </Comment.Group>
                </Segment>
                <MessageForm
                    messagesRef={messagesRef}
                    currentChannel={channel}
                    currentUser={user}
                    isProgressBarVIsible={this._isProgressBarVIsible}
                    isPrivateChannel={privateChannel}
                    getMessagesRef={this.getMessagesRef}
                />
            </>
        );
    }
}

export default connect(null, { setUserPosts })(Messages);
