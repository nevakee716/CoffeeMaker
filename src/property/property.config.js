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

  cwCoffeeMaker.prototype.controller_property = function ($container, templatePath, $scope) {
    $scope.objectTypes = cwAPI.mm.getMetaModel().objectTypes;
    $scope.OTs = [];
    $scope.ng = {};
    for (let o in $scope.objectTypes) {
      if ($scope.objectTypes.hasOwnProperty(o) && !$scope.objectTypes[o].properties.hasOwnProperty("allowautomaticdeletion")) {
        $scope.OTs.push($scope.objectTypes[o]);
      }
    }

    $scope.getProperties = function (type) {
      let result = [];
      let prop = $scope.objectTypes[$scope.ng.selectedObjectTypeScriptname].properties;
      for (let p in prop) {
        if (prop.hasOwnProperty(p) && prop[p].type == type) {
          result.push(prop[p]);
        }
      }
      return result;
    };

    $scope.bootstrapFilter = function (id, icon) {
      // repeat with the interval of 2 seconds
      let timerId = window.setInterval(function (params) {
        let a = $("#" + id).selectpicker();

        $("#" + id).selectpicker("val", icon);
        if (a.length > 0) clearInterval(timerId);
      }, 1000);
    };

    return;
  };
  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
