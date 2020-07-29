import React, { Component } from 'react';
import { Segment, Input, Button } from 'semantic-ui-react';
import firebase from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';
import { Picker, emojiIndex } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';

import FileModal from './FileModal';
import ProgressBar from './ProgressBar';
import { Firebase } from '../../config';

class MessageForm extends Component {
    state = {
        uploadState: '',
        uploadTask: null,
        storageRef: Firebase.storage().ref(),
        typingRef: Firebase.database().ref('typing'),
        percentUploaded: 0,
        message: '',
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        loading: false,
        errors: [],
        modal: false,
        emojiPicker: false,
    };

    componentWillUnmount() {
        if (this.state.uploadTask !== null) {
            this.state.uploadTask.cancel();
            this.setState({ uploadTask: null });
        }
    }

    _openModal = () => this.setState({ modal: true });
    _closeModal = () => this.setState({ modal: false });

    createMessage = (fileUrl = null) => {
        const newMessage = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            user: {
                id: this.state.user.uid,
                name: this.state.user.displayName,
                avatar: this.state.user.photoURL,
            },
            // content: this.state.message,
        };

        if (fileUrl !== null) {
            newMessage['image'] = fileUrl;
        } else {
            newMessage['content'] = this.state.message;
        }

        return newMessage;
    };

    _handleChange = (event) =>
        this.setState({ [event.target.name]: event.target.value });

    _handleKeyDown = (event) => {
        if (event.ctrlKey && event.keyCode === 13) {
            this._sendMessage();
        }

        const { message, typingRef, channel, user } = this.state;

        if (message) {
            typingRef.child(channel.id).child(user.uid).set(user.displayName);
        } else {
            typingRef.child(channel.id).child(user.uid).remove();
        }
    };

    _handleTogglePicker = () => {
        this.setState({ emojiPicker: !this.state.emojiPicker });
    };

    _handleAddEmoji = (emoji) => {
        const oldMessage = this.state.message;
        const newMessage = this.colonToUnicode(
            ` ${oldMessage} ${emoji.colons} `
        );
        this.setState({ message: newMessage, emojiPicker: false });
        setTimeout(() => {
            this.messageInputRef.focus();
        }, 0);
    };

    colonToUnicode = (message) => {
        return message.replace(/:[A-Za-z0-9_+-]+:/g, (x) => {
            x = x.replace(/:/g, '');
            let emoji = emojiIndex.emojis[x];
            if (typeof emoji !== 'undefined') {
                let unicode = emoji.native;
                if (typeof unicode !== 'undefined') {
                    return unicode;
                }
            }
            x = ':' + x + ':';
            return x;
        });
    };

    _sendMessage = () => {
        const { getMessagesRef } = this.props;
        const { message, channel, typingRef, user } = this.state;

        if (message) {
            this.setState({ loading: true });
            getMessagesRef()
                .child(channel.id)
                .push()
                .set(this.createMessage())
                .then(() => {
                    this.setState({ loading: false, message: '', errors: [] });
                    typingRef.child(channel.id).child(user.uid).remove();
                })
                .catch((err) => {
                    console.error(err);
                    this.setState({
                        loading: false,
                        errors: this.state.errors.concat(err),
                    });
                });
        } else {
            this.setState({
                errors: this.state.errors.concat({ message: 'Add a message' }),
            });
        }
    };

    getPath = () => {
        if (this.props.isPrivateChannel) {
            return `chat/private-${this.state.channel.id}`;
        } else {
            return `chat/public`;
        }
    };

    _uploadFile = (file, metadata) => {
        const pathToUpload = this.state.channel.id;
        const ref = this.props.getMessagesRef();
        const filePath = `${this.getPath()}${uuidv4()}.jpg`;

        this.setState(
            {
                uploadState: 'uploading',
                uploadTask: this.state.storageRef
                    .child(filePath)
                    .put(file, metadata),
            },
            () => {
                this.state.uploadTask.on(
                    'state_changed',
                    (snap) => {
                        const percentUploaded = Math.round(
                            (snap.bytesTransferred / snap.totalBytes) * 100
                        );
                        this.props.isProgressBarVIsible(percentUploaded);
                        this.setState({ percentUploaded });
                    },
                    (err) => {
                        console.error(err);
                        this.setState({
                            errors: this.state.errors.concat(err),
                            uploadState: 'error',
                            uploadTask: null,
                        });
                    },
                    () => {
                        this.state.uploadTask.snapshot.ref
                            .getDownloadURL()
                            .then((downloadUrl) => {
                                this.sendFileMessage(
                                    downloadUrl,
                                    ref,
                                    pathToUpload
                                );
                            })
                            .catch((err) => {
                                console.error(err);
                                this.setState({
                                    errors: this.state.errors.concat(err),
                                    uploadState: 'error',
                                    uploadTask: null,
                                });
                            });
                    }
                );
            }
        );
    };

    sendFileMessage = (fileUrl, ref, pathToUpload) => {
        ref.child(pathToUpload)
            .push()
            .set(this.createMessage(fileUrl))
            .then(() => {
                this.setState({ uploadState: 'done' });
            })
            .catch((err) => {
                console.error(err);
                this.setState({ errors: this.state.errors.concat(err) });
            });
    };

    render() {
        const {
            errors,
            message,
            loading,
            modal,
            uploadState,
            percentUploaded,
            emojiPicker,
        } = this.state;

        return (
            <Segment className="message__form">
                {emojiPicker && (
                    <Picker
                        set="apple"
                        onSelect={this._handleAddEmoji}
                        className="emojipicker"
                        title="Pick your emoji"
                        emoji="point_up"
                    />
                )}
                <Input
                    fluid
                    name="message"
                    onChange={this._handleChange}
                    onKeyDown={this._handleKeyDown}
                    value={message}
                    ref={(node) => (this.messageInputRef = node)}
                    style={{ marginBottom: '0.7em' }}
                    label={
                        <Button
                            icon={emojiPicker ? 'close' : 'add'}
                            content={emojiPicker ? 'Close' : null}
                            onClick={this._handleTogglePicker}
                        />
                    }
                    labelPosition="left"
                    className={
                        errors.some((err) => err.message.includes('message'))
                            ? 'error'
                            : ''
                    }
                    placeholder="Write your message"
                />
                <Button.Group icon widths="2">
                    <Button
                        onClick={this._sendMessage}
                        disabled={loading}
                        color="orange"
                        content="Add Reply"
                        labelPosition="left"
                        icon="edit"
                    />
                    <Button
                        onClick={this._openModal}
                        disabled={uploadState === 'uploading'}
                        color="teal"
                        content="Upload Media"
                        labelPosition="right"
                        icon="cloud upload"
                    />
                </Button.Group>
                <FileModal
                    modal={modal}
                    closeModal={this._closeModal}
                    uploadFile={this._uploadFile}
                />
                <ProgressBar
                    uploadState={uploadState}
                    percentUploaded={percentUploaded}
                />
            </Segment>
        );
    }
}

export default MessageForm;
