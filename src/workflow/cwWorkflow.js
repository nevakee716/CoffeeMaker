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

  var cwWorkFlowItemRoleID = 2;

  cwLayout.prototype.construct = function (options, viewSchema) {
    this.drawOneMethod = cwApi.cwLayouts.cwLayoutList.drawOne.bind(this);
    this.options = options;
    var configuration = {
      actionrequest: {
        adhoc: {
          steps: [
            {
              name: "1st Submission",
              formInput: [
                {
                  type: "property",
                  scriptname: "name",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "type",
                  readOnly: true,
                  value: 10042,
                },
                {
                  type: "property",
                  scriptname: "daterequestreceived",
                  readOnly: true,
                  value: "@currentDate",
                },
                {
                  type: "property",
                  scriptname: "requestername",
                  readOnly: true,
                  value: "@currentCwUserName",
                },
                {
                  type: "evolveViewItemList",
                  scriptname: "pernr",
                  label: "Pernr",
                  viewName: "index_pernrs",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "contactphonenumber",
                  readOnly: true,
                  value: "{pernr.cellphonenumber}",
                },
                {
                  type: "property",
                  scriptname: "requestfor",
                  readOnly: true,
                  value: "{pernr.name}",
                },
                {
                  type: "property",
                  scriptname: "arworklocation",
                },
                {
                  type: "property",
                  scriptname: "requesttype",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "deviceids",
                  mandatory: true,
                  filter: [
                    {
                      Asset: "requesttype",
                      Operator: "=",
                      Value: 12550,
                    },
                  ],
                },
                {
                  type: "property",
                  scriptname: "businessjustification",
                  mandatory: true,
                },
                {
                  type: "message",
                  message:
                    "Provide user help text that says 'Saying that you need this for your job or job duties' is too generic and is insufficient and will result in this request being rejected. You need to provide a detailed description that justifies having this item.",
                },
                {
                  type: "property",
                  scriptname: "description",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "bulk",
                  mandatory: true,
                },
              ],
              stepsSettings: [
                {
                  stepName: "1st Submission",
                  label: "Submitter",
                  type: "cw_user",
                  readOnly: true,
                  value: "@currentCwUserId",
                },
                {
                  stepName: "Review",
                  label: "Reviewer",
                  type: "cw_user",
                  mandatory: true,
                },
              ],
              nextStep: [
                {
                  stepName: "Review",
                  label: "Submit",
                  shareWorkflow: true,
                },
                {
                  stepName: "1st Submission",
                  label: "Save For Later",
                },
              ],
            },
            {
              name: "Review",
              formInput: [
                {
                  type: "property",
                  scriptname: "name",
                  mandatory: true,
                  readOnly: true,
                },
                {
                  type: "property",
                  scriptname: "type",
                  readOnly: true,
                },
                {
                  type: "property",
                  scriptname: "daterequestreceived",
                  readOnly: true,
                },
                {
                  type: "property",
                  scriptname: "requestername",
                  readOnly: true,
                },
                {
                  type: "evolveViewItemList",
                  scriptname: "pernr",
                  label: "Pernr",
                  viewName: "index_pernrs",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "contactphonenumber",
                  readOnly: true,
                  value: "{pernr.cellphonenumber}",
                },
                {
                  type: "property",
                  scriptname: "requestfor",
                  readOnly: true,
                  value: "{pernr.name}",
                },
                {
                  type: "property",
                  scriptname: "arworklocation",
                },
                {
                  type: "property",
                  scriptname: "requesttype",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "deviceids",
                  mandatory: true,
                  filter: [
                    {
                      Asset: "requesttype",
                      Operator: "=",
                      Value: 12550,
                    },
                  ],
                },
                {
                  type: "property",
                  scriptname: "businessjustification",
                  mandatory: true,
                },
                {
                  type: "message",
                  message:
                    "Provide user help text that says 'Saying that you need this for your job or job duties' is too generic and is insufficient and will result in this request being rejected. You need to provide a detailed description that justifies having this item.",
                },
                {
                  type: "property",
                  scriptname: "description",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "bulk",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "requeststatus",
                  readOnly: true,
                  value: 10038,
                },
                {
                  type: "property",
                  scriptname: "arassignedto",
                },
                {
                  type: "property",
                  scriptname: "vendorname",
                },
                {
                  type: "property",
                  scriptname: "arfloor",
                },
                {
                  type: "property",
                  scriptname: "arcubicle",
                },
                {
                  type: "property",
                  scriptname: "daterequestcompleted",
                },
                {
                  type: "property",
                  scriptname: "notescomments",
                },
                {
                  type: "property",
                  scriptname: "dateapprovedbygatekeeper",
                },
              ],
              stepsSettings: [
                {
                  stepName: "2nd Submission",
                  label: "Submitter",
                  type: "cw_user",
                  value: "1st Submission",
                },
                {
                  stepName: "ChangeRequest Approuved",
                  label: "Submitter To Notify In Case Of Approuval ",
                  type: "cw_user",
                  value: "1st Submission",
                },
              ],
              nextStep: [
                {
                  stepName: "ChangeRequest Approuved",
                  label: "Validate",
                  createObject: true,
                  end: true,
                  shareWorkflow: true,
                },
                {
                  stepName: "ChangeRequest Rejected",
                  label: "Reject",
                  end: true,
                },
                {
                  stepName: "2nd Submission",
                  label: "Need to Be Redone",
                  shareWorkflow: true,
                },
                {
                  stepName: "Review",
                  label: "Save For Later",
                },
              ],
            },
            {
              name: "2nd Submission",
              formInput: [
                {
                  type: "property",
                  scriptname: "name",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "type",
                  readOnly: true,
                  value: 10042,
                },
                {
                  type: "property",
                  scriptname: "daterequestreceived",
                  readOnly: true,
                  value: "@currentDate",
                },
                {
                  type: "property",
                  scriptname: "requestername",
                  readOnly: true,
                  value: "@currentCwUserName",
                },
                {
                  type: "evolveViewItemList",
                  scriptname: "pernr",
                  label: "Pernr",
                  viewName: "index_pernrs",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "contactphonenumber",
                  readOnly: true,
                  value: "{pernr.cellphonenumber}",
                },
                {
                  type: "property",
                  scriptname: "requestfor",
                  readOnly: true,
                  value: "{pernr.name}",
                },
                {
                  type: "property",
                  scriptname: "arworklocation",
                },
                {
                  type: "property",
                  scriptname: "requesttype",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "deviceids",
                  mandatory: true,
                  filter: [
                    {
                      Asset: "requesttype",
                      Operator: "=",
                      Value: 12550,
                    },
                  ],
                },
                {
                  type: "property",
                  scriptname: "businessjustification",
                  mandatory: true,
                },
                {
                  type: "message",
                  message:
                    "Provide user help text that says 'Saying that you need this for your job or job duties' is too generic and is insufficient and will result in this request being rejected. You need to provide a detailed description that justifies having this item.",
                },
                {
                  type: "property",
                  scriptname: "description",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "bulk",
                  mandatory: true,
                },
                {
                  type: "property",
                  scriptname: "requeststatus",
                  readOnly: true,
                  value: 9479,
                },
                {
                  type: "property",
                  scriptname: "arassignedto",
                  readOnly: true,
                },
                {
                  type: "property",
                  scriptname: "vendorname",
                  readOnly: true,
                },
                {
                  type: "property",
                  scriptname: "arfloor",
                },
                {
                  type: "property",
                  scriptname: "arcubicle",
                },
                {
                  type: "property",
                  scriptname: "daterequestcompleted",
                  readOnly: true,
                },
                {
                  type: "property",
                  scriptname: "notescomments",
                  readOnly: true,
                },
                {
                  type: "property",
                  scriptname: "dateapprovedbygatekeeper",
                  readOnly: true,
                },
              ],
              stepsSettings: [
                {
                  stepName: "Review",
                  label: "Reviewer",
                  type: "cw_user",
                  readOnly: true,
                },
              ],
              nextStep: [
                {
                  stepName: "Review",
                  label: "Submit",
                  shareWorkflow: true,
                },
                {
                  stepName: "1st Submission",
                  label: "Save For Later",
                },
              ],
            },
          ],
        },
      },
    };
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      configuration = cwAPI.customLibs.utils.getCustomLayoutConfiguration("cwWorkflow");
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
    this.configuration.steps.some(function (s) {
      if (s.name === stepName) {
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
          if (formInput.hasOwnProperty("filter")) {
            let cwFilter = new cwApi.customLibs.utils.cwFilter();
            cwFilter.init(formInput.filter);
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
          let r = formInput.value.toString().match(/{(.*)}/);

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

            r = result.toString().match(/{(.*)}/);
          }

          result = result.replace("@currentDate", new Date().toLocaleDateString());
          result = result.replace("@currentCwUserName", cwAPI.cwUser.GetCurrentUserFullName());

          $scope.ng.changeset.properties[formInput.scriptname] = result;
          return result;
        };
        $scope.setProperty = function (formInput) {
          $scope.ng.changeset.properties[formInput.scriptname] = formInput.objects[formInput.selectedId];
          $scope.ng.currentStep.formInput.forEach(function (fi) {
            if (fi.value) $scope.initValue(fi);
          });
        };

        $scope.getStepValue = function (stepConfiguration) {
          let v;
          if (undefined == stepConfiguration.value) return;
          else {
            if ("@currentCwUserId" === stepConfiguration.value) {
              v = cwAPI.currentUser.ID;
            } else {
              v = $scope.ng.stepmapping[stepConfiguration.value];
            }
          }

          $scope.ng.stepmapping[stepConfiguration.stepName] = v;
          return v;
        };

        $scope.getView = function (formInput) {
          /*
          cwApi.CwRest.Diagram.getExistingObjects(
            objName, //searchingString
            currentSearchPage, //PageNumber
            assoToLoad.targetObjectTypeScriptName, //objectType
            null, //categoryId
            function (isSuccess, results) {
              if (isSuccess) {*/
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

        $scope.initValueEvolveViewOption = function (filter_id, selectedId, object, index) {
          if (object.object_id === selectedId) {
            setTimeout(function () {
              $("#" + filter_id).selectpicker("val", index);
            }, 0);
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
    if (!cwAPI.isWebSocketConnected) cwApi.customLibs.utils.setupWebSocketForSocial(this.loadCWUsers().bind(this));
    else this.loadCWUsers();
  };

  cwLayout.prototype.loadCWUsers = function () {
    let self = this;
    let query = {
      ObjectTypeScriptName: "CW_USER",
      PropertiesToLoad: ["name", "id"],
      Where: [],
    };
    cwApi.CwDataServicesApi.send("flatQuery", query, function (err, res) {
      if (err) {
        console.log(err);
        return;
      }
      self.cwUsers = res;
      self.load();
    });
  };

  cwApi.cwLayouts.cwWorkflow = cwLayout;
})(cwAPI, jQuery);
