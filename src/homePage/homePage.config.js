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
    var objectpages = [];
    let config = $scope.config;
    $scope.objectTypes = cwAPI.mm.getMetaModel().objectTypes;
    $scope.OT = [];
    for (let o in $scope.objectTypes) {
      if ($scope.objectTypes.hasOwnProperty(o) && !$scope.objectTypes[o].properties.hasOwnProperty("allowautomaticdeletion")) {
        $scope.OT.push($scope.objectTypes[o]);
      }
    }

    $scope.OTsSelected = Object.keys($scope.config.objectTypeToSelect);
    $scope.op = {};
    $scope.toggleHM = function(c, e) {
      if (c.hasOwnProperty(e)) c[e].enable = !c[e].enable;
      else {
        c[e] = { enable: true, cds: "{name}" };
      }
      $scope.OTsSelected = Object.keys($scope.config.objectTypeToSelect);
    };
    $scope.sortOT = function(o) {
      return $scope.objectTypes[o].name;
    };

    //cwPropertiesGroups.formatMemoProperty(value);
    $scope.getObjects = function(o) {
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
        $scope.objDescription = res;
        $scope.$apply();
      });
    };

    if ($scope.config.descriptionObjectTypeScriptname) $scope.getObjects($scope.config.descriptionObjectTypeScriptname);
    return;
  };
  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
