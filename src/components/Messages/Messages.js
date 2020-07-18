import React, { Component } from "react";
import { Segment, Comment } from "semantic-ui-react";
import MessagesHeader from "./MessagesHeader";
import MessageForm from "./MessageForm";
import Message from "./Message";
import { Firebase } from "../../config";

export default class Messages extends Component {
    state = {
        privateChannel: this.props.isPrivateChannel,
        privateMessagesRef: Firebase.database().ref("privateMessages"),
        messagesRef: Firebase.database().ref("messages"),
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        messages: [],
        messagesLoading: true,
        progressBar: false,
        numUniqueUsers: "",
        searchTerm: "",
        searchLoading: false,
        searchResults: [],
    };

    componentDidMount() {
        const { channel, user } = this.state;

        if (channel && user) {
            this.addListeners(channel.id);
        }
    }

    addListeners = (channelId) => {
        this.addMessageListListener(channelId);
    };

    addMessageListListener = (channelId) => {
        let loadedMessages = [];
        const ref = this.getMessagesRef();
        ref.child(channelId).on("child_added", (snap) => {
            loadedMessages.push(snap.val());
            this.setState({
                messages: loadedMessages,
                messagesLoading: false,
            });
            this.countUniqueUsers(loadedMessages);
        });
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
        const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s" : ""}`;
        this.setState({ numUniqueUsers });
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
            this.setState({ progressBar: true });
        }
    };

    _displayChannelName = (channel) => {
        return channel
            ? `${this.state.privateChannel ? "@" : "#"}${channel.name}`
            : "";
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

    handleSearchMessages = () => {
        const channelMessages = [...this.state.messages];
        const regex = new RegExp(this.state.searchTerm, "gi");
        const searchResults = channelMessages.reduce((acc, message) => {
            if (
                (message.content && message.content.match(regex)) ||
                message.user.name.match(regex)
            ) {
                acc.push(message);
            }
            return acc;
        }, []);

        this.setState({ searchResults });
        setTimeout(() => {
            this.setState({ searchLoading: false });
        }, 1000);
    };

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
        } = this.state;

        return (
            <>
                <MessagesHeader
                    channelName={this._displayChannelName(channel)}
                    numUniqueUsers={numUniqueUsers}
                    handleSearchChange={this._handleSearchChange}
                    searchLoading={searchLoading}
                    isPrivateChannel={privateChannel}
                />

                <Segment>
                    {/* prettier-ignore */}
                    <Comment.Group className={progressBar ? "messages__progress" : "messages"}>
                        {searchTerm ? this._displayMessages(searchResults) : this._displayMessages(messages)}
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
