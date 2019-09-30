/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI, jQuery*/
(function(cwApi, $) {
  "use strict";

  function isUserAssociated(associationsList) {
    for (var i = 0; i < associationsList.length; i++) {
      if (associationsList[i].object_id === cwApi.currentUser.ID) return true;
    }
    return false;
  }

  function getViewNameForEdit(view, item) {
    var currentUser = cwApi.currentUser,
      r,
      targetView = "",
      targetRedirection = {},
      associations;
    var editPageByPageAndRoles = cwAPI.customLibs.utils.getCustomLayoutConfiguration("redirectEdit");

    if (!cwApi.isUndefined(editPageByPageAndRoles) && editPageByPageAndRoles !== null) {
      // redirection due to association with the object
      if (editPageByPageAndRoles.hasOwnProperty(view)) {
        if (editPageByPageAndRoles[view].association) {
          // association
          associations = editPageByPageAndRoles[view].association;
          for (let nodeID in associations) {
            if (item && associations.hasOwnProperty(nodeID) && item.associations.hasOwnProperty(nodeID) && isUserAssociated(item.associations[nodeID])) {
              return associations[nodeID];
            }
          }

          // redirection due to role
        } else if (currentUser.RolesId.length === 1 && editPageByPageAndRoles[view].hasOwnProperty(currentUser.RolesId[0])) {
          targetRedirection.view = editPageByPageAndRoles[view][currentUser.RolesId[0]];
          return targetRedirection;
        } else if (currentUser.RolesId.length > 1) {
          for (r in editPageByPageAndRoles[view]) {
            // get first target in list
            if (editPageByPageAndRoles[view].hasOwnProperty(r)) {
              targetRedirection.view = editPageByPageAndRoles[view][r];
              return targetRedirection;
            }
          }
        }
        //default redirection
        if (editPageByPageAndRoles[view].hasOwnProperty("default")) {
          targetRedirection.view = editPageByPageAndRoles[view].default;
          return targetRedirection;
        }
      }
    } else {
      sessionStorage.removeItem("lastUrl");
    }
    targetRedirection.view = view;
    return targetRedirection;
  }

  function checkAccess(config, item) {
    if (!cwApi.cwUser.canAccessView(cwApi.currentUser, cwApi.getView(config.view))) {
      return $.i18n.prop("error_NotHaveTheRightsToSeeThisPage");
    }
    if (config.denyPropertyFilter && config.denyPropertyFilter.property && item.properties[config.denyPropertyFilter.property.toLowerCase()] && cwAPI.customLibs.isActionToDo) {
      if (cwAPI.customLibs.isActionToDo(item, config.denyPropertyFilter)) {
        return config.message;
      }
    }
    return null;
  }

  cwApi.cwEditProperties.cwEditPropertyManagerDOM.prototype.setEditModeButtonsActions = function() {
    var that = this,
      showComments = false,
      paddingTop = $(".page-content").css("padding-top");

    cwApi.CwEditCancel.registerActions(this.editPropertyManager);
    cwApi.CwEditDelete.registerActions(this.editPropertyManager.item);
    cwApi.CwEditSave.registerActionsForSinglePage(this.editPropertyManager);
    if (cwApi.queryObject.isDiagramDraftView()) {
      if (cwApi.isDiagramEditorEnable()) {
        cwApi.CwEdit.registerEditButtonClick(this.draftEditAction, false);
      } else {
        $(".cw-edit-buttons").remove();
      }
    } else {
      cwApi.CwEdit.registerEditButtonClick(function() {
        var qs = cwApi.getQueryStringObject(),
          url,
          targetRedirection,
          currentView = cwApi.getCurrentView().cwView;

        targetRedirection = getViewNameForEdit(qs.cwview, that.editPropertyManager.item);

        if (targetRedirection.view === currentView) {
          //standard code
          var o = [];
          cwApi.disableLoadPage = true;
          cwApi.cwEditProperties.setEditMode();
          cwApi.cwPageManager.updateQueryString();
          if (cwApi.cwEditProperties.isTinymce(that.editPropertyManager) === true) {
            cwApi.cwTinymceManager.loadTinymce(function() {
              that.editPropertyManager.goToEditMode();
            });
          } else {
            that.editPropertyManager.goToEditMode();
          }
          that.outputSaveAndCancelButton(o);
          $("div.cw-edit-buttons").html(o.join(""));
          that.setEditModeButtonsActions();
        } else {
          var message = checkAccess(targetRedirection, that.editPropertyManager.item);
          if (message === null) {
            // if you can accesss
            cwApi.CwPendingEventsManager.setEvent("SetEditMode");
            url = "#/cwtype=" + qs.cwtype + "&cwview=" + targetRedirection.view + "&lang=" + qs.lang + "&cwid=" + qs.cwid + "&cwmode=" + cwApi.CwMode.Edit;
            var o = [];
            that.outputSaveAndCancelButton(o);
            $("div.cw-edit-buttons").html(o.join(""));
            that.setEditModeButtonsActions();
            sessionStorage.setItem("lastUrl", cwApi.getURLHash().replace("#", ""));
            cwApi.updateURLHash(url);
          } else {
            cwApi.cwNotificationManager.addError(message);
            $("#top-actions").removeClass("edit-mode");
          }
        }

        cwApi.CwPendingEventsManager.deleteEvent("SetEditMode");
      });
    }
  };

  function getRedirectPage(parentId, parentObjectTypeId) {
    if (!cwApi.isUndefined(parentId) && !cwApi.isUndefined(parentObjectTypeId)) {
      var parentObjectTypeScriptName = cwApi.mm.getObjectTypeById(parentObjectTypeId).scriptName.toLowerCase();
      if (cwApi.cwConfigs.SingleViewsByObjecttype.hasOwnProperty(parentObjectTypeScriptName)) {
        return cwApi.getSingleViewHash(parentObjectTypeScriptName, parentId);
      } else {
        return "#";
      }
    } else {
      return "#";
    }
  }

  cwApi.cwEditProperties.unsetEditMode = function() {
    cwApi.CwPendingEventsManager.setEvent("UnsetEditMode");
    var regex, hash;
    if (cwApi.queryObject.isEditMode() && sessionStorage.hasOwnProperty("lastUrl")) {
      hash = sessionStorage.getItem("lastUrl");
      sessionStorage.removeItem("lastUrl");
    } else {
      hash = cwApi.getURLHash();
    }
    regex = new RegExp("&cwmode=" + cwApi.CwMode.Edit, "g");
    hash = hash.replace(regex, "").replace("#", "");
    hash = hash.replace(/\&cwisnew=true/g, "").replace("#", "");

    cwApi.updateURLHash(hash);
    cwApi.CwPendingEventsManager.deleteEvent("UnsetEditMode");
  };

  // ajouter la redirection lorsqu'on submit les modifications
})(cwAPI, jQuery);
