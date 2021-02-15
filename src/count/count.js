/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */
var layoutName = "cwCount";
/*global cwAPI, jQuery */
(function (cwApi, $) {
  "use strict";
  if (cwApi && cwApi.cwLayouts && cwApi.cwLayouts.cwLayout) {
    var cwLayout = cwApi.cwLayouts.cwLayout;
  } else {
    // constructor
    var cwLayout = function (options, viewSchema) {
      cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema); // heritage
      cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations
      this.viewSchema = viewSchema;

      try {
        this.config = JSON.parse(this.options.CustomOptions["configuration"]);
      } catch (e) {
        this.config = {};
      }
      this.construct(options);
    };
  }
  cwLayout.prototype.construct = function (options) {};

  cwLayout.prototype.getTemplatePath = function (folder, templateName) {
    return cwApi.format("{0}/html/{1}/{2}.ng.html", cwApi.getCommonContentPath(), folder, templateName);
  };

  cwLayout.prototype.drawAssociations = function (output, associationTitleText, object) {
    try {
      if (cwApi.customLibs.utils === undefined || cwAPI.customLibs.utils.version === undefined || cwAPI.customLibs.utils.version < 2.5) {
        output.push("<h2> Please Install Utils library 2.5 or higher</h2>");
        return;
      }
      output.push('<div class="cwLayout' + layoutName + 'Wrapper cw-visible" id="cwLayout' + layoutName + this.nodeID + '">');
      output.push("</div>");
      this.originalObject = object;
    } catch (e) {
      console.log(e);
      return;
    }
  };
  cwLayout.prototype.applyJavaScript = function () {
    var self = this;

    self.load();
  };

  cwLayout.prototype.load = function () {
    var layoutContainer = document.getElementById("cwLayout" + layoutName + this.nodeID);
    // set height
    var canvaHeight = window.innerHeight - 92 - 1.25 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    var self = this;
    cwApi.CwAsyncLoader.load("angular", function () {
      let loader = cwApi.CwAngularLoader,
        templatePath,
        $container = $("#cwLayout" + layoutName + self.nodeID);
      loader.setup();
      templatePath = self.getTemplatePath("cwLayout" + layoutName, layoutName);

      loader.loadControllerWithTemplate("cwLayout" + layoutName, $container, templatePath, function ($scope, $sce) {
        self.angularScope = $scope;
        $scope.ng = {};
        $scope.expertMode = false;
        $scope.config = self.config;
        $scope.viewSchema = self.viewSchema;
        $scope.items = self.originalObject.associations[self.mmNode.NodeID];
        $scope.enableExpertMode = function () {
          $scope.expertMode = !$scope.expertMode;
          self.manageExpertMode($scope.expertMode);
        };
        $scope.round = Math.round;
        $scope.displayItemString = function (item) {
          return $sce.trustAsHtml(cwApi.customLibs.utils.getItemDisplayString(self.viewSchema.ViewName, item));
        };
      });
    });

    cwLayout.prototype.manageExpertMode = function (expertMode) {
      this.angularScope.expertMode = !this.angularScope.expertMode;
      var self = this;
      if (this.angularScope.expertMode === true) {
        cwAPI.CwPopout.hide();
      } else {
        cwApi.CwPopout.showPopout($.i18n.prop("expert_mode"));

        var expertModeConfig = document.createElement("div");
        expertModeConfig.className = "cwExpertModeConfig";
        expertModeConfig.id = "cwLayout" + layoutName + "ExpertModeConfig" + self.nodeID;

        cwApi.CwPopout.setContent(expertModeConfig);
        cwApi.CwPopout.onClose(function () {
          self.angularScope.expertMode = false;
          self.angularScope.$apply();
        });
        let loader = cwApi.CwAngularLoader,
          templatePath,
          $container = $("#" + expertModeConfig.id);
        loader.setup();
        templatePath = self.getTemplatePath("cwLayout" + layoutName, layoutName + "ExpertMode");

        loader.loadControllerWithTemplate("cwLayout" + layoutName + "ExpertMode", $container, templatePath, function ($scope, $sce) {
          $scope.ng = {};
          $scope.cwApi = cwApi;
          $scope.config = self.config;
          $scope.viewSchema = self.viewSchema;
          $scope.mmNode = self.mmNode;

          $scope.refreshConfig = function () {
            self.angularScope.$apply();
          };

          $scope.saveConfig = function () {
            cwAPI.customLibs.utils.copyToClipboard(JSON.stringify(self.config));
          };
        });
      }
    };
  };

  cwApi.cwLayouts[layoutName] = cwLayout;
})(cwAPI, jQuery);
