import React from "react";
import { Comment, Image } from "semantic-ui-react";
import moment from "moment";

const Message = ({ message, user }) => {
    const _isOwnMessage = (message, user) => {
        return message.user.id === user.uid ? "message__self" : "";
    };

    const _timeFromNow = (timestamp) => moment(timestamp).fromNow();

    const isImage = (message) => {
        return (
            message.hasOwnProperty("image") &&
            !message.hasOwnProperty("content")
        );
    };

    return (
        <Comment>
            <Comment.Avatar src={message.user.avatar} />
            <Comment.Content className={_isOwnMessage(message, user)}>
                <Comment.Author as="a">{message.user.name}</Comment.Author>
                <Comment.Metadata>
                    {_timeFromNow(message.timestamp)}
                </Comment.Metadata>
                {isImage(message) ? (
                    <Image src={message.image} className="message__image" />
                ) : (
                    <Comment.Text>{message.content}</Comment.Text>
                )}
            </Comment.Content>
        </Comment>
    );
};

export default Message;
