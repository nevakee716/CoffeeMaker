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

  cwCoffeeMaker.prototype.controller_duplicateButton = function($container, templatePath, $scope) {
    var objectpages = [];
    let config = $scope.config;
    for (let v in $scope.views) {
      if ($scope.views.hasOwnProperty(v)) {
        if ($scope.views[v].type === "Single" && $scope.views[v].name.indexOf("|>B")) objectpages.push($scope.views[v]);
      }
    }
    $scope.currentView = objectpages[0];
    $scope.objectpages = objectpages;

    $scope.updateConfig = function(c, view) {
      $scope.toggle(c, view);
      if ($scope.config.hasOwnProperty(view) === false) {
        $scope.config[view] = {
          associationScriptNameToExclude: ["anyobjectexplodedasdiagram", "anyobjectshownasshapeindiagram"],
          propertyScriptNameToExclude: ["cwtotalcomment", "cwaveragerating", "whoowns", "whoupdated", "whocreated", "whencreated", "whenupdated", "exportflag", "id", "datevalidated", "uniqueidentifier", "template"],
          associationToTheMainObject: {},
        };
      }
    };

    return;
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
