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
    if (!$scope.ng.config.hardcoded) $scope.ng.config.hardcoded = [];

    for (let o in $scope.objectTypes) {
      if ($scope.objectTypes.hasOwnProperty(o) && !$scope.objectTypes[o].properties.hasOwnProperty("allowautomaticdeletion")) {
        $scope.OTs.push($scope.objectTypes[o]);
      }
    }

    $scope.getProperties = function (types) {
      let result = [];
      let prop = $scope.objectTypes[$scope.ng.selectedObjectTypeScriptname].properties;
      for (let p in prop) {
        if (prop.hasOwnProperty(p) && types.indexOf(prop[p].type) !== -1) {
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
    $scope.addStep = function (objectTypesScriptname, propertyTypeScriptname) {
      if (!$scope.ng.config[objectTypesScriptname]) $scope.ng.config[objectTypesScriptname] = {};
      if (!$scope.ng.config[objectTypesScriptname][propertyTypeScriptname]) $scope.ng.config[objectTypesScriptname][propertyTypeScriptname] = {};
      if (!$scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps)
        $scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps = [];
      $scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps.push({});
    };
    $scope.deleteStep = function (objectTypesScriptname, propertyTypeScriptname, index) {
      $scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps.splice(index, 1);
      if ($scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps.length === 0) {
        delete $scope.ng.config[objectTypesScriptname][propertyTypeScriptname];
      }
    };

    $scope.addMapping = function () {
      $scope.ng.config.hardcoded.push({});
    };
    $scope.deleteStep = function (index) {
      delete $scope.ng.config.hardcoded.splice(index, 1);
    };

    $scope.manageUndefined = function (value) {
      return value === cwApi.getLookupUndefinedValue() ? (value = $.i18n.prop("global_undefined")) : value;
    };

    return;
  };
  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
