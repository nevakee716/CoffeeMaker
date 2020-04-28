/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/

/* modified version, adding change of behaviour for the drill down, fixing issue of the objectlink
adding the support and clickable associated region*/
(function (cwApi, $) {
  "use strict";
  cwApi.Diagrams.CwDiagramViewer.prototype.clickOnCanvas = function (e) {
    var regionZone, cwObject, link;

    function openObjectLink() {
      // Object link
      cwObject = that.currentContext.selectedShape.shape.cwObject;
      if (cwObject !== undefined && cwObject !== null && cwObject.properties !== undefined && cwObject.properties !== null) {
        link = cwObject.properties.link;
        var re = /cwOpenDiagram.exe [A-Z0-9]* (\d*)/;
        var result = link.match(re);
        if (result && result[1]) {
          var newHash = cwApi.getSingleViewHash("diagram", result[1]);
          cwApi.updateURLHash(newHash);
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

    if (this.currentContext.selectedShape !== null && this.currentContext.selectedJoiner === null) {
      regionZone = this.currentContext.selectedRegionZone;
      if (!cwApi.isUndefinedOrNull(regionZone)) {
        if (this.currentContext.selectedShape.shape.paletteEntryKey === "OBJECTLINK|0") {
          openObjectLink();
        } else if (regionZone.IsExplosionRegion === true) {
          // Explosion
          let config = cwAPI.customLibs && cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration("diagram");
          if (config && config.deactivateDiagramDrillDown) {
            location.href = cwAPI.createLinkForSingleView(
              this.currentContext.selectedObject.objectTypeScriptName,
              this.currentContext.selectedObject
            );
          } else this.openDiagrams(regionZone.explodedDiagrams);
        } else if (regionZone.IsNavigationRegion === true) {
          // Navigation
          this.openDiagrams(regionZone.navigationDiagrams);
        } else if (regionZone.RegionTypeString === "MultiplePropertyAssociations" || regionZone.RegionTypeString === "Association") {
          if (cwAPI.customLibs && cwAPI.customLibs.utils && cwAPI.customLibs.utils.createPopOutFormultipleObjects)
            cwAPI.customLibs.utils.createPopOutFormultipleObjects(regionZone.filteredObjects);
        } else if (regionZone.Clickable === true) {
          // Clickable regions
          if (!cwApi.isUndefined(regionZone) && regionZone.ClickableRegionUrl !== "") {
            window.open(regionZone.ClickableRegionUrl, "_blank");
          }
        }
      } else {
        cwObject = this.currentContext.selectedShape.shape.cwObject;
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

  cwApi.Diagrams.CwDiagramViewer.prototype.getImageFromCanvas = function (title, sizeScale, e, isDiagramOverview, callback) {
    var canvas,
      diagramViewer,
      $saveButton,
      $container,
      $canvas,
      w,
      h,
      fileName,
      diagramImage,
      that = this,
      exportId;
    if (sizeScale === undefined) {
      sizeScale = 5;
    }

    if (title === undefined || title === null || title === "" || title === "&nbsp;") title = "NoName";

    fileName = title + ".png";
    exportId = "SaveVectorToImage-" + this.id;

    if (isDiagramOverview) {
      $("body").append("<div id='" + exportId + "' class='cw-diagram-export-image' style = 'display: none;'></div>");
    } else {
      $("body").append("<div id='" + exportId + "' class='cw-diagram-export-image'></div>");
    }

    $container = $("#" + exportId);

    diagramImage = {
      $container: $container,
      fileName: fileName,
      diagramViewer: diagramViewer,
      remove: function () {
        if (diagramViewer !== undefined) {
          diagramViewer.removed = true;
        }
        $container.remove();
        that.removeSaveToImageLoader();
      },
    };

    if (that.useImage === true) {
      $container.append(
        '<canvas id="canvas_temp_' +
          that.id +
          '" class="cwDiagramViewer" width="' +
          that.image.width +
          '" height="' +
          that.image.height +
          '"></canvas>'
      );
      $canvas = $container.find("#canvas_temp_" + that.id);
      canvas = $canvas[0];
      canvas.getContext("2d").drawImage(that.image, 0, 0);
      diagramImage.canvas = canvas;
      return callback && callback(diagramImage);
    }
    // is vector mode
    var maxHeightWidth = this.getCanvasMaxHeight();

    var scaleLimitByLength = (maxHeightWidth - 100) / Math.max(that.json.diagram.size.Height, that.json.diagram.size.Width);
    var actualScale = Math.min(scaleLimitByLength, sizeScale);

    w = that.json.diagram.size.Width * actualScale + 100;
    h = that.json.diagram.size.Height * actualScale + 100;

    var maxArea = this.getCanvasMaxArea();
    if (w * h > maxArea) {
      var rescaleRatio = Math.sqrt(maxArea / w / h);
      w = Math.floor(w * rescaleRatio);
      h = Math.floor(h * rescaleRatio);
    }

    $container.css("width", 500);
    $container.css("height", 250);
    diagramViewer = new cwAPI.Diagrams.CwDiagramViewer($container, false, that.BehaviourProperties);
    diagramImage.diagramViewer = diagramViewer;
    diagramViewer.onReadyToSaveAsImage = function () {
      return callback && callback(diagramImage);
    };
    diagramViewer.json = that.json;
    diagramViewer.isDiagramOverview = isDiagramOverview;
    diagramViewer.isDraftDiagram = that.isDraftDiagram;
    diagramViewer.initSave(sizeScale);
    diagramImage.canvas = diagramViewer.$canvas[0];
    // draw the diagram, then remove it asap
    diagramViewer.$canvas.attr("width", w);
    diagramViewer.$canvas.attr("height", h);
    diagramViewer.$canvas.css("background-color", "transparent");
    diagramViewer.ctx.canvas.width = w;
    diagramViewer.ctx.canvas.height = h;
    diagramViewer.setInitPositionAndScale(true, false, true, isDiagramOverview);
    cwApi.pluginManager.execute("CwDiagramViewer.printDiagramReady", diagramViewer);
    diagramViewer.tick();
    diagramViewer.tick();
  };
})(cwAPI, jQuery);
