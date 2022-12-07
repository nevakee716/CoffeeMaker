/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery */
(function (cwApi, $) {
  "use strict";

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

  cwLayout.prototype.loadScopeRequestFunction = function ($scope) {
    var self = this;
    $scope.manageStepClick = function (step) {
      let requestName =
        $scope.ng.changeset.properties.requestname && $scope.ng.changeset.properties.requestname != ""
          ? $scope.ng.changeset.properties.requestname
          : $scope.ng.changeset.properties.name;
      $scope.manageDocumentsBeforeSavingWI();
      $scope.ng.jsonObjects = {
        objectTypeScriptname: "cwworkflowitem",
        object_id: self.object.object_id,
        iProperties: {},
        properties: {
          step: step.stepName,
          changeset: angular.toJson($scope.ng.changeset).replaceAll("“", "'").replaceAll("”", "'"),
          name: requestName,
          documents: angular.toJson($scope.ng.documents),
          scenario: self.scenario,
          objecttypescriptname: self.objectTypeScriptName,
        },
        associations: {},
      };

       if( self.object.objectTypeScriptName != "cwworkflowitem" )delete $scope.ng.jsonObjects.object_id;
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

      // adding creator to the step mapping
      $scope.ng.currentStep.stepsSettings.forEach(function (stepSetting) {
        if (stepSetting.creator === true) {
          if (!$scope.ng.stepmapping.creator) {
            //adding a creator if there isn't already one
            $scope.ng.jsonObjects.associations.cwworkflowitemtoassocwworkflowitemtocwusercreatortocw_user = [
              { object_id: cwApi.currentUser.ID, iProperties: {} },
            ];
            $scope.ng.stepmapping.creator = cwApi.currentUser.ID;
          }
          // map the creator to the step
          $scope.ng.stepmapping[stepSetting.stepName] = $scope.ng.stepmapping.creator;
        }
        // map the
        if (stepSetting.cwUser === true && stepSetting.cwUserObject) {
          $scope.ng.stepmapping[stepSetting.stepName] = stepSetting.cwUserObject.object_id;
          if (!$scope.ng.stepmapping.cwUserMapping) $scope.ng.stepmapping.cwUserMapping = {};
          // store the name, for next steps
          $scope.ng.stepmapping.cwUserMapping[stepSetting.cwUserObject.object_id] = stepSetting.cwUserObject.name;
        }
      });

      $scope.ng.jsonObjects.properties.stepmapping = angular.toJson($scope.ng.stepmapping);

      // if we create the final object, validate the workflow item
      if (step.createObject) {
        $scope.ng.jsonObjects.properties.validated = true;
      }

      // mapping the role to the wi
      $scope.ng.jsonObjects.associations.cwworkflowitemtoassocwworkflowitemtocwroletocw_role = [];
      Object.keys($scope.ng.stepmapping).forEach(function (k) {
        if (($scope.ng.stepmapping[k] ^ 0) !== $scope.ng.stepmapping[k] && k !== "cwUserMapping") {
          $scope.ng.jsonObjects.associations.cwworkflowitemtoassocwworkflowitemtocwroletocw_role.push({
            object_id: $scope.ng.stepmapping[k],
            iProperties: {
              step: k,
            },
          });
        }
      });





      cwAPI.customLibs.utils.sendRequestToCwFileHandling(
        "CwCreateUpdateObjectWithDocsConnId",
        [
          { key: "Connection", value: "" },
          { key: "Username", value: cwAPI.cwUser.getCurrentUserItem().name },
          { key: "ConnectionId", value: $.connection.cwEvolveDiagramEditorHub.connection.id },
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
            if (id == "0") {
              cwAPI.notificationManager.addError(
                "An error occur during the submittion Please contact your administrator : \n" + $scope.parseError(response)
              );
              return;
            }
            if (step.createObject && self.objectTypeScriptName === "cw_diagram_editor_session") {
              /// if diagram draft go to webmodeler to publish
              cwAPI.customLibs.utils.associateUserToCwWorkflowRole([$scope.ng.stepmapping.creator], self.cwWorkFlowItemRoleID, function () {
                $scope.triggerShareWorkflow(
                  id,
                  step,
                  self.cwWorkFlowItemRoleID,
                  cwApi.getDiagrammerUrl() + "#/diagram/" + $scope.ng.diagram.properties.description.diagram.id
                );
              });
            } else if (step.createObject && step.shareWorkflow) {
              // create an object and notify a roles
              if (self.objectTypeScriptName === "erwinbackup" && $scope.ng.changeset.properties.locked === true) {
                self.triggerBackup($scope,() => {
                  $scope.createFinalObject(step, id, $scope.ng.stepmapping[step.stepName]);
                });
              } else {
                $scope.createFinalObject(step, id, $scope.ng.stepmapping[step.stepName]);
              }
            } else if (step.createObject) {
              // create an object and notify creator (default)
              if (self.objectTypeScriptName === "erwinbackup" && $scope.ng.changeset.properties.locked === true) {
                self.triggerBackup($scope,() => {
                  $scope.createFinalObject(step, id);
                });
              } else {
                $scope.createFinalObject(step, id);
              }
            } else if (step.shareWorkflow) {
              // notify
              if (($scope.ng.stepmapping[step.stepName] ^ 0) === $scope.ng.stepmapping[step.stepName]) {
                cwAPI.customLibs.utils.associateUserToCwWorkflowRole([$scope.ng.stepmapping[step.stepName]], self.cwWorkFlowItemRoleID, function () {
                  $scope.triggerShareWorkflow(id, step, self.cwWorkFlowItemRoleID);
                });
              } else {
                $scope.triggerShareWorkflow(id, step);
              }
            } else {
              // reload the page
              if (!cwApi.isDebugMode()) window.location = cwApi.getSingleViewHash($scope.ng.jsonObjects.objectTypeScriptname, id);
            }
          });
        }
      );
    };

    $scope.deleteRequest = function (callback) {
      if (self.task) {
        cwAPI.customLibs.utils.sendRequestToCwFileHandling(
          "CwDeleteObjectConnId",
          [
            { key: "Connection", value: "" },
            { key: "Username", value: cwAPI.cwUser.getCurrentUserItem().name },
            { key: "ConnectionId", value: $.connection.cwEvolveDiagramEditorHub.connection.id },
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

    $scope.triggerShareWorkflow = function (id, step, cw_role, url) {
      cw_role = cw_role ? cw_role : $scope.ng.stepmapping[step.stepName];
      cwApi.customLibs.utils.shareWorkflow(
        $scope.ng.changeset.properties.name,
        id,
        "cwworkflowitem",
        step.notificationMessage,
        [cw_role],
        step.notificationLabel,
        url ? url : window.location.origin + window.location.pathname + cwApi.getSingleViewHash("cwworkflowitem", id),
        function () {
          if (!cwApi.isDebugMode()) window.location = window.location.origin + window.location.pathname;
        }
      );
    };

    $scope.createFinalObject = function (step, id, mapping) {



      if (mapping === undefined) mapping = $scope.ng.stepmapping.creator;
      $scope.ng.changeset.associations.anyobjecttoassocwworkflowitemtocwworkflowitem = [{ object_id: id, iProperties: {} }];

      $scope.ng.changeset.properties[$scope.ng.configuration.docScriptname] = self.getDocumentPropertiesHTML();
      $scope.cleanDatePropInChangeSet();
      cwAPI.customLibs.utils.sendRequestToCwFileHandling(
        "CwCreateUpdateObjectConnId",
        [
          { key: "Connection", value: "" },
          { key: "Username", value: cwAPI.cwUser.getCurrentUserItem().name },
          { key: "ConnectionId", value: $.connection.cwEvolveDiagramEditorHub.connection.id },
          { key: "ModelScriptName", value: cwApi.cwConfigs.ModelFilename },
          { key: "ObjectJsonStr", value: angular.toJson($scope.ng.changeset).replaceAll("“", "'").replaceAll("”", "'") },
        ],
        function (response) {
          let id = $scope.parseObjectID(response);
          if (id == "0") {
            cwAPI.notificationManager.addError(
              "An error occur during the creation of the final object Please contact your administrator : \n" + $scope.parseError(response)
            );
            return;
          }

          //mapping is cwUser
          if (mapping && (mapping ^ 0) !== mapping) {
            cwApi.customLibs.utils.shareWorkflow(
              $scope.ng.changeset.properties.name,
              id,
              $scope.ng.changeset.objectTypeScriptName,
              step.notificationMessage,
              [mapping],
              step.notificationLabel,
              window.location.origin + window.location.pathname + cwApi.getSingleViewHash($scope.ng.changeset.objectTypeScriptName, id),
              function () {
                if (!cwApi.isDebugMode()) window.location = cwApi.getSingleViewHash($scope.ng.changeset.objectTypeScriptName, id);
              }
            );
          } else {
            cwAPI.customLibs.utils.associateUserToCwWorkflowRole([mapping], self.cwWorkFlowItemRoleID, function () {
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
        cwAPI.customLibs.utils.sendRequestToCwFileHandling(
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
      cwAPI.customLibs.utils.sendRequestToCwFileHandling(
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


  cwLayout.prototype.triggerBackup = function (scope,callback) {
    let jsonFile = cwApi.getObjectPageJsonUrl("erwinbackup_detail", this.changeset.object_id);
    cwApi.getJSONFile(
      jsonFile,
      function (o) {
        if (cwApi.checkJsonCallback(o)) {
          let object = o.object;
          var xmlhttp = new XMLHttpRequest();
          var self = this;
          //replace second argument with the path to your Secret Server webservices
          xmlhttp.open("POST", window.location.origin + cwAPI.getServerPath() + "CWObjectExportImport/CWObjectExportImport.asmx", true);


          let schema = cwAPI.getViewsSchemas().erwinbackup_detail;
          let childNodeId = schema.NodesByID[schema.RootNodesId].SortedChildren[0].NodeId;
          let lOption = schema.NodesByID[childNodeId].LayoutOptions.CustomOptions;


          let config = cwAPI.customLibs.utils.cleanJSON(object.properties.configuration);
		  if(config == undefined || config === "") config = cwApi.customLibs.utils.getCustomLayoutConfiguration("cwBackup");
		  else {
	          try {
            config = JSON.parse(config);
          } catch(e){
            cwAPI.notificationManager.addError(
              "Backup configuration is corrupted : \n" + $scope.parseError(response)
            );
            callback();
          }		  
			  
			  
			  }

          let xml = config.method !== "1" ? true : false;
          let level = config.level - 1;
          let levelFilter = { levelFilter: config.levelFilter };
          //create the SOAP request
          //replace username, password (and org + domain, if necessary) with the appropriate info
          var strRequest =
            '<?xml version="1.0" encoding="utf-8"?>' +
            '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
            "<soap12:Body>" +
            '<CWErwinBackup xmlns="http://HawkeyeQ.org/">' +
            "<ConnectionName></ConnectionName>" +
            "<Username>" +
            lOption.login +
            "</Username>" +
            "<Password>" +
            lOption.password +
            "</Password>" +
            "<Domain></Domain>" +
            "<ModelFileName>" +
            cwApi.mm.getMetaModel().fileName +
            "</ModelFileName>" +
            "<InstanceId>" +
            object.object_id +
            "</InstanceId>" +
            "<Method>" +
            config.method +
            "</Method>" +
            "<DefaultLevel>" +
            level +
            "</DefaultLevel>" +
            "<FiltersJson>" +
            JSON.stringify(levelFilter)
              .toUpperCase()
              .replace(/ASSOCIATIONTYPES/g, "AssociationTypes") +
            "</FiltersJson>" +
            "<GenerateXml>" +
            xml +
            "</GenerateXml>" +
            "<BackupFolder></BackupFolder>" +
            "</CWErwinBackup>" +
            "</soap12:Body>" +
            "</soap12:Envelope>";

          //specify request headers
          xmlhttp.setRequestHeader("Content-Type", "application/soap+xml; charset=utf-8");
          cwAPI.siteLoadingPageStart();
          xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
              callback();
            }
          };
          xmlhttp.send(strRequest);
        }
      })
  };




  cwApi.cwLayouts.cwWorkflow = cwLayout;
})(cwAPI, jQuery);
