/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery */
(function (cwApi, $) {
  "use strict";
  var userCST = "ADMIN";
  var passwordCST = "";
  if (cwApi && cwApi.cwLayouts && cwApi.cwLayouts.cwWorkflow) {
    var cwLayout = cwApi.cwLayouts.cwWorkflow;
  } else {
    // constructor
    var cwLayout = function (options, viewSchema) {
      cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema); // heritage
      cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations
      this.construct(options);
    };
  }

  cwLayout.prototype.sendRequest = function (request, parameters, callback) {
    var xmlhttp = new XMLHttpRequest();
    var self = this;
    //replace second argument with the path to your Secret Server webservices
    xmlhttp.open("POST", window.location.origin + "/evolve/CWFileHandling/CwFileHandling.asmx", true);

    //create the SOAP request
    //replace username, password (and org + domain, if necessary) with the appropriate info
    var strRequest =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
      "<soap12:Body>" +
      "<" +
      request +
      ' xmlns="http://HawkeyeQ.org/">';
    parameters.forEach(function (p) {
      var v = p.value;
      if (v && v.indexOf) {
        v = v.replaceAll(/&/, "&amp;");
        v = v.replaceAll(/</, "&lt;");
        v = v.replaceAll(/>/, "&gt;");
      }
      strRequest += "<" + p.key + ">" + v + "</" + p.key + ">";
    });

    strRequest += "</" + request + ">" + "</soap12:Body>" + "</soap12:Envelope>";

    //specify request headers
    xmlhttp.setRequestHeader("Content-Type", "application/soap+xml; charset=utf-8");

    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4) {
        cwAPI.siteLoadingPageFinish();
        callback(xmlhttp.responseText);
      }
    };

    cwAPI.siteLoadingPageStart();
    //clean the SOAP request

    //send the SOAP request
    xmlhttp.send(strRequest);
  };

  cwLayout.prototype.loadScopeRequestFunction = function ($scope) {
    var self = this;
    $scope.manageStepClick = function (step) {
      $scope.manageDocumentsBeforeSavingWI();
      $scope.ng.jsonObjects = {
        objectTypeScriptname: "cwworkflowitem",
        object_id: self.object.object_id,
        iProperties: {},
        properties: {
          step: step.stepName,
          changeset: angular.toJson($scope.ng.changeset),
          name: $scope.ng.changeset.properties.name,
          documents: angular.toJson($scope.ng.documents),
          scenario: self.scenario,
          objecttypescriptname: self.objectTypeScriptName,
        },
        associations: {},
      };

      //fullfill history
      $scope.ng.history[$scope.ng.currentStep.label] = {};
      $scope.ng.history[$scope.ng.currentStep.label].user = cwApi.currentUser.FullName;
      $scope.ng.history[$scope.ng.currentStep.label].userID = cwApi.currentUser.ID;
      $scope.ng.history[$scope.ng.currentStep.label].action = step.label;
      $scope.ng.jsonObjects.properties.history = JSON.stringify(JSON.parse(angular.toJson($scope.ng.history)), undefined, 4);

      // deduce association of user depending of the history
      $scope.ng.jsonObjects.associations.cwworkflowitemtoasso_cwworkflowitem_cw_usertocw_user = [];
      Object.keys($scope.ng.history).forEach(function (stepLabel) {
        if ($scope.ng.history[stepLabel] && $scope.ng.history[stepLabel].user) {
          $scope.ng.jsonObjects.associations.cwworkflowitemtoasso_cwworkflowitem_cw_usertocw_user.push({
            object_id: $scope.ng.history[stepLabel].userID,
            iProperties: {
              step: stepLabel,
            },
          });
        }
      });

      $scope.ng.currentStep.stepsSettings.forEach(function (stepSetting) {
        if (stepSetting.creator === true) {
          if (!$scope.ng.stepmapping.creator) {
            //adding a creator if there isn't already one
            $scope.ng.jsonObjects.associations.cwworkflowitemtoassocwworkflowitemtocwusercreatortocw_user = [
              { object_id: cwApi.currentUser.ID, iProperties: {} },
            ];
            $scope.ng.stepmapping.creator = cwApi.currentUser.ID;
          }
          $scope.ng.stepmapping[stepSetting.stepName] = $scope.ng.stepmapping.creator;
        }
        if (stepSetting.cwUser === true && stepSetting.cwUserObject) {
          $scope.ng.stepmapping[stepSetting.stepName] = stepSetting.cwUserObject.object_id;
          if (!$scope.ng.stepmapping.cwUserMapping) $scope.ng.stepmapping.cwUserMapping = {};
          $scope.ng.stepmapping.cwUserMapping[stepSetting.cwUserObject.object_id] = stepSetting.cwUserObject.name;
        }
      });

      $scope.ng.jsonObjects.properties.stepmapping = angular.toJson($scope.ng.stepmapping);

      // mapping the role to the wi
      $scope.ng.jsonObjects.associations.cwworkflowitemtoassocwworkflowitemtocwroletocw_role = [];
      Object.keys($scope.ng.stepmapping).forEach(function (k) {
        if (($scope.ng.stepmapping[k] ^ 0) !== $scope.ng.stepmapping[k] && k !== "cwUserMapping") {
          if (!$scope.ng.jsonObjects.associations.cwworkflowitemtoassocwworkflowitemtocwroletocw_role)
            $scope.ng.jsonObjects.associations.cwworkflowitemtoassocwworkflowitemtocwroletocw_role.push({
              object_id: $scope.ng.stepmapping[k],
              iProperties: {
                step: k,
              },
            });
        }
      });

      self.sendRequest(
        "CwCreateUpdateObjectWithDocs",
        [
          { key: "Connection", value: "" },
          { key: "Username", value: userCST },
          { key: "Password", value: passwordCST },
          { key: "ModelScriptName", value: cwApi.cwConfigs.ModelFilename },
          { key: "ObjectJsonStr", value: angular.toJson($scope.ng.jsonObjects) },
          { key: "SessionId", value: $scope.ng.sessionUuid },
          {
            key: "DocsToDeleteCommaSep",
            value: $scope.ng.deletedDocument
              .map(function (d) {
                return (d = '"' + d + '"');
              })
              .join(","),
          },
        ],
        function (response) {
          $scope.deleteRequest(function () {
            let id = $scope.parseObjectID(response);
            if (step.shareWorkflow) {
              let t = $scope.ng.currentStep.stepsSettings.some(function (stepSetting) {
                if (stepSetting.stepName === step.stepName) {
                  if (stepSetting.creator === true) {
                    $scope.associateUserToCwWorkflowRole($scope.ng.stepmapping.creator, function () {
                      $scope.triggerShareWorkflow(id, step, self.cwWorkFlowItemRoleID);
                    });
                    return true;
                  }
                  if (stepSetting.cwUser === true) {
                    $scope.associateUserToCwWorkflowRole($scope.ng.stepmapping[step.stepName], function () {
                      $scope.triggerShareWorkflow(id, step, self.cwWorkFlowItemRoleID);
                    });
                    return true;
                  }
                }
              });
              if (!t) $scope.triggerShareWorkflow(id, step);
            }

            if (step.createObject) {
              $scope.createFinalObject(step, id);
            }
          });
        }
      );
    };

    $scope.deleteRequest = function (callback) {
      if (self.task) {
        self.sendRequest(
          "CwDeleteObject",
          [
            { key: "Connection", value: "" },
            { key: "Username", value: userCST },
            { key: "Password", value: passwordCST },
            { key: "ModelScriptName", value: cwApi.cwConfigs.ModelFilename },
            { key: "ObjectTypeScriptName", value: "CW_TASK" },
            { key: "ObjectId", value: self.task.object_id },
          ],
          function (response) {
            callback();
          }
        );
      } else callback();
    };

    $scope.triggerShareWorkflow = function (id, step, cw_role) {
      cw_role = cw_role ? cw_role : $scope.ng.stepmapping[step.stepName];
      cwApi.customLibs.utils.shareWorkflow(
        $scope.ng.changeset.properties.name,
        id,
        "cwworkflowitem",
        step.notificationMessage,
        [cw_role],
        step.notificationLabel,
        window.location.origin + window.location.pathname + cwApi.getSingleViewHash("cwworkflowitem", id),
        function () {
          if (!cwApi.isDebugMode()) window.location = window.location.origin + window.location.pathname;
        }
      );
    };

    $scope.createFinalObject = function (step, id) {
      $scope.ng.changeset.associations.anyobjecttoassocwworkflowitemtocwworkflowitem = [{ object_id: id, iProperties: {} }];

      $scope.ng.changeset.properties[$scope.ng.configuration.docScriptname] = self.getDocumentPropertiesHTML();
      $scope.cleanDatePropInChangeSet();
      self.sendRequest(
        "CwCreateUpdateObject",
        [
          { key: "Connection", value: "" },
          { key: "Username", value: userCST },
          { key: "Password", value: passwordCST },
          { key: "ModelScriptName", value: cwApi.cwConfigs.ModelFilename },
          { key: "ObjectJsonStr", value: angular.toJson($scope.ng.changeset) },
        ],
        function (response) {
          let id = $scope.parseObjectID(response);

          $scope.associateUserToCwWorkflowRole($scope.ng.stepmapping.creator, function () {
            cwApi.customLibs.utils.shareWorkflow(
              $scope.ng.changeset.properties.name,
              id,
              $scope.ng.changeset.objectTypeScriptName,
              step.notificationMessage,
              [self.cwWorkFlowItemRoleID],
              step.notificationLabel,
              window.location.origin + window.location.pathname + cwApi.getSingleViewHash($scope.ng.changeset.objectTypeScriptName, id),
              function () {
                if (!cwApi.isDebugMode()) window.location = cwApi.getSingleViewHash($scope.ng.changeset.objectTypeScriptName, id);
              }
            );
          });
        }
      );
    };

    $scope.associateUserToCwWorkflowRole = function (cwUserID, callback) {
      let jsonObject = {
        objectTypeScriptname: "cw_role",
        object_id: self.cwWorkFlowItemRoleID,
        iProperties: {},
        properties: {
          name: "WorkFlow Role",
        },
        associations: {
          cw_roletocw_role_to_cw_usertocw_user: [
            {
              object_id: cwUserID,
            },
          ],
        },
      };
      self.sendRequest(
        "CwCreateUpdateObject",
        [
          { key: "Connection", value: "" },
          { key: "Username", value: userCST },
          { key: "Password", value: passwordCST },
          { key: "ModelScriptName", value: cwApi.cwConfigs.ModelFilename },
          { key: "ObjectJsonStr", value: angular.toJson(jsonObject) },
        ],
        function (response) {
          callback();
        }
      );
    };

    $scope.addDocument = function (documents) {
      if ($scope.ng.sessionUuid === null) {
        let name0 = documents[0].filename;
        $scope.uploadDocument(documents[0], function (responseText) {
          $scope.ng.sessionUuid = $scope.parseUUIDSession(responseText);
          $scope.ng.documents.push({
            name: name0,
            url: self.getUrlForNewDocument($scope.ng.sessionUuid, name0),
            status: "new",
          });
          for (let i = 1; i < documents.length; i++) {
            let document = documents[i];
            let name = document.filename;
            $scope.uploadDocument(document, function () {
              $scope.ng.documents.push({
                name: name,
                url: self.getUrlForNewDocument($scope.ng.sessionUuid, name),
                status: "new",
              });
              $scope.$apply();
            });
          }
          $scope.$apply();
        });
      } else {
        for (let i = 0; i < documents.length; i++) {
          let name = documents[i].filename;
          $scope.uploadDocument(documents[i], function () {
            $scope.ng.documents.push({
              name: name,
              url: self.getUrlForNewDocument($scope.ng.sessionUuid, name),
              status: "new",
            });
            $scope.$apply();
          });
        }
      }
    };

    $scope.deleteDocument = function (index, callback) {
      let document = $scope.ng.documents[index];
      if (document.status === "new") {
        self.sendRequest(
          "CwDeleteFile",
          [
            { key: "SessionId", value: $scope.ng.sessionUuid },
            { key: "fileName", value: document.name },
          ],
          function () {
            $scope.ng.documents.splice(index, 1);
            $scope.$apply();
          }
        );
      } else if (document.status === "exist") {
        document.status = "deleted";
        $scope.ng.deletedDocument.push(document.name);
      }
    };

    $scope.restoreDocument = function (index, callback) {
      let document = $scope.ng.documents[index];
      document.status = "exist";
      $scope.ng.deletedDocument.splice($scope.ng.deletedDocument.indexOf(document.name), 1);
    };

    $scope.uploadDocument = function (document, callback) {
      self.sendRequest(
        "CwUploadFile",
        [
          { key: "SessionId", value: $scope.ng.sessionUuid ? $scope.ng.sessionUuid : "" },
          { key: "fileName", value: document.filename },
          { key: "bytes", value: document.base64 },
        ],
        callback
      );
    };
  };

  cwApi.cwLayouts.cwWorkflow = cwLayout;
})(cwAPI, jQuery);
