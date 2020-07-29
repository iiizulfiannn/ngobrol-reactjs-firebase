import React, { Component } from 'react';
import { Segment, Header, Icon, Input } from 'semantic-ui-react';

class MessagesHeader extends Component {
    render() {
        const {
            channelName,
            numUniqueUsers,
            handleSearchChange,
            searchLoading,
            isPrivateChannel,
            handleStar,
            isChannelStarred,
        } = this.props;

        return (
            <Segment clearing>
                {/* Channel Title */}
                <Header
                    fluid="true"
                    as="h2"
                    floated="left"
                    style={{ marginBottom: 0 }}
                >
                    <span>
                        {channelName}
                        {!isPrivateChannel && (
                            <Icon
                                name={
                                    isChannelStarred ? 'star' : 'star outline'
                                }
                                color={isChannelStarred ? 'yellow' : 'black'}
                                onClick={handleStar}
                            />
                        )}
                    </span>
                    <Header.Subheader>{numUniqueUsers}</Header.Subheader>
                </Header>

                {/* Channel search input */}
                <Header floated="right">
                    <Input
                        loading={searchLoading}
                        size="mini"
                        onChange={handleSearchChange}
                        icon="search"
                        name="searchTerm"
                        placeholder="Search Messages"
                    />
                </Header>
            </Segment>
        );
    }
}

export default MessagesHeader;
