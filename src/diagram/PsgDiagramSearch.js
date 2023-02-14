/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";

  var PsgDiagramSearch;

  PsgDiagramSearch = function (diagramViewer, configuration) {
    function hex(x) {
      return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    function rgb2hex(rgb) {
      rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(,\s*\d+\.*\d+)?\)$/);
      return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }

    this.globalAlpha = configuration.globalAlpha;
    this.connectorObject = ["CONNECTORSET", "EVENTRESULT"];
    this.originalHighlightColor = configuration.color;
    this.highlightColor = configuration.color;
    this.title1 = "Search";
    this.title2 = diagramViewer.json.properties.type;
    this.width = 5;
    this.falseString = $.i18n.prop("global_false");
    this.trueString = $.i18n.prop("global_true");

    this.weakArrowSymbol = [0, 3];
    this.highlightShape = {};
    this.highlightConnectorObject = {};
    this.diagramViewer = diagramViewer;
    this.template = this.diagramViewer.json.properties.type;
    this.gpsButton = false;
    var v = cwAPI.getCurrentView();

    this.config = configuration.shape;

    if (!diagramViewer.isImageDiagram()) {
      this.setupDiagramOptions(diagramViewer);
      this.createSearchButton(diagramViewer);
    }
  };

  PsgDiagramSearch.prototype.setupDiagramOptions = function (diagramViewer) {
    var i, entry, objectTypeScriptName, propertyScriptname, paletteEntry, associationRegionEntry, associationRegion;
    this.diagramOptions = {};
    for (paletteEntry in diagramViewer.json.diagram.paletteEntries) {
      if (diagramViewer.json.diagram.paletteEntries.hasOwnProperty(paletteEntry)) {
        entry = diagramViewer.json.diagram.paletteEntries[paletteEntry];
        objectTypeScriptName = entry.PaletteObjectTypeScriptName.toLowerCase();
        if (!this.diagramOptions.hasOwnProperty(objectTypeScriptName)) {
          this.diagramOptions[objectTypeScriptName] = {};
          this.diagramOptions[objectTypeScriptName].properties = [];
          this.diagramOptions[objectTypeScriptName].properties.push("name");
          this.diagramOptions[objectTypeScriptName].associations = {};
        } else {
          if (objectTypeScriptName === "eventresult") {
            propertyScriptname = "internalexternal";
          } else {
            propertyScriptname = "type";
          }
          if (this.diagramOptions[objectTypeScriptName].properties.indexOf(propertyScriptname) === -1) {
            this.diagramOptions[objectTypeScriptName].properties.push(propertyScriptname);
          }
        }
        for (i = 0; i < entry.PropertiesToExport.length; i += 1) {
          propertyScriptname = entry.PropertiesToExport[i].toLowerCase();
          if (this.diagramOptions[objectTypeScriptName].properties.indexOf(propertyScriptname) === -1) {
            this.diagramOptions[objectTypeScriptName].properties.push(propertyScriptname);
          }
        }
        for (associationRegionEntry in entry.AssociationsRegions) {
          if (entry.AssociationsRegions.hasOwnProperty(associationRegionEntry)) {
            associationRegion = entry.AssociationsRegions[associationRegionEntry];
            if (!this.diagramOptions[objectTypeScriptName].associations.hasOwnProperty(associationRegion.AssociationTypeScriptName)) {
              this.diagramOptions[objectTypeScriptName].associations[associationRegion.AssociationTypeScriptName] = [];
            }
            this.diagramOptions[objectTypeScriptName].associations[associationRegion.AssociationTypeScriptName] = this.diagramOptions[
              objectTypeScriptName
            ].associations[associationRegion.AssociationTypeScriptName].concat(associationRegion.PropertiesToSelect);
          }
        }
      }
    }

    this.getAllAssociatedItems(diagramViewer);
  };

  PsgDiagramSearch.prototype.getAllAssociatedItems = function (diagramViewer) {
    var otScriptName,
      atScriptName,
      cwObject,
      i = 0,
      j = 0,
      item,
      at;
    this.itemsByScriptname = {};
    for (i = 0; i < diagramViewer.json.diagram.shapes.length; i += 1) {
      cwObject = diagramViewer.json.diagram.shapes[i].cwObject;
      if (!cwApi.isUndefinedOrNull(cwObject)) {
        otScriptName = cwObject.objectTypeScriptName;
        if (this.diagramOptions.hasOwnProperty(otScriptName)) {
          for (atScriptName in this.diagramOptions[otScriptName].associations) {
            if (this.diagramOptions[otScriptName].associations.hasOwnProperty(atScriptName)) {
              for (at in cwObject.associations) {
                if (cwObject.associations.hasOwnProperty(at) && at.indexOf(atScriptName.toLowerCase()) !== -1) {
                  for (j = 0; j < cwObject.associations[at].length; j += 1) {
                    item = cwObject.associations[at][j];
                    if (!this.itemsByScriptname.hasOwnProperty(atScriptName)) {
                      this.itemsByScriptname[atScriptName] = [];
                    }
                    this.itemsByScriptname[atScriptName].push(item);
                  }
                }
              }
            }
          }
        }
      }
    }

    for (at in this.itemsByScriptname) {
      if (this.itemsByScriptname.hasOwnProperty(at)) {
        this.itemsByScriptname[at].sort(function (a, b) {
          var x = a.name.toLowerCase();
          var y = b.name.toLowerCase();
          if (x < y) {
            return -1;
          }
          if (x > y) {
            return 1;
          }
          return 0;
        });
      }
    }
  };

  PsgDiagramSearch.prototype.manageGPS = function (diagramViewer) {
    var t = 0,
      self = this;
    this.selectedShape = null;
    Object.keys(this.highlightShape).forEach(function (s) {
      if (self.highlightShape[s] >= 2) {
        t = t + 1;
        self.selectedShape = s;
      }
    });
    if (t === 1 && this.gpsButton === false) {
      this.gpsButton = true;
      let b = document.getElementsByClassName("diagramSearchGPS")[0];
      if (b) b.classList.remove("cw-hidden");
    }
    if (t !== 1 && this.gpsButton === true) {
      this.gpsButton = false;
      let b = document.getElementsByClassName("diagramSearchGPS")[0];
      if (b) b.classList.add("cw-hidden");
    }

    if (this.updateOverwiew === true) {
      diagramViewer.camera.updateDiagramOverview(false);
      this.updateOverwiew = false;
    }
  };

  PsgDiagramSearch.prototype.initSearchButton = function (diagramViewer) {
    let b = document.getElementsByClassName("diagramSearchGPS")[0];
    var self = this;
    if (b) {
      b.addEventListener("click", function (e) {
        if (self.selectedShape != null) {
          let shape = diagramViewer.diagramShapesBySequence[self.selectedShape].shape;
          diagramViewer.centerShapeOnCanvas(shape);
          self.updateOverwiew = true;
          /*let point = new cwApi.CwPoint();
          point.x = shape.X + shape.W / 2;
          point.y = shape.Y + shape.H / 2;
          let scale = Math.max(Math.min(Math.max(shape.H, shape.W) * 0.004, 1), 0.1);
          diagramViewer.camera.focusOnPoint(point, scale);*/
        }
      });
    }
  };

  PsgDiagramSearch.prototype.createSearchBox = function (diagramViewer) {
    if (!diagramViewer.isImageDiagram()) {
      var searchBox,
        o,
        that = this;
      searchBox = diagramViewer.$breadcrumb.find(".cw-diagram-searchBox");
      if (searchBox.length > 0) {
        searchBox.remove();
      }

      var filterContainer = document.createElement("a");
      filterContainer.className = "cw-diagram-searchBox-Container bootstrap-iso";

      var filterObject;
      var option, optgroup;

      filterObject = document.createElement("select");
      filterObject.setAttribute("title", '<i style="color : black" class="fa fa-search" aria-hidden="true"></i> ' + $.i18n.prop("focus_on"));
      filterObject.setAttribute("data-selected-text-format", "static");
      filterObject.setAttribute("data-size", "10");
      filterObject.setAttribute("data-live-search", "true");
      filterObject.setAttribute("data-selected-text-format", "static");
      filterObject.setAttribute("data-width", "300px");
      filterObject.setAttribute("data-dropdown-align-right", false);

      filterObject.className = "cw-diagram-searchBox";
      filterContainer.appendChild(filterObject);
      this.getShapeForSearchBox(diagramViewer, filterObject);
      diagramViewer.$breadcrumb.find(".cwDiagramBreadcrumbZoneRight").prepend(filterContainer);

      var self = this;
      if (cwAPI.isDebugMode() === true) {
        self.pushSearchBox(diagramViewer);
      } else {
        let libToLoad =
          cwAPI.cwConfigs.EnabledVersion.indexOf("v2022") !== -1
            ? []
            : ["modules/bootstrap/bootstrap.min.js", "modules/bootstrap-select/bootstrap-select.min.js"];
        // AsyncLoad
        cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad, function (error) {
          if (error === null) {
            self.pushSearchBox(diagramViewer);
          } else {
            cwAPI.Log.Error(error);
          }
        });
      }
    }
  };
  PsgDiagramSearch.prototype.pushSearchBox = function (diagramViewer) {
    var searchBox = diagramViewer.$breadcrumb.find(".cw-diagram-searchBox");
    searchBox.selectpicker();

    var self = this;
    searchBox.on("changed.bs.select", function (e, clickedIndex, newValue, oldValue) {
      var changeSet, id, nodeId, i;
      var groupArray = {};
      if (clickedIndex !== undefined && $(this).children() && $(this).children().children()[clickedIndex]) {
        id = $(this).children().children()[clickedIndex].id;
        let shape = diagramViewer.diagramShapesBySequence[id].shape;

        diagramViewer.centerShapeOnCanvas(shape);
        self.updateOverwiew = true;
      }
      //$(this).selectpicker("val", "");
    });
  };

  PsgDiagramSearch.prototype.getShapeForSearchBox = function (diagramViewer, filterObject) {
    var shapeByObjectType = {};
    let shapes = [];

    diagramViewer.diagramShapes.forEach(function (s) {
      let o = s.shape.cwObject;

      if (o && o.objectTypeScriptName !== "freetextobject" && o.objectTypeScriptName !== "connectorset") {
        if (shapeByObjectType[o.objectTypeScriptName] === undefined) shapeByObjectType[o.objectTypeScriptName] = [];
        shapeByObjectType[o.objectTypeScriptName].push(s);
        shapes.push(s);
      }
    });
    let dupeIds = [];
    for (let ot in shapeByObjectType) {
      if (shapeByObjectType.hasOwnProperty(ot)) {
        let shapes = shapeByObjectType[ot];
        let dupesObjectIds = [];
        let ids = [];
        shapes.forEach(function (s) {
          if (ids.indexOf(s.shape.cwObject.object_id) === -1) {
            ids.push(s.shape.cwObject.object_id);
          } else dupesObjectIds.push(s.shape.cwObject.object_id);
        });
        shapes.forEach(function (s) {
          if (dupesObjectIds.indexOf(s.shape.cwObject.object_id) !== -1) {
            dupeIds.push(s.shape.Sequence);
          }
        });
      }
    }

    shapes.sort(function (a, b) {
      return a.shape.W * a.shape.H - b.shape.W * b.shape.H;
    });

    shapes.forEach(function (s) {
      if (dupeIds.indexOf(s.shape.Sequence) !== -1) {
        shapes.forEach(function (sp) {
          if (s.shape.Sequence !== sp.shape.Sequence) {
            if (
              sp.parent === undefined &&
              sp.shape.X + sp.shape.W > s.shape.X + s.shape.W &&
              sp.shape.X < s.shape.X &&
              sp.shape.Y + sp.shape.H > s.shape.Y + s.shape.H &&
              sp.shape.Y < s.shape.Y
            ) {
              if (s.parent === undefined) s.parent = sp;
              else if (sp.shape.W * sp.shape.H < s.parent.shape.W * s.parent.shape.H) s.parent = sp;
            }
          }
        });
      }
    });

    shapes.forEach(function (s) {
      if (s.parent) s.shape.cwObject.name += " (" + s.parent.shape.cwObject.name + ")";
    });

    for (let ot in shapeByObjectType) {
      if (shapeByObjectType.hasOwnProperty(ot)) {
        let shapes = shapeByObjectType[ot];

        shapes.sort(function (a, b) {
          return a.shape.cwObject.name.localeCompare(b.shape.cwObject.name);
        });
      }
    }

    Object.keys(shapeByObjectType).forEach(function (otScriptName) {
      var shapes = shapeByObjectType[otScriptName];
      let g = document.createElement("optgroup");
      g.setAttribute("label", cwAPI.mm.getObjectType(otScriptName).name);
      shapes.forEach(function (s) {
        let object = document.createElement("option");
        object.setAttribute("id", s.shape.Sequence);
        object.textContent = s.shape.cwObject.name;
        g.appendChild(object);
      });
      filterObject.appendChild(g);
    });
  };

  PsgDiagramSearch.prototype.createSearchButton = function (diagramViewer) {
    var searchButton,
      o,
      that = this;
    searchButton = diagramViewer.$breadcrumb.find("a#cw-diagram-search");
    if (searchButton.length > 0) {
      searchButton.unbind("click");
    } else {
      o = [];
      o.push(
        '<a id="cw-diagram-search" class="btn btn-diagram-search no-text" title="',
        $.i18n.prop("DiagramSearchSearchIcon"),
        '"><span class="btn-text"></span><i class="fa fa-search"></i></a>'
      );
      diagramViewer.$breadcrumb.find(".cwDiagramBreadcrumbZoneRight").append(o.join(""));
      searchButton = diagramViewer.$breadcrumb.find(".btn-diagram-search");
    }

    searchButton.on("click", function () {
      that.setupDiagramSearchZone(diagramViewer);
    });
  };

  PsgDiagramSearch.prototype.setupDiagramSearchZone = function (diagramViewer) {
    var o,
      $div,
      paletteEntry,
      objScriptname,
      objType,
      loadedEntries,
      that = this;
    o = [];
    loadedEntries = [];
    o.push('<div class="cw-diagram-search-container">');
    o.push('<a class="btn page-action no-text diagramSearchGPS cw-hidden" title="Focus"><i class="fa fa-map-marker"></i></a>');
    o.push("<h3>", this.title2, "</h3>");
    o.push('<div class="cw-diagram-search">');

    o.push(
      '<div class="cw-diagram-search-objectType"><span class="diagramSearchHeader">',
      $.i18n.prop("globalSearch_objectType"),
      ' : </span> <select class="HTML5searchFiler" id="',
      diagramViewer.id,
      '-options-select">'
    );
    o.push('<option value="0"> </option>');
    for (paletteEntry in diagramViewer.json.diagram.paletteEntries) {
      if (diagramViewer.json.diagram.paletteEntries.hasOwnProperty(paletteEntry)) {
        objScriptname = diagramViewer.json.diagram.paletteEntries[paletteEntry].PaletteObjectTypeScriptName.toLowerCase();
        if ((this.config && this.config[objScriptname] && this.config[objScriptname].activated) || this.config === undefined) {
          objType = cwApi.mm.getObjectType(objScriptname);
          if (!cwApi.isUndefined(objType)) {
            if (loadedEntries.indexOf(objScriptname) === -1) {
              o.push('<option value="', objScriptname, '">', objType.name, "</option>");
              loadedEntries.push(objScriptname);
            }
          }
        }
      }
    }
    o.push("</select></div>");
    o.push('<ul class="cw-search-zone-properties"></ul></div>');
    o.push("</div>");
    $div = $(o.join(""));
    cwApi.CwPopout.showPopout(this.title1);
    cwApi.CwPopout.setContent($div);
    this.initSearchButton(diagramViewer);
    this.setupOptionEvents(diagramViewer);
    cwApi.CwPopout.onClose(function () {
      that.setupSearchParameters(false);
    });
  };

  PsgDiagramSearch.prototype.setupOptionEvents = function (diagramViewer) {
    var that = this,
      displayPropertyField,
      displayLookup,
      displayAssociationField;
    displayLookup = function (output, property, lookups) {
      var i;
      output.push(
        '<span class="diagramSearchHeader">',
        property.name,
        " : </span>",
        '<select id="',
        diagramViewer.id,
        "-options-property-",
        property.scriptName,
        '" data-property-scriptname="',
        property.scriptName,
        '" >'
      );
      output.push('<option value="-1"> </option>');
      for (i = 0; i < lookups.length; i += 1) {
        output.push('<option value="', lookups[i].id, '">', lookups[i].name, "</option>");
      }
      output.push("</select>");
    };
    displayAssociationField = function (output, association) {
      var display = false,
        i,
        o = [],
        alreadyDisplayedItemIds = [];
      o.push(
        '<span class="diagramSearchHeader">',
        association.DisplayName,
        " : </span>",
        '<select id="',
        diagramViewer.id,
        "-options-association-",
        association.ScriptName,
        '" data-association-scriptname="',
        association.ScriptName,
        '">'
      );
      o.push('<option value="0"> </option>');
      if (that.itemsByScriptname.hasOwnProperty(association.ScriptName)) {
        for (i = 0; i < that.itemsByScriptname[association.ScriptName].length; i += 1) {
          if (alreadyDisplayedItemIds.indexOf(that.itemsByScriptname[association.ScriptName][i].object_id) === -1) {
            o.push(
              '<option value="',
              that.itemsByScriptname[association.ScriptName][i].object_id,
              '">',
              that.itemsByScriptname[association.ScriptName][i].name,
              "</option>"
            );
            alreadyDisplayedItemIds.push(that.itemsByScriptname[association.ScriptName][i].object_id);
          }
        }
        display = true;
      }
      o.push("</select>");
      if (display) {
        output.push('<li class="cw-diagram-options-li" data-association-scriptname="', association.ScriptName, '">');
        output.push(o.join(""));
        output.push("</li>");
      }
    };
    displayPropertyField = function (output, property) {
      var display = true,
        o = [],
        lookups;

      switch (property.type) {
        case "Boolean":
          lookups = [
            {
              id: "false",
              name: that.falseString,
            },
            {
              id: "true",
              name: that.trueString,
            },
          ];
          displayLookup(o, property, lookups);
          break;
        case "Date":
          break;
        case "Lookup":
        case "FixedLookup":
          lookups = property.lookups;
          displayLookup(o, property, lookups);
          break;
        default:
          o.push(
            '<span class="diagramSearchHeader">',
            property.name,
            ' : </span><input type="text" class="k-input k-textbox" id="',
            diagramViewer.id,
            "-options-property-",
            property.scriptName,
            '" data-property-scriptname="',
            property.scriptName,
            '" />'
          );
          break;
      }
      if (display) {
        output.push('<li class="cw-diagram-options-li" data-property-scriptname="', property.scriptName, '">');
        output.push(o.join(""));
        output.push("</li>");
      }
    };

    $("select#" + diagramViewer.id + "-options-select").change(function (e) {
      $("ul.cw-search-zone-properties li").remove();
      var selectedOt, output, properties, property, associations, associationScriptName, association, i;
      selectedOt = e.target.value;
      output = [];
      if (that.diagramOptions.hasOwnProperty(selectedOt)) {
        properties = that.diagramOptions[selectedOt].properties;
        if (!cwApi.isUndefined(properties)) {
          for (i = 0; i < properties.length; i += 1) {
            property = cwApi.mm.getProperty(selectedOt, properties[i]);
            if (!cwApi.isUndefined(property)) {
              if (
                that.config === undefined ||
                (that.config[selectedOt].activated === true &&
                  (that.config[selectedOt].region === undefined ||
                    (that.config[selectedOt].region[property.scriptName] && that.config[selectedOt].region[property.scriptName] === true)))
              ) {
                displayPropertyField(output, property);
              }
            }
          }
        }
        associations = that.diagramOptions[selectedOt].associations;
        if (!cwApi.isUndefined(associations)) {
          for (associationScriptName in associations) {
            if (associations.hasOwnProperty(associationScriptName)) {
              association = cwAPI.mm.getMetaModel().AssociationScriptNames[associationScriptName];
              if (!cwApi.isUndefined(association)) {
                if (
                  that.config === undefined ||
                  (that.config[selectedOt].activated === true &&
                    (that.config[selectedOt].region === undefined ||
                      (that.config[selectedOt].region[association.ScriptName] && that.config[selectedOt].region[association.ScriptName] === true)))
                ) {
                  displayAssociationField(output, association);
                }
              }
            }
          }
        }
        //  date
        if (that.config && that.config[selectedOt] && that.config[selectedOt].steps) {
          var step;

          output.push('<li class="cw-diagram-options-li" >');
          output.push('<span class="diagramSearchHeader">Date : </span><input id="', diagramViewer.id, "_", selectedOt, '_date" type="date">');
          output.push("</li>");
          output.push('<li class="searchFilerDateLegend" >');
          that.config[selectedOt].steps.forEach(function (step) {
            output.push('<div><i class="fa fa-square-o" style="color:', step.color, '" aria-hidden="true"></i>', " : ", step.name, "</div>");
          });
          output.push("</li>");
        }

        $("ul.cw-search-zone-properties").append(output.join(""));
        that.setupSearchParameters(true);
      } else {
        that.setupSearchParameters(false);
      }

      $.each($("ul.cw-search-zone-properties input, ul.cw-search-zone-properties select"), function (i, item) {
        /*jslint unparam:true*/
        $(item).on("change", function () {
          that.setupSearchParameters(true);
        });
        $(item).on("keyup", function () {
          that.setupSearchParameters(true);
        });
      });
    });
  };

  PsgDiagramSearch.prototype.setGlobalAlphaShape = function (diagramViewer, shape) {
    if (!cwApi.isUndefinedOrNull(shape) && !cwApi.isUndefinedOrNull(shape.shape) && !cwApi.isUndefinedOrNull(shape.shape.cwObject)) {
      if (
        !cwApi.isUndefined(this.searchParameters) &&
        this.searchParameters.search === true &&
        this.searchParameters.objectTypeScriptName === shape.shape.cwObject.objectTypeScriptName &&
        this.highlightShape[shape.shape.Sequence] < 2
      ) {
        diagramViewer.ctx.globalAlpha = this.globalAlpha;
      } else {
        diagramViewer.ctx.globalAlpha = 1;
      }
    }
  };

  PsgDiagramSearch.prototype.setGlobalAlphaJoiner = function (diagramViewer, joiner) {
    if (!cwApi.isUndefinedOrNull(joiner) && !cwApi.isUndefined(this.searchParameters) && this.searchParameters.search === true) {
      if (!this.isJoinerNeedToBeHighlight(joiner)) {
        diagramViewer.ctx.globalAlpha = this.globalAlpha;
      } else {
        diagramViewer.ctx.globalAlpha = 1;
      }
    }
  };

  PsgDiagramSearch.prototype.resetGlobalAlpha = function (diagramViewer) {
    if (!cwApi.isUndefined(this.searchParameters) && this.searchParameters.search === true) {
      diagramViewer.ctx.globalAlpha = this.globalAlpha;
    } else {
      diagramViewer.ctx.globalAlpha = 1;
    }
  };

  PsgDiagramSearch.prototype.setHighlightShape = function (diagramViewer, shape) {
    if (!cwApi.isUndefinedOrNull(shape) && !cwApi.isUndefinedOrNull(shape.shape) && !cwApi.isUndefinedOrNull(shape.shape.cwObject)) {
      if (!cwApi.isUndefined(this.searchParameters) && this.searchParameters.search === true) {
        if (this.isShapeNeedToBeHighlight(shape)) {
          diagramViewer.strokeShape(diagramViewer.ctx, shape, this.highlightColor, this.width);
          return;
        }
      }
      this.highlightShape[shape.shape.Sequence] = 0;
    }
  };

  PsgDiagramSearch.prototype.isShapeNeedToBeHighlight = function (shape) {
    if (shape.hasOwnProperty("shape") && this.highlightConnectorObject.hasOwnProperty(shape.shape.Sequence)) {
      // Check if it's a connectorSet
      if (this.highlightConnectorObject[shape.shape.Sequence].before && this.highlightConnectorObject[shape.shape.Sequence].after) {
        // Check if it should be highlight
        this.highlightShape[shape.shape.Sequence] = 2;
        this.highlightConnectorObject[shape.shape.Sequence].before = false;
        this.highlightConnectorObject[shape.shape.Sequence].after = false;
        return true;
      }
      // if it's connector init it
    } else if (shape.hasOwnProperty("shape") && this.connectorObject.indexOf(shape.shape.cwObject.objectTypeScriptName.toUpperCase()) !== -1) {
      this.highlightConnectorObject[shape.shape.Sequence] = {};
      this.highlightConnectorObject[shape.shape.Sequence].before = false;
      this.highlightConnectorObject[shape.shape.Sequence].after = false;
    }
    if (this.matchSearchCriteria(shape.shape.cwObject)) {
      // if regular shape, check if it should be highlight
      this.highlightShape[shape.shape.Sequence] = 2;
      return true;
    }
    return false;
  };

  PsgDiagramSearch.prototype.setHighlightJoiner = function (diagramViewer, joiner) {
    if (!cwApi.isUndefinedOrNull(joiner) && !cwApi.isUndefinedOrNull(joiner.joiner) && this.isJoinerNeedToBeHighlight(joiner)) {
      var style = {};
      var ctx = diagramViewer.ctx;
      style.StrokeColor = this.highlightColor;
      style.StrokePattern = "SOLID";

      joiner.setJoinerStyle(ctx, style);
      if (joiner.joiner.points.length > 0) {
        // Draw joiners lines
        joiner.drawJoinerLines(ctx, style.StrokePattern.toUpperCase() !== "SOLID");

        if (!cwAPI.isUndefinedOrNull(joiner.paletteEntry)) {
          // Draw joiner symbols
          if (joiner.joiner.points.length > 1) {
            joiner.drawJoinerSide(ctx, joiner.paletteEntry, "JoinerToEndSymbol");
            joiner.drawJoinerSide(ctx, joiner.paletteEntry, "JoinerFromEndSymbol");
          }
        }
      }
    }
  };

  PsgDiagramSearch.prototype.isJoinerNeedToBeHighlight = function (joiner) {
    var toto = "ae";
    // si le from est un connectorSet
    if (joiner.joiner && this.highlightConnectorObject.hasOwnProperty(joiner.joiner.FromSeq)) {
      if (this.highlightShape.hasOwnProperty(joiner.joiner.ToSeq) && this.highlightShape[joiner.joiner.ToSeq] >= 2) {
        if (joiner.paletteEntry && this.weakArrowSymbol.indexOf(joiner.paletteEntry.JoinerFromEndSymbol) !== -1) {
          this.highlightConnectorObject[joiner.joiner.FromSeq].before = true;
        } else {
          this.highlightConnectorObject[joiner.joiner.FromSeq].after = true;
        }
      }
    }
    // si le to est un connectorSet
    if (joiner.joiner && this.highlightConnectorObject.hasOwnProperty(joiner.joiner.ToSeq)) {
      if (this.highlightShape.hasOwnProperty(joiner.joiner.FromSeq) && this.highlightShape[joiner.joiner.FromSeq] >= 2) {
        if (joiner.paletteEntry && this.weakArrowSymbol.indexOf(joiner.paletteEntry.JoinerFromEndSymbol) !== -1) {
          this.highlightConnectorObject[joiner.joiner.ToSeq].after = true;
        } else {
          this.highlightConnectorObject[joiner.joiner.ToSeq].before = true;
        }
      }
    }

    if (
      joiner.joiner &&
      this.highlightShape.hasOwnProperty(joiner.joiner.FromSeq) &&
      this.highlightShape[joiner.joiner.FromSeq] >= 2 &&
      this.highlightShape.hasOwnProperty(joiner.joiner.ToSeq) &&
      this.highlightShape[joiner.joiner.ToSeq] >= 2
    ) {
      return true;
    } else {
      return false;
    }
  };

  cwAPI.Diagrams.CwDiagramViewer.prototype.strokeShape = function (ctx, shape, strokeColor, width) {
    if (ctx !== undefined) {
      ctx.strokeStyle = strokeColor;
      if (width !== undefined) {
        ctx.lineWidth = width; //2
      } else {
        ctx.lineWidth = 1; //2
      }
      var item = shape.getItem();
      shape.drawSymbolPath(ctx, 100, item);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  };

  PsgDiagramSearch.prototype.setupSearchParameters = function (set) {
    if (set === false) {
      if (cwApi.isUndefined(this.searchParameters)) {
        this.searchParameters = {};
      }
      this.searchParameters.search = false;
      return undefined;
    }

    var i, params, canSearch, inputField, inputValue, selectedOt, at;
    canSearch = true;
    selectedOt = $("select#" + this.diagramViewer.id + "-options-select").val();
    params = {};
    params.properties = {};
    params.associations = {};
    if (this.diagramOptions.hasOwnProperty(selectedOt)) {
      for (i = 0; i < this.diagramOptions[selectedOt].properties.length; i += 1) {
        inputField = $("#" + this.diagramViewer.id + "-options-property-" + this.diagramOptions[selectedOt].properties[i]);
        if (inputField.attr("type") === "checkbox") {
          inputValue = inputField.is(":checked");
        } else {
          inputValue = inputField.val();
        }
        params.properties[this.diagramOptions[selectedOt].properties[i]] = inputValue;
      }
      for (at in this.diagramOptions[selectedOt].associations) {
        if (this.diagramOptions[selectedOt].associations.hasOwnProperty(at)) {
          inputField = $("#" + this.diagramViewer.id + "-options-association-" + at);
          inputValue = inputField.val();
          params.associations[at] = inputValue;
        }
      }
    }
    this.searchParameters = params;
    this.searchParameters.objectTypeScriptName = selectedOt;
    this.searchParameters.date = $("#" + this.diagramViewer.id + "_" + selectedOt + "_date").val();

    if (selectedOt !== "0") {
      this.searchParameters.search = canSearch;
    } else {
      this.searchParameters.search = false;
    }
  };

  PsgDiagramSearch.prototype.matchSearchCriteria = function (item) {
    var itemPropertyValue,
      searchValue,
      property,
      propertyScriptname,
      at,
      associatedItem,
      atScriptName,
      step,
      b = true,
      i;
    if (item.objectTypeScriptName !== this.searchParameters.objectTypeScriptName) {
      return false;
    }
    this.highlightColor = this.originalHighlightColor;
    for (propertyScriptname in this.searchParameters.properties) {
      if (this.searchParameters.properties.hasOwnProperty(propertyScriptname)) {
        property = cwApi.mm.getProperty(item.objectTypeScriptName, propertyScriptname);
        searchValue = this.searchParameters.properties[propertyScriptname];
        itemPropertyValue = item.properties[propertyScriptname];
        if (property) {
          if (property.type === "Lookup" || property.type === "FixedLookup") {
            if (
              searchValue !== undefined &&
              searchValue !== "-1" &&
              (item.properties[propertyScriptname + "_id"] === undefined || item.properties[propertyScriptname + "_id"].toString() !== searchValue)
            ) {
              return false;
            }
          } else if (property.type === "Boolean") {
            if (
              searchValue !== undefined &&
              searchValue !== "0" &&
              searchValue !== "-1" &&
              (itemPropertyValue === undefined || itemPropertyValue.toString().toLowerCase() != searchValue.toLowerCase())
            ) {
              return false;
            }
          } else {
            if (
              searchValue !== undefined &&
              searchValue !== "" &&
              itemPropertyValue &&
              itemPropertyValue.toString().toLowerCase().indexOf(searchValue.toLowerCase()) === -1
            ) {
              return false;
            }
          }
        }
      }
    }
    for (at in this.searchParameters.associations) {
      if (this.searchParameters.associations.hasOwnProperty(at)) {
        if (this.searchParameters.associations[at] != 0 && this.searchParameters.associations[at] !== undefined) {
          b = false;
          for (atScriptName in item.associations) {
            if (item.associations.hasOwnProperty(atScriptName)) {
              if (atScriptName.indexOf(at.toLowerCase()) !== -1) {
                for (i = 0; i < item.associations[atScriptName].length; i += 1) {
                  if (item.associations[atScriptName][i].object_id == this.searchParameters.associations[at]) {
                    b = true;
                  }
                }
              }
            }
          }
        }
      }
    }
    if (b === false) return b;

    let self = this;
    if (
      this.searchParameters.date &&
      this.searchParameters.date != "" &&
      this.config &&
      this.config[this.searchParameters.objectTypeScriptName] &&
      this.config[this.searchParameters.objectTypeScriptName].steps
    ) {
      return this.config[this.searchParameters.objectTypeScriptName].steps.some(function (step) {
        return self.isObjectInStep(item.properties, step, self.searchParameters.date);
      });
    }

    return true;
  };

  PsgDiagramSearch.prototype.isObjectInStep = function (properties, step, configDateString) {
    var startDate, endDate, configDate;
    if (step.start === undefined) {
      this.highlightColor = step.color;
      return true;
    } else if (properties && properties[step.start.toLowerCase()] && properties[step.end.toLowerCase()]) {
      if (Date.parse(properties[step.start.toLowerCase()]) < 0) {
        return false;
      }
      startDate = new Date(properties[step.start.toLowerCase()]);

      if (Date.parse(properties[step.end.toLowerCase()]) < 0) {
        endDate = new Date("01/01/9999");
      } else {
        endDate = new Date(properties[step.end.toLowerCase()]);
      }

      configDate = new Date(configDateString);

      if (configDate.getTime() > startDate.getTime() && configDate.getTime() < endDate.getTime()) {
        this.highlightColor = step.color;
        return true;
      }
    }
    return false;
  };

  PsgDiagramSearch.prototype.register = function () {};

  if (!cwApi.customLibs) {
    cwApi.customLibs = {};
  }
  if (!cwApi.customLibs.PsgDiagramSearch) {
    cwApi.customLibs.PsgDiagramSearch = PsgDiagramSearch;
  }
})(cwAPI, jQuery);
