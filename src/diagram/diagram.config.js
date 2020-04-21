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
    this.loadDiagramTemplate("z_diagram_template", function () {
      $scope.$apply();
    });
    this.$scope = $scope;
    $scope.selectedTemplateID = 0;
    $scope.diagramTemplate = [];

    $scope.selectTemplate = function (i) {
      $scope.selectedTemplateID = i;
    };

    return;
  };

  cwCoffeeMaker.prototype.getPaletteData = function (palettes) {
    var result = {};
    Object.values(palettes).forEach(function (p) {
      if (bannedObjectTypeScriptName.indexOf(p.PaletteObjectTypeScriptName) !== -1) return;
      if (!result[p.PaletteObjectTypeScriptName.toLowerCase()]) {
        result[p.PaletteObjectTypeScriptName.toLowerCase()] = {
          displayName: cwApi.getObjectTypeName(p.PaletteObjectTypeScriptName.toLowerCase()),
          regions: [],
        };
      }
      p.Regions.forEach(function (r) {
        if (r.RegionData && r.RegionData["AssociationsTypeDisplayName"]) {
          result[p.PaletteObjectTypeScriptName.toLowerCase()].regions.push({
            scriptname: r.RegionData.AssociationTypeScriptName,
            displayName: r.RegionData.AssociationsTypeDisplayName,
          });
        } else if (r.RegionTypeString === "VisualizationUsingPaletteValue") {
          result[p.PaletteObjectTypeScriptName.toLowerCase()].regions.push({
            scriptname: r.SourcePropertyTypeScriptName,
            displayName: cwAPI.mm.getProperty(p.PaletteObjectTypeScriptName.toLowerCase(), r.SourcePropertyTypeScriptName).name,
          });
        } else if (r.RegionTypeString === "MultipleProperties") {
          r.PropertyInformation.PropTypes.forEach(function (rp) {
            result[p.PaletteObjectTypeScriptName.toLowerCase()].regions.push({
              scriptname: rp.ScriptName,
              displayName: cwAPI.mm.getProperty(p.PaletteObjectTypeScriptName.toLowerCase(), rp.ScriptName).name,
            });
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
        idToLoad.forEach(function (id) {
          var url = cwApi.getLiveServerURL() + "Diagram/Vector/" + id + "?" + cwApi.getDeployNumber();
          $.getJSON(url, function (json) {
            if (json.status === "Ok") {
              json.result.data = self.getPaletteData(json.result.diagram.paletteEntries);
              self.$scope.diagramTemplate.push(json.result);
              console.log(" Load Diagram Template ID : " + id);
            } else {
              console.log("Failed to Load Diagram Template ID : " + id);
            }
            idLoaded = idLoaded + 1;
            if (idLoaded === idToLoad.length) callback();
          });
        });
      }
    });
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
