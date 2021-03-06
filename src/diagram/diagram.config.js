/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */
/*global cwAPI, jQuery */
(function (cwApi, $) {
  "use strict";

  var bannedObjectTypeScriptName = ["EVENTRESULT", "PROCESSBREAK", "CONNECTORSET", "FREETEXTOBJECT", "CONNECTOR", "HIERARCHYLINK"];

  if (cwApi && cwApi.cwLayouts && cwApi.cwLayouts.cwCoffeeMaker) {
    var cwCoffeeMaker = cwApi.cwLayouts.cwCoffeeMaker;
  } else {
    // constructor
    var cwCoffeeMaker = function (options, viewSchema) {
      cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema); // heritage
      cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations
      this.construct(options);
    };
  }

  cwCoffeeMaker.prototype.controller_diagram = function ($container, templatePath, $scope) {
    cwAPI.siteLoadingPageStart();
    this.loadDiagramTemplate("z_diagram_template", function () {
      cwAPI.siteLoadingPageFinish();
      $scope.$apply();
    });
    var views = cwAPI.cwConfigs.Pages;
    $scope.diagramPopout = [];
    for (let v in views) {
      if (views.hasOwnProperty(v)) {
        if (views[v].type === "DiagramPopout" && views[v].rootObjectType === "diagram") $scope.diagramPopout.push(views[v]);
      }
    }

    this.$scope = $scope;
    $scope.selectedTemplateID = 0;
    $scope.diagramTemplate = [];

    $scope.selectTemplate = function (i) {
      $scope.selectedTemplateID = i;
    };

    $scope.getDateRegion = function (regions, scriptname) {
      return regions.filter(function (r) {
        let p = cwAPI.mm.getProperty(scriptname, r.scriptname);
        return p && p.type == "Date";
      });
    };

    $scope.updateStepValue = function (o) {
      if (o.DrillDownFilteringActivated == false) {
        delete o.drillDownFilters;
      }
    };

    $scope.updateDrillDownFilteringValue = function (o) {
      if (o.stepActivated == false) {
        delete o.steps;
      }
    };

    $scope.addStep = function (o) {
      if (!o.steps) {
        o.steps = [
          {
            name: "out",
            color: "#FF2222",
          },
        ];
      }
      o.steps.splice(-1, 0, {
        name: "New Step",
        color: "#FF2222",
      });
    };
    $scope.deleteStep = function (o, index) {
      o.steps.splice(index, 1);
    };

    $scope.addDrillDownFilter = function (o) {
      if (!o.drillDownfilters) {
        o.drillDownfilters = [];
      }
      o.drillDownfilters.push({});
    };
    $scope.deleteDrillDownFilter = function (o, index) {
      o.drillDownfilters.splice(index, 1);
    };

    $scope.isPropertyInRegion = function (propertyScriptname, regions) {
      return regions.some(function (r) {
        return r.scriptname === propertyScriptname;
      });
    };
    $scope.processFilter = function (f) {
      let s;
      if (f.id.indexOf("prop") !== -1) {
        s = f.id.split("prop_");
        f.type = "property";
        delete f.nodeID;
        f.scriptname = s[1];
        f.Asset = s[1];
      } else {
        s = f.id.split("asso_");
        delete f.scriptname;
        f.type = "association";
        f.nodeID = s[1];
      }
    };
  };
  cwCoffeeMaker.prototype.getPaletteData = function (palettes) {
    let result = {};

    Object.values(palettes).forEach(function (p) {
      if (bannedObjectTypeScriptName.indexOf(p.PaletteObjectTypeScriptName) !== -1) return;
      if (!result[p.PaletteObjectTypeScriptName.toLowerCase()]) {
        result[p.PaletteObjectTypeScriptName.toLowerCase()] = {
          displayName: cwApi.getObjectTypeName(p.PaletteObjectTypeScriptName.toLowerCase()),
          scriptname: p.PaletteObjectTypeScriptName.toLowerCase(),
          regions: [],
        };
      }
      let scriptname = {};
      p.Regions.forEach(function (r) {
        if (r.RegionData && r.RegionData["AssociationsTypeDisplayName"]) {
          if (!scriptname[r.RegionData.AssociationTypeScriptName]) {
            result[p.PaletteObjectTypeScriptName.toLowerCase()].regions.push({
              scriptname: r.RegionData.AssociationTypeScriptName,
              displayName: r.RegionData.AssociationsTypeDisplayName,
            });
            scriptname[r.RegionData.AssociationTypeScriptName] = true;
          }
        } else if (
          r.RegionTypeString === "LocalPropertyActualValue" ||
          r.RegionTypeString === "PropertiesAsDateRange" ||
          r.RegionTypeString === "VisualizationUsingPaletteValue" ||
          r.RegionTypeString === "GaugeUsingPaletteValue" ||
          r.RegionTypeString === "GaugeUsingReferenceProperty" ||
          r.RegionTypeString === "VisualizationUsingReferenceProperty"
        ) {
          if (!scriptname[r.SourcePropertyTypeScriptName.toLowerCase()]) {
            result[p.PaletteObjectTypeScriptName.toLowerCase()].regions.push({
              scriptname: r.SourcePropertyTypeScriptName.toLowerCase(),
              displayName: cwAPI.mm.getProperty(p.PaletteObjectTypeScriptName.toLowerCase(), r.SourcePropertyTypeScriptName).name,
            });
            scriptname[r.SourcePropertyTypeScriptName.toLowerCase()] = true;
          }
        } else if (r.RegionTypeString === "MultipleProperties") {
          r.PropertyInformation.PropTypes.forEach(function (rp) {
            if (!scriptname[rp.ScriptName.toLowerCase()]) {
              let cwProperty = cwAPI.mm.getProperty(p.PaletteObjectTypeScriptName.toLowerCase(), rp.ScriptName);
              if (cwProperty) {
                result[p.PaletteObjectTypeScriptName.toLowerCase()].regions.push({
                  scriptname: rp.ScriptName.toLowerCase(),
                  displayName: cwProperty.name,
                });
              }
              scriptname[rp.ScriptName] = true;
            }
          });
        }
      });
    });
    return Object.values(result);
  };

  cwCoffeeMaker.prototype.loadDiagramTemplate = function (templateListUrl, callback) {
    var self = this;
    this.diagramTemplate = {};
    var idToLoad = [];
    var idLoaded = 0;
    $.getJSON(cwApi.getLiveServerURL() + "page/" + templateListUrl + "?" + cwApi.getDeployNumber(), function (json) {
      if (json) {
        for (var associationNode in json) {
          if (json.hasOwnProperty(associationNode)) {
            for (var i = 0; i < json[associationNode].length; i += 1) {
              idToLoad.push(json[associationNode][i].object_id);
            }
          }
        }

        self.getBatchOfDiagram(idToLoad, 10, callback);
      }
    });
  };

  cwCoffeeMaker.prototype.getBatchOfDiagram = function (idToLoad, batchSize, callback) {
    var self = this;
    let idLoaded = 0;
    for (let i = 0; i < Math.min(idToLoad.length, batchSize); i++) {
      let id = idToLoad[i];
      let url = cwApi.getLiveServerURL() + "Diagram/Vector/" + id + "?" + cwApi.getDeployNumber();

      $.getJSON(url, function (json) {
        if (json.status === "Ok") {
          json.result.data = self.getPaletteData(json.result.diagram.paletteEntries);
          self.$scope.diagramTemplate.push(json.result);
          console.log(" Load Diagram Template ID : " + id);
        } else {
          console.log("Failed to Load Diagram Template ID : " + id);
        }
        idLoaded = idLoaded + 1;
        if (idLoaded === Math.min(idToLoad.length, batchSize)) {
          idToLoad = idToLoad.slice(Math.min(idToLoad.length, batchSize));
          if (idToLoad.length === 0) callback();
          else self.getBatchOfDiagram(idToLoad, batchSize, callback);
        }
      });
    }
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
