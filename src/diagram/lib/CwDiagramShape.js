/* Copyright � 2012-2017 erwin, Inc. - All rights reserved */
/*global cwAPI : true */

(function (cwApi, $) {
  "use strict";
  // Magic number for padding inside boxes
  var ratioMmToCanvasSize = 8192 / 2180; // 8192 / 2165;
  var specialCasesShapes = {
    201: ["+"],
    202: ["-"],
    203: ["x"],
    241: ["x"],
    244: ["x"],
    204: ["v"],
    205: ["^"],
    206: ["XOR"],
    207: ["OR"],
    208: ["AND"],
    209: [" "],
    235: ["x", "."],
    236: ["o", "."],
    237: ["&", "."],
    238: ["X", "."],
    239: ["o", "."],
    240: ["&", "."],
    242: ["O"],
    245: ["O"],
    243: ["&"],
    246: ["&"],
  };

  // Create the draw engine
  let cwDiagramShape = cwApi.Diagrams.CwDiagramShape;
  // Load region zones inside the shapes
  cwDiagramShape.prototype.loadRegionsZones = function () {
    var standardExplosionZone, properties, excludeRegionsTypeFromEditMode;
    var text, style;

    if (this.paletteEntry) {
      if (this.paletteEntry.HasExplosionRegion === false && this.diagramCanvas.isInEditMode === false) {
        // Standard Explosion
        standardExplosionZone = this.loadRegionStandardExplosion();
        standardExplosionZone.RegionTypeString = "StandardExplosion";
        standardExplosionZone.defaultRegionSymbol = "StandardExplosion";
        if (standardExplosionZone.explodedDiagrams.length > 0) {
          this.regions.push(standardExplosionZone);
        }
      }

      excludeRegionsTypeFromEditMode = ["ExplosionWithRuleAndReferenceProperty", "ExplosionWithRuleOnly", "Explosion", "Navigation"];

      for (var i = 0; i < this.paletteEntry.Regions.length; i++) {
        var region = this.paletteEntry.Regions[i];
        var regionZone = {};
        var other = false;
        var textRegionArea = {};
        var getTextandCoordinates = {};

        // exclude explosions regions from edit mode
        if (this.diagramCanvas.isInEditMode === true && excludeRegionsTypeFromEditMode.indexOf(region.RegionTypeString) !== -1) {
          continue;
        }

        regionZone = this.getRegionSize(region);
        regionZone.RegionSequence = region.RegionSequence; //***adding this information for easier filtering */
        regionZone.explodedDiagrams = [];
        switch (region.RegionTypeString) {
          case "ExplosionWithRuleAndReferenceProperty":
            regionZone.explodedDiagrams = this.diagramCanvas.loadRegionExplosionWithRuleAndRefProp(region, this.shape.cwObject, this.diagramId);
            if (regionZone.explodedDiagrams !== undefined && regionZone.explodedDiagrams !== null && regionZone.explodedDiagrams.length !== 0) {
              regionZone.defaultRegionSymbol = regionZone.explodedDiagrams[0].defaultRegionSymbol;
              regionZone.defaultRegionStyle = regionZone.explodedDiagrams[0].defaultRegionStyle;
            }
            break;

          case "ExplosionWithRuleOnly":
            regionZone.explodedDiagrams = this.diagramCanvas.loadRegionExplosionWithRuleOnly(region, this.shape.cwObject, this.diagramId);
            break;

          case "Explosion":
            regionZone.explodedDiagrams = this.diagramCanvas.getExplodedDiagramsForObject(this.shape.cwObject, this.diagramId);
            break;

          case "Navigation":
            regionZone.IsNavigationRegion = true;
            regionZone.navigationDiagrams = this.diagramCanvas.getNavigationDiagramsForObject(this.shape.cwObject, this.diagramId);
            break;

          default:
            // Complement region zone with rest of text data
            regionZone.AdjustSizeToText = region.AdjustSizeToText;
            regionZone.BandingRows = region.BandingRows;
            regionZone.DisplayText = region.DisplayText;
            // NOTE: IMPORTANT - Swapping alignments because there are wrongly defined in CM metadata
            regionZone.HorizontalJustification = region.VerticalJustification;
            regionZone.VerticalJustification = region.HorizontalJustification;
            regionZone.VerticalText = region.VerticalText;
            regionZone.VerticalTextDirection = region.VerticalTextDirection;
            regionZone.DateTimeFormat = region.DateTimeFormat;

            other = true; // Any but Explosions and Navigation

            break;
        }
        regionZone.IsExplosionRegion = region.IsExplosionRegion;
        regionZone.RegionTypeString = region.RegionTypeString;
        regionZone.AssociationMultiplePropertyNames = region.AssociationMultiplePropertyNames;

        // Associactions region are NOW clickable
        regionZone.Clickable = region.Clickable;

        regionZone.SourcePropertyTypeScriptName = region.SourcePropertyTypeScriptName;
        regionZone.ReferencePropertyTypeScriptName = region.ReferencePropertyTypeScriptName;
        regionZone.MultiplePropertyNames = region.MultiplePropertyNames;

        if (region.RegionTypeString !== "ExplosionWithRuleAndReferenceProperty") {
          var defaultValues = null;
          defaultValues = this.getDefaultRegionSymbolAndStyle(region, regionZone);
          regionZone.defaultRegionSymbol = defaultValues.defaultSymbol;
          regionZone.defaultRegionStyle = defaultValues.defaultStyle;
        }
        if (region.RegionTypeString === "Association" || region.RegionTypeString === "MultiplePropertyAssociations") {
          regionZone.RegionData = region.RegionData;
        }

        regionZone.ClickableRegionUrl = "";
        if (this.getRegionTextStyleImage !== undefined) {
          // Calculate all regions details
          regionZone.RegionResultReadyToDisplay = this.getRegionTextStyleImage(region, regionZone.defaultRegionSymbol, regionZone.defaultRegionStyle);
          if (regionZone.RegionResultReadyToDisplay !== undefined && regionZone.RegionResultReadyToDisplay !== null) {
            text =
              regionZone.RegionResultReadyToDisplay.text !== undefined && regionZone.RegionResultReadyToDisplay.text !== null
                ? cwAPI.cwPropertiesGroups.getTextFromHTML(regionZone.RegionResultReadyToDisplay.text)
                : "";
            style =
              regionZone.RegionResultReadyToDisplay.style !== undefined && regionZone.RegionResultReadyToDisplay.style !== null
                ? regionZone.RegionResultReadyToDisplay.style
                : null;
          }

          // Region clickable with a valid url then fill ClickableRegionUrl with text
          if (region.Clickable && text !== undefined && text !== null && text !== "" && cwAPI.checkUrlFormat(text)) {
            regionZone.ClickableRegionUrl = text;
          }

          // Calculate region area for text inside regions
          textRegionArea = this.prepareTextInsideAnyShape(
            this.diagramCanvas.ctx,
            regionZone,
            style,
            regionZone.RegionResultReadyToDisplay.symbol,
            regionZone.VerticalText,
            regionZone.VerticalTextDirection
          );
          // Calculate exact text position inside region
          //***** */ modify to display of multiassociation prop
          if (regionZone.RegionTypeString === "MultiplePropertyAssociations") {
            text = this.getAssociationTypeCustomRegionText(regionZone);
            regionZone.VerticalJustification = "CentreJustify";
            regionZone.HorizontalJustification = "CentreJustify";
            regionZone.DisplayText = true;
            getTextandCoordinates = this.calculatePositionTextInsideRegion(this.diagramCanvas.ctx, regionZone, text, style, textRegionArea);
          } else {
            getTextandCoordinates = this.calculatePositionTextInsideRegion(this.diagramCanvas.ctx, regionZone, text, style, textRegionArea);
          }

          // Add text and coordinates calculated to the region
          regionZone.TextRegionArea = textRegionArea;
          regionZone.TextandCoordinates = getTextandCoordinates;
        }

        if (!cwAPI.isUndefined(region.BandingRows) && cwAPI.isUndefined(regionZone.BandingRows)) {
          regionZone.BandingRows = [];
          // ToDo: check if it is right pushing only the first banding row, when push everything some regions loss the style.
          regionZone.BandingRows.push(region.BandingRows[0]);
        }

        // Only the regions with explosions but is stopping the labels
        if (
          (!cwAPI.isUndefined(regionZone.explodedDiagrams) && regionZone.explodedDiagrams.length > 0) ||
          (!cwAPI.isUndefined(regionZone.navigationDiagrams) && regionZone.navigationDiagrams.length > 0) ||
          other
        ) {
          this.regions.push(regionZone);
          // If not region represented, no need bounding box
          if (style !== null || regionZone.RegionResultReadyToDisplay.symbol !== null) {
            this.boundingBoxes.push(regionZone);
          }
        }
      }
    } else {
      // Set all objects not contained in palette

      // Object Link
      if (this.isObjectLink()) {
        properties =
          !cwAPI.isUndefinedOrNull(this.shape.cwObject) && !cwAPI.isUndefinedOrNull(this.shape.cwObject.properties)
            ? this.shape.cwObject.properties
            : null;
        if (properties !== null) {
          // ToDo: Get the name from back-end
          this.shape.name = !cwAPI.isUndefinedOrNull(properties.name) ? properties.name : null;
        }
        // Set region as a standard explosion
        standardExplosionZone = this.loadRegionStandardExplosion();
        standardExplosionZone.RegionTypeString = "StandardExplosion";
        standardExplosionZone.defaultRegionSymbol = "StandardExplosion";
        this.regions.push(standardExplosionZone);
      }
    }
  };
})(cwAPI, jQuery);
