/* Copyright � 2012-2017 erwin, Inc. - All rights reserved */
/*jslint nomen: true */
/*global cwAPI,$,_,moment*/

(function (cwApi, moment) {
  "use strict";

  var cwCommentObject = function (id, description, user, createdDate, title, parentDiscussion, associations, validated) {
    this.id = id;
    this.description = description;
    this.user = user;
    this.createdDate = createdDate;
    this.associations = associations;
    this.title = title;
    this.isNew = false;
    this.parentDiscussion = parentDiscussion;
    this.unreadComment = 0;
    this.validated = validated;
  };

  cwCommentObject.prototype.drawComment = function (output) {
    output.push('<li cw-data-objectid = "' + this.id + '">');
    if (this.isNew) {
      output.push('<div class="badge">' + this.unreadComment + "</div>");
    }
    output.push('<h4 class="discuss-title"><a href="#">', this.title, "</a></h4>");
    output.push('<div class="discuss-item">');
    output.push('<div class="avatar small"><img src="', cwApi.cwUser.getUserPicturePathByUserName(this.user.properties.name), '"></div>');
    output.push('<p class="discuss-comment">', this.description, "</p>");
    output.push(
      '<p class="meta">',
      cwApi.cwUser.getFullName(this.user),
      ", ",
      this.createdDate.getDate(),
      " ",
      moment.months(this.createdDate.getMonth()),
      ", ",
      this.getTime(this.createdDate),
      "</p>"
    );
    output.push("</div>");
    if (this.validated) output.push('<i style="color:green" class="validated_discussion fa fa-check"/>');
    output.push("</li>");
  };

  cwCommentObject.prototype.getTime = function (date) {
    return moment(date).format("h:mm a");
  };

  cwApi.CwDiscussions.CwCommentObject = cwCommentObject;
})(cwAPI, moment);
