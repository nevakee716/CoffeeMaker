/* Copyright (c) 2012-2016 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery, cwConfigurationEditorMapping */
(function (cwApi, $) {
  "use strict";

  var cwLayout = function (options, viewSchema) {
    cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema);
    this.drawOneMethod = cwApi.cwLayouts.cwLayoutList.drawOne.bind(this);
    cwApi.registerLayoutForJSActions(this);
    this.options = options;
  };

  cwLayout.prototype.getTemplatePath = function (folder, templateName) {
    return cwApi.format("{0}/html/{1}/{2}.ng.html", cwApi.getCommonContentPath(), folder, templateName);
  };

  cwLayout.prototype.drawAssociations = function (output, associationTitleText, object) {
    output.push('<div class="cw-visible cwLayoutBackup CoffeeMaker" id="cwLayoutBackup' + this.nodeID + '"></div>');
    this.object = object;
  };

  cwLayout.prototype.getRefreshDataFromWebService = function () {
    var xmlhttp = new XMLHttpRequest();
    var self = this;
    //replace second argument with the path to your Secret Server webservices
    xmlhttp.open("POST", window.location.origin + cwAPI.getServerPath() + "CWObjectExportImport/CWObjectExportImport.asmx", true);

    let xml = this.config.method !== "1" ? true : false;
    let level = this.config.level - 1;
    let levelFilter = { levelFilter: this.config.levelFilter };
    //create the SOAP request
    //replace username, password (and org + domain, if necessary) with the appropriate info
    var strRequest =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
      "<soap12:Body>" +
      '<CWErwinBackup xmlns="http://HawkeyeQ.org/">' +
      "<ConnectionName></ConnectionName>" +
      "<Username>" +
      this.options.CustomOptions["login"] +
      "</Username>" +
      "<Password>" +
      this.options.CustomOptions["password"] +
      "</Password>" +
      "<Domain></Domain>" +
      "<ModelFileName>" +
      cwApi.mm.getMetaModel().fileName +
      "</ModelFileName>" +
      "<InstanceId>" +
      this.object.object_id +
      "</InstanceId>" +
      "<Method>" +
      this.config.method +
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
        let jsonFile = cwApi.getObjectPageJsonUrl(self.mmNode.ViewName, self.object.object_id);
        setTimeout(function () {
          cwApi.getJSONFile(
            jsonFile,
            function (o) {
              clearTimeout(event1);
              clearTimeout(event2);
              clearTimeout(event3);
              if (cwApi.checkJsonCallback(o)) {
                self.object = o.object;
                self.load();
              }
            },
            cwApi.errorOnLoadPage
          );
        }, 10);
      }
    };
    var event1 = window.setTimeout(loading, 500);
    var event2 = window.setTimeout(loading, 100);
    var event3 = window.setTimeout(loading, 1500);
    //var event4 = window.setTimeout(cwAPI.siteLoadingPageFinish, 2500);
    function loading(oEvent) {
      cwAPI.siteLoadingPageStart();
    }

    //send the SOAP request
    xmlhttp.send(strRequest);

    //self.load();
  };

  function translateText(text) {
    switch (text) {
      case "true":
        return $.i18n.prop("global_true");
      case "false":
        return $.i18n.prop("global_false");
      case cwApi.cwConfigs.UndefinedValue:
        return $.i18n.prop("global_undefined");
      default:
        return text;
    }
  }
  // manage search
  cwLayout.prototype.manageDisplayAllProperties = function (event) {
    var self = this;
    if (this.angularScope) {
      if (this.displayAllProp === true) {
        self.displayAllProp = false;
        event.target.title = $.i18n.prop("compare_hide_allprop");
        event.target.classList.remove("selected");
      } else {
        self.displayAllProp = true;
        event.target.title = $.i18n.prop("compare_show_allprop");
        event.target.classList.add("selected");
      }
      this.angularScope.ng.displayAllProp = this.displayAllProp;
      this.angularScope.$apply();
    }
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

  cwLayout.prototype.parseJSON = function (json) {
    var r = null;
    try {
      var r = JSON.parse(this.cleanJSON(this.cleanJSON(json)));
    } catch (e) {
      try {
        var r = JSON.parse(this.cleanJSON(json));
      } catch (e) {
        try {
          var r = JSON.parse(json);
        } catch (e) {
          console.log(e);
          cwAPI.siteLoadingPageFinish();
          return r;
        }
      }
    }
    return r;
  };

  function deepEqual(object1, object2) {
    var keys1 = Object.keys(object1);
    var keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (var _i = 0, _keys = keys1; _i < _keys.length; _i++) {
      var key = _keys[_i];
      var val1 = object1[key];
      var val2 = object2[key];
      var areObjects = isObject(val1) && isObject(val2);

      if ((areObjects && !deepEqual(val1, val2)) || (!areObjects && val1 !== val2)) {
        return false;
      }
    }

    return true;
  }

  function isObject(object) {
    return object != null && typeof object === "object";
  }

  cwLayout.prototype.load = function () {
    var self = this;

    var backupCWProp = self.parseJSON(self.object.properties.backupjson);
    if (!backupCWProp) {
      cwAPI.siteLoadingPageFinish();
      cwAPI.notificationManager.addError("Empty Backup");
      return;
    }
    cwApi.CwAsyncLoader.load("angular", function () {
      let loader = cwApi.CwAngularLoader,
        templatePath,
        $container = $("#cwLayoutBackup" + self.nodeID);
      loader.setup();
      templatePath = self.getTemplatePath("cwLayoutBackup", "backup");

      loader.loadControllerWithTemplate("cwLayoutBackup", $container, templatePath, function ($scope, $sce) {
        cwAPI.siteLoadingPageFinish();
        self.angularScope = $scope;
        $scope.cwApi = cwApi;
        $scope.ng = {};
        $scope.hasKeys = function (o) {
          return Object.keys(o).length > 0;
        };
        $scope.ng.backupInfo = backupCWProp[0]["JSON Information"][0];
        $scope.ng.backupInfo.name = self.object.name;
        let b = backupCWProp[1].Objects;
        let c = self.parseJSON(self.object.properties.currentjson)[1].Objects;

        $scope.ng.config = self.parseJSON(self.object.properties.configuration) ?? cwApi.customLibs.utils.getCustomLayoutConfiguration("cwBackup");

        $scope.ng.displayAll = true;
        $scope.getCDSForAssociatedObjects = function (ng, ao) {
          let ot = cwAPI.mm.getObjectTypeById(ao["Associated Object Type ID"]);
          let id = ao["Associated Object ID"];
          let item = {
            objectTypeScriptName: ot.scriptName,
            object_id: id,
            name: ng[ot.name][id]["Object Name"],
            properties: { name: ng[ot.name][id]["Object Name"], description: "" },
          };

          return $sce.trustAsHtml(cwAPI.customLibs.utils.getCustomDisplayString("{name}", item, "", false));
        };

        $scope.getCDSForOTAndID = function (ng, ot, id) {
          if (ng[ot] && ng[ot][id]) {
            let ots = cwAPI.mm.getObjectTypeById(ng[ot][id]["Object Type ID"]);
            let name = ng[ot][id]["Object Name"];
            let item = {
              objectTypeScriptName: ots.scriptName,
              object_id: id,
              name: name,
              properties: { name: name, description: "" },
            };
            return $sce.trustAsHtml(cwAPI.customLibs.utils.getCustomDisplayString("{name}", item, "", false));
          } else {
            return '<i style="color: red" class="fa fa-times" aria-hidden="true"></i>';
          }
        };
        $scope.getCenteredName = function (ng, ot, id) {
          return $sce.trustAsHtml("<div class='textcentered'>" + $scope.getCDSForOTAndID(ng, ot, id) + "</div>");
        };

        $scope.getPropertyValue = function (ng, ot, id, propertyName, noSCE) {
          let p;
          let value = "";
          if (ng[ot] && ng[ot][id]) {
            const objectType = cwApi.mm.getObjectType(ng[ot][id]["Object Type Script-Name"]);
            let property =
              objectType.properties[
              Object.keys(objectType.properties).find((p) => {
                return objectType.properties[p].name === propertyName;
              })
              ];

            if (propertyName == "Screenshot")
              return "<img src=" + ng[ot][id].Properties[propertyName].replace(/^\/[eE]volve\//g, cwApi.getServerPath()) + ">";

            let item = { objectTypeScriptname: objectType.scriptName, properties: {} };
            if (propertyName == "TYPE") {
              property = objectType.properties.type;
              value = ng[ot][id][property.name.toUpperCase()] ? ng[ot][id][property.name.toUpperCase()] : ng[ot][id][property.name];
            } else if (propertyName.toUpperCase() == "DESCRIPTION") {
              property = objectType.properties.description;
              value = ng[ot][id].Properties[property.name];
            } else {
              value = ng[ot][id].Properties[property.name];
            }

            switch (property.type) {
              case "Date":
                item.properties[property.scriptName] = value;
                break;
              case "Boolean":
                item.properties[property.scriptName] = value !== undefined ? true : false;
                break;
              case "URL":
                item.properties[property.scriptName] = value;
                break;
              case "Memo":
                item.properties[property.scriptName] = value;
                break;
              case "Lookup":
                let lookup = property.lookups.find((l) => l.name === value);
                if (lookup) {
                  item.properties[property.scriptName] = lookup.name;
                  item.properties[property.scriptName + "_id"] = lookup.id;
                } else {
                  item.properties[property.scriptName] = "__|UndefinedValue|__";
                  item.properties[property.scriptName + "_id"] = 0;
                }

                break;
              case "Integer":
              case "Double":
                item.properties[property.scriptName] = value ? value : 0;
                break;
              default:
                item.properties[property.scriptName] = value;
            }
            try {
              if (noSCE) return item.properties[property.scriptName];
              return $sce.trustAsHtml(
                cwApi.cwPropertiesGroups.getDisplayValue(
                  objectType.scriptName,
                  property.scriptName,
                  item.properties[property.scriptName],
                  item,
                  "properties"
                )
              );
            } catch (e) {
              return "<span></span>";
            }
          }
          return;
        };

        $scope.getAssociationOfCurrent = function (OT, vv, assoName, ao) {
          return $scope.ng.current[OT] &&
            $scope.ng.current[OT][vv.id] &&
            $scope.ng.current[OT][vv.id].Associations[assoName] &&
            $scope.ng.current[OT][vv.id].Associations[assoName][ao["Associated Object ID"]]
            ? $scope.ng.current[OT][vv.id].Associations[assoName][ao["Associated Object ID"]].Properties
            : [];
        };

        $scope.getAssociationPropertyValue = function (ass, label, propertyValue) {
          let p;
          const at = cwApi.mm.getObjectType(ass["Association Type Script-Name"]);
          const property = 
            at.properties[
            Object.keys(at.properties).find((ps) => {
              return at.properties[ps].name === label || (label === "Description" && ps === "description");
            })
            ];

          if (label == "TYPE") {
            let c = $scope.getCategoryLabel(ao["Association Type Script-Name"]);
            return p ? ao.Category || ao["Catégorie"] || ao["Categoria"] : "";
          }

          if (property.type == "Boolean") {
            let true_value = '<i class="fa fa-check green"><span class="hidden">' + jQuery.i18n.prop("global_true") + "</span></i>";

            let false_value = '<i class="fa fa-times red"><span class="hidden">' + jQuery.i18n.prop("global_false") + "</span></i>";

            p = propertyValue !== undefined ? true_value : false_value;
          } else p = propertyValue.replace(/T[0-9]+\:[0-9]+\:[0-9]+/, "");

          if (p === undefined) p = "";
          return "<span>" + $sce.trustAsHtml(p) + "</span>";
        };

        $scope.getAssociatedObjects = function (ng, ot, id, assoName) {
          if (ng[ot] && ng[ot][id] && ng[ot][id].Associations[assoName]) {
            let n = ng[ot][id].Associations[assoName];
            return Object.values(n)
              .map((r) => {
                let ot = cwAPI.mm.getObjectTypeById(r["Associated Object Type ID"]);
                let id = r["Associated Object ID"];
                r.name = ng[ot.name][id]["Object Name"];
                return r;
              })
              .sort((a, b) => a.name.localeCompare(b.name));
          } else return {};
        };

        $scope.keys = function (obj) {
          return obj ? Object.keys(obj) : null;
        };

        $scope.keyLength = function (obj) {
          return obj ? Object.keys(obj).length : 0;
        };
        $scope.checkAssociationExistance = function (ass) {
          let ot = cwAPI.mm.getObjectTypeById(ass["Associated Object Type ID"]);
          return $scope.ng.objectTypes[ot.name] !== undefined;
        };

        $scope.checkOTDiff = function (json1_, json2_) {
          let json1 = JSON.parse(angular.toJson(json1_));
          let json2 = JSON.parse(angular.toJson(json2_));
          let aa,
            bb,
            r = true;
          for (let o in json1) {
            aa = json1[o];
            bb = json2[o];
            if (r && bb && $scope.checkJSONDiff(aa, bb)) {
              r = false;
            }
          }
          return !r;
        };

        $scope.checkJSONDiff = function (json1, json2) {
          return !deepEqual(
            angular.fromJson(angular.toJson(json1).replace(/BAK_Diagram_/g, "CUR_Diagram_").replace(/,"extended":true/g, "").replace(/,"extended":false/g, "")),
            angular.fromJson(angular.toJson(json2).replace(/BAK_Diagram_/g, "CUR_Diagram_").replace(/,"extended":true/g, "").replace(/,"extended":false/g, ""))
          );
        };
        $scope.getCategoryLabel = function (ot) {
          let r = cwApi.mm.getProperty(ot, "type");
          return r ? r.name : undefined;
        };
        $scope.getAssoName = function (a) {
          return a["Association Type"];
        };

        $scope.checkNames = function (ot, id) {
          return $scope.ng.current[ot] && $scope.ng.current[ot][id] && $scope.ng.backup[ot] && $scope.ng.backup[ot][id]
            ? $scope.ng.backup[ot][id]["Object Name"] == $scope.ng.current[ot][id]["Object Name"]
            : false;
        };



        $scope.mergeUniqAndSort = function(a,b){
          return [...new Set(a.concat(b))].sort();
        }
        
        $scope.getDiagram = function (ng, ot, id, did) {
          return ng[ot] && ng[ot][id] && ng[ot][id].Diagrams[did] ? ng[ot][id].Diagrams[did] : "";
        };

        $scope.getDiagramImg = function (ng, ot, id, did) {
          return ng[ot] && ng[ot][id] && ng[ot][id].Diagrams[did]
            ? ng[ot][id].Diagrams[did].Screenshot.replace(/^\/[eE]volve\//g, cwApi.getServerPath()) + "?" + $scope.getRandom()
            : "";
        };
        $scope.getLevelArray = function () {
          let r = [...Array($scope.ng.config.level).keys()];
          return r;
        };

        $scope.lastMillis = new Date().getTime();
        $scope.getRandom = function () {
          var curMillis = new Date().getTime();
          if (curMillis - $scope.lastMillis > 5000) {
            $scope.lastMillis = curMillis;
          }
          return "?ran=" + $scope.lastMillis;
        };

        $scope.getDiagramImgComp = function (ng, ot, id, did) {
          return ng[ot] && ng[ot][id] && ng[ot][id].Diagrams[did]
            ? ng[ot][id].Diagrams[did].ScreenshotComp.replace(/^\/[eE]volve\//g, cwApi.getServerPath())
            : "";
        };

        $scope.getDiagramName = function (ng, ot, id, did) {
          return ng[ot] && ng[ot][id] && ng[ot][id].Diagrams[did] ? ng[ot][id].Diagrams[did].Name : "";
        };

        $scope.hasAssociationProperty = function (ng, OT, vvid, assoName, aoid) {
          return $scope.hasKeys(ng?.[OT]?.[vvid]?.Associations?.[assoName]?.[aoid]?.Properties);
        };

        $scope.reFormatAssociations = function (associations, ot, ng) {
          let r = {};

          if (jQuery.isEmptyObject(associations)) return {};
          if (!Array.isArray(associations)) return associations;
          associations.forEach(function (asso) {
            try {
              if (!r[asso["Association Type"]]) r[asso["Association Type"]] = {};
              asso.Properties.Description = asso.Description
              .replaceAll("&amp;", "&")
              .replaceAll("&lt;", "<")
              .replaceAll("&gt;", ">").trim();
              r[asso["Association Type"]][asso["Associated Object ID"]] = asso;

              asso.Properties.Category = asso.Category



              asso.targetScriptname = Object.keys(cwApi.mm.getMetaModel().objectTypes).find((o) => {
                return cwApi.mm.getMetaModel().objectTypes[o].Id.toString() === asso["Associated Object Type ID"];
              });
              let otTarget = cwAPI.mm.getObjectTypeById(asso["Associated Object Type ID"]);
              let id = asso["Associated Object ID"];
              if (!$scope.ng.objectTypes[ot].associations[asso["Association Type"]]) {
                $scope.ng.objectTypes[ot].associations[asso["Association Type"]] = asso;
              }
              // r.name = ng[otTarget.name][id]["Object Name"];
              asso.name = ng[otTarget.name][id]["Object Name"];

            }
            catch (e) { 
              console.log("Error while reformating association" + e)
            }
          });

          return r;
        };

        $scope.reFormatDiagrams = function (diagrams, obj) {
          let r = {};
          try {
            diagrams.forEach(function (d) {
              r[d["Diagram ID"]] = d;

              if (!obj.diagrams) {
                obj.diagrams = {};
              }
              if (!obj.diagrams[d["Diagram ID"]]) {
                obj.diagrams[d["Diagram ID"]] = d;
              }
            });
          } catch (e) {

          }
          return r;
        };

        $scope.compareDiagram = function (OT, id, did) {
          let iA = $scope.getDiagramImg($scope.ng.backup, OT, id, did);
          let iB = $scope.getDiagramImg($scope.ng.current, OT, id, did);

          if (true || window.document.documentMode) {
            let t = $scope.getDiagram($scope.ng.current, OT, id, did);
            let r = $scope.getDiagram($scope.ng.backup, OT, id, did);
            if (t) {
              t.ScreenshotComp = iB;
              t.matched = true;
            }
            if (r) {
              r.ScreenshotComp = iB;
              r.matched = true;
            }
            return;
          }
          /*var rembrandt = new Rembrandt({
          // `imageA` and `imageB` can be either Strings (file path on node.js,
          // public url on Browsers) or Buffers
          imageA: iA,
          imageB: iB,
  
          // Needs to be one of Rembrandt.THRESHOLD_PERCENT or Rembrandt.THRESHOLD_PIXELS
          thresholdType: Rembrandt.THRESHOLD_PERCENT,
          // The maximum threshold (0...1 for THRESHOLD_PERCENT, pixel count for THRESHOLD_PIXELS
          maxThreshold: 0.01,
          // Maximum color delta (0...1):
          maxDelta: 0.02,
          // Maximum surrounding pixel offset
          maxOffset: 0,
          renderComposition: true, // Should Rembrandt render a composition image?
          compositionMaskColor: Rembrandt.Color.RED, // Color of unmatched pixels
        });
        rembrandt
          .compare()
          .then(function (result) {
            let t = $scope.getDiagram($scope.ng.current, OT, id, did);
            if (t) {
              t.ScreenshotComp = result.compositionImage.src;
              t.matched = result;
              $scope.$apply();
            }
  
            // Note that `compositionImage` is an Image when Rembrandt.js is run in the browser environment
          })
          .catch(function (e) {
            console.error(e);
          });*/
        };

        $scope.getObjectTypeFromLevelFilter = function (lvlf) {
          return $scope.getKeys(lvlf).map(cwApi.mm.getObjectType);
        };

        $scope.getKeys = function (o) {
          return Object.keys(o);
        };

        $scope.cleanByLevel = function (lvl, json) {
          Object.keys(json).forEach((ots) => {
            let ot = json[ots];
            let r = Object.keys(ot).some((oid) => {
              return ot[oid].Levels.indexOf(lvl) !== -1;
            });
            if (r) $scope.ng.objectTypesForCurrentLevel[ots] = {};
          });
        };

        $scope.updateDataByFilterLevel = function (lvl) {
          $scope.ng.selectedDataFilterLevel = lvl;
          $scope.ng.objectTypesForCurrentLevel = {};
          $scope.cleanByLevel(lvl, $scope.ng.current);
          $scope.cleanByLevel(lvl, $scope.ng.backup);
        };

        $scope.analyzeOT = function (objectType) {
          console.log("Analyse" + objectType);
          let objects = {};
          if (!$scope.ng.objectTypes[objectType]) $scope.ng.objectTypes[objectType] = {};
          if (!$scope.ng.objectTypes[objectType].associations) $scope.ng.objectTypes[objectType].associations = {};

          // Parse Backup
          if ($scope.ng.backup[objectType] === undefined) {
            $scope.ng.objectTypes[objectType].addingObjectType = true;
            $scope.ng.objectTypes[objectType].addingObjects = true;
          } else {
            Object.keys($scope.ng.backup[objectType]).forEach(function (id, iter) {
              $scope.ng.objectTypes[objectType].scriptname = $scope.ng.backup[objectType][id]["Object Type Script-Name"].toLowerCase();
              //check properties
              if (!$scope.ng.objectTypes[objectType].properties) $scope.ng.objectTypes[objectType].properties = {};
              let description = $scope.ng.backup[objectType][id].Description ?? "";
              $scope.ng.backup[objectType][id]["Properties"].Description = description
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">");

              Object.keys($scope.ng.backup[objectType]?.[id]?.["Properties"] ?? []).forEach((pLabel) => {
                const ot = cwApi.mm.getObjectType($scope.ng.backup[objectType][id]["Object Type Script-Name"]);
                $scope.ng.objectTypes[objectType].properties[pLabel] =
                  ot.properties[
                  Object.keys(ot.properties).find((p) => {
                    return ot.properties[p].name === pLabel;
                  })
                  ];
              });

              if (objects[id] === undefined) {
                objects[id] = {};
                objects[id].object = $.extend(true, {}, $scope.ng.backup[objectType][id]);
              }

              if (
                $scope.ng.current[objectType] &&
                $scope.ng.objectTypes[objectType].missingObjects == undefined &&
                $scope.ng.current[objectType][id] === undefined
              ) {
                $scope.ng.objectTypes[objectType].missingObjects = true;
              }


              // Format Associations
              $scope.ng.backup[objectType][id].Associations = $scope.reFormatAssociations(
                $scope.ng.backup[objectType][id].Associations,
                objectType,
                $scope.ng.backup
              );

              // Format Diagrams
              $scope.ng.backup[objectType][id].Diagrams = $scope.reFormatDiagrams($scope.ng.backup[objectType][id].Diagrams, objects[id]);
            });
          }

          // Current
          if ($scope.ng.current[objectType] === undefined) {
            $scope.ng.objectTypes[objectType].missingObjectType = true;
            $scope.ng.objectTypes[objectType].missingObjects = true;
          } else {
            Object.keys($scope.ng.current[objectType]).forEach(function (id, iter) {
              if (!$scope.ng.objectTypes[objectType].properties) $scope.ng.objectTypes[objectType].properties = {};

              // description
              let description = $scope.ng.current[objectType][id].Description ?? "";
              $scope.ng.current[objectType][id]["Properties"].Description = description
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">");

              //check properties
              Object.keys($scope.ng.backup[objectType]?.[id]?.["Properties"] ?? []).forEach((pLabel) => {
                const ot = cwApi.mm.getObjectType($scope.ng.backup[objectType][id]["Object Type Script-Name"]);
                $scope.ng.objectTypes[objectType].properties[pLabel] =
                  ot.properties[
                  Object.keys(ot.properties).find((p) => {
                    return ot.properties[p].name === pLabel;
                  })
                  ];
              });

              if (objects[id] === undefined) objects[id] = { object: $scope.ng.current[objectType][id] };
              $scope.ng.objectTypes[objectType].scriptname = $scope.ng.current[objectType][id]["Object Type Script-Name"].toLowerCase();

              $.extend(true, objects[id].object.Properties, $scope.ng.current[objectType][id].Properties);

              if (
                $scope.ng.backup[objectType] &&
                $scope.ng.objectTypes[objectType].addingObjects == undefined &&
                $scope.ng.backup[objectType][id] === undefined
              ) {
                $scope.ng.objectTypes[objectType].addingObjects = true;
              }

              // Format Associations
              $scope.ng.current[objectType][id].Associations = $scope.reFormatAssociations(
                $scope.ng.current[objectType][id].Associations,
                objectType,
                $scope.ng.current
              );

              // Format Diagrams
              $scope.ng.current[objectType][id].Diagrams = $scope.reFormatDiagrams($scope.ng.current[objectType][id].Diagrams, objects[id]);
            });
          }
          // sort
          $scope.ng.objectTypes[objectType].objects = Object.values(objects)
            .sort(function (a, b) {
              return a.object["Object Name"].localeCompare(b.object["Object Name"]);
            })
            .map(function (o) {
              o.id = o.object["Object ID"];
              return o;
            });
        };

        $scope.init = function () {
          $scope.ng.objectTypes = {};
          $scope.ng.backup = self.sortByKey(b, "Object Type", $scope.ng);
          $scope.ng.current = self.sortByKey(c, "Object Type", $scope.ng);
          if ($scope.ng.config.method == "1") {
            $scope.updateDataByFilterLevel(0);
          }
        };

        $scope.init();
      });
    });
  };

  cwLayout.prototype.applyJavaScript = function () {
    let self = this;
    this.config = this.parseJSON(this.object.properties.configuration) ?? cwApi.customLibs.utils.getCustomLayoutConfiguration("cwBackup");
    if (this.object.properties.archive !== false) this.getRefreshDataFromWebService();
    else this.loadConfigurator();
  };

  cwLayout.prototype.loadConfigurator = function () {
    var self = this;

    cwApi.CwAsyncLoader.load("angular", function () {
      let loader = cwApi.CwAngularLoader,
        templatePath,
        $container = $("#cwLayoutBackup" + self.nodeID);
      loader.setup();
      templatePath = self.getTemplatePath("coffee", "cwBackup");

      loader.loadControllerWithTemplate("cwBackup", $container, templatePath, function ($scope, $sce) {
        self.angularScope = $scope;
        $scope.metamodel = cwAPI.mm.getMetaModel();
        $scope.OTs = [];
        $scope.objectTypes = cwAPI.mm.getMetaModel().objectTypes;
        for (let o in $scope.objectTypes) {
          if ($scope.objectTypes.hasOwnProperty(o) && !$scope.objectTypes[o].properties.hasOwnProperty("allowautomaticdeletion")) {
            $scope.OTs.push($scope.objectTypes[o]);
          }
        }
        $scope.saveButton = true;
        $scope.toggleArray = function (c, e) {
          var i = c.indexOf(e);
          if (i === -1) c.push(e);
          else c.splice(i, 1);
        };

        $scope.toggle = function (c, e) {
          if (c.hasOwnProperty(e)) delete c[e];
          else c[e] = true;
        };
        $scope.ng = {};

        $scope.ng.config = self.parseJSON(self.object.properties.configuration) ?? cwApi.customLibs.utils.getCustomLayoutConfiguration("cwBackup");

        $scope.hasKeys = function (o) {
          return Object.keys(o).length > 0;
        };
        $scope.objectToArray = function (objs) {
          if (!objs) return [];
          return Object.keys(objs).map(function (k) {
            return objs[k];
          });
        };

        $scope.getLevelArray = function () {
          let r = [...Array($scope.ng.config.level).keys()];
          return r;
        };

        $scope.otSelected = $scope.OTs[0].scriptName;

        if (!$scope.ng.config.ots) $scope.ng.config.ots = {};

        $scope.getSelectedObjectTypeForLevel = function () {
          let lvl = $scope.ng.config.levelFilter?.[$scope.ng.selectedDataFilterLevel];
          return lvl == undefined ? [] : Object.keys(lvl).map(cwApi.mm.getObjectType);
        };

        $scope.updateFilterDataConfig = function (i, ots) {
          if (!$scope.ng.config.levelFilter[i]) $scope.ng.config.levelFilter[i] = {};
          const c = $scope.ng.config.levelFilter[i];
          if (!c.hasOwnProperty(ots)) {
            c[ots] = {
              AssociationTypes: [],
            };
          } else {
            delete c[ots];
          }
        };

        $scope.updateConfig = function (c, view) {
          if ($scope.ng.config.ots.hasOwnProperty(view) === true || !$scope.ng.config.ots.hasOwnProperty(view)) {
            $scope.ng.config[view] = {
              associationScriptNameToExclude: [],
              propertyScriptNameToExclude: [
                "cwtotalcomment",
                "cwaveragerating",
                "whoowns",
                "whoupdated",
                "whocreated",
                "whencreated",
                "whenupdated",
                "exportflag",
                "id",
                "uniqueidentifier",
                "template",
              ],
            };
          }
          $scope.toggle(c, view);
        };

        $scope.getAssociationTargetObjectType = function (otSelected) {
          var assoTypes = $scope.metamodel.objectTypes[otSelected].AssociationTypes;
          if (!assoTypes) return [];
          const r = {};
          assoTypes.forEach((ass) => {
            let s = ass.TargetObjectTypeScriptName.toLowerCase();
            r[s] = { name: cwAPI.mm.getObjectType(s).name, scriptname: s };
          });
          $scope.associationTargetOT = Object.keys(r).map((k) => r[k]);
        };

        $scope.getAssociationTargetObjectType($scope.otSelected);

        $scope.save = function () {
          self.saveConfiguration($scope);
        };
      });
    });
  };

  cwLayout.prototype.saveConfiguration = function ($scope) {
    var changeset, sourceItem, targetItem;
    sourceItem = {
      associations: {},
      displayNames: {
        configuration: "Configuration",
      },
      properties: {
        configuration: this.object.properties.configuration,
      },
    };
    targetItem = {
      associations: {},
      displayNames: {
        configuration: "Configuration",
      },
      properties: {
        configuration: angular.toJson($scope.ng.config),
      },
    };
    cwApi.pendingChanges.clear();
    changeset = new cwApi.CwPendingChangeset(this.object.objectTypeScriptName, this.object.object_id, this.object.name, true, 1);
    changeset.compareAndAddChanges(sourceItem, targetItem);
    cwApi.pendingChanges.addChangeset(changeset);
    cwApi.pendingChanges.sendAsChangeRequest(
      undefined,
      function (response) {
        if (cwApi.statusIsKo(response)) {
          cwApi.notificationManager.addNotification($.i18n.prop("editmode_someOfTheChangesWereNotUpdated"), "error");
        } else {
          cwApi.notificationManager.addNotification($.i18n.prop("editmode_yourChangeHaveBeenSaved"));
        }
      },
      function (error) {
        cwApi.notificationManager.addNotification(error.status + " - " + error.responseText, "error");
      }
    );
  };

  cwApi.cwLayouts.cwBackup = cwLayout;
})(cwAPI, jQuery);
