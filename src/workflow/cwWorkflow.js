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
      this.construct(options, viewSchema);
    };
  }

  cwLayout.prototype.construct = function (options, viewSchema) {
    let configuration;
    this.drawOneMethod = cwApi.cwLayouts.cwLayoutList.drawOne.bind(this);
    this.options = options;
    var self = this;

    this.objectTypeScriptName = this.options.CustomOptions["objecttypescriptname"];
    this.scenario = this.options.CustomOptions["scenario"];

    self.currentEditRequest = [];
  };

  cwLayout.prototype.getTemplatePath = function (folder, templateName) {
    return cwApi.format("{0}/html/{1}/{2}.ng.html", cwApi.getCommonContentPath(), folder, templateName);
  };

  cwLayout.prototype.drawAssociations = function (output, associationTitleText, object) {
    output.push('<div class="cw-visible cwWorkflow" id="cwWorkflow' + this.nodeID + '"></div>');
    this.object = object;
  };

  // sort by key
  cwLayout.prototype.sortByKey = function (obj, key, sc) {
    let r = {};
    let l = {};

    obj.forEach(function (o) {
      if (!r[o[key]]) r[o[key]] = {};
      r[o[key]][o["Object ID"]] = o;
      if (!sc.objectTypes[o[key]]) sc.objectTypes[o[key]] = {};
    });
    return r;
  };

  cwLayout.prototype.cleanJSON = function (json) {
    let c = json.replaceAll('\\\\\\"', "#§#§#");
    c = c.replaceAll('\\"', '"');
    c = c.replaceAll("#§#§#", '\\"');
    return c;
  };

  cwLayout.prototype.getStep = function (stepName) {
    let r;
    if (undefined === stepName) return this.configuration.steps[0];
    this.configuration.steps.some(function (s) {
      if (s.label === stepName) {
        r = s;
        return true;
      }
      return false;
    });
    return r;
  };

  cwLayout.prototype.getUrlForNewDocument = function (uuid, filename) {
    return window.location.origin + cwAPI.getServerPath() + "CWFileHandling/Sessions/" + uuid + "/" + filename;
  };

  cwLayout.prototype.getDocumentPropertiesHTML = function () {
    let output = this.documents.map(function (doc) {
      return '<div><a target="_blank" href="' + doc.url + '">' + doc.name + "</a></div>";
    });
    return "<!DOCTYPE html><html><head></head><body><p>" + output.join("") + "</p></body></html>";
  };

  cwLayout.prototype.load = function () {
    var self = this;

    var configuration;
    try {
      if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
        configuration = JSON.parse(JSON.stringify(cwAPI.customLibs.utils.getCustomLayoutConfiguration("cwWorkflow")));
      } else return;

      if (!cwApi.isIndexPage() && cwAPI.getCurrentView().rootObjectType === "cwworkflowitem") {
        let o = self.object;
        self.objectTypeScriptName = o.properties.objecttypescriptname;
        self.scenario = o.properties.scenario;
        if (
          configuration &&
          configuration.objectTypes &&
          configuration.objectTypes[this.objectTypeScriptName] &&
          configuration.objectTypes[this.objectTypeScriptName].scenarios
        ) {
          this.cwWorkFlowItemRoleID = configuration.cwRole;

          configuration.objectTypes[this.objectTypeScriptName].scenarios.some(function (s) {
            if (s.label === self.scenario) {
              self.configuration = s;
              return true;
            }
          });
        }

        self.step = o.properties.step;
        self.history = JSON.parse(self.cleanJSON(o.properties.history));
        self.documents = JSON.parse(self.cleanJSON(o.properties.documents));
        self.documents.forEach(function (doc) {
          doc.url =
            cwAPI.getServerPath() +
            "cwfilehandling/documents/" +
            cwApi.cwConfigs.ModelFilename +
            "/" +
            o.objectTypeScriptName +
            "/" +
            o.object_id +
            "/" +
            doc.name;
        });
        if (self.object.associations && self.object.associations[Object.keys(self.object.associations)]) {
          self.task = self.object.associations[Object.keys(self.object.associations)][0];
        }
        self.changeset = JSON.parse(self.cleanJSON(o.properties.changeset));
        self.stepmapping = JSON.parse(self.cleanJSON(o.properties.stepmapping));
        if (!self.stepmapping.cwUserMapping) self.stepmapping.cwUserMapping = {};
      } else {
        //new cwWorkflowItem page
        if (
          configuration &&
          configuration.objectTypes &&
          configuration.objectTypes[this.objectTypeScriptName] &&
          configuration.objectTypes[this.objectTypeScriptName].scenarios
        ) {
          this.cwWorkFlowItemRoleID = configuration.cwRole;

          this.configuration = undefined;
          configuration.objectTypes[this.objectTypeScriptName].scenarios.some(function (s) {
            if (s.label === self.scenario) {
              self.configuration = s;
              return true;
            }
          });
        }
        self.step = self.configuration.steps[0].name;
        self.history = {
          creator: cwApi.currentUser.FullName,
        };
        self.documents = [];
        self.stepmapping = { cwUserMapping: {} };
        self.changeset = {
          objectTypeScriptName: self.objectTypeScriptName,
          objectTypeScriptname: self.objectTypeScriptName,
          iProperties: {},
          properties: {},
          associations: {},
        };
        self.creation = true;

        if (!cwApi.isIndexPage()) {
          self.changeset.object_id = self.object.object_id;

          //get properties of the existing object
          self.viewSchema.NodesByID[this.viewSchema.RootNodesId[0]].PropertiesSelected.forEach(function (propertyScriptname) {
            let property = cwAPI.mm.getProperty(self.objectTypeScriptName, propertyScriptname);
            if (property.type === "Lookup") {
              self.changeset.properties[propertyScriptname.toLowerCase()] =
                self.object.properties[propertyScriptname.toLowerCase() + "_id"].toString();
            } else {
              self.changeset.properties[propertyScriptname.toLowerCase()] = self.object.properties[propertyScriptname.toLowerCase()];
            }
          });

          //get association of the existing object
          Object.keys(self.object.associations).forEach(function (assoScriptName) {
            if (!self.changeset.associations[assoScriptName.toLowerCase()]) {
              self.changeset.associations[assoScriptName.toLowerCase()] = [];
            }
            self.object.associations[assoScriptName].forEach(function (assoObject) {
              self.changeset.associations[assoScriptName.toLowerCase()].push({
                object_id: assoObject.object_id,
                name: assoObject.name,
                objectTypeScriptName: assoObject.objectTypeScriptName,
                iProperties: {},
              });
            });
          });
        }
      }
      this.currentStep = this.getStep(this.step);
    } catch (e) {
      console.log(e);
      cwAPI.notificationManager.addError("Workflow Item seems corrupted. Please contact your administrator : \n" + $scope.parseError(response));
      cwAPI.siteLoadingPageFinish();
      return;
    }

    cwApi.CwAsyncLoader.load("angular", function () {
      let loader = cwApi.CwAngularLoader,
        templatePath,
        $container = $("#cwWorkflow" + self.nodeID);
      loader.setup();
      templatePath = self.getTemplatePath("cwWorkflow", "workflow");

      loader.loadControllerWithTemplate("cwWorkflow", $container, templatePath, function ($scope, $sce) {
        self.angularScope = $scope;
        $scope.ng = {};
        $scope.cwApi = cwApi;
        $scope.ng.otherUsers = "";
        $scope.ng.configuration = self.configuration;
        $scope.ng.step = self.step;
        $scope.ng.history = self.history;
        $scope.ng.documents = self.documents;
        $scope.ng.changeset = self.changeset;
        $scope.ng.currentStep = self.currentStep;
        $scope.ng.objectTypeScriptName = self.objectTypeScriptName;
        $scope.ng.objectType = cwApi.mm.getObjectType(self.objectTypeScriptName);
        $scope.ng.cwUsers = self.cwUsers;
        $scope.ng.stepmapping = self.stepmapping;
        $scope.ng.sessionUuid = null;
        $scope.ng.scenario = self.scenario;
        $scope.ng.deletedDocument = [];
        $scope.ng.otherUsers = "";
        $scope.ng.diagram = self.diagram;
        $scope.ng.currentEditRequest = self.currentEditRequest;
        // check if other users are working on the task
        if (self.task && self.task.associations) {
          let ou;
          ou = self.task.associations[Object.keys(self.task.associations)[0]].filter(function (u) {
            return u.object_id != cwApi.currentUser.ID && u.iProperties.read === true;
          });
          ou = ou.map(function (u) {
            return u.name;
          });
          if (ou.length > 0) $scope.ng.otherUsers = " (" + $.i18n.prop("otherPeopleAreWorkingOn") + " : " + ou.join(",") + ")";
        }

        $scope.ng.canEdit = self.creation;
        if (!self.creation && $scope.ng.stepmapping[$scope.ng.currentStep.label]) {
          if (($scope.ng.stepmapping[$scope.ng.currentStep.label] ^ 0) === $scope.ng.stepmapping[$scope.ng.currentStep.label]) {
            $scope.ng.canEdit = cwApi.currentUser.ID == $scope.ng.stepmapping[$scope.ng.currentStep.label];
          } else {
            $scope.ng.canEdit = cwApi.currentUser.RolesId.some(function (r) {
              return $scope.ng.stepmapping[$scope.ng.currentStep.label] == r;
            });
          }
        } else $scope.ng.canEdit = $scope.ng.stepmapping.creator === cwApi.currentUser.ID ? true : false;

        $scope.ng.canRead =
          $scope.ng.canEdit ||
          Object.keys($scope.ng.stepmapping).some(function (k) {
            if (($scope.ng.stepmapping[k] ^ 0) === $scope.ng.stepmapping[k]) {
              return $scope.ng.stepmapping[k] == cwAPI.cwUser.getCurrentUserItem().object_id;
            } else {
              return cwApi.currentUser.RolesId.some(function (r) {
                return $scope.ng.stepmapping[$scope.ng.currentStep.label] == r;
              });
            }
          });
        $scope.ng.canEditIfNotAdmin = $scope.ng.canEdit;
        $scope.ng.canReadIfNotAdmin = $scope.ng.canRead;
        $scope.ng.canEdit = $scope.ng.canEdit || cwApi.currentUser.PowerLevel === 1;
        $scope.ng.canRead = $scope.ng.canRead || cwApi.currentUser.PowerLevel === 1;
        $scope.getPropertyName = function (propertyScriptname) {
          return cwApi.mm.getProperty(self.objectTypeScriptName, propertyScriptname).name;
        };
        $scope.checkFilter = function (formInput) {
          if (formInput.hasOwnProperty("filters") && formInput.filters.length && formInput.filters.length > 0) {
            let cwFilter = new cwApi.customLibs.utils.cwFilter();
            formInput.filters.forEach(function (filter) {
              filter.Asset = filter.scriptname;
            });
            cwFilter.init(formInput.filters);
            $scope.ng.changeset.objectTypeScriptName = $scope.ng.changeset.objectTypeScriptname;
            return cwFilter.isMatching($scope.ng.changeset);
          }
          return true;
        };
        $scope.getLookupLabel = function (p, lookupId) {
          let r;
          p.lookups.some(function (l) {
            if (l.id.toString() === lookupId.toString()) {
              r = l.name;
              return true;
            }
          });
          return r;
        };

        $scope.initStepMapping = function (stepConfiguration) {
          if (!$scope.ng.stepmapping[stepConfiguration.stepName] || stepConfiguration.readOnly === true)
            $scope.ng.stepmapping[stepConfiguration.stepName] = stepConfiguration.cwRole;
        };

        $scope.initValue = function (formInput) {
          if (!formInput.value) return;
          let result = formInput.value.toString();
          let r = formInput.value.toString().match(/{(.*?)}/);

          while (r !== null) {
            let cds = r[1];
            let v = "";
            if (cds.indexOf(".") !== -1) {
              if ($scope.ng.changeset.properties[cds.split(".")[0]]) {
                v = $scope.ng.changeset.properties[cds.split(".")[0]].properties[cds.split(".")[1]];
              }
            } else {
              v = $scope.ng.changeset.properties[cds];
            }
            result = result.replace(r[0], v);

            r = result.toString().match(/{(.*?)}/);
          }
          let prop = cwApi.mm.getProperty(self.objectTypeScriptName, formInput.scriptname);
          // get the prop if Date
          if (prop && prop.type === "Date") {
            result = result.replace("@currentDate", new Date().toISOString());
          } else {
            result = result.replace("@currentDate", new Date().toLocaleDateString());
          }
          result = result.replace("@currentCwUserName", cwAPI.cwUser.GetCurrentUserFullName());
          result = result.replace("@currentCwUserId", cwAPI.cwUser.getCurrentUserItem().object_id);
          result = result.replace("@currentTimeStamp", $scope.getTimeStamp());

          // get the value if lookup
          if (prop && prop.type === "Lookup") {
            let found = false;
            found = prop.lookups.some(function (l) {
              //check the name
              if (l.name === result) {
                result = l.id.toString();
                return true;
              }
              //check the id
              if (l.id == result) {
                result = l.id.toString();
                return true;
              }
            });
            if (!found) result = 0;
          }

          if (prop && prop.type === "Boolean") {
            result = $.i18n.prop("global_true").toLowerCase() == result.toLowerCase();
          }
          if (
            !prop ||
            prop.type === "Boolean" ||
            prop.type === "Double" ||
            prop.type === "Integer" ||
            $scope.ng.changeset.properties[formInput.scriptname] === "" ||
            $scope.ng.changeset.properties[formInput.scriptname] === undefined ||
            formInput.readOnly
          ) {
            $scope.ng.changeset.properties[formInput.scriptname] = result;
          }

          return result;
        };

        $scope.getcwUserName = function (stepConfiguration) {
          return $scope.ng.stepmapping.cwUserMapping && $scope.ng.stepmapping.cwUserMapping[$scope.ng.stepmapping[stepConfiguration.stepName]];
        };
        $scope.getTimeStamp = function () {
          let d = new Date();
          return (
            d.getFullYear() +
            ("0" + (d.getMonth() + 1)).slice(-2) +
            ("0" + d.getDate()).slice(-2) +
            ("0" + d.getHours()).slice(-2) +
            ("0" + d.getMinutes()).slice(-2) +
            ("0" + d.getSeconds()).slice(-2)
          );
        };
        $scope.cleanDatePropInChangeSet = function () {
          Object.keys($scope.ng.changeset.properties).forEach(function (pScriptname) {
            if ($scope.getPropertyDataType(self.objectTypeScriptname, pScriptname) == "date") {
              $scope.ng.changeset.properties[pScriptname] = $scope.ng.changeset.properties[pScriptname].split("T")[0];
            }
          });
        };
        $scope.selectObjectInObjectTypeList = function ($index, object, formInput) {
          formInput.selectedIndex = $index;
          formInput.selectedId = object.object_id;
          formInput.searchText = object.name;
          formInput.result = object.name;
          $scope.ng.changeset.properties[formInput.scriptname] = object;
          $scope.getPropertiesFromObjectList(formInput, object);
        };

        $scope.selectAssociationObjectInObjectTypeList = function ($index, object, formInput) {
          if (!formInput.selectedObjects) formInput.selectedObjects = {};
          formInput.selectedObjects[object.object_id] = object;

          formInput.result = object.name;
          if (!$scope.ng.changeset.associations) $scope.ng.changeset.associations = {};
          if (!$scope.ng.changeset.associations[formInput.association.toLowerCase()]) {
            $scope.ng.changeset.associations[formInput.association.toLowerCase()] = [];
          }

          $scope.ng.changeset.associations[formInput.association.toLowerCase()].push({
            object_id: object.object_id,
            name: object.name,
            objectTypeScriptName: object.objectTypeScriptName,
            iProperties: {},
          });
        };

        $scope.isInTheListOfAssociation = function (id, formInput) {
          return (
            $scope.ng.changeset.associations &&
            $scope.ng.changeset.associations[formInput.association.toLowerCase()] &&
            $scope.ng.changeset.associations[formInput.association.toLowerCase()].some(function (ao) {
              return ao.object_id === id;
            })
          );
        };

        $scope.removeAssociation = function (formInput, object) {
          $scope.ng.changeset.associations[formInput.association.toLowerCase()] = $scope.ng.changeset.associations[
            formInput.association.toLowerCase()
          ].filter(function (a) {
            return a.object_id !== object.object_id;
          });
          delete formInput.selectedObjects[object.object_id];
        };

        $scope.getPropertiesFromObjectList = function (formInput, object) {
          var url = cwApi.getLiveServerURL() + "page/" + object.objectTypeScriptName + "/" + object.object_id + "?" + Math.random();
          $.getJSON(url, function (json) {
            $scope.ng.changeset.properties[formInput.scriptname] = json.object;
            $scope.refreshProperties();
            $scope.$apply();
          });
        };

        $scope.setProperty = function (formInput) {
          $scope.ng.changeset.properties[formInput.scriptname] = formInput.objects[formInput.selectedId];
          $scope.refreshProperties();
        };
        $scope.refreshProperties = function () {
          $scope.ng.currentStep.formInput.forEach(function (fi) {
            if (fi.value) $scope.initValue(fi);
          });
        };

        $scope.getView = function (formInput) {
          let jsonFile = cwApi.getIndexViewDataUrl(formInput.viewName);
          cwApi.getJSONFile(jsonFile, function (o) {
            if (cwApi.checkJsonCallback(o)) {
              formInput.objects = o[Object.keys(o)[0]];
              formInput.loaded = true;
              formInput.selectedId =
                $scope.ng.changeset.properties[formInput.scriptname] && $scope.ng.changeset.properties[formInput.scriptname].object_id
                  ? $scope.ng.changeset.properties[formInput.scriptname].object_id
                  : "";

              $scope.$apply();
            }
          });
        };

        $scope.getAssociationList = function (formInput) {
          let associationtype;
          cwApi.mm.getObjectType(self.objectTypeScriptName).AssociationTypes.some(function (a) {
            if (a.ScriptName === formInput.association) {
              associationtype = a;
              return true;
            }
            return false;
          });
          let tOt = associationtype.TargetObjectTypeScriptName.toLowerCase();
          var url = cwApi.getLiveServerURL() + "page/" + tOt + "AllNames?" + cwAPI.getRandomNumber();
          $.getJSON(url, function (json) {
            if (json[tOt]) {
              formInput.objects = json[tOt];
              $scope.$apply();
            }
          });
        };

        $scope.getObjectTypeList = function (formInput) {
          var url = cwApi.getLiveServerURL() + "page/" + formInput.objectType + "AllNames?" + cwAPI.getRandomNumber();
          $.getJSON(url, function (json) {
            if (json[formInput.objectType]) {
              formInput.objects = json[formInput.objectType];
              if ($scope.ng.changeset.properties[formInput.scriptname])
                formInput.searchText = $scope.ng.changeset.properties[formInput.scriptname].name;
              $scope.$apply();
            }
          });
        };
        $scope.setFormFilter = function (formInput) {
          if (formInput.objects && formInput.objects.length > 0) {
            formInput.objectsFiltered = formInput.objects.filter(function (o) {
              return (
                o.name.toLowerCase().indexOf(formInput.searchText.toLowerCase()) !== -1 ||
                ($scope.ng.changeset.properties[formInput.scriptname] &&
                  $scope.ng.changeset.properties[formInput.scriptname].object_id === o.object_id)
              );
            });
          }
        };

        $scope.initValueEvolveViewOption = function (filter_id, selectedId, object, index) {
          if (object.object_id === selectedId) {
            setTimeout(function () {
              $("#" + filter_id).selectpicker("val", index);
            }, 0);
          }
        };

        $scope.initValueOfStepmapping = function (stepConfiguration, $index) {
          $scope.bootstrapFilter("cwuser_" + $index, $scope.ng.stepmapping[stepConfiguration.stepName], stepConfiguration.cwRole);
          $scope.ng.stepmapping[stepConfiguration.stepName] = stepConfiguration.cwRole;
        };

        $scope.initLookup = function (formInput) {
          if (!formInput.mandatory && $scope.ng.changeset.properties[formInput.scriptname] === undefined) {
            $scope.ng.changeset.properties[formInput.scriptname] = 0;
          }
        };
        $scope.manageDocumentsBeforeSavingWI = function () {
          $scope.ng.documents.forEach(function (doc) {
            if (doc.status === "new") {
              doc.status = "exist";
            }
          });
          $scope.ng.documents = $scope.ng.documents.filter(function (doc) {
            return doc.status !== "deleted";
          });
        };
        self.loadScopeRequestFunction($scope);

        $scope.parseUUIDSession = function (text) {
          return text.match(/<SessionId>(.*)<\/SessionId>/)[1];
        };
        $scope.parseObjectID = function (text) {
          return text.match(/<ObjectId>(.*)<\/ObjectId>/)[1];
        };
        $scope.parseError = function (text) {
          return text.match(/<Message>(.*)<\/Message>/)[1];
        };

        $scope.bootstrapFilter = function (id, value) {
          window.setTimeout(function (params) {
            $("#" + id).selectpicker();
            if (value) $("#" + id).selectpicker("val", value);
          }, 1000);
        };
        $scope.getPropertyDataType = function (ot, scriptname) {
          if (cwApi.isUndefined(ot)) {
            return "";
          }
          if (scriptname) {
            var p = cwApi.mm.getProperty(ot.scriptName, scriptname);
            if (cwApi.isUndefined(p)) {
              return "text";
            }
            switch (p.type) {
              case "Boolean":
                return "checkbox";
              case "Integer":
              case "Double":
                return "number";
              case "Lookup":
                return "lookup";
              case "Memo":
                return "memo";
              case "Date":
                return "date";
              default:
                return "text";
            }
          } else return "number";
        };
      });
    });
  };

  cwLayout.prototype.applyJavaScript = function () {
    let self = this;

    if (!cwAPI.isWebSocketConnected) cwApi.customLibs.utils.setupWebSocketForSocial(this.loadLibs.bind(this));
    else this.loadLibs();
  };

  cwLayout.prototype.loadLibs = function () {
    let self = this;
    let query = {
      ObjectTypeScriptName: "CW_USER",
      PropertiesToLoad: ["NAME"], //, "EMAIL"],
      Where: [],
    };

    cwApi.CwDataServicesApi.send("flatQuery", query, function (err, res) {
      self.cwUsers = res.map(function (u) {
        u.name = u.name + "(" + u.properties.email + ")";
        return u;
      });
      if (cwAPI.isDebugMode() === true) {
        self.checkAlreadyExistingRequest();
      } else {
        var libToLoad = ["modules/vis/vis.min.js", "modules/bootstrap/bootstrap.min.js", "modules/bootstrap-select/bootstrap-select.min.js"];
        // AsyncLoad
        cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad, function (error) {
          if (error === null) {
            self.checkAlreadyExistingRequest();
          } else {
            cwAPI.Log.Error(error);
          }
        });
      }
    });
  };

  cwLayout.prototype.checkAlreadyExistingRequest = function () {
    if (
      !cwApi.isIndexPage() &&
      cwAPI.getCurrentView().rootObjectType !== "cwworkflowitem" &&
      cwAPI.getCurrentView().rootObjectType === this.objectTypeScriptName
    ) {
      // $(".cw-edit-mode-button-edit").addClass("cw-hidden");
      this.getUserWorkflowItemsForEdit(this.load.bind(this));
    } else if (this.objectTypeScriptName !== "cw_diagram_editor_session") {
      this.getDiagramDraftDescription(this.load.bind(this));
    } else this.load();
  };

  cwLayout.prototype.getDiagramDraftDescription = function (callback) {
    let self = this;

    let editItemquery = {
      ObjectTypeScriptName: "CW_DIAGRAM_EDITOR_SESSION",
      PropertiesToLoad: ["NAME", "DESCRIPTION"],
      Where: [{ PropertyScriptName: "NAME", Value: self.object.name }],
    };

    cwApi.CwDataServicesApi.send("flatQuery", editItemquery, function (err, res) {
      self.currentEditRequest = [];
      res.forEach(function (diag) {
        self.diagram = diag;
        self.diagram.properties.description = JSON.parse(self.cleanJSON(self.diagram.properties.description));
        debugger;
      });

      callback();
    });
  };

  cwLayout.prototype.getUserWorkflowItemsForEdit = function (callback) {
    let self = this;
    let editItemquery = {
      ObjectTypeScriptName: "CWWORKFLOWITEM",
      PropertiesToLoad: ["NAME", "CHANGESET", "HISTORY", "STEP"],
      Where: [
        { PropertyScriptName: "VALIDATED", Value: false },
        { PropertyScriptName: "SCENARIO", Value: this.scenario },
        { PropertyScriptName: "OBJECTTYPESCRIPTNAME", Value: this.objectTypeScriptName },
      ],
    };

    cwApi.CwDataServicesApi.send("flatQuery", editItemquery, function (err, res) {
      self.currentEditRequest = [];
      res.forEach(function (wf) {
        self.currentEditRequest.push({
          name: wf.properties.name,
          step: wf.properties.step,
          object_id: wf.object_id,
          user: JSON.parse(self.cleanJSON(wf.properties.history)).creator,
          url: cwAPI.getSingleViewHash("cwworkflowitem", wf.object_id),
        });
      });

      callback();
    });
  };
  cwLayout.prototype.diagramConverter = function (callback) {
    var d = self.diagram.properties.description;
    r = {};
    r.diagramId = d.diagram.id;
  };

  cwApi.cwLayouts.cwWorkflow = cwLayout;
})(cwAPI, jQuery);
