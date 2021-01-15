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

  cwCoffeeMaker.prototype.controller_cwWorkflow = function ($container, templatePath, $scope) {
    let config = $scope.ng.config;
    if (!config.objectTypes) config.objectTypes = {};

    $scope.formInputType = ["property", "objectType", "association", "message"]; // "evolveViewItemList",
    $scope.indexpages = [];
    for (let v in $scope.views) {
      if ($scope.views.hasOwnProperty(v)) {
        if ($scope.views[v].type === "Index" && $scope.views[v].name.indexOf("|>B")) $scope.indexpages.push($scope.views[v]);
      }
    }

    $scope.addScenario = function (ot) {
      if (ot === undefined) {
        $scope.ng.config.objectTypes[$scope.ng.selectedObjectTypeScriptname] = {
          scenarios: [],
        };
        ot = $scope.ng.config.objectTypes[$scope.ng.selectedObjectTypeScriptname];
      }
      if (ot.scenarios === undefined) ot.scenarios = [];
      ot.scenarios.push({ label: "Scenario " + ot.scenarios.length });
      $scope.selectScenario(ot, ot.scenarios.length - 1);
    };

    $scope.removeScenario = function (ot, i) {
      display.ot.splice(i, 1);
    };

    $scope.selectScenario = function (ot, i) {
      ot.scenarios.forEach(function (c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.addScenario = function (ot) {
      if (ot === undefined) {
        $scope.ng.config.objectTypes[$scope.ng.selectedObjectTypeScriptname] = {
          scenarios: [],
        };
        ot = $scope.ng.config.objectTypes[$scope.ng.selectedObjectTypeScriptname];
      }
      if (ot.scenarios === undefined) ot.scenarios = [];
      ot.scenarios.push({ label: "Scenario " + ot.scenarios.length });
      $scope.selectScenario(ot, ot.scenarios.length - 1);
    };

    $scope.removeScenario = function (ot, i) {
      ot.splice(i, 1);
    };

    $scope.selectScenario = function (ot, i) {
      ot.scenarios.forEach(function (c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };
    $scope.reOrderScenarios = function (sce) {
      $scope.ng.config.objectTypes[$scope.ng.selectedObjectTypeScriptname].scenarios.sort(function (a, b) {
        return a.order - b.order;
      });
    };

    $scope.addStep = function (sce) {
      if (sce.steps === undefined) sce.steps = [];
      sce.steps.push({ label: "Step " + sce.steps.length, order: sce.steps.length });
      $scope.selectStep(sce, sce.steps.length - 1);
    };

    $scope.duplicateStep = function (sce, step) {
      let s = JSON.parse(angular.toJson(step));
      s.label = s.label + cwApi.getRandomNumber();
      sce.steps.push(s);
    };

    $scope.removeStep = function (sce, i) {
      sce.steps.splice(i, 1);
    };

    $scope.selectStep = function (sce, i) {
      sce.steps.forEach(function (c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.reOrderSteps = function (sce) {
      sce.steps.sort(function (a, b) {
        return a.order - b.order;
      });
    };

    $scope.addFormInput = function (step) {
      if (step.formInput === undefined) step.formInput = [];
      step.formInput.push({ label: "Input " + step.formInput.length, order: step.formInput.length * 10 });
      $scope.selectFormInput(step, step.formInput.length - 1);
    };

    $scope.removeFormInput = function (step, i) {
      step.formInput.splice(i, 1);
    };

    $scope.selectFormInput = function (step, i) {
      step.formInput.forEach(function (c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.reOrderFormInput = function (step) {
      step.formInput.sort(function (a, b) {
        return a.order - b.order;
      });
    };

    $scope.addStepsSettings = function (step) {
      if (step.stepsSettings === undefined) step.stepsSettings = [];
      step.stepsSettings.push({ label: "Step Setting " + step.stepsSettings.length, order: step.stepsSettings.length * 10 });
      $scope.selectStepSetting(step, step.stepsSettings.length - 1);
    };

    $scope.removeStepsSetting = function (step, i) {
      step.stepsSettings.splice(i, 1);
    };

    $scope.selectStepSetting = function (step, i) {
      step.stepsSettings.forEach(function (c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.reOrderStepSetting = function (step) {
      step.stepsSettings.sort(function (a, b) {
        return a.order - b.order;
      });
    };

    $scope.addNextStep = function (step) {
      if (step.nextStep === undefined) step.nextStep = [];
      step.nextStep.push({ label: "Next Step " + step.nextStep.length, order: step.nextStep.length * 10 });
      $scope.selectNextStep(step, step.nextStep.length - 1);
    };

    $scope.removeNextStep = function (step, i) {
      step.nextStep.splice(i, 1);
    };

    $scope.selectNextStep = function (step, i) {
      step.nextStep.forEach(function (c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.reOrderNextStep = function (step) {
      step.nextStep.sort(function (a, b) {
        return a.order - b.order;
      });
    };

    $scope.getWIObjectType = function () {
      return cwApi.mm.getObjectType($scope.ng.selectedObjectTypeScriptname);
    };

    $scope.updateInactiveLookups = function (input, lookupId) {
      if (input.inactiveLookups === undefined) input.inactiveLookups = {};
      if (input.inactiveLookups.hasOwnProperty(lookupId)) delete input.inactiveLookups[lookupId];
      else input.inactiveLookups[lookupId] = true;
    };
    $scope.addFilter = function (input) {
      if (input.filters === undefined) input.filters = [];
      input.filters.push({});
    };

    $scope.createNetwork = function (sce) {
      if (cwAPI.isDebugMode() === true) {
        $scope.buildNetwork(sce);
      } else {
        var libToLoad = ["modules/vis/vis.min.js", "modules/bootstrap/bootstrap.min.js", "modules/bootstrap-select/bootstrap-select.min.js"];
        // AsyncLoad
        cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad, function (error) {
          if (error === null) {
            $scope.buildNetwork(sce);
          } else {
            cwAPI.Log.Error(error);
          }
        });
      }
    };

    $scope.buildNetwork = function (sce) {
      var a = setInterval(function () {
        var networkContainer = document.getElementById("network_" + sce.label);
        if (!networkContainer) return;
        clearInterval(a);
        var nodes = new vis.DataSet(nodes);
        var edges = new vis.DataSet(edges);
        var data = {
          nodes: nodes,
          edges: edges,
        };
        if (sce.steps === undefined) return;
        sce.steps.forEach(function (step) {
          nodes.add({
            label: step.label,
            id: step.label,
          });
          if (step.nextStep) {
            step.nextStep.forEach(function (ns) {
              edges.add({
                label: ns.label,
                id: step.label + "_" + ns.stepName + "_" + ns.label,
                from: step.label,
                to: ns.stepName,
                arrows: "to",
              });
            });
          }
        });
        var network = new vis.Network(networkContainer, data, {
          physics: {
            barnesHut: {
              gravitationalConstant: -70000,
            },
            minVelocity: 0.75,
          },
        });
        network.fit();
      }, 1000);
    };
    return;
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);
