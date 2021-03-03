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
    console.log("property controller");
    $scope.objectTypes = cwAPI.mm.getMetaModel().objectTypes;

    $scope.indexPages = [];

    for (let v in $scope.views) {
      if ($scope.views.hasOwnProperty(v)) {
        if ($scope.views[v].type === "Index" && $scope.views[v].name.indexOf("|>B")) $scope.indexPages.push($scope.views[v]);
      }
    }

    $scope.focused = -1;
    if (!$scope.ng.config.hardcoded) $scope.ng.config.hardcoded = [];

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

    $scope.bootstrapFilter = function (id, icon, open) {
      // repeat with the interval of 2 seconds
      console.log("initBootstrap");
      let timerId = window.setInterval(function (params) {
        console.log("check " + id);
        let q = $("#" + id);
        if (q.length > 0) clearInterval(timerId);
        q.selectpicker();

        q.selectpicker("val", icon);
        if (open) {
          q.selectpicker("toggle");
          q.on("hide.bs.select", function () {
            console.log("Hide Focus");
            $scope.focused = -1;
          });
        }
      }, 20);
    };

    $scope.setFocus = function (index) {
      $scope.focused = index;
      console.log("Set Focus");
    };

    $scope.addStep = function (objectTypesScriptname, propertyTypeScriptname) {
      if (!$scope.ng.config[objectTypesScriptname]) $scope.ng.config[objectTypesScriptname] = {};
      if (!$scope.ng.config[objectTypesScriptname][propertyTypeScriptname]) $scope.ng.config[objectTypesScriptname][propertyTypeScriptname] = {};
      if (!$scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps)
        $scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps = [];
      $scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps.push({});
      $scope.ng.config[objectTypesScriptname][propertyTypeScriptname].extended = true;
    };
    $scope.deleteNumericStep = function (objectTypesScriptname, propertyTypeScriptname, index) {
      $scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps.splice(index, 1);
      if ($scope.ng.config[objectTypesScriptname][propertyTypeScriptname].steps.length === 0) {
        delete $scope.ng.config[objectTypesScriptname][propertyTypeScriptname];
      }
    };

    $scope.addMapping = function () {
      $scope.ng.config.hardcoded.push({ icon: "fa fa-question" });
    };
    $scope.deleteHarcodedMapping = function (index) {
      delete $scope.ng.config.hardcoded.splice(index, 1);
    };

    $scope.manageUndefined = function (value) {
      return value === cwApi.getLookupUndefinedValue() ? (value = $.i18n.prop("global_undefined")) : value;
    };

    return;
  };
  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
