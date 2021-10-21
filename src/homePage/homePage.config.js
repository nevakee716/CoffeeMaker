/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */
/*global cwAPI, jQuery */
(function (cwApi, $) {
  "use strict";
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

  cwCoffeeMaker.prototype.controller_homePage = function ($container, templatePath, $scope) {
    $scope.objectpages = [];
    $scope.cwUser_pages = [];
    $scope.indexpages = [];
    let config = $scope.ng.config;
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
        if ($scope.views[v].type === "Index" && $scope.views[v].name.indexOf("|>B")) $scope.indexpages.push($scope.views[v]);
        if ($scope.views[v].type === "Single" && $scope.views[v].name.indexOf("|>B") && $scope.views[v].rootObjectType === "cw_user")
          $scope.cwUser_pages.push($scope.views[v]);
      }
    }

    $scope.objDescription = {};
    $scope.op = {};
    $scope.toggleHM = function (display, e) {
      if (display.objectTypeToSelect === undefined) display.objectTypeToSelect = {};

      if (display.objectTypeToSelect.hasOwnProperty(e)) display.objectTypeToSelect[e].enable = !display.objectTypeToSelect[e].enable;
      else {
        display.objectTypeToSelect[e] = { enable: true, cds: "{name}" };
      }
    };
    $scope.sortOT = function (o) {
      return $scope.objectTypes[o].name;
    };

    $scope.addColumn = function () {
      $scope.ng.config.columns.push({ label: "Column " + $scope.ng.config.columns.length, displays: [] });
      $scope.selectColumn($scope.ng.config.columns.length - 1);
    };

    $scope.removeColumn = function (i) {
      $scope.ng.config.columns.splice(i, 1);
    };

    $scope.selectColumn = function (i) {
      $scope.ng.config.columns.forEach(function (c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.reOrderColumns = function () {
      $scope.ng.config.columns.sort(function (a, b) {
        return a.order - b.order;
      });
    };

    $scope.addDisplay = function (col) {
      col.displays.push({ label: "Display " + col.displays.length, order: col.displays.length * 10 });
      $scope.selectDisplay(col, col.displays.length - 1);
    };

    $scope.removeDisplay = function (col, i) {
      col.displays.splice(i, 1);
    };

    $scope.selectDisplay = function (col, i) {
      col.displays.forEach(function (c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.initSortProperties = function (display) {
      if (display.sortProperties === undefined) display.sortProperties = {};
    };
    $scope.reOrderDisplays = function (col) {
      col.displays.sort(function (a, b) {
        return a.order - b.order;
      });
    };

    $scope.addLinkBox = function (display) {
      if (display.linksToDisplay === undefined) display.linksToDisplay = [];
      display.linksToDisplay.push({});
    };
    //cwPropertiesGroups.formatMemoProperty(value);
    $scope.getObjects = function (icol, idisp, o) {
      if (o === undefined) return;
      let query = {
        ObjectTypeScriptName: o.toUpperCase(),
        PropertiesToLoad: ["NAME"],
        Where: [],
      };

      cwApi.CwDataServicesApi.send("flatQuery", query, function (err, res) {
        if (err) {
          console.log(err);
          return;
        }
        $scope.objDescription[icol + "_" + idisp] = res;
        $scope.$apply();
      });
    };

    $scope.addFilter = function (config) {
      if (config.filters === undefined) {
        config.filters = [];
      }
      config.filters.push({});
    };

    $scope.processFilter = function (f) {
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

    $scope.getNodeFromObjectView = function (view) {
      let v = cwAPI.getViewsSchemas()[view];
      let c = v.NodesByID[v.RootNodesId].SortedChildren;
      if (c && c.length > 0) {
        return v.NodesByID[c[0].NodeId];
      }
    };

    $scope.getNodeNumerFromObjectView = function (view) {
      let v = cwAPI.getViewsSchemas()[view];
      let c = v.NodesByID[v.RootNodesId].SortedChildren;
      return c ? c.length : 0;
    };

    $scope.getRootObjectTypeFromObjectView = function (view) {
      let node = $scope.getNodeFromObjectView(view);
      return cwApi.mm.getObjectType(node.ObjectTypeScriptName);
    };
    return;
  };
  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
