(function(cwApi, $) {
  "use strict";
  // config
  var removeDiagramPopOut = true,
    historyBrowser = true;

  /********************************************************************************
    Custom Action for Single and Index Page : See Impact here http://bit.ly/2qy5bvB
    *********************************************************************************/
  cwCustomerSiteActions.doActionsForSingle_Custom = function(rootNode) {
    var currentView, url, i, cwView;
    currentView = cwAPI.getCurrentView();

    if (currentView) cwView = currentView.cwView;
    for (i in cwAPI.customLibs.doActionForSingle) {
      if (cwAPI.customLibs.doActionForSingle.hasOwnProperty(i)) {
        if (typeof cwAPI.customLibs.doActionForSingle[i] === "function") {
          cwAPI.customLibs.doActionForSingle[i](rootNode, cwView);
        }
      }
    }
  };

  cwCustomerSiteActions.duplication = {};

  cwCustomerSiteActions.duplication.addButton = function(rootNode) {
    try {
      // check creation and contributor
      if (cwAPI.cwUser.isCurrentUserSocial() === true || cwAPI.mm.getLookupsOnAccessRights(rootNode.objectTypeScriptName, "CanCreate").length == 0) {
        return;
      }
    } catch (e) {
      console.log(e);
      return;
    }

    var config, configG;
    configG = cwAPI.customLibs.utils.getCustomLayoutConfiguration("duplicateButton");
    let cwViewName = cwApi.getCurrentView().cwView;
    if (configG && configG.pageWithDuplicateButton[cwViewName] && configG[cwViewName]) {
      config = configG[cwViewName];
    } else {
      return;
    }

    cwAPI.CwWorkflowRestApi.getApprovers(cwApi.getCurrentView().cwView, rootNode.object_id, function(response) {
      let canDupe = false;
      if (response.approvers.length === 0) canDupe = true;
      response.approvers.forEach(function(approuver) {
        if (approuver.Id === cwAPI.currentUser.ID) {
          canDupe = true;
        }
      });
      if (canDupe) {
        var duplicationButton = document.createElement("div");
        duplicationButton.innerHTML = '<a class="cw-edit-mode-button-edit cw-edit-mode-button page-action edit btn btn-edit no-text" title="Dupliquer"><span class="btn-text"></span><i class="fa fa-copy"></i></a>';

        var buttonContainer = document.querySelector(".cw-edit-buttons");
        buttonContainer.appendChild(duplicationButton);
        cwCustomerSiteActions.duplication.addEventToDuplicateButton(rootNode, duplicationButton, config);
      }
    });
  };

  cwCustomerSiteActions.duplication.addEventToDuplicateButton = function(rootNode, duplicationButton, config) {
    var newObj = $.extend(true, {}, rootNode);

    newObj.properties = {};
    newObj.displayNames = {};
    newObj.associations = {};

    for (let i in rootNode.properties) {
      if (rootNode.properties.hasOwnProperty(i) && config.propertyScriptNameToExclude.indexOf(i) === -1 && i !== "cwaveragerating" && i !== "cwtotalcomment" && i !== "exportflag") {
        let p = cwApi.mm.getProperty(rootNode.objectTypeScriptName, i);
        if (p) {
          switch (p.type) {
            case "Boolean":
              if (rootNode.properties[i] === false) newObj.properties[i] = "0";
              else newObj.properties[i] = "1";
              break;
            case "Lookup":
              newObj.properties[i] = rootNode.properties[i + "_id"];
              break;
            case "Date":
              newObj.properties[i] = moment(rootNode.properties[i]).format(cwAPI.cwPropertiesGroups.types.dateFormatForServer);
              break;
            case "URL":
            default:
              newObj.properties[i] = rootNode.properties[i];
          }
          newObj.displayNames[i] = p.name;
        }
      }
    }

    newObj.properties.name = rootNode.properties.name + "_" + Math.floor(Math.random() * 100);

    var newNewObj = $.extend(true, {}, newObj);

    var viewSchema = cwApi.ViewSchemaManager.getCurrentViewSchema();

    duplicationButton.addEventListener("click", function(event) {
      if (cwApi.isWebSocketConnected === false) {
        cwApi.notificationManager.addError("The websocket connection is not available, either wait or reload the page.");
        return false;
      }

      cwAPI.CwEditSave.setPopoutContentForGrid(cwApi.CwPendingChangeset.ActionType.Create, null, newObj, 0, newObj.objectTypeScriptName, function(elem) {
        if (elem && elem.status == "Ok") {
          var associationsCalls = [];
          var existing_association = {};
          newObj.object_id = elem.id;
          for (let assNode in rootNode.associations) {
            if (
              rootNode.associations.hasOwnProperty(assNode) &&
              config.associationScriptNameToExclude.indexOf(viewSchema.NodesByID[assNode].AssociationTypeScriptName.toLowerCase()) === -1 &&
              (config.associationToTheMainObject == undefined || config.associationToTheMainObject.associationTypeScriptName === undefined || (config.associationToTheMainObject && viewSchema.NodesByID[assNode].AssociationTypeScriptName !== config.associationToTheMainObject.associationTypeScriptName.toLowerCase()))
            ) {
              let associationTypeScriptName = viewSchema.NodesByID[assNode].AssociationTypeScriptName.toLowerCase();
              rootNode.associations[assNode].forEach(function(o) {
                let dataServiceFunction = function(callback) {
                  if (existing_association[[associationTypeScriptName.toUpperCase(), newObj.object_id, o.object_id].join("_")] !== undefined) {
                    cwApi.CwDataServicesApi.send("updateObject", o.iObjectTypeScriptName, existing_association[[associationTypeScriptName.toUpperCase(), newObj.object_id, o.object_id].join("_")], o.iProperties, function(err) {
                      callback(null, err);
                    });
                  } else {
                    cwApi.CwDataServicesApi.send("associateObjects", associationTypeScriptName.toUpperCase(), newObj.objectTypeScriptName.toUpperCase(), newObj.object_id, o.objectTypeScriptName.toUpperCase(), o.object_id, function(err, associationId, intersectionObject) {
                      if (err !== null) {
                        console.log(err);
                        callback(null, err);
                      }
                      existing_association[[associationTypeScriptName.toUpperCase(), newObj.object_id, o.object_id].join("_")] = intersectionObject.iProperties.uniqueidentifier;
                      cwApi.CwDataServicesApi.send("updateObject", o.iObjectTypeScriptName, intersectionObject.iProperties.uniqueidentifier, o.iProperties, function(err) {
                        callback(null, err);
                      });
                    });
                  }
                };
                associationsCalls.push(dataServiceFunction);
              });
            }
          }

          cwAPI.siteLoadingPageStart();
          cwAPI.notificationManager.addNotification($.i18n.prop("duplicate_button_creating_association"));
          // Association to original Object
          if (config.associationToTheMainObject && config.associationToTheMainObject.associationTypeScriptName) {
            let dataServiceFunction = function(callback) {
              cwApi.CwDataServicesApi.send("associateObjects", config.associationToTheMainObject.associationTypeScriptName.toUpperCase(), newObj.objectTypeScriptName.toUpperCase(), newObj.object_id, rootNode.objectTypeScriptName.toUpperCase(), rootNode.object_id, function(err, associationId, intersectionObject) {
                callback(null, "ok");
              });
            };
            associationsCalls.push(dataServiceFunction);
          }
          async.series(associationsCalls, function(err, results) {
            cwAPI.siteLoadingPageFinish();
            window.location.hash = cwApi.getSingleViewHash(newObj.objectTypeScriptName, newObj.object_id);
          });
        }
      });
    });
  };

  cwCustomerSiteActions.duplication.duplicationPopout = function(duplicateObject, object) {
    var output = document.createElement("div");
    output.className = "duplicatePopOut";

    var navigateTo = document.createElement("a");
    navigateTo.href = cwApi.getSingleViewHash(duplicateObject.objectTypeScriptName, duplicateObject.object_id);
    navigateTo.innerText = "Naviguer vers l'objet dupliqué";
    navigateTo.className = "duplicateNavigateButton";

    var navigateToNewWindows = document.createElement("a");
    navigateToNewWindows.href = cwApi.getSingleViewHash(duplicateObject.objectTypeScriptName, duplicateObject.object_id);
    navigateToNewWindows.target = "_blank";
    navigateToNewWindows.innerText = "Naviguer vers l'objet dupliqué dans un nouvel onglet";
    navigateToNewWindows.className = "duplicateNavigateButton";
    output.appendChild(navigateTo);
    output.appendChild(navigateToNewWindows);

    return output;
  };
  /********************************************************************************
    Configs : add trigger for single page
    *********************************************************************************/
  if (cwAPI.customLibs === undefined) {
    cwAPI.customLibs = {};
  }
  if (cwAPI.customLibs.doActionForSingle === undefined) {
    cwAPI.customLibs.doActionForSingle = {};
  }

  cwAPI.customLibs.doActionForSingle.duplication = cwCustomerSiteActions.duplication.addButton;
})(cwAPI, jQuery);
