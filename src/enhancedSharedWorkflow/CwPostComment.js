/* Copyright � 2012-2017 erwin, Inc. - All rights reserved */
/*jslint nomen: true */
/*global cwAPI,$,_*/

(function (cwApi) {
  "use strict";

  var cwPostComment = cwApi.CwDiscussions.CwPostComment;

  cwPostComment.setupPostCommentZone = function (mainContainer, appendIn, discussionObject, commentObject) {
    if (cwApi.isUndefined(mainContainer)) {
      mainContainer = ".popout";
    }

    var $validateButton = $(mainContainer).find(".btn-comment-submit-validate");
    if (!commentObject || commentObject.user.object_id != cwApi.currentUser.ID) $validateButton.hide();
    $validateButton.off("click.setComment");

    var $button = $(mainContainer).find(".btn-comment-submit");
    if (
      discussionObject &&
      commentObject &&
      discussionObject.item &&
      discussionObject.item.associations["cw_comment"] &&
      discussionObject.item.associations["cw_comment"].length > 0 &&
      discussionObject.item.associations["cw_comment"].some(function (c) {
        if (c.object_id === commentObject.id && c.properties.validated === true) return true;
      })
    ) {
      $(".discuss-form").hide();
      $validateButton.hide();
      $button.hide();
    }

    // hide validation button if new comment
    if (!commentObject) $validateButton.hide();
    $button.off("click.setComment");

    $validateButton.on("click.setComment", function (e) {
      let nameComment = "";
      discussionObject.mainComments.some(function (c) {
        if (c.object_id == commentObject.id) {
          nameComment = c.name;
          return true;
        }
      });
      var textarea, text;

      textarea = $(this).closest("form").find('textarea[name="discuss-comment"]');
      text = textarea.val();
      cwApi.pendingChanges.clear();
      var old = {
        name: nameComment,
        objectTypeScriptName: "cw_comment",
        object_id: commentObject.id,
        associations: [],
        properties: { finalcomment: "", validated: false, name: nameComment },
      };
      let newObj = JSON.parse(JSON.stringify(old));
      newObj.properties.validated = true;
      newObj.properties.finalcomment = text;

      cwAPI.customLibs.utils.editObject(old, newObj, false, function () {
        cwApi.pendingChanges.clear();
        postComment(e, $(this), true);
      });
    });

    $button.on("click.setComment", function (e) {
      postComment(e, $(this));
    });

    var postComment = function (e, jqueryContext, reload) {
      cwApi.CwPendingEventsManager.setEvent("NewCommentSubmit");
      e.preventDefault();
      var textarea, text, currentObjectId, currentObjectTypeScriptName, totalcomment, sendData, assoUser, postId, assoApp, titleInput, title;

      textarea = jqueryContext.closest("form").find('textarea[name="discuss-comment"]');
      titleInput = jqueryContext.closest("form").find("input#discuss-comment-title");
      text = textarea.val();
      title = titleInput.val();

      totalcomment = discussionObject.totalcomment;

      if (text === "") {
        jqueryContext.prev().attr("placeholder", $.i18n.prop("comments_cantPostEmptyComment", cwApi.currentUser.FirstName));
        return false;
      }

      if (cwApi.cwEditProperties.cwEditPropertyMemo.isHTMLContent(text) || cwApi.cwEditProperties.cwEditPropertyMemo.isHTMLContent(title)) {
        return false;
      }

      currentObjectId = discussionObject.item.object_id;
      currentObjectTypeScriptName = discussionObject.item.objectTypeScriptName.toUpperCase();

      sendData = {};
      sendData.objecttypeScriptname = "cw_comment";
      sendData.propertiesToUpdate = {};
      sendData.propertiesToUpdate.description = text;
      sendData.propertiesToUpdate.title = title;
      sendData.propertiesToUpdate.version = discussionObject.item.properties.version;
      sendData.changedAssociations = [];

      assoUser = cwApi.createAssociationAdded("CW_COMMENTTOCW_USER_TO_CW_COMMENTTOCW_USER", cwApi.currentUser.ID);
      sendData.changedAssociations.push(assoUser);

      //root post
      if (mainContainer === ".popout") {
        assoApp = cwApi.createAssociationAdded("CW_COMMENTTOCW_COMMENT_TO_ANYOBJECTTOANYOBJECT", currentObjectId, currentObjectTypeScriptName);
      } else {
        // reply to post
        postId = $(mainContainer).find(".discuss-convo").find("h4").attr("cw-data-objectid");
        assoApp = cwApi.createAssociationAdded("CW_COMMENTTOCW_COMMENT_TO_CW_COMMENTREVERSETOCW_COMMENT", postId, "cw_comment");
      }
      sendData.changedAssociations.push(assoApp);

      cwApi.cwEditProperties.createAndUpdateNewObject(sendData, function (newComment) {
        if (newComment.status === "Ok") {
          var user;
          user = cwApi.cwUser.getCurrentUserItem();

          discussionObject.removeNewTags();

          //create new comment dom
          cwPostComment.createNewCommentDom(newComment, text, title, user, new Date(Date.now()), commentObject, discussionObject);

          //remove new tags from all comments
          $(".popout-content").find(".badge").remove();
          discussionObject.updateFavouriteMenu(totalcomment, discussionObject.item.name);

          //update viewedComment for the comment made by current user by checking the object is favourite
          if (cwApi.cwFavourite.cwFavourite.isObjectFavourite === true) {
            cwApi.CwBookmarkManager.updateViewedComment(totalcomment + 1, function () {
              cwApi.CwBookmarkManager.updateUnreadCommentFromVariable(
                currentObjectTypeScriptName,
                currentObjectId,
                totalcomment + 1,
                totalcomment + 1
              );
              //update commentDataDictionary
              cwApi.CwBookmarkManager.setComment(currentObjectTypeScriptName, currentObjectId, totalcomment + 1, totalcomment + 1);
              discussionObject.totalcomment = totalcomment + 1;
              // discussionObject.removeNewTags();
              discussionObject.unRegisterEvents();
              discussionObject.registerEvents();
            });
          } else {
            $("#cw-favourite-button").attr("cw_data_totalcomment", totalcomment + 1);
            discussionObject.totalcomment = totalcomment + 1;
            discussionObject.unRegisterEvents();
            discussionObject.registerEvents();
          }
          if (reload) window.location.hash = window.location.hash + "&reload=true";

          $("#discuss-comment").focus();
        } else {
          cwApi.notificationManager.addNotification(newComment.error, "error");
        }
      });
    };
    cwApi.CwPendingEventsManager.deleteEvent("NewCommentSubmit");
  };

  cwApi.CwDiscussions.CwPostComment = cwPostComment;
})(cwAPI);
