import React, { Component } from "react";
import { Grid, Header, Icon, Dropdown, Image } from "semantic-ui-react";
import { Firebase } from "../../config";

class UserPanel extends Component {
    state = {
        user: this.props.currentUser,
    };

    _dropdownOptions = () => [
        {
            key: "user",
            text: (
                <span>
                    Signed in as <strong>{this.state.user.displayName}</strong>
                </span>
            ),
            disabled: true,
        },
        {
            key: "avatar",
            text: <span>Change Avatar</span>,
        },
        {
            key: "signout",
            text: <span onClick={this.handleSignout}>Sign Out</span>,
        },
    ];

    handleSignout = () => {
        Firebase.auth()
            .signOut()
            .then(() => console.log("signout success"));
    };

    render() {
        const { user } = this.state;
        return (
            <Grid style={{ background: "#4c3c4c" }}>
                <Grid.Column>
                    <Grid.Row style={{ padding: "1.2em", margin: 0 }}>
                        {/* App header */}
                        <Header inverted floated="left" as="h2">
                            <Icon name="code" />
                            <Header.Content>Ngobrol</Header.Content>
                        </Header>

                        {/* User dropdown */}
                        <Header style={{ padding: "0.25em" }} as="h4" inverted>
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
            </Grid>
        );
    }
}

export default UserPanel;
