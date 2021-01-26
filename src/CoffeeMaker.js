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

  var loader = cwApi.CwAngularLoader;
  if (cwApi.ngDirectives) {
    cwApi.ngDirectives.push(function () {
      loader.registerDirective("jsonText", [
        "$http",
        function ($http) {
          return {
            restrict: "A", // only activate on element attribute
            require: "ngModel", // get a hold of NgModelController
            link: function (scope, element, attrs, ngModelCtrl) {
              var lastValid;

              // push() if faster than unshift(), and avail. in IE8 and earlier (unshift isn't)
              ngModelCtrl.$parsers.push(fromUser);
              ngModelCtrl.$formatters.push(toUser);

              // clear any invalid changes on blur
              element.bind("blur", function () {
                element.val(toUser(scope.$eval(attrs.ngModel)));
              });

              // $watch(attrs.ngModel) wouldn't work if this directive created a new scope;
              // see https://stackoverflow.com/questions/14693052/watch-ngmodel-from-inside-directive-using-isolate-scope how to do it then
              scope.$watch(
                attrs.ngModel,
                function (newValue, oldValue) {
                  lastValid = lastValid || newValue;

                  if (newValue != oldValue) {
                    ngModelCtrl.$setViewValue(toUser(newValue));

                    // TODO avoid this causing the focus of the input to be lost..
                    ngModelCtrl.$render();
                  }
                },
                true
              ); // MUST use objectEquality (true) here, for some reason..

              function fromUser(text) {
                // Beware: trim() is not available in old browsers
                if (!text || text.trim() === "") {
                  return {};
                } else {
                  try {
                    lastValid = angular.fromJson(text);
                    ngModelCtrl.$setValidity("invalidJson", true);
                  } catch (e) {
                    ngModelCtrl.$setValidity("invalidJson", false);
                  }
                  return lastValid;
                }
              }

              function toUser(object) {
                // better than JSON.stringify(), because it formats + filters $$hashKey etc.
                return angular.toJson(object, true);
              }
            },
          };
        },
      ]);
    });
  }

  cwCoffeeMaker.prototype.construct = function (options) {
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.version && cwAPI.customLibs.utils.version >= 1.5) {
      this.config = cwAPI.customLibs.utils.getCustomLayoutConfiguration();
      if (this.config === null) {
        this.config = {};
      }
      if (this.config.redirectEdit === undefined) this.config.redirectEdit = {};
      if (this.config.duplicateButton === undefined) this.config.duplicateButton = { pageWithDuplicateButton: {} };
      if (this.config.homePage === undefined) this.config.homePage = { objectTypeToSelect: {} };
      if (this.config.cdsEnhanced === undefined) this.config.cdsEnhanced = { defaultIcon: "fa fa-external-link" };
      if (this.config.actionOnObjectPage === undefined) this.config.actionOnObjectPage = {};
      if (this.config.checkEditModel === undefined) this.config.checkEditModel = {};
      if (this.config.pageFilter === undefined) this.config.pageFilter = {};
      if (this.config.tableComplexeEnhanced === undefined) this.config.tableComplexeEnhanced = {};
      if (this.config.diagram === undefined) this.config.diagram = {};
      if (this.config.property === undefined) this.config.property = {};
      if (this.config.cwWorkflow === undefined) this.config.cwWorkflow = {};
      cwApi.customLibs.utils.customLayoutConfiguration = this.config;
    }
  };

  // obligatoire appeler par le system
  cwCoffeeMaker.prototype.drawAssociations = function (output, associationTitleText, object) {
    if (!(cwAPI.customLibs.utils && cwAPI.customLibs.utils.version && cwAPI.customLibs.utils.version >= 2.2)) {
      output.push("<h1> Please Install Utils 2.2 or Higher");
    } else {
      var self = this;
      output.push('<div id="CoffeeMaker_' + this.nodeID + '" class="CoffeeMaker">');
      output.push('<div id="CoffeeMakerTabContainer_' + this.nodeID + '" class="CoffeeMakerTabs">');

      Object.keys(this.config).forEach(function (e) {
        output.push('<div data-id="' + e + '" id="CoffeeMakerTab_' + e + "_" + self.nodeID + '" class="CoffeeMakerTab">' + $.i18n.prop(e) + "</div>");
      });

      output.push(
        '<div data-id="saveconfiguration" id="CoffeeMakerTab_saveconfiguration_"' +
          self.nodeID +
          '" class="CoffeeMakerTab"><i class="fa fa-floppy-o" aria-hidden="true"></i></div>'
      );
      output.push(
        '<div data-id="refresh"  id="CoffeeMakerTab_localstorage_"' +
          self.nodeID +
          '" class="CoffeeMakerTab"><i class="fa fa-refresh" aria-hidden="true"></i></div>'
      );

      output.push("</div>");

      output.push('<div id="CoffeeMakerViewContainer_' + this.nodeID + '" class="CoffeeMakerView">');
      output.push("</div>");
      output.push("</div>");
    }
  };

  cwCoffeeMaker.prototype.applyJavaScript = function () {
    var self = this;

    if (cwAPI.isDebugMode() === true) {
      self.loadAngularTemplate();
    } else {
      let libToLoad = ["modules/bootstrap/bootstrap.min.js", "modules/bootstrap-select/bootstrap-select.min.js"];
      // AsyncLoad
      cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad, function (error) {
        if (error === null) {
          self.loadAngularTemplate();
        } else {
          cwAPI.Log.Error(error);
        }
      });
    }
  };

  cwCoffeeMaker.prototype.loadAngularTemplate = function () {
    var self = this;
    var $container = $("#CoffeeMakerViewContainer_" + this.nodeID);
    cwApi.CwAsyncLoader.load("angular", function () {
      var loader = cwApi.CwAngularLoader;
      loader.setup();

      let matches = document.querySelectorAll(".CoffeeMakerTab");
      for (let i = 0; i < matches.length; i++) {
        let t = matches[i];
        t.addEventListener("click", function (event) {
          loader.setup();

          if (t.dataset.id === "saveconfiguration") {
            cwAPI.customLibs.utils.copyToClipboard(angular.toJson(self.config));
          }
          if (t.dataset.id === "refresh") {
            localStorage.setItem(cwApi.getSiteId() + "_" + cwApi.getDeployNumber() + "_coffeeMakerConfiguration", angular.toJson(self.config));
            return;
          }
          let templatePath = cwAPI.getCommonContentPath() + "/html/coffee/" + t.dataset.id + ".ng.html" + "?" + Math.random();
          self.unselectTabs();
          t.className += " selected";
          loader.loadControllerWithTemplate(t.dataset.id, $container, templatePath, function ($scope) {
            $scope.metamodel = cwAPI.mm.getMetaModel();
            $scope.views = cwApi.cwConfigs.Pages;
            self.angularScope = $scope;
            $scope.ng = {};
            $scope.ng.config = self.config[t.dataset.id];
            self.config[t.dataset.id] = $scope.ng.config;
            $scope.gConfig = self.config;
            $scope.cwApi = cwApi;
            $scope.lang = cwApi.getSelectedLanguage();
            $scope.showDescription = true;
            $scope.FilterOperators = ["=", "!=", ">", "<", "In"];
            $scope.keys = function (o) {
              return Object.keys(o);
            };
            $scope.$watchCollection("ng", function (newValue, oldValue) {
              self.config[t.dataset.id] = $scope.ng.config;
            });
            $scope.jsonText = {};
            $scope.toggle = function (c, e) {
              if (c.hasOwnProperty(e)) delete c[e];
              else c[e] = true;
            };

            $scope.toggleArray = function (c, e) {
              var i = c.indexOf(e);
              if (i === -1) c.push(e);
              else c.splice(i, 1);
            };
            $scope.configError = false;
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
            $scope.addSlide = function (display) {
              if (display.slides === undefined) display.slides = [];
              display.slides.push({ label: "Slide " + display.slides.length });
              $scope.selectSlide(display, display.slides.length - 1);
            };

            $scope.removeSlide = function (display, i) {
              display.slides.splice(i, 1);
            };

            $scope.selectSlide = function (display, i) {
              display.slides.forEach(function (c, ii) {
                if (i == ii) c.selected = true;
                else c.selected = false;
              });
            };
            $scope.getSortPropFromOT = function (ot) {
              let r = [];
              for (let p in ot.properties) {
                if (ot.properties.hasOwnProperty(p)) {
                  r.push(ot.properties[p]);
                }
              }
              r.sort(function (pa, pb) {
                return pa.name.localeCompare(pb.name);
              });
              return r;
            };
            $scope.reOrderSlides = function () {
              $scope.ng.config.columns.sort(function (a, b) {
                return a.order - b.order;
              });
            };

            $scope.OTs = [];
            $scope.objectTypes = cwAPI.mm.getMetaModel().objectTypes;
            for (let o in $scope.objectTypes) {
              if ($scope.objectTypes.hasOwnProperty(o) && !$scope.objectTypes[o].properties.hasOwnProperty("allowautomaticdeletion")) {
                $scope.OTs.push($scope.objectTypes[o]);
              }
            }

            if (self["controller_" + t.dataset.id] && $scope.ng.config) self["controller_" + t.dataset.id]($container, templatePath, $scope);
          });
        });
      }
    });
  };

  cwCoffeeMaker.prototype.unselectTabs = function (tabs) {
    let matches = document.querySelectorAll(".CoffeeMakerTab");
    for (let i = 0; i < matches.length; i++) {
      let t = matches[i];
      t.className = t.className.replaceAll(" selected", "");
    }
  };

  cwCoffeeMaker.prototype.getPropertiesFromNode = function (node) {
    let result = [];
    let propertiesScriptnames = {};
    node.PropertiesSelected.forEach(function (p) {
      propertiesScriptnames[p.toLowerCase()] = true;
      result.push(cwApi.mm.getProperty(node.ObjectTypeScriptName, p));
    });
    let pgSchema = node.PropertiesGroups;
    for (let pgk in pgSchema) {
      if (pgSchema[pgk]) {
        pgSchema[pgk].properties.forEach(function (p) {
          if (!propertiesScriptnames.hasOwnProperty(p)) {
            propertiesScriptnames[p] = true;
            result.push(cwAPI.mm.getProperty(node.ObjectTypeScriptName, p));
          }
        });
      }
    }
    return result;
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
