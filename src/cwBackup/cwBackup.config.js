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

  cwCoffeeMaker.prototype.controller_cwBackup = function ($container, templatePath, $scope) {
    $scope.currentOT = $scope.OTs[0];
    if (!$scope.ng.config.ots) $scope.ng.config.ots = {};

    $scope.updateConfig = function (c, view) {
      if ($scope.ng.config.ots.hasOwnProperty(view) === true || !$scope.ng.config.ots.hasOwnProperty(view)) {
        $scope.ng.config[view] = {
          associationScriptNameToExclude: ["anyobjectexplodedasdiagram", "anyobjectshownasshapeindiagram"],
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

    return;
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
