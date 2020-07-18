import React, { Component } from "react";
import { Modal, Input, Button, Icon } from "semantic-ui-react";
import mime from "mime-types";

class FileModal extends Component {
    state = {
        file: null,
        authorized: ["image/jpeg", "image/png"],
    };

    _addFile = (event) => {
        const file = event.target.files[0];
        if (file) {
            this.setState({ file });
        }
    };

    _sendFile = () => {
        const { file } = this.state;
        const { uploadFile, closeModal } = this.props;

        if (file !== null) {
            if (this.isAuthorized(file.name)) {
                const metadata = { contentType: mime.lookup(file.name) };
                uploadFile(file, metadata);
                closeModal();
                this.clearFile();
            }
        }
    };

    clearFile = () => this.setState({ file: null });

    isAuthorized = (filename) =>
        this.state.authorized.includes(mime.lookup(filename));

    render() {
        const { modal, closeModal } = this.props;

        return (
            <Modal basic dimmer="blurring" open={modal} onClose={closeModal}>
                <Modal.Header>Select an Image File</Modal.Header>
                <Modal.Content>
                    <Input
                        fluid
                        label="File types: jpg, png"
                        name="file"
                        type="file"
                        onChange={this._addFile}
                    />
                </Modal.Content>
                <Modal.Actions>
                    <Button color="green" inverted onClick={this._sendFile}>
                        <Icon name="checkmark" /> Send
                    </Button>
                    <Button color="red" inverted onClick={closeModal}>
                        <Icon name="remove" /> Cancel
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

export default FileModal;
