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

  cwCoffeeMaker.prototype.construct = function(options) {
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.version && cwAPI.customLibs.utils.version >= 1.5) {
      this.config = cwAPI.customLibs.utils.getCustomLayoutConfiguration();
      if (this.config === null) {
        this.config = { redirectEdit: {}, duplicateButton: { pageWithDuplicateButton: {} }, homePage: { objectTypeToSelect: [] } };
      }
      if (this.config.redirectEdit === undefined) this.config.redirectEdit = {};
      if (this.config.duplicateButton === undefined) this.config.duplicateButton = { pageWithDuplicateButton: {} };
      if (this.config.homePage === undefined) this.config.homePage = { objectTypeToSelect: [] };

      cwApi.customLibs.utils.customLayoutConfiguration = this.config;
    }
  };

  // obligatoire appeler par le system
  cwCoffeeMaker.prototype.drawAssociations = function(output, associationTitleText, object) {
    if (!(cwAPI.customLibs.utils && cwAPI.customLibs.utils.version && cwAPI.customLibs.utils.version >= 1.5)) {
      output.push("<h1> Please Install Utils 1.5 or Higher");
    } else {
      var self = this;
      output.push('<div id="CoffeeMaker_' + this.nodeID + '" class="CoffeeMaker">');
      output.push('<div id="CoffeeMakerTabContainer_' + this.nodeID + '" class="CoffeeMakerTabs">');

      Object.keys(this.config).forEach(function(e) {
        output.push('<div data-id="' + e + '" id="CoffeeMakerTab_' + e + "_" + self.nodeID + '" class="CoffeeMakerTab">' + $.i18n.prop(e) + "</div>");
      });

      output.push('<div data-id="saveconfiguration" id="CoffeeMakerTab_saveconfiguration_"' + self.nodeID + '" class="CoffeeMakerTab"><i class="fa fa-floppy-o" aria-hidden="true"></i></div>');
      output.push("</div>");

      output.push('<div id="CoffeeMakerViewContainer_' + this.nodeID + '" class="CoffeeMakerView">');
      output.push("</div>");
      output.push("</div>");
    }
  };

  cwCoffeeMaker.prototype.applyJavaScript = function() {
    var self = this;
    var $container = $("#CoffeeMakerViewContainer_" + this.nodeID);

    cwApi.CwAsyncLoader.load("angular", function() {
      var loader = cwApi.CwAngularLoader;
      loader.setup();

      let matches = document.querySelectorAll(".CoffeeMakerTab");
      for (let i = 0; i < matches.length; i++) {
        let t = matches[i];
        t.addEventListener("click", function(event) {
          loader.setup();

          if (t.dataset.id === "saveconfiguration") {
            cwAPI.customLibs.utils.copyToClipboard(JSON.stringify(self.config));
          }
          let templatePath = cwAPI.getCommonContentPath() + "/html/coffee/" + t.dataset.id + ".ng.html" + "?" + Math.random();
          self.unselectTabs();
          t.className += " selected";
          loader.loadControllerWithTemplate(t.dataset.id, $container, templatePath, function($scope) {
            $scope.metamodel = cwAPI.mm.getMetaModel();
            $scope.views = cwApi.cwConfigs.Pages;
            self.angularScope = $scope;
            $scope.config = self.config[t.dataset.id];
            $scope.cwApi = cwApi;
            $scope.toggle = function(c, e) {
              if (c.hasOwnProperty(e)) delete c[e];
              else c[e] = true;
            };

            $scope.toggleArray = function(c, e) {
              var i = c.indexOf(e);
              if (i === -1) c.push(e);
              else c.splice(i, 1);
            };

            if (self["controller_" + t.dataset.id] && $scope.config) self["controller_" + t.dataset.id]($container, templatePath, $scope);
          });
        });
      }
    });
  };

  cwCoffeeMaker.prototype.controller_homePage = function($container, templatePath, $scope) {
    var objectpages = [];
    let config = $scope.config;
    $scope.objectTypes = cwAPI.mm.getMetaModel().objectTypes;

    return;
  };

  cwCoffeeMaker.prototype.unselectTabs = function(tabs) {
    let matches = document.querySelectorAll(".CoffeeMakerTab");
    for (let i = 0; i < matches.length; i++) {
      let t = matches[i];
      t.className = t.className.replaceAll(" selected", "");
    }
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
