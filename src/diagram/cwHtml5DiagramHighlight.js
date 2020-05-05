/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";

  var PsgDiagramSearchManager;

  PsgDiagramSearchManager = function () {
    this.PsgDiagramSearch = {};
  };

  PsgDiagramSearchManager.prototype.init = function (diagramViewer) {
    let config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("diagram");
    if (!config || config.template) return;
    if (
      config.template[diagramViewer.json.properties.type_id] &&
      config.template[diagramViewer.json.properties.type_id].highlight &&
      config.template[diagramViewer.json.properties.type_id].highlight.activated
    ) {
      this.PsgDiagramSearch[diagramViewer.id] = new cwApi.customLibs.PsgDiagramSearch(
        diagramViewer,
        config.template[diagramViewer.json.properties.type_id].highlight
      );
      this.PsgDiagramSearch[diagramViewer.id].createSearchBox(diagramViewer);
    }
  };

  PsgDiagramSearchManager.prototype.setGlobalAlphaShape = function (diagramViewer, shape) {
    if (this.PsgDiagramSearch.hasOwnProperty(diagramViewer.id)) {
      this.PsgDiagramSearch[diagramViewer.id].setGlobalAlphaShape(diagramViewer, shape);
    }
  };

  PsgDiagramSearchManager.prototype.setGlobalAlphaJoiner = function (diagramViewer, joiner) {
    if (this.PsgDiagramSearch.hasOwnProperty(diagramViewer.id)) {
      this.PsgDiagramSearch[diagramViewer.id].setGlobalAlphaJoiner(diagramViewer, joiner);
    }
  };

  PsgDiagramSearchManager.prototype.setHighlightShape = function (diagramViewer, shape) {
    if (this.PsgDiagramSearch.hasOwnProperty(diagramViewer.id)) {
      this.PsgDiagramSearch[diagramViewer.id].setHighlightShape(diagramViewer, shape);
    }
  };

  PsgDiagramSearchManager.prototype.setHighlightJoiner = function (diagramViewer, joiner) {
    if (this.PsgDiagramSearch.hasOwnProperty(diagramViewer.id)) {
      this.PsgDiagramSearch[diagramViewer.id].setHighlightJoiner(diagramViewer, joiner);
    }
  };

  PsgDiagramSearchManager.prototype.resetGlobalAlpha = function (diagramViewer, shape) {
    if (this.PsgDiagramSearch.hasOwnProperty(diagramViewer.id)) {
      this.PsgDiagramSearch[diagramViewer.id].resetGlobalAlpha(diagramViewer, shape);
    }
  };

  PsgDiagramSearchManager.prototype.resetGlobalAlpha = function (diagramViewer, shape) {
    if (this.PsgDiagramSearch.hasOwnProperty(diagramViewer.id)) {
      this.PsgDiagramSearch[diagramViewer.id].resetGlobalAlpha(diagramViewer, shape);
    }
  };

  PsgDiagramSearchManager.prototype.manageGPS = function (diagramViewer) {
    if (this.PsgDiagramSearch.hasOwnProperty(diagramViewer.id)) {
      this.PsgDiagramSearch[diagramViewer.id].manageGPS(diagramViewer);
    }
  };

  PsgDiagramSearchManager.prototype.register = function () {
    cwApi.pluginManager.register("CwDiagramViewer.initWhenDomReady", this.init.bind(this));
    cwApi.pluginManager.register("CwDiagramViewer.beforeDrawShape", this.setGlobalAlphaShape.bind(this));
    cwApi.pluginManager.register("CwDiagramViewer.beforeDrawJoiner", this.setGlobalAlphaJoiner.bind(this));
    cwApi.pluginManager.register("CwDiagramViewer.afterDrawShape", this.setHighlightShape.bind(this));
    cwApi.pluginManager.register("CwDiagramViewer.afterDrawJoiner", this.setHighlightJoiner.bind(this));
    cwApi.pluginManager.register("CwDiagramViewer.beforeDrawRegionJoiner", this.setGlobalAlphaJoiner.bind(this));
    cwApi.pluginManager.register("CwDiagramViewer.afterDrawRegionJoiner", this.resetGlobalAlpha.bind(this));
    cwApi.pluginManager.register("CwDiagramViewer.tickEnd", this.manageGPS.bind(this));
  };

  function shouldDisplayJoiner(diagramViewer, joiner) {
    var toShape, fromShape;

    if (diagramViewer.isInEditMode === true) {
      toShape = diagramViewer.getDiagramShapeBySequence(joiner.joiner.ToSeq);
      fromShape = diagramViewer.getDiagramShapeBySequence(joiner.joiner.FromSeq);
      if (toShape !== undefined && fromShape !== undefined && toShape !== null && fromShape !== null) {
        if (toShape.shape.moveTo !== undefined || fromShape.shape.moveTo !== undefined) {
          return false;
        }
      }
    }
    return true;
  }

  // Draw Elements - Shapes, Regions and Joiners
  cwApi.Diagrams.CwDiagramViewer.prototype.drawElements = function () {
    var shape,
      joiner,
      regionJoiner,
      i,
      ctx = this.ctx;

    // Draw Shapes, text and regions inside them
    for (i = 0; i < this.diagramShapes.length; i += 1) {
      if (this.diagramShapes[i].paletteEntry !== null) {
        shape = this.diagramShapes[i];
        cwApi.pluginManager.execute("CwDiagramViewer.beforeDrawShape", this, shape);
        shape.draw(ctx, "", this);
        cwApi.pluginManager.execute("CwDiagramViewer.afterDrawShape", this, shape);
      }
    }

    // Draw Joiners
    for (i = 0; i < this.joiners.length; i += 1) {
      joiner = this.joiners[i];
      if (shouldDisplayJoiner(this, joiner) === true) {
        cwApi.pluginManager.execute("CwDiagramViewer.beforeDrawJoiner", this, joiner);
        joiner.draw(ctx, this);
        cwApi.pluginManager.execute("CwDiagramViewer.afterDrawJoiner", this, joiner);
      }
    }

    // Draw Regions on Joiners
    if (this.diagramJoinerRegions !== undefined && this.diagramJoinerRegions !== null) {
      for (i = 0; i < this.diagramJoinerRegions.length; i += 1) {
        if (this.diagramJoinerRegions[i].paletteEntry !== null) {
          regionJoiner = this.diagramJoinerRegions[i];
          cwApi.pluginManager.execute("CwDiagramViewer.beforeDrawRegionJoiner", this, regionJoiner);
          regionJoiner.draw(ctx, "", this);
          cwApi.pluginManager.execute("CwDiagramViewer.afterDrawRegionJoiner", this, regionJoiner);
        }
      }
    }

    if (this.isInEditMode === true) {
      if (this.selectionZone !== undefined && this.selectionZone.started === true) {
        this.selectionZone.drawZone(ctx, this.camera.scale);
      }
      cwApi.pluginManager.execute("CwDiagramViewer.DrawElementsEnd", this);
    }
    cwApi.pluginManager.execute("CwDiagramViewer.tickEnd", this);
  };

  cwApi.CwPlugins.PsgDiagramSearch = PsgDiagramSearchManager;

  /********************************************************************************
  Activation
  *********************************************************************************/
  new cwApi.CwPlugins.PsgDiagramSearch().register();
})(cwAPI, jQuery);
