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

  cwCoffeeMaker.prototype.controller_redirectEdit = function ($container, templatePath, $scope) {
    var objectpages = [];
    var views = cwAPI.cwConfigs.Pages;
    for (let v in views) {
      if (views.hasOwnProperty(v)) {
        if (views[v].type === "Single" && views[v].name.indexOf("|>B")) objectpages.push(views[v]);
      }
    }

    $scope.objectpages = objectpages;
    $scope.redirectViews = [];
    $scope.configInit = function () {
      if ($scope.currentView.cwView) {
        if ($scope.ng.config[$scope.currentView.cwView] === undefined) {
          $scope.ng.config[$scope.currentView.cwView] = {};
        }
        let r = [];
        cwApi.cwConfigs.SingleViewsByObjecttype[$scope.currentView.rootObjectType].forEach(function (v) {
          r.push(cwApi.getView(v));
        });
        $scope.redirectViews = r;
      }
    };

    $scope.cwApi = cwApi;

    return;
  };
  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
