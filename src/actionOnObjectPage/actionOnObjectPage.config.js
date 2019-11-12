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

  cwCoffeeMaker.prototype.controller_actionOnObjectPage = function($container, templatePath, $scope) {
    var objectpages = [];
    var self = this;
    let config = $scope.config;
    for (let v in $scope.views) {
      if ($scope.views.hasOwnProperty(v)) {
        if ($scope.views[v].type === "Single" && $scope.views[v].name.indexOf("|>B")) objectpages.push($scope.views[v]);
      }
    }

    $scope.selectOperation = function(i) {
      $scope.currentConfig.map(function(c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.selectConfig = function(i) {
      if (!$scope.config[$scope.currentView.cwView]) {
        $scope.config[$scope.currentView.cwView] = [];
      }
      $scope.currentConfig = $scope.config[$scope.currentView.cwView];
      $scope.currentSchema = cwApi.ViewSchemaManager.getPageSchema($scope.currentView.cwView);
      $scope.objectType = cwAPI.mm.getObjectType($scope.currentView.rootObjectType);
      $scope.rootNode = $scope.currentSchema.NodesByID[$scope.currentSchema.RootNodesId];
      $scope.properties = self.getPropertiesFromNode($scope.rootNode);

      $scope.currentRedirectViews = [];
      cwApi.cwConfigs.SingleViewsByObjecttype[$scope.currentView.rootObjectType].forEach(function(v) {
        $scope.currentRedirectViews.push(cwApi.getView(v));
      });
    };

    $scope.addOperation = function() {
      $scope.currentConfig.push({ label: "New Operation", order: $scope.currentConfig.length * 10, filters: [], tabs: [], propertygroups: [], views: [] });
      $scope.selectOperation($scope.currentConfig.length - 1);
    };

    $scope.removeOperation = function(i) {
      $scope.currentConfig.splice(i, 1);
    };

    $scope.addFilter = function(i) {
      $scope.currentConfig[i].filters.push({});
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

    $scope.bootstrapFilter = function(id, icon) {
      window.setTimeout(function(params) {
        $("#" + id).selectpicker();
        $("#" + id).selectpicker("val", icon);
      }, 1000);
    };

    $scope.currentView = objectpages[0];
    $scope.objectpages = objectpages;
    $scope.selectConfig(0);
    $scope.typeOftarget = ["tabs", "propertygroups", "views", "cssClass", "htmlId", "jQuerySelector"];
    $scope.actionType = ["hide", "highlight", "displaymsg"];
    return;
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
