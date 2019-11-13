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
      sessionStorage.removeItem("lastItem");
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

  function getPageNavigationForSinglePage(item, objectTypeScriptName) {
    var views, o, i, v, tabCount, viewsLoaded, currentViewName, navView, viewSchema, j, tab, navTab, questionnaireQueTab, questionnaireResultTab;
    if (cwApi.cwConfigs.SingleViewsByObjecttype === null) {
      return [];
    }

    views = cwApi.cwConfigs.SingleViewsByObjecttype[objectTypeScriptName.toLowerCase()];

    viewsLoaded = views.map(function(v) {
      return cwApi.getView(v);
    });
    viewsLoaded = cwApi.sortBy(viewsLoaded, function(v) {
      if (cwApi.isUndefined(v)) {
        cwApi.Log.Error("One or several views are not correct part of your views, please check case of the views to don't have duplicates, Please check part of these views : " + views.join(","));
        return 0;
      }
      return v.Order;
    });
    currentViewName = cwApi.getQueryStringObject().cwview;
    o = [];
    for (i = 0; i < viewsLoaded.length; i += 1) {
      tabCount = 0;
      v = viewsLoaded[i];
      if (!cwApi.isUndefined(v) && cwApi.cwUser.canAccessView(cwApi.currentUser, v) === true) {
        navView = {};
        navView.viewName = v.cwView;
        navView.selected = v.cwView === currentViewName;
        navView.tabs = [];
        var displayPropertyObject = new cwAPI.CwDisplayProperties(v.name, false);
        if (displayPropertyObject.formattedFieldValue.indexOf("|>BuiltInSite") === 0) {
          navView.label = cwApi.mapToTranslation(v.name);
        } else {
          navView.label = displayPropertyObject.getDisplayString(item);
        }
        viewSchema = cwApi.ViewSchemaManager.getPageSchema(v.cwView);
        if (viewSchema.Tab !== null) {
          for (j = 0; j < viewSchema.Tab.Tabs.length; j += 1) {
            tabCount += 1;
            tab = viewSchema.Tab.Tabs[j];
            navTab = {
              // tab: tab,
              id: tab.Id,
              label: cwApi.mapToTranslation(tab.Name),
            };
            navView.tabs.push(navTab);
          }
        }
        // Add object questionnaire tabs
        if (cwApi.isQuestionnaireBehaviuor(viewSchema.Behaviours) && objectTypeScriptName.toLowerCase() !== cwApi.mmDefinition.OBJECTTYPE_SCRIPTNAME_QUESTIONNAIRE) {
          questionnaireQueTab = {
            id: "tab" + tabCount,
            label: cwApi.mapToTranslation("Questionnaire"),
          };
          questionnaireResultTab = {
            id: "tab" + (tabCount + 1),
            label: cwApi.mapToTranslation("Result"),
          };
          navView.tabs.push(questionnaireQueTab);
          navView.tabs.push(questionnaireResultTab);
        }

        o.push(navView);
      }
    }
    return o;
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
            sessionStorage.setItem("lastItem", JSON.stringify(that.editPropertyManager.item));
            cwApi.updateURLHash(url);

            var $ulView = $('<ul class="navViews"></ul>');
            var pageNavigation = getPageNavigationForSinglePage(that.editPropertyManager.item, that.editPropertyManager.item.objectTypeScriptName);
            $("#page-options").html($ulView);
            for (i = 0; i < pageNavigation.length; i += 1) {
              if (pageNavigation[i].viewName === targetRedirection.view) {
                outputPageNavigation(pageNavigation[i], $ulView, that.editPropertyManager.item);
              }
            }
          }
        }

        cwApi.CwPendingEventsManager.deleteEvent("SetEditMode");
      });
    }
  };

  function outputPageNavigation(navView, $ulViewLocal, item) {
    var $li = cwApi.cwDisplayManager.getViewNav$(navView.viewName, navView.label, "#");
    cwApi.createMainAndSubNavMenus($li, $ulViewLocal, navView, item);

    if (!$li.children("a").hasClass("hassub")) {
      $li.children("a").on("click", function() {
        cwApi.cwDisplayManager.setContentPage();
      });
      cwApi.cwDisplayManager.setContentPage();
    }
    if (navView.selected) {
      selectNavView($li);
    }
  }

  function outputPageNavigationForObjectPage(item, objectTypeScriptName, restrictToCurrentView) {
    var pageNavigation, $ulView, i, $li;
    cwApi.CwPendingEventsManager.setEvent("OutputPageNavigationForObjectPage");

    cwApi.applyPageMenuJavascript();
    cwApi.CwPendingEventsManager.deleteEvent("OutputPageNavigationForObjectPage");
  }

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
    var regex, hash, item;
    if (cwApi.queryObject.isEditMode() && sessionStorage.hasOwnProperty("lastUrl")) {
      hash = sessionStorage.getItem("lastUrl");
      item = JSON.parse(sessionStorage.getItem("lastItem"));
      sessionStorage.removeItem("lastUrl");
      sessionStorage.removeItem("lastItem");
      var $ulView = $('<ul class="navViews"></ul>');
      var pageNavigation = getPageNavigationForSinglePage(item, item.objectTypeScriptName);
      $("#page-options").html($ulView);
      for (i = 0; i < pageNavigation.length; i += 1) {
        outputPageNavigation(pageNavigation[i], $ulView, item);
      }
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
