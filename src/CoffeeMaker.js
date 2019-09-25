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
    try {
      this.config = JSON.parse(options.CustomOptions.config);
    } catch (e) {
      this.config = { redirectEdit: {}, duplicateButton: { pageWithDuplicateButton: {} } };
    }
  };

  // obligatoire appeler par le system
  cwCoffeeMaker.prototype.drawAssociations = function(output, associationTitleText, object) {
    if (!(cwAPI.customLibs.utils && cwAPI.customLibs.utils.version && cwAPI.customLibs.utils.version >= 1.4)) {
      output.push("<h1> Please Install Utils 1.4");
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
      matches.forEach(function(t) {
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
      });
    });
  };

  cwCoffeeMaker.prototype.controller_duplicateButton = function($container, templatePath, $scope) {
    var objectpages = [];
    let config = $scope.config;
    for (let v in $scope.views) {
      if ($scope.views.hasOwnProperty(v)) {
        if ($scope.views[v].type === "Single" && $scope.views[v].name.indexOf("|>B")) objectpages.push($scope.views[v]);
      }
    }
    $scope.currentView = objectpages[0];
    $scope.objectpages = objectpages;

    $scope.updateConfig = function(c, view) {
      $scope.toggle(c, view);
      if ($scope.config.hasOwnProperty(view)) delete $scope.config[view];
      else {
        $scope.config[view] = {
          associationScriptNameToExclude: ["anyobjectexplodedasdiagram", "anyobjectshownasshapeindiagram"],
          propertyScriptNameToExclude: ["cwtotalcomment", "cwaveragerating", "whoowns", "whoupdated", "whocreated", "whencreated", "whenupdated", "exportflag", "id", "datevalidated", "uniqueidentifier", "template"],
          associationToTheMainObject: {},
        };
      }
    };

    return;
  };

  cwCoffeeMaker.prototype.controller_redirectEdit = function($container, templatePath, $scope) {
    var objectpages = [];
    var views = cwAPI.cwConfigs.Pages;
    for (let v in views) {
      if (views.hasOwnProperty(v)) {
        if (views[v].type === "Single" && views[v].name.indexOf("|>B")) objectpages.push(views[v]);
      }
    }

    $scope.objectpages = objectpages;
    $scope.redirectViews = [];
    $scope.configInit = function() {
      if($scope.currentView.cwView) {
        if ($scope.config[$scope.currentView.cwView] === undefined) {
          $scope.config[$scope.currentView.cwView] = {};
        }
        let r = [];
        cwApi.cwConfigs.SingleViewsByObjecttype[$scope.currentView.rootObjectType].forEach(function(v) {
          r.push(cwApi.getView(v));
        });
        $scope.redirectViews = r;
      }


    };

    $scope.cwApi = cwApi;

    return;
  };

  cwCoffeeMaker.prototype.unselectTabs = function(tabs) {
    let matches = document.querySelectorAll(".CoffeeMakerTab");
    matches.forEach(function(t) {
      t.className = t.className.replaceAll(" selected", "");
    });
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
