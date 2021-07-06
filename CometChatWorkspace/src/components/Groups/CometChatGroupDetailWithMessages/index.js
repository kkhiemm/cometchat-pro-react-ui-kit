import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatGroupList } from "..";
import { CometChatMessages } from "../../Messages";
import { CometChatIncomingDirectCall } from "../../Calls";

import { CometChatContextProvider } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
  groupScreenStyle,
  groupScreenSidebarStyle,
  groupScreenMainStyle,
} from "./style"

// custom form CometChatGroupListMessaages
class CometChatGroupDetailWithMessages extends React.Component {

  loggedInUser = null;

  constructor(props) {

    super(props);

    this.state = {
      tab: "groups",
      sidebarview: false,
      lang: props.lang,
    }

    this.groupListRef = React.createRef();

    CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
      console.error(error);
    });
  }

  componentDidMount() {

    if (this.props.chatWithGroup.length === 0) {
      this.toggleSideBar();
    }

    CometChat.getGroup(this.props.guid).then(
      group => {
        console.log("Group details fetched successfully:", group);
        this.contextProviderRef.setTypeAndItem(CometChat.ACTION_TYPE.TYPE_GROUP, group);
        this.toggleSideBar()
      },
      error => {
        console.log("Group details fetching failed with exception:", error);
      }
    );
  }

  componentDidUpdate(prevProps) {

    if (prevProps.lang !== this.props.lang) {
      this.setState({ lang: this.props.lang });
    }
  }

  actionHandler = (action, item, count, ...otherProps) => {

    switch (action) {
      case enums.ACTIONS["TOGGLE_SIDEBAR"]:
        this.toggleSideBar();
        break;
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
        this.groupUpdated(action, item, count, ...otherProps);
        break;
      default:
        break;
    }
  }

  toggleSideBar = () => {

    const sidebarview = this.state.sidebarview;
    this.setState({ sidebarview: !sidebarview });
  }

  /**
   If the logged in user is banned, kicked or scope changed, update the chat window accordingly
   */
  groupUpdated = (key, message, group, options) => {

    switch (key) {
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_KICKED: {

        if (this.contextProviderRef.type === CometChat.ACTION_TYPE.TYPE_GROUP
          && this.contextProviderRef.item.guid === group.guid
          && options.user.uid === this.loggedInUser.uid) {

          this.contextProviderRef.setItem({});
          this.contextProviderRef.setType("");
        }
        break;
      }
      case enums.GROUP_MEMBER_SCOPE_CHANGED: {

        if (this.contextProviderRef.type === CometChat.ACTION_TYPE.TYPE_GROUP
          && this.contextProviderRef.item.guid === group.guid
          && options.user.uid === this.loggedInUser.uid) {

          const newObject = Object.assign({}, this.contextProviderRef.item, { "scope": options["scope"] })
          this.contextProviderRef.setItem(newObject);
          this.contextProviderRef.setType(CometChat.ACTION_TYPE.TYPE_GROUP);

        }
        break;
      }
      default:
        break;
    }
  }

  render() {

    let messageScreen = (
      <CometChatMessages
        theme={this.props.theme}
        tab={this.state.tab}
        lang={this.state.lang}
        _parent="groups"
        actionGenerated={this.actionHandler} />
    );

    return (
      <CometChatContextProvider ref={el => this.contextProviderRef = el} group={this.props.chatWithGroup}>
        <div css={groupScreenStyle(this.props)} className="cometchat cometchat--groups">
          <div css={groupScreenMainStyle(this.state, this.props)} className="groups__main" style={{ width: "100%" }}>{messageScreen}</div>
        </div>
      </CometChatContextProvider>
    );
  }
}

// Specifies the default values for props:
CometChatGroupDetailWithMessages.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  chatWithGroup: "",
  _parent: ""
};

CometChatGroupDetailWithMessages.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  chatWithGroup: PropTypes.string,
}

export default CometChatGroupDetailWithMessages;