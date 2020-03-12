/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */
/*global cwAPI, jQuery */
(function(cwApi, $) {
  "use strict";
  if (cwApi && cwApi.cwLayouts && cwApi.cwLayouts.cwCoffeeMaker) {
    var cwCoffeeMaker = cwApi.cwLayouts.cwCoffeeMaker;
  } else {
    // constructor
    var cwCoffeeMaker = function(options, viewSchema) {
      cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema); // heritage
      cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations
      this.construct(options);
    };
  }

  cwCoffeeMaker.prototype.controller_homePage = function($container, templatePath, $scope) {
    $scope.objectpages = [];
    let config = $scope.config;
    if (config.columns === undefined) config.columns = [];
    $scope.objectTypes = cwAPI.mm.getMetaModel().objectTypes;
    $scope.OT = [];
    for (let o in $scope.objectTypes) {
      if ($scope.objectTypes.hasOwnProperty(o) && !$scope.objectTypes[o].properties.hasOwnProperty("allowautomaticdeletion")) {
        $scope.OT.push($scope.objectTypes[o]);
      }
    }
    for (let v in $scope.views) {
      if ($scope.views.hasOwnProperty(v)) {
        if ($scope.views[v].type === "Single" && $scope.views[v].name.indexOf("|>B")) $scope.objectpages.push($scope.views[v]);
      }
    }

    $scope.objDescription = {};
    $scope.op = {};
    $scope.toggleHM = function(display, e) {
      if (display.objectTypeToSelect === undefined) display.objectTypeToSelect = {};

      if (display.objectTypeToSelect.hasOwnProperty(e)) display.objectTypeToSelect[e].enable = !display.objectTypeToSelect[e].enable;
      else {
        display.objectTypeToSelect[e] = { enable: true, cds: "{name}" };
      }
    };
    $scope.sortOT = function(o) {
      return $scope.objectTypes[o].name;
    };

    $scope.addColumn = function() {
      $scope.config.columns.push({ label: "Column " + $scope.config.columns.length, displays: [] });
      $scope.selectColumn($scope.config.columns.length - 1);
    };

    $scope.removeColumn = function(i) {
      $scope.config.columns.splice(i, 1);
    };

    $scope.selectColumn = function(i) {
      $scope.config.columns.forEach(function(c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.addDisplay = function(col) {
      col.displays.push({ label: "Display " + col.displays.length, order: col.displays.length * 10 });
      $scope.selectDisplay(col, col.displays.length - 1);
    };

    $scope.removeDisplay = function(col, i) {
      col.displays.splice(i, 1);
    };

    $scope.selectDisplay = function(col, i) {
      col.displays.forEach(function(c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    //cwPropertiesGroups.formatMemoProperty(value);
    $scope.getObjects = function(icol, idisp, o) {
      let query = {
        ObjectTypeScriptName: o.toUpperCase(),
        PropertiesToLoad: ["NAME"],
        Where: [],
      };

      cwApi.CwDataServicesApi.send("flatQuery", query, function(err, res) {
        if (err) {
          console.log(err);
          return;
        }
        $scope.objDescription[icol + "_" + idisp] = res;
        $scope.$apply();
      });
    };

    $scope.addFilter = function(config) {
      if (config.filters === undefined) {
        config.filters = [];
      }
      config.filters.push({});
    };
    $scope.getPropertyDataType = function(ot, scriptname) {
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
          default:
            return "text";
        }
      } else return "number";
    };
    $scope.processFilter = function(f) {
      let s;
      if (f.id.indexOf("prop") !== -1) {
        s = f.id.split("prop_");
        f.type = "property";
        delete f.nodeID;
        f.scriptname = s[1];
      } else {
        s = f.id.split("asso_");
        delete f.scriptname;
        f.type = "association";
        f.nodeID = s[1];
      }
    };

    //if ($scope.config.descriptionObjectTypeScriptname) $scope.getObjects($scope.config.descriptionObjectTypeScriptname);
    return;
  };
  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
