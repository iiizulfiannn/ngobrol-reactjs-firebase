import React from "react";
import { Grid } from "semantic-ui-react";
import { connect } from "react-redux";
import { ColorPanel, Messages, MetaPanel, SidePanel } from "../components";

const Home = ({ currentUser, currentChannel, isPrivateChannel }) => {
    return (
        <Grid columns="equal" className="app" style={{ background: "#eee" }}>
            <ColorPanel />
            <SidePanel
                key={currentUser && currentUser.uid}
                currentUser={currentUser}
            />
            <Grid.Column style={{ marginLeft: 320 }}>
                <Messages
                    key={currentChannel && currentChannel.id}
                    currentChannel={currentChannel}
                    currentUser={currentUser}
                    isPrivateChannel={isPrivateChannel}
                />
            </Grid.Column>
            <Grid.Column width={4}>
                <MetaPanel />
            </Grid.Column>
        </Grid>
    );
};

const mapStateToProps = (state) => ({
    currentUser: state.user.currentUser,
    currentChannel: state.channel.currentChannel,
    isPrivateChannel: state.channel.isPrivateChannel,
});

export default connect(mapStateToProps)(Home);
