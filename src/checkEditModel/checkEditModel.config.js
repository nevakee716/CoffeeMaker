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

  cwCoffeeMaker.prototype.controller_checkEditModel = function($container, templatePath, $scope) {
    var objectpages = [];
    var indexPages = [];
    var self = this;
    let config = $scope.config;
    for (let v in $scope.views) {
      if ($scope.views.hasOwnProperty(v)) {
        if ($scope.views[v].type === "Single" && $scope.views[v].name.indexOf("|>B")) objectpages.push($scope.views[v]);
        if ($scope.views[v].type === "Index" && $scope.views[v].name.indexOf("|>B")) indexPages.push($scope.views[v]);
      }
    }
    $scope.roles = [];
    let url = cwApi.getIndexViewDataUrl("index_gov_roles");
    $.getJSON(url, function(json) {
      if (json.cw_role) {
        $scope.roles = json.cw_role;
        $scope.$apply();
      }
    });
    $scope.indexUniqueOption = true;
    $scope.indexpages = indexPages;
    $scope.currentView = objectpages[0];
    $scope.objectpages = objectpages;
    $scope.associations = [];
    $scope.properties = [];
    $scope.updateCurrentView = function(view) {
      let propertiesScriptnames = {};
      $scope.properties = [];
      let schema = cwAPI.ViewSchemaManager.getPageSchema(view.cwView);
      let rootSchema = schema.NodesByID[schema.RootNodesId];
      $scope.associations = rootSchema.AssociationsTargetObjectTypes;
      let pgSchema = rootSchema.PropertiesGroups;
      for (let pgk in pgSchema) {
        if (pgSchema[pgk]) {
          pgSchema[pgk].properties.forEach(function(p) {
            if (!propertiesScriptnames.hasOwnProperty(p)) {
              propertiesScriptnames[p] = true;
              $scope.properties.push(cwAPI.mm.getProperty(view.rootObjectType, p));
            }
          });
        }
      }
    };
    $scope.updateCurrentView($scope.currentView);
    return;
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
