/* Copyright (c) 2012-2016 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery, cwConfigurationEditorMapping */
(function (cwApi, $) {
  "use strict";

  var cwLayout = function (options, viewSchema) {
    cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema);
    cwApi.registerLayoutForJSActions(this);
    this.configMode = false;
    this.init = false;
    cwApi.appliedLayoutsOriginal = undefined;
    this.trueNodeID = this.nodeID + this.options.LayoutID;
    try {
      this.config = JSON.parse(this.options.CustomOptions["configuration"]);
    } catch (e) {
      try {
        this.config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("homePage");
      } catch (e) {
        this.config = {};
        console.log(e);
      }
    }
  };

  cwLayout.prototype.getTemplatePath = function (folder, templateName) {
    return cwApi.format("{0}/html/{1}/{2}.ng.html", cwApi.getCommonContentPath(), folder, templateName);
  };

  cwLayout.prototype.drawAssociations = function (output, associationTitleText, object) {
    if (!(cwAPI.customLibs.utils && cwAPI.customLibs.utils.version && cwAPI.customLibs.utils.version >= 2.4)) {
      output.push("<h1> Please Install Utils 2.4 or Higher");
    } else {
      var self = this;
      output.push('<div id="Grid_' + this.trueNodeID + '" class="Grid cw-visible">');
      if (this.isUserAbleToSeeConfigurator()) {
        output.push(
          '<div class="gridToolbar" ><a id="GridConfigButton_' +
            this.trueNodeID +
            '" class="btn page-action no-text" title="Configurer"><i class="fa fa-cogs"></i></a>'
        );
        output.push(
          '<a id="GridSaveButton_' + this.trueNodeID + '" class="btn page-action no-text" title="Save"><i class="fa fa-save"></i></a></div>'
        );
      }
      output.push('<div id="GridConfiguration_' + this.trueNodeID + '" class="cw-hidden CoffeeMaker GridConfiguration"></div>');
      output.push('<div id="GridDisplays_' + this.trueNodeID + '" class="GridDisplays"></div>');

      output.push("</div>");
    }
  };

  cwLayout.prototype.enableConfigurationLayout = function () {
    this.configMode = !this.configMode;
    if (this.configMode === true) {
      document.getElementById("GridDisplays_" + this.trueNodeID).classList.add("cw-hidden");
      document.getElementById("GridConfiguration_" + this.trueNodeID).classList.remove("cw-hidden");
    } else {
      document.getElementById("GridDisplays_" + this.trueNodeID).classList.remove("cw-hidden");
      document.getElementById("GridConfiguration_" + this.trueNodeID).classList.add("cw-hidden");
    }
  };

  cwLayout.prototype.saveConfiguration = function () {
    this.loadDisplayLayout();
    try {
      cwApi.customLibs.utils.copyToClipboard(angular.toJson(this.config));
    } catch (e) {
      cwApi.customLibs.utils.copyToClipboard(JSON.stringify(this.config));
    }
  };

  cwLayout.prototype.applyJavaScript = function () {
    if (this.init === false) {
      this.init = true;
      if (this.isUserAbleToSeeConfigurator()) {
        document.getElementById("GridConfigButton_" + this.trueNodeID).addEventListener("click", this.enableConfigurationLayout.bind(this));
        document.getElementById("GridSaveButton_" + this.trueNodeID).addEventListener("click", this.saveConfiguration.bind(this));
        this.loadConfigurationLayout();
      }
      this.loadDisplayLayout();
    }
  };

  cwLayout.prototype.loadConfigurationLayout = function () {
    let self = this;

    cwApi.CwAsyncLoader.load("angular", function () {
      let loader = cwApi.CwAngularLoader,
        $container = $("#GridConfiguration_" + self.trueNodeID);
      loader.setup();

      let templatePath = cwAPI.getCommonContentPath() + "/html/coffee/homePage.ng.html" + "?" + Math.random();
      loader.loadControllerWithTemplate("cwGridController", $container, templatePath, function ($scope, $sce) {
        $scope.ng = {};
        $scope.metamodel = cwAPI.mm.getMetaModel();
        $scope.views = cwApi.cwConfigs.Pages;
        $scope.ng.config = self.config;
        $scope.cwApi = cwApi;
        $scope.isGridLayout = true;
        $scope.lang = cwApi.getSelectedLanguage();
        $scope.toggle = function (c, e) {
          if (c.hasOwnProperty(e)) delete c[e];
          else c[e] = true;
        };

        $scope.toggleArray = function (c, e) {
          var i = c.indexOf(e);
          if (i === -1) c.push(e);
          else c.splice(i, 1);
        };
        $scope.bootstrapFilter = function (id, value) {
          window.setTimeout(function (params) {
            $("#" + id).selectpicker();
            if (value) $("#" + id).selectpicker("val", value);
          }, 1000);
        };
        $scope.getPropertyDataType = function (ot, scriptname) {
          if (cwApi.isUndefined(ot)) {
            return "";
          }
          if (scriptname) {
            var p = cwApi.mm.getProperty(ot.scriptName, scriptname);
            if (cwApi.isUndefined(p)) {
              return "";
            }
            switch (p.type) {
              case "Boolean":
                return "checkbox";
              case "Integer":
              case "Double":
                return "number";
              case "Lookup":
                return "lookup";
              default:
                return "text";
            }
          } else return "number";
        };
        $scope.copyToClipboard = function () {
          let str = angular.toJson($scope.configuration);
          cwApi.customLibs.utils.copyToClipboard(str);
        };

        $scope.refresh = self.loadDisplayLayout.bind(self);

        $scope.monMenuOff = true;
        cwAPI.cwLayouts.cwCoffeeMaker.prototype.controller_homePage($container, templatePath, $scope);
      });
    });
  };

  cwLayout.prototype.loadDisplayLayout = function () {
    let self = this;
    let container = $("#GridDisplays_" + this.trueNodeID);
    var parentTable = container.parents("div.tab-content");
    var loaded = false;

    if (parentTable && parentTable.length === 0) {
      cwAPI.customLibs.loadHomePage(this.config, "GridDisplays_" + this.trueNodeID);
    } else {
      var tabHidden;
      setInterval(function () {
        tabHidden = parentTable.css("visibility") == "hidden";
        if (tabHidden && loaded) {
          container.empty();
          loaded = false;
        } else if (!tabHidden && loaded === false) {
          loaded = true;
          cwAPI.customLibs.loadHomePage(self.config, "GridDisplays_" + self.trueNodeID);
        }
      }, 200);
    }
  };

  cwLayout.prototype.isUserAbleToSeeConfigurator = function () {
    return (cwApi.isLive() && cwAPI.currentUser && cwAPI.currentUser.PowerLevel === 1) || (!cwApi.isLive() && isConsoleOpen());
  };

  function isConsoleOpen() {
    var startTime = new Date();
    debugger;
    var endTime = new Date();

    return endTime - startTime > 100;
  }

  cwApi.cwLayouts.cwGrid = cwLayout;
})(cwAPI, jQuery);
