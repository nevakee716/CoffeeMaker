/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
/*
(function (cwApi, $) {
  "use strict";

  var DiagramObjectLinkOnEvolveConfig = {
    behaviour: "dbclick",
  };

  var DiagramObjectLinkOnEvolve = {};

  DiagramObjectLinkOnEvolve.clickOnCanvas = function (e) {
    var that = this;
    function userHasRightToDrillDown() {
      var scriptname = that.currentContext.selectedObject.objectTypeScriptName;

      if (DiagramObjectLinkOnEvolveConfig.accessright.hasOwnProperty(scriptname)) {
        var config = DiagramObjectLinkOnEvolveConfig.accessright[scriptname];
        if (
          cwAPI.customLibs &&
          cwAPI.customLibs.isActionToDo &&
          cwAPI.customLibs.isActionToDo(that.currentContext.selectedObject, config.conditionnalAccessFilter)
        ) {
          return true;
        } else {
          cwApi.cwNotificationManager.addError(config.message);
          return false;
        }
      }
      return true;
    }

    function openObjectLink() {
      // Object link
      cwObject = that.currentContext.selectedShape.shape.cwObject;
      if (cwObject !== undefined && cwObject !== null && cwObject.properties !== undefined && cwObject.properties !== null) {
        link = cwObject.properties.link;
        var re = /cwOpenDiagram.exe [A-Z0-9]* (\d*)/;
        var result = link.match(re);
        if (result && result[1]) {
          if (DiagramObjectLinkOnEvolveConfig.behaviour === "drill-down") {
            that.drillDownInDiagram(result[1]);
          } else if (DiagramObjectLinkOnEvolveConfig.behaviour === "dbclick") {
            var newHash = cwApi.getSingleViewHash("diagram", result[1]);
            cwApi.updateURLHash(newHash);
          }
        } else {
          if (link[0] === "#") {
            window.location.hash = link;
          } else {
            if (
              link.indexOf("http://") !== 0 &&
              link.indexOf("https://") !== 0 &&
              link.indexOf("/") !== 0 &&
              link.indexOf("./") !== 0 &&
              link !== ""
            ) {
              link = "http://" + link;
            }
            window.open(link);
          }
        }
      }
    }

    var regionZone, cwObject, link;
    if (this.currentContext.selectedShape !== null && this.currentContext.selectedJoiner === null) {
      regionZone = this.currentContext.selectedRegionZone;
      if (!cwApi.isUndefinedOrNull(regionZone)) {
        if (this.currentContext.selectedShape.shape.paletteEntryKey === "OBJECTLINK|0") {
          openObjectLink();
        } else if (regionZone.IsExplosionRegion === true) {
          // Explosion
          let config = cwAPI.customLibs && cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration("diagram");
          if (config && config.deactivateDiagramDrillDown && userHasRightToDrillDown()) {
            location.href = cwAPI.createLinkForSingleView(
              this.currentContext.selectedObject.objectTypeScriptName,
              this.currentContext.selectedObject
            );
          }

          //this.openDiagrams(regionZone.explodedDiagrams);
        } else if (regionZone.IsNavigationRegion === true) {
          // Navigation
          this.openDiagrams(regionZone.navigationDiagrams);
        } else if (regionZone.Clickable === true) {
          // Clickable regions
          if (!cwApi.isUndefined(regionZone) && regionZone.ClickableRegionUrl !== "") {
            window.open(regionZone.ClickableRegionUrl, "_blank");
          }
        }
      } else {
        cwObject = this.currentContext.selectedShape.shape.cwObject;
        // Object link
        if (
          this.currentContext.selectedShape.shape.paletteEntryKey === "OBJECTLINK|0" &&
          cwObject !== undefined &&
          cwObject !== null &&
          cwObject.properties !== undefined &&
          cwObject.properties !== null
        ) {
          openObjectLink();
        }
        if (cwObject !== null) {
          // NOTE: If there is any action to take on a click, so far on a click only Explosions and Navigation should take action
          this.simpleClickOnShape(cwObject, e);
          this.simpleClickOnShapeCustom(cwObject);
        }
      }
    } else {
      if (this.isInEditMode === true) {
        if (this.currentContext.selectedJoiner !== null) {
          cwApi.pluginManager.execute("CwDiagramViewer.SimpleClickOnJoiner", this, this.currentContext.selectedJoiner, e);
        } else {
          cwApi.pluginManager.execute("CwDiagramViewer.ClickOnCanvasNotAnyShape", this, e);
        }
      } else {
        this.resetSelectedShapesForEditor();
      }
    }
  };

  if (cwAPI) {
    cwAPI.Diagrams.CwDiagramViewer.prototype.clickOnCanvas = DiagramObjectLinkOnEvolve.clickOnCanvas;
  }

  PsgDiagramFilter.prototype.createFilterButton = function (diagramViewer) {
    var filterButton,
      o,
      that = this;
    if (diagramViewer.$breadcrumb === undefined) return;
    filterButton = diagramViewer.$breadcrumb.find("a#cw-diagram-filter");
    var filterClass = "";
    if (this.filterEnable === true) filterClass = "enable";
    if (filterButton.length > 0) {
      filterButton.unbind("click");
    } else {
      o = [];
      o.push(
        '<a id="cw-diagram-filter" class="btn btn-diagram-filter no-text ',
        filterClass,
        '" title="',
        $.i18n.prop("DiagramFilterIcon"),
        '"><span class="btn-text"></span><i class="fa fa-filter"></i></a>'
      );
      diagramViewer.$breadcrumb.find(".cwDiagramBreadcrumbZoneRight").append(o.join(""));
      filterButton = diagramViewer.$breadcrumb.find(".btn-diagram-filter");
    }

    filterButton.on("click", function () {
      that.setupDiagramFilterZone(diagramViewer);
    });
  };

  var PsgDiagramLegend;

  PsgDiagramLegend = function () {
    this.PsgDiagramLegend = {};
  };

  PsgDiagramFilter.prototype.init = function (diagramViewer) {
    var legendButton,
      o,
      that = this;
    if (diagramViewer.$breadcrumb === undefined) return;

    filterButton = diagramViewer.$breadcrumb.find("a#cw-diagram-legend");
    if (filterButton.length > 0) {
      filterButton.unbind("click");
    } else {
      o = [];
      o.push(
        '<a id="cw-diagram-filter" class="btn btn-diagram-filter no-text ',
        filterClass,
        '" title="',
        $.i18n.prop("DiagramLegendIcon"),
        '"><span class="btn-text"><i class="fa fa-question-circle" aria-hidden="true"></i></a>'
      );
      diagramViewer.$breadcrumb.find(".cwDiagramBreadcrumbZoneRight").append(o.join(""));
      filterButton = diagramViewer.$breadcrumb.find(".btn-diagram-filter");
    }

    filterButton.on("click", function () {
      debugger;
      that.setupDiagramFilterZone(diagramViewer);
    });
  };

  PsgDiagramLegend.prototype.register = function () {
    cwApi.pluginManager.register("CwDiagramViewer.initWhenDomReady", this.init.bind(this));
  };

  cwApi.CwPlugins.PsgDiagramLegend = PsgDiagramLegend;

  /********************************************************************************
  Activation
  *********************************************************************************/
/* new cwApi.CwPlugins.PsgDiagramLegend().register();
})(cwAPI, jQuery);
*/
