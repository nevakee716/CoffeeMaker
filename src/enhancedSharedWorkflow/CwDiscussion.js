/* Copyright � 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI,$,document, moment */

(function (cwApi, moment) {
  "use strict";

  var cwDiscussion = cwApi.CwDiscussions.CwDiscussion;

  cwDiscussion.prototype.loadCommentObjects = function ($anchor, data, objectTypeScriptName, id) {
    var i,
      commentObject,
      date,
      subCommentObject,
      subDate,
      a,
      subComments,
      subCommentObjectList,
      that,
      viewedcomment,
      b,
      unreadComment,
      sortedDate,
      $discussionButton,
      otScriptname;
    that = this;

    that.outputDiscussionButton($anchor);
    viewedcomment = parseInt(cwApi.CwBookmarkManager.getViewedComment(objectTypeScriptName, id), 10);

    otScriptname = this.item.objectTypeScriptName.toUpperCase();
    if (otScriptname === "USER") {
      if (cwApi.isModelSelectionPage() === true) {
        // remove the button if it's user profile on the model selection page
        return $(".btn-discuss").remove();
      }
      // otherwise use the cw_user as input for comments
      that.mainComments = data.cw_user;
    } else {
      that.mainComments = data[that.objectTypeScriptName];
    }

    if (cwApi.isUndefined(that.mainComments)) {
      return;
    }

    for (i = 0; i < that.mainComments.length; i += 1) {
      date = new Date(cwApi.cwPropertiesGroups.types.dateStringToDate(that.mainComments[i].properties.whencreated));
      let validated =
        this.item &&
        this.item.associations["cw_comment"] &&
        this.item.associations["cw_comment"].length > 0 &&
        this.item.associations["cw_comment"].some(function (c) {
          if (c.object_id === that.mainComments[i].object_id && c.properties.validated === true) return true;
        });

      commentObject = new cwApi.CwDiscussions.CwCommentObject(
        that.mainComments[i].object_id,
        that.mainComments[i].properties.description,
        that.mainComments[i].associations.cw_user[0],
        date,
        that.mainComments[i].properties.title,
        null,
        null,
        validated
      );

      subComments = that.mainComments[i].associations.cw_comment;
      subCommentObjectList = [];
      for (a = 0; a < subComments.length; a += 1) {
        subDate = new Date(cwApi.cwPropertiesGroups.types.dateStringToDate(subComments[a].properties.whencreated));
        subCommentObject = new cwApi.CwDiscussions.CwCommentObject(
          subComments[a].object_id,
          subComments[a].properties.description,
          subComments[a].associations.cw_user[0],
          subDate,
          subComments[a].properties.title,
          commentObject,
          subComments[a].associations.cw_comment
        );
        subCommentObjectList.push(subCommentObject);
        that.commentObjectByCreationDate[subDate] = subCommentObject;
      }

      commentObject.associations = subCommentObjectList;
      that.commentObjects[that.mainComments[i].object_id] = commentObject;
      that.commentObjectByCreationDate[date] = commentObject;
    }

    function assignUnreadDiscussions(comment) {
      comment.isNew = true;
      comment.unreadComment = comment.unreadComment + 1;
    }

    sortedDate = Object.keys(that.commentObjectByCreationDate)
      .sort(function (a, b) {
        var dateA = new Date(a),
          dateB = new Date(b);
        return dateA - dateB;
      })
      .reverse();

    //Check and assign new discussions
    if (that.totalcomment !== viewedcomment && cwApi.cwFavourite.cwFavourite.isObjectFavourite === true) {
      unreadComment = that.totalcomment - viewedcomment;
      that.unreadComment = unreadComment;
      for (b = 0; b < unreadComment; b += 1) {
        if (!cwApi.isUndefined(that.commentObjectByCreationDate[sortedDate[b]])) {
          if (that.commentObjectByCreationDate[sortedDate[b]].parentDiscussion === null) {
            assignUnreadDiscussions(that.commentObjectByCreationDate[sortedDate[b]]);
          } else {
            assignUnreadDiscussions(that.commentObjectByCreationDate[sortedDate[b]].parentDiscussion);
          }
        }
      }
    }

    //Fix - latest discussion on top including comment
    that.sortDiscussionAndComments(sortedDate);

    if (!cwApi.queryObject.isEditMode()) {
      //register events
      that.unRegisterEvents();
      that.registerEvents();
      $discussionButton = $(".btn-discuss");
      $discussionButton.removeClass("btn-discuss-disable");
      if (that.unreadComment > 0) {
        $discussionButton.append('<div class="badge">' + that.unreadComment + "</div>");
        $discussionButton.addClass("has-badge");
      }
    }
  };

  cwApi.CwDiscussions.CwDiscussion = cwDiscussion;
})(cwAPI, moment);
