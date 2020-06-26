/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */
/*global cwAPI, jQuery*/

(function (cwApi, $) {
  "use strict";
  var customDisplayStringSimulator;

  customDisplayStringSimulator = function (options, viewSchema) {
    cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema);
    cwApi.registerLayoutForJSActions(this);
    this.viewSchema = viewSchema;
  };

  customDisplayStringSimulator.prototype.getTemplatePath = function (folder, templateName) {
    return cwApi.format("{0}/html/{1}/{2}.ng.html", cwApi.getCommonContentPath(), folder, templateName);
  };

  customDisplayStringSimulator.prototype.drawAssociations = function (output, associationTitleText, object) {
    output.push(
      '<div class="cw-visible customDisplayStringSimulator" id="customDisplayStringSimulator' + this.nodeID + "_" + object.object_id + '"></div>'
    );
    this.object = object;
    this.objects = object.associations[this.nodeID];
  };

  customDisplayStringSimulator.prototype.applyJavaScript = function () {
    let self = this;

    if (!this.objects || !this.objects.length || this.objects.length == 0) return;
    cwApi.CwAsyncLoader.load("angular", function () {
      let loader = cwApi.CwAngularLoader,
        templatePath,
        $container = $("#customDisplayStringSimulator" + self.nodeID + "_" + self.object.object_id);
      loader.setup();
      templatePath = self.getTemplatePath("customDisplayStringSimulator", "customDisplayStringSimulator");

      loader.loadControllerWithTemplate("customDisplayStringSimulator", $container, templatePath, function ($scope, $sce) {
        self.angularScope = $scope;
        $scope.ng = {};
        $scope.ng.objects = self.objects;
        $scope.ng.cds =
          self.viewSchema.NodesByID[self.nodeID].LayoutOptions.DisplayPropertyScriptName !== ""
            ? self.viewSchema.NodesByID[self.nodeID].LayoutOptions.DisplayPropertyScriptName
            : "{name}";
        $scope.ng.viewSchema = self.viewSchema.NodesByID[self.nodeID];
        $scope.displayItemString = function (item) {
          return $sce.trustAsHtml(item.displayName);
        };

        let config;
        if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
          config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("property");
        }
        if (config && config[$scope.ng.objects[0].objectTypeScriptName]) {
          config = config[$scope.ng.objects[0].objectTypeScriptName];
        }
        $scope.ng.config = config;

        $scope.getCDS = function (item, cds) {
          return $sce.trustAsHtml(cwAPI.customLibs.utils.getCustomDisplayString($scope.ng.cds, item, self.nodeID, false));
        };

        $scope.reload = function () {
          $scope.$apply();
        };

        $scope.getProperties = function () {
          return Object.keys($scope.ng.objects[0].properties)
            .map(function (ps) {
              return cwApi.mm.getProperty($scope.ng.objects[0].objectTypeScriptName, ps);
            })
            .filter(function (prop) {
              return prop != undefined;
            });
        };

        $scope.getIProperties = function () {
          return Object.keys($scope.ng.objects[0].iProperties)
            .map(function (ps) {
              return cwApi.mm.getProperty($scope.ng.objects[0].iObjectTypeScriptName, ps);
            })
            .filter(function (prop) {
              return prop != undefined;
            });
        };
        $scope.manageUndefined = function (value) {
          return value === cwApi.getLookupUndefinedValue() ? (value = $.i18n.prop("global_undefined")) : value;
        };
      });
    });
  };

  cwApi.cwLayouts.customDisplayStringSimulator = customDisplayStringSimulator;
})(cwAPI, jQuery);
