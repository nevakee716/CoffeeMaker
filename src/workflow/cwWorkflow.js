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

    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      configuration = JSON.parse(JSON.stringify(cwAPI.customLibs.utils.getCustomLayoutConfiguration("cwWorkflow")));
    } else return;

    this.objectTypeScriptName = this.options.CustomOptions["objecttypescriptname"]
      ? this.options.CustomOptions["objecttypescriptname"]
      : "actionrequest";
    this.scenario = this.options.CustomOptions["scenario"] ? this.options.CustomOptions["scenario"] : "adhoc";
    if (
      configuration &&
      configuration.objectTypes &&
      configuration.objectTypes[this.objectTypeScriptName] &&
      configuration.objectTypes[this.objectTypeScriptName].scenarios
    ) {
      this.cwWorkFlowItemRoleID = configuration.cwRole;
      this.configuration = configuration.objectTypes[this.objectTypeScriptName].scenarios[0];
    }
  };

  cwLayout.prototype.getTemplatePath = function (folder, templateName) {
    return cwApi.format("{0}/html/{1}/{2}.ng.html", cwApi.getCommonContentPath(), folder, templateName);
  };

  cwLayout.prototype.drawAssociations = function (output, associationTitleText, object) {
    output.push('<div class="cw-visible cwWorkflow" id="cwWorkflow' + this.nodeID + '"></div>');
    this.object = object.associations[this.mmNode.NodeID][0];
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
    return window.location.origin + "/evolve/CWFileHandling/Sessions/" + uuid + "/" + filename;
  };

  cwLayout.prototype.load = function () {
    var self = this;
    try {
      if (!cwApi.isIndexPage()) {
        let o = self.object;
        self.step = o.properties.step;
        self.history = JSON.parse(self.cleanJSON(o.properties.history));
        self.documents = JSON.parse(self.cleanJSON(o.properties.documents));
        self.documents.forEach(function (doc) {
          doc.url =
            window.origin +
            "/evolve/cwfilehandling/documents/" +
            cwApi.cwConfigs.ModelFilename +
            "/" +
            o.objectTypeScriptName +
            "/" +
            o.object_id +
            "/" +
            doc.name;
        });

        self.changeset = JSON.parse(self.cleanJSON(o.properties.changeset));
        self.stepmapping = JSON.parse(self.cleanJSON(o.properties.stepmapping));
      } else {
        //creation page
        self.step = self.configuration.steps[0].name;
        self.history = {
          creator: cwAPI.cwUser.getCurrentUserItem().object_id,
        };
        self.documents = [];
        self.stepmapping = {};
        self.changeset = { objectTypeScriptname: self.objectTypeScriptName, iProperties: {}, properties: {}, associations: {} };
      }
      this.currentStep = this.getStep(this.step);
    } catch (e) {
      console.log(e);
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
        $scope.ng.deletedDocument = [];
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

          result = result.replace("@currentDate", new Date().toLocaleDateString());
          result = result.replace("@currentCwUserName", cwAPI.cwUser.GetCurrentUserFullName());
          result = result.replace("@currentTimeStamp", $scope.getTimeStamp());

          let prop = cwApi.mm.getProperty(self.objectTypeScriptName, formInput.scriptname);
          if (prop.type === "Lookup") {
            prop.lookups.forEach(function (l) {
              if (l.name === result) result = l.id;
            });
          }
          $scope.ng.changeset.properties[formInput.scriptname] = result;
          return result;
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
          /*
          cwApi.CwRest.Diagram.getExistingObjects(
            objName, //searchingString
            currentSearchPage, //PageNumber
            assoToLoad.targetObjectTypeScriptName, //objectType
            null, //categoryId
            function (isSuccess, results) {
              if (isSuccess) {*/
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
          /*
          cwApi.CwRest.Diagram.getExistingObjects(
            objName, //searchingString
            currentSearchPage, //PageNumber
            assoToLoad.targetObjectTypeScriptName, //objectType
            null, //categoryId
            function (isSuccess, results) {
              if (isSuccess) {*/
          var url = cwApi.getLiveServerURL() + "page/" + formInput.objectType + "AllNames?" + cwAPI.getRandomNumber();
          $.getJSON(url, function (json) {
            if (json[formInput.objectType]) {
              formInput.objects = json[formInput.objectType];
              $scope.$apply();
            }
          });
        };
        $scope.setFormFilter = function (formInput) {
          if (formInput.objects && formInput.objects.length > 0) {
            formInput.objectsFiltered = formInput.objects.filter(function (o) {
              return (
                o.name.indexOf(formInput.searchText) !== -1 ||
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
              return "";
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
    if (!cwAPI.isWebSocketConnected) cwApi.customLibs.utils.setupWebSocketForSocial(this.loadLibs().bind(this));
    else this.loadLibs();
  };

  cwLayout.prototype.loadLibs = function () {
    let self = this;

    if (cwAPI.isDebugMode() === true) {
      self.load();
    } else {
      libToLoad = ["modules/vis/vis.min.js", "modules/bootstrap/bootstrap.min.js", "modules/bootstrap-select/bootstrap-select.min.js"];
      // AsyncLoad
      cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad, function (error) {
        if (error === null) {
          self.load();
        } else {
          cwAPI.Log.Error(error);
        }
      });
    }
  };

  cwApi.cwLayouts.cwWorkflow = cwLayout;
})(cwAPI, jQuery);
