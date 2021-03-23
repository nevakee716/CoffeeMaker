/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/

/* modified version, adding change of behaviour for the drill down, fixing issue of the objectlink
adding the support and clickable associated region*/
(function (cwApi, $) {
  "use strict";
  cwApi.Diagrams.CwDiagramViewer.prototype.clickOnCanvas = function (e) {
    var regionZone, cwObject, link;
    var that = this;

    function userHasRightToDrillDown(config) {
      var scriptname = that.currentContext.selectedObject.objectTypeScriptName;
      var templateId = that.json.properties.type_id;
      if (
        config &&
        config.template &&
        config.template[templateId] &&
        config.template[templateId].highlight &&
        config.template[templateId].highlight.shape &&
        config.template[templateId].highlight.shape[scriptname] &&
        config.template[templateId].highlight.shape[scriptname].DrillDownFilteringActivated
      ) {
        var config = config.template[templateId].highlight.shape[scriptname];

        if (config.notRole) {
          // check is the rules doesn't apply to the user
          var currentUser = cwApi.currentUser;
          for (var i = 0; i < currentUser.RolesId.length; i++) {
            if (config.notRole.hasOwnProperty(currentUser.RolesId[i])) return true;
          }
        }
        var cwfilter = new cwAPI.customLibs.utils.cwFilter();
        cwfilter.init(config.drillDownfilters);
        if (cwfilter.isMatching(that.currentContext.selectedShape.shape.cwObject)) {
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
          if (config) {
            if (userHasRightToDrillDown(config)) {
              if (config.deactivateDiagramDrillDown) {
                cwAPI.CwPopout.hide();
                location.href = cwAPI.createLinkForSingleView(
                  this.currentContext.selectedObject.objectTypeScriptName,
                  this.currentContext.selectedObject
                );
              } else this.openDiagrams(regionZone.explodedDiagrams);
            }
          } else this.openDiagrams(regionZone.explodedDiagrams);
        } else if (regionZone.IsNavigationRegion === true) {
          // Navigation
          let config = cwAPI.customLibs && cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration("diagram");
          this.openDiagrams(regionZone.navigationDiagrams, config);
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

  cwApi.Diagrams.CwDiagramViewer.prototype.openDiagrams = function (diagrams, config) {
    cwApi.CwPopout.hide();
    if (diagrams.length === 1) {
      // One Diagram
      if (config && config.deactivateDiagramDrillDown) {
        let p = diagrams[0].properties;
        window.location.hash = cwAPI.getSingleViewHash(cwApi.mm.getObjectTypeById(p.tablenumber).scriptName, p.objectid);
      } else {
        this.drillDownInDiagram(diagrams[0].object_id);
      }
    } else if (diagrams.length > 1) {
      // Multiple diagrams
      if (config && config.deactivateDiagramDrillDown) {
        let om = diagrams.map(function (d) {
          return {
            name: d.name,
            object_id: d.properties.objectid,
            objectTypeScriptName: cwApi.mm.getObjectTypeById(d.properties.tablenumber).scriptName,
            properties: { name: d.name },
          };
        });
        cwAPI.customLibs.utils.createPopOutFormultipleObjects(om);
      } else {
        this.createDialogForExplodedDiagram(diagrams);
      }
    }
  };

  cwApi.Diagrams.CwDiagramViewer.prototype.registerEvents = function () {
    var that = this;
    // Catch actions on Canvas
    this.$canvas.mousemove(that.mouseMove.bind(that));

    this.$canvas.on("mousewheel", function (e) {
      that.camera.updateMousePositions(e);
      that.mouseMove(e);
    });

    var pendingClick;
    if (!this.isDraftDiagram) {
      this.$canvas.click(function (e) {
        if (pendingClick) {
          clearTimeout(pendingClick);
          pendingClick = null;
          //dbclick
          cwAPI.CwPopout.hide();
          that.goToSelectedObjectLink(e);
        } else {
          //sclick
          pendingClick = setTimeout(function () {
            that.clickOnCanvas(e);
            pendingClick = null;
          }, 500); // should match OS multi-click speed
        }
      });
    }

    $("body").on("keydown." + this.id, this.keyDown.bind(this));
    $("body").on("keyup." + this.id, this.keyUp.bind(this));
    $(window).on("resize." + this.id, this.windowResize.bind(this));
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

  var requestAnimFrame,
    cwDiagramViewerId = 0,
    cwDiagramViewer,
    oldAnimFrameId;
  requestAnimFrame = (function () {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        var animFrameId = window.setTimeout(callback, 1000 / 15);
        return animFrameId;
      }
    );
  })();

  // TICK
  cwApi.Diagrams.CwDiagramViewer.prototype.tick = function () {
    var r, rKey, canvas, ratio;

    if (!this.removed) {
      if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (oldAnimFrameId) {
          clearTimeout(oldAnimFrameId);
        };
      }
      oldAnimFrameId = requestAnimFrame(this.tick.bind(this));
    }
    this.loop += 1;
    if (this.loop % 6 !== 0) {
      return null;
    }
    if (this.camera === undefined) {
      return null;
    }
    if (this.errorOutOfMemory) {
      return null;
    }

    this.handleMoveTo();

    this.camera.update();
    // this.camera.debug();
    this.ctx.save();
    this.camera.clearContext(this.ctx);

    // Draw Image
    if (this.isImageDiagram()) {
      this.ctx.save();
      this.camera.transform(this.ctx, false);
      ratio = 1 / this.camera.scale;
      if (this.errorOnDownScaleCache === true || ratio >= 1) {
        try {
          this.ctx.drawImage(this.image, 0, 0, this.image.naturalWidth * ratio, this.image.naturalHeight * ratio);
        } catch (err) {
          cwApi.Log.Error(err);
          cwApi.notificationManager.addNotification($.i18n.prop("cmdiagram_run_out_of_memory"), "error");
          clearTimeout(oldAnimFrameId);
          this.errorOutOfMemory = true;
        }
      } else {
        r = parseInt(Math.floor(ratio / this.ratioDownScaleConst), 10);
        r += 1;
        rKey = r * this.ratioDownScaleConst;
        rKey = parseFloat(rKey.toFixed(2), 10);

        canvas = this.downScaleCache[rKey];
        if (!cwApi.isUndefinedOrNull(canvas)) {
          this.ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, this.image.naturalWidth * ratio, this.image.naturalHeight * ratio);
        }
      }
      this.ctx.restore();
    }

    this.camera.transform(this.ctx);
    this.ctx.lineWidth = 1;

    if (this.useImage) {
      // Stroke images and navigation/explosion regions
      this.setStrokeShapeWhenMouseHover(this.ctx);
    } else {
      // Draw Diagram on canvas
      this.drawElements();
      if (cwApi.CwPrintManager.isPrintMode() === false) {
        this.setStrokeShapeWhenMouseHover(this.ctx); // Stroke navigation areas
        this.setStrokeJoinerWhenMouseHover(this.ctx); // Stroke navigation areas
      }
    }
    this.ctx.restore();

    if (this.loop === 0) {
      // if there is no image after first draw, diagram is ready for save
      if (this.regionsImageCount === 0) {
        return this.onReadyToSaveAsImage();
      }
    }
    // asap all the image and ready & draw at least once (as here is the end of draw) the diagrma viewer is ready
    if (this.regionsImageAreAllLoaded === true) {
      delete this.regionsImageAreAllLoaded;
      return this.onReadyToSaveAsImage();
    }
    if (this.oldHeight && this.oldWidth && (this.oldHeight != this.$diagramContainer.height() || this.oldWidth != this.$diagramContainer.width())) {
      this.redraw();
    }
    this.oldHeight = this.$diagramContainer.height();
    this.oldWidth = this.$diagramContainer.width();
    return null;
  };

  cwApi.Diagrams.CwDiagramViewer.prototype.setToFullscreenHeight = function () {
    var h = cwApi.setToFullScreenAndGetNewHeight(this.$diagramContainer, 0);
    if (h < cwApi.CwDiagramDefinitions.MinimumDiagramHeight) {
      h = (this.$diagramContainer.width() * this.json.diagram.size.Height) / this.json.diagram.size.Width;
    }
    this.setDiagramContainerMinHeight(h);
  };
})(cwAPI, jQuery);
