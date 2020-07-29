import React, { Component } from 'react';
import {
    Grid,
    Header,
    Icon,
    Dropdown,
    Image,
    Modal,
    Input,
    Button,
} from 'semantic-ui-react';
import AvatarEditor from 'react-avatar-editor';
import { Firebase } from '../../config';

class UserPanel extends Component {
    state = {
        modal: false,
        user: this.props.currentUser,
        previewImage: '',
        croppedImage: '',
        blob: '',
        uploadedCroppedImage: '',
        userRef: Firebase.auth().currentUser,
        usersRef: Firebase.database().ref('users'),
        storageRef: Firebase.storage().ref(),
        metadata: {
            contentType: 'image/jpeg',
        },
    };

    _openModal = () => this.setState({ modal: true });
    _closeModal = () => this.setState({ modal: false });

    _dropdownOptions = () => [
        {
            key: 'user',
            text: (
                <span>
                    Signed in as <strong>{this.state.user.displayName}</strong>
                </span>
            ),
            disabled: true,
        },
        {
            key: 'avatar',
            text: <span onClick={this._openModal}>Change Avatar</span>,
        },
        {
            key: 'signout',
            text: <span onClick={this.handleSignout}>Sign Out</span>,
        },
    ];

    handleSignout = () => {
        Firebase.auth()
            .signOut()
            .then(() => console.log('signout success'));
    };

    _handleChange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        if (file) {
            reader.readAsDataURL(file);
            reader.addEventListener('load', () => {
                this.setState({ previewImage: reader.result });
            });
        }
    };

    _handleCropImage = () => {
        if (this.avatarEditor) {
            this.avatarEditor.getImageScaledToCanvas().toBlob((blob) => {
                let imageURL = URL.createObjectURL(blob);
                this.setState({
                    croppedImage: imageURL,
                    blob,
                });
            });
        }
    };

    _uploadCroppedImage = () => {
        const { userRef, storageRef, blob, metadata } = this.state;

        storageRef
            .child(`avatars/user-${userRef.uid}`)
            .put(blob, metadata)
            .then((snap) => {
                snap.ref.getDownloadURL().then((downloadURL) => {
                    this.setState({ uploadedCroppedImage: downloadURL }, () =>
                        this.changeAvatar()
                    );
                });
            });
    };

    changeAvatar = () => {
        this.state.userRef
            .updateProfile({ photoURL: this.state.uploadedCroppedImage })
            .then(() => this._closeModal())
            .catch((err) => console.error(err));

        this.state.usersRef
            .child(this.state.user.uid)
            .update({ avatar: this.state.uploadedCroppedImage })
            .then(() => this._closeModal())
            .catch((err) => console.error(err));
    };

    render() {
        const { user, modal, previewImage, croppedImage } = this.state;
        const { primaryColor } = this.props;

        return (
            <Grid style={{ background: primaryColor }}>
                <Grid.Column>
                    <Grid.Row style={{ padding: '1.2em', margin: 0 }}>
                        {/* App header */}
                        <Header inverted floated="left" as="h2">
                            <Icon name="code" />
                            <Header.Content>Ngobrol</Header.Content>
                        </Header>

                        {/* User dropdown */}
                        <Header style={{ padding: '0.25em' }} as="h4" inverted>
                            <Dropdown
                                trigger={
                                    <span>
                                        <Image
                                            src={user.photoURL}
                                            spaced="right"
                                            avatar
                                        />
                                        {user.displayName}
                                    </span>
                                }
                                options={this._dropdownOptions()}
                            />
                        </Header>
                    </Grid.Row>
                </Grid.Column>

                {/* Modal Change avatar */}
                <Modal basic open={modal} onClose={this._closeModal}>
                    <Modal.Header>Change Avatar</Modal.Header>
                    <Modal.Content>
                        <Input
                            fluid
                            type="file"
                            label="New Avatar"
                            name="previewImage"
                            onChange={this._handleChange}
                        />
                        <Grid centered stackable columns={2}>
                            <Grid.Row centered>
                                <Grid.Column className="ui center aligned grid">
                                    {previewImage && (
                                        <AvatarEditor
                                            ref={(node) =>
                                                (this.avatarEditor = node)
                                            }
                                            image={previewImage}
                                            width={120}
                                            height={120}
                                            border={50}
                                            scale={1.2}
                                        />
                                    )}
                                </Grid.Column>
                                <Grid.Column>
                                    {croppedImage && (
                                        <Image
                                            style={{ margin: '3.5em auto' }}
                                            src={croppedImage}
                                            width={100}
                                            height={100}
                                        />
                                    )}
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Modal.Content>
                    <Modal.Actions>
                        {croppedImage && (
                            <Button
                                color="green"
                                inverted
                                onClick={this._uploadCroppedImage}
                            >
                                <Icon name="save" />
                                Change Avatar
                            </Button>
                        )}
                        <Button
                            color="green"
                            inverted
                            onClick={this._handleCropImage}
                        >
                            <Icon name="image" />
                            Preview
                        </Button>
                        <Button color="red" inverted onClick={this._closeModal}>
                            <Icon name="remove" />
                            Cancel
                        </Button>
                    </Modal.Actions>
                </Modal>
            </Grid>
        );
    }
}

export default UserPanel;
