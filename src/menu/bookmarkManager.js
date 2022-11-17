/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */
/*jslint nomen: true */
/*global $,cwAPI */

(function(cwApi) {
  "use strict";
  cwApi.CwBookmarkManager = (function() {
    var cwUserFavourites = {},
      commentData = {},
      getTotalComment,
      cleanVariables,
      getViewedComment,
      setComment,
      loadFavourites,
      getCurrentUserFavorites,
      getFavouriteList,
      outputFavourites,
      saveUserFavorites,
      manageFavImage,
      outputFavoritesDom,
      getUnreadComment,
      markAsReadClick,
      updateUnreadCommentFromVariable,
      getCurrentItemInVariable,
      updateViewedComment;

    loadFavourites = function(callback) {
      if ((!cwApi.isLive() || !cwApi.cwConfigs.SocialSiteDefinition.FavouritesEnabled) && cwApi.isFunction(callback)) {
        return callback(null);
      }

      getCurrentUserFavorites(function(favorites) {
        if (cwApi.statusIsKo(favorites)) {
          return callback(favorites);
        }
        var favouriteObject, objectTypeScripeNameList, anyObjectAssociations, i;
        favouriteObject = {};
        anyObjectAssociations = favorites.associations.anyobject;
        objectTypeScripeNameList = [];
        for (i = 0; i < anyObjectAssociations.length; i += 1) {
          if (objectTypeScripeNameList.indexOf(anyObjectAssociations[i].objectTypeScriptName) === -1) {
            objectTypeScripeNameList.push(anyObjectAssociations[i].objectTypeScriptName);
            favouriteObject[anyObjectAssociations[i].objectTypeScriptName] = [];
          }
          favouriteObject[anyObjectAssociations[i].objectTypeScriptName].push(anyObjectAssociations[i]);
        }
        cwUserFavourites = favouriteObject;
        if (cwApi.isFunction(callback)) {
          return callback(favorites);
        }
      });
    };

    getCurrentUserFavorites = function(callback) {
      var error, path;
      const random = cwApi.getRandomNumber();
      error = {
        status: "Ok",
        message: "Favorite page not found",
      };
      if (cwApi.isLive()) {
        path = cwApi.getLiveServerURL() + "CwUserBookmarks/" + cwApi.currentUser.ID + "?" + random;
        cwApi.cwDoGETQuery(error, path, function(o) {
          return callback(o);
        });
      } else {
        return callback(error);
      }
    };

    //Save all favourites into a list to create submenu items
    getFavouriteList = function() {
      return cwUserFavourites;
    };

    outputFavourites = function(callback) {
      var favouriteObjects;
      favouriteObjects = cwUserFavourites;

      saveUserFavorites();

      outputFavoritesDom(favouriteObjects);

      $("#cw-home-navigation li.level0").each(function() {
        if ($(this).find("li.level1").length === 0) {
          $(this).remove();
        }
      });

      if (!cwApi.isUndefined(callback)) {
        callback();
      }
    };

    saveUserFavorites = function() {
      var key, items, i, unreadComment, totalUnreadComment;
      totalUnreadComment = 0;

      for (key in cwUserFavourites) {
        if (cwUserFavourites.hasOwnProperty(key)) {
          items = cwUserFavourites[key];
          for (i = 0; i < items.length; i += 1) {
            unreadComment = items[i].properties.cwtotalcomment - items[i].iProperties.cwviewedcomments;
            totalUnreadComment = totalUnreadComment + unreadComment;

            //key = objectTypeScriptName|objectid, value = totalcomment|viewedComment
            commentData[items[i].objectTypeScriptName + "|" + items[i].object_id] = items[i].properties.cwtotalcomment + "|" + items[i].iProperties.cwviewedcomments;
          }
        }
      }
    };

    manageFavImage = function(l, output) {
      let config;
      if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
        config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("homePage");
      } else return;

      if (config && config.lastModifiedObjectFav) {
        output.push('<img class="homePageFav_newImage" id="homePageFav_' + l.objectTypeScriptName + "_" + l.object_id + '" src="' + config.lastModifiedObjectFavLink + '">');
      }
    };

    outputFavoritesDom = function(favorites) {
      var number, key, list, o, ot, l, link, $li, i, unreadCommentCount;
      number = 0;

      for (key in favorites) {
        if (favorites.hasOwnProperty(key)) {
          list = favorites[key];
          o = [];
          o.push('<li class="level0">');
          ot = cwApi.mm.getObjectType(key);
          o.push('<h1 class="cw-home-title">', ot.pluralName.toLowerCase(), "</h1>");

          if (list.length > 0) {
            o.push('<ul class="cwHomeFavorite level1 ">');

            for (i = 0; i < list.length; i += 1) {
              l = list[i];
              link = cwApi.getSingleViewHash(l.objectTypeScriptName, l.object_id);
              unreadCommentCount = getUnreadComment(l.objectTypeScriptName, l.object_id);
              o.push('<li class="level1 cwHomeFavorite color', number, '">');

              if (unreadCommentCount > 0) {
                o.push('<div class="badge-holder">');
                o.push('<span id="cw_' + l.objectTypeScriptName + "_" + l.object_id + '" class="badge numericFont right">', unreadCommentCount, "</span>");
                o.push("</div>");
              }

              o.push('<a href="', link, '" class="click-zone color', number, '">');
              o.push('<div class="text color', number, '">', l.name, "</div>");
              o.push("</a>");

              if (cwApi.isWorkflowEnabled()) {
                cwApi.CwFollowWorkflowActivity.outputButton(o, l);
              }
              manageFavImage(l, o);
              o.push("</li>");
            }
            o.push("</ul>");
          }
          o.push("</li>");
          number += 1;

          $li = $(o.join(""));
          $("#cw-home-navigation ul.level0").append($li);
        }
      }
    };

    markAsReadClick = function(totalComment, mainObject, discussionObject) {
      var objectTypeScriptName,
        objectId,
        queryString = cwApi.getQueryStringObject();

      objectTypeScriptName = mainObject.objectTypeScriptName;
      objectId = queryString.cwid;

      updateViewedComment(totalComment, function(o) {
        if (o.status === "Ok") {
          updateUnreadCommentFromVariable(objectTypeScriptName, objectId, totalComment, totalComment);
          discussionObject.updateFavouriteMenu(totalComment, mainObject.name);

          //update commentDataDictionary
          cwApi.CwBookmarkManager.setComment(objectTypeScriptName, objectId, totalComment, totalComment);

          //update unreadcomment to remove new tag
          discussionObject.removeNewTags();
          discussionObject.unRegisterEvents();
          discussionObject.registerEvents();
        }
      });
    };

    updateViewedComment = function(totalcomment, callback) {
      var objectData, intersectionId;
      objectData = {};
      objectData.itemProperties = {};
      objectData.changedAssociations = [];

      cwApi.cwFavourite.cwFavourite.getFavouriteIntersectionId(cwApi.mmDefinition.PROPERTYTYPE_SCRIPTNAME_VIEWEDCOMMENTCOUNT, function(o) {
        if (cwApi.statusIsKo(o)) {
          return callback(o);
        }
        objectData.itemProperties[cwApi.mmDefinition.PROPERTYTYPE_SCRIPTNAME_VIEWEDCOMMENTCOUNT] = totalcomment;
        intersectionId = o.intersectionObjectProperties.ID.Value;
        cwApi.cwEditProperties.doAJAXQueryForUpdateALL(objectData, intersectionId, cwApi.mmDefinition.INTERSECTION_OBJECT_SCRIPTNAME_USERTOANYOBJECT, function() {
          return callback(o);
        });
      });
    };

    updateUnreadCommentFromVariable = function(objectTypeScriptName, objectId, viewedComment, totalcomment) {
      var item = getCurrentItemInVariable(objectTypeScriptName.toLowerCase(), objectId);
      item.iProperties.cwviewedcomments = viewedComment;
      item.properties.cwtotalcomment = totalcomment;
    };

    getCurrentItemInVariable = function(scriptName, id) {
      var items, i;
      items = cwUserFavourites[scriptName];
      if (!cwApi.isUndefined(items)) {
        for (i = 0; i < items.length; i += 1) {
          if (items[i].object_id === parseInt(id, 10)) {
            return items[i];
          }
        }
      }
    };

    getTotalComment = function(scriptName, id) {
      if (!cwApi.isUndefined(commentData[scriptName + "|" + id])) {
        return commentData[scriptName + "|" + id].split("|")[0];
      }
      return "0";
    };

    getViewedComment = function(scriptName, id) {
      if (!cwApi.isUndefined(commentData[scriptName + "|" + id])) {
        return commentData[scriptName + "|" + id].split("|")[1];
      }
      return "0";
    };

    getUnreadComment = function(scriptName, id) {
      if (!cwApi.isUndefined(commentData[scriptName + "|" + id])) {
        return parseInt(commentData[scriptName + "|" + id].split("|")[0] - commentData[scriptName + "|" + id].split("|")[1], 10);
      }
      return 0;
    };

    setComment = function(scriptName, id, totalComment, viewedComment) {
      commentData[scriptName + "|" + id] = totalComment + "|" + viewedComment;
    };

    cleanVariables = function() {
      cwUserFavourites = {};
      commentData = {};
    };

    return {
      loadFavourites: loadFavourites,
      getFavouriteList: getFavouriteList,
      outputFavourites: outputFavourites,
      markAsReadClick: markAsReadClick,
      getCurrentItemInVariable: getCurrentItemInVariable,
      updateViewedComment: updateViewedComment,
      getTotalComment: getTotalComment,
      getViewedComment: getViewedComment,
      setComment: setComment,
      saveUserFavorites: saveUserFavorites,
      updateUnreadCommentFromVariable: updateUnreadCommentFromVariable,
      cleanVariables: cleanVariables,
    };
  })();
})(cwAPI);
