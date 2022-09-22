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
    $scope.otSelected = $scope.OTs[0].scriptName;

    if (!$scope.ng.config.ots) $scope.ng.config.ots = {};
    if (!$scope.ng.config.levelFilter) $scope.ng.config.levelFilter = {};
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
    $scope.getLevelArray = function () {
      let r = [...Array($scope.ng.config.level).keys()];
      r.shift();
      return r;
    };

    $scope.getAssociationTargetObjectType($scope.otSelected);
    return;
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
