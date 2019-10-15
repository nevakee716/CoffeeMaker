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

  cwCoffeeMaker.prototype.controller_cdsEnhanced = function($container, templatePath, $scope) {
    var objectpages = [];
    let config = $scope.config;
    for (let v in $scope.views) {
      if ($scope.views.hasOwnProperty(v)) {
        if ($scope.views[v].type === "Single" && $scope.views[v].name.indexOf("|>B")) objectpages.push($scope.views[v]);
      }
    }
    $scope.filterId = this.nodeID + "_cds_default_icon_filer"
    $scope.objectpages = objectpages;
    $scope.bootstrapFilter = function(id) {
      window.setTimeout(function(params) {
          $("#" + id).selectpicker();
          $("#" + id).selectpicker("val", config.defaultIcon);
        }, 1000);
      };
    

    return;
  };



  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
