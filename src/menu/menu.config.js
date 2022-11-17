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

  cwCoffeeMaker.prototype.controller_menu = function ($container, templatePath, $scope) {
    $scope.objectpages = [];
    $scope.cwUser_pages = [];
    $scope.indexpages = [];
    let config = $scope.ng.config;
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
    $scope.ng.menus = cwApi.CwMenuData.mainMenu;
    $scope.objDescription = {};
    $scope.op = {};

    $scope.selectMenu = function (i) {
      $scope.ng.menus.forEach(function (c, ii) {
        if (i == ii) {
          c.selected = true;
        } else c.selected = false;
      });
    };

    return;
  };
  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
