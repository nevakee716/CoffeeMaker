(function(cwDiagramShape, cwApi) {
  "use strict";

  // Load regions inside the shapes and check the properties
  cwDiagramShape.prototype.drawRegionZones = function(ctx) {
    if (this.paletteEntry) {
      // Draw all regions
      for (var i = 0; i < this.regions.length; i++) {
        var region = this.regions[i];
        cwApi.pluginManager.execute("CwDiagramViewer.beforeDrawShapeRegion", this, this.shape, region);
        this.drawRegion(ctx, region);
        cwApi.pluginManager.execute("CwDiagramViewer.afterDrawShapeRegion", this, this.shape, region);
      }
      if (this.paletteEntry.HasExplosionRegion === false) {
        // Draw Standard Explosion
        if (!cwApi.isUndefined(this.regions) && this.regions.length > 0 && !cwApi.isUndefined(this.regions[0].explodedDiagrams))
          if (this.regions[0].explodedDiagrams.length > 0) {
            this.drawSymbolPath(ctx, 1, this.regions[0]);
            // Added stroke style to reafirm some places where get lost.
            ctx.strokeStyle = cwApi.CwDiagramDefinitions.StrokeStandardExplosionColor;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
      }
    } else {
      if (this.shape.paletteEntryKey === "OBJECTLINK|0") {
        // Draw part of the Object Link standard own standard explosion region, image and text will be drwan as shape
        if (this.regions.length > 0) {
          this.drawSymbolPath(ctx, 1, this.regions[0]);
          ctx.stroke();
        }
      }
    }
  };

  /*  Draw Shape
        get the RegionSize, align, valign
        check the style of BandingRows
        Draw the shape using drawRegionShape calling shapes i cwDrawEngine.js  -  check if shape has any gradient
        For each Region shape, check the textZone Area if text needs to be displayed
        check the Source and Reference Property type
        display the text inside the Regions
    */
  cwDiagramShape.prototype.drawRegion = function(ctx, region) {
    var style, text;
    var regionCoordinates = {
      X: region.X,
      Y: region.Y,
      W: region.W,
      H: region.H,
    };

    if (!cwApi.isUndefined(region.BandingRows)) {
      // Get Style - shape the region or place the image if any
      var result = region.RegionResultReadyToDisplay;

      ctx.save();

      style = !cwApi.isUndefinedOrNull(result.style) ? result.style : null;
      text = !cwApi.isUndefinedOrNull(result.text) ? result.text : "";

      // Draw Image or apply style to the region
      if (!cwApi.isUndefinedOrNull(result.symbol) && result.symbol >= 1000) {
        this.drawImageInsideShapes(ctx, region, result.symbol);
      } else {
        var direction = null;
        if (!cwApi.isUndefinedOrNull(result.gaugeRegion) && !cwApi.isUndefinedOrNull(result.gaugeRegion.gaugePointer)) {
          direction = result.gaugeRegion.gaugePointer.Orientation;
        }
        this.drawRegionStyle(ctx, region, style, result.symbol, result.gaugeRegion, direction, text);
      }

      ctx.restore();

      // Draw Text inside the region
      if (!cwApi.isUndefinedOrNull(style)) {
        this.drawTextInsideRegion(ctx, region, style, result.symbol);
      }

      // Draw gauge pointer
      if (!cwApi.isUndefinedOrNull(result.gaugeRegion) && !cwApi.isUndefinedOrNull(result.gaugeRegion.gaugePointer)) {
        // ToDo: Should I ask for HidePointer? It seem to be sending the wrong value from back-end
        this.drawGaugePointer(ctx, result.gaugeRegion.gaugePointer, result.gaugeRegion.gaugePointerStyle, result.gaugeRegion.gaugeGradientPercentage, regionCoordinates);
      }
    }
  };

  // Draw Gauge indicator/pointer and apply style
  // Similar to drawRegion() but new coordinates needs to be calculated
  cwDiagramShape.prototype.drawGaugePointer = function(ctx, gaugePointer, gaugePointerStyle, percentage, coord) {
    var dim = gaugePointer.Orientation === 1 ? coord.W : coord.H; // hor=0 Ver=1
    var pWidth = dim * (gaugePointer.LowValue / 100);
    var pHeight = dim * (gaugePointer.HighValue / 100);
    var perc = percentage >= 100 ? 100 : percentage <= 0 ? 0 : percentage;

    var symbol = !cwApi.isUndefinedOrNull(gaugePointer.SymbolNumber) ? gaugePointer.SymbolNumber : null;

    // Images as pointer are not supported by CM
    if (!cwApi.isUndefinedOrNull(symbol) && symbol >= 1000) return;

    // Calculate the pointer coordinates and pass them as Region to draw
    if (gaugePointer.Orientation) {
      // Vertical
      coord.X = coord.X + coord.W - coord.W * (1 - gaugePointer.Position * 0.25);
      coord.Y = coord.Y + coord.H - coord.H * (perc / 100);
      coord.W = pWidth;
      coord.H = pHeight;
    } else {
      // Horizontal
      coord.X = coord.X + coord.W * (perc / 100);
      coord.Y = coord.Y + coord.H * (gaugePointer.Position * 0.25);
      coord.W = pWidth;
      coord.H = pHeight;
    }
    // Position pointer in the middle point
    coord.X -= coord.W / 2;
    coord.Y -= coord.H / 2;

    // Draw pointer
    this.drawRegionStyle(ctx, coord, gaugePointerStyle, symbol);
  };

  // Calculate Percentage of gradient when Source Property Type and Reference Property type are used in a Gauge Region
  cwDiagramShape.prototype.calculatePercentagePropertyValue = function(propertyValues, gaugeRegion) {
    var percentage = null;
    var value;

    switch (propertyValues.propertyTypeType.toUpperCase()) {
      case "INTEGER":
      case "DOUBLE":
        if (!cwApi.isUndefinedOrNull(propertyValues.referencePropertyTypeValue)) {
          // Using Reference Property
          value = (propertyValues.sourcePropertyTypeValue * 100) / propertyValues.referencePropertyTypeValue;
          if (!cwApi.isUndefinedOrNull(gaugeRegion)) {
            // When is gauge calculate percentage in range
            percentage = this.calculatePercentagePropertyValueRange(value, gaugeRegion.HighValue, gaugeRegion.LowValue);
          }
        } else {
          // Using Palette Value
          value = propertyValues.sourcePropertyTypeValue;
          if (!cwApi.isUndefinedOrNull(gaugeRegion)) {
            // When is gauge
            percentage = this.calculatePercentagePropertyValueRange(value, gaugeRegion.HighValue, gaugeRegion.LowValue);
          } else {
            // Just Property type
            percentage = value;
          }
        }
        break;
      case "DATE":
        if (!cwApi.isUndefinedOrNull(gaugeRegion)) {
          if (!cwApi.isUndefinedOrNull(propertyValues.referencePropertyTypeValue)) {
            // Using Reference Property
            var refDate = new Date(propertyValues.referencePropertyTypeValue);
            var sourceDate = new Date(propertyValues.sourcePropertyTypeValue);

            percentage = this.calculatePercentagePropertyDateRange(refDate, sourceDate);
          }
        }
        break;
      default:
        return null;
    }

    if (!cwApi.isUndefinedOrNull(percentage)) {
      return Math.floor(percentage);
    } else {
      return null;
    }
  };

  // Calculate value in permitted range
  cwDiagramShape.prototype.calculatePercentagePropertyDateRange = function(refDate, sourceDate) {
    var offsetStep = 0,
      xOffset = 0;
    var dateTimeNow = new Date();
    var widthX = 100;
    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    var daysDiff = Math.floor(Math.round((refDate.getTime() - sourceDate.getTime()) / oneDay));

    if (daysDiff > 0) {
      offsetStep = widthX / daysDiff;
    } else {
      if (dateTimeNow < refDate) {
        return 0;
      } else {
        return widthX;
      }
    }

    if (dateTimeNow <= sourceDate) {
      xOffset = 0;
    } else if (dateTimeNow >= refDate) {
      xOffset = widthX;
    } else {
      xOffset = offsetStep * Math.floor(Math.abs((dateTimeNow.getTime() - sourceDate.getTime()) / oneDay));
    }

    return Math.floor(xOffset);
  };

  // Calculate value in permitted range
  cwDiagramShape.prototype.calculatePercentagePropertyValueRange = function(value, highValue, lowValue) {
    var high = Number(highValue),
      low = Number(lowValue),
      newValue = value !== undefined && value !== null ? value : 0;

    if (low + high === 0) return newValue;

    // Validate value in permitted range
    if (value < low) newValue = low; // Or 0?
    if (value > high) newValue = high; // Or 0?

    return ((newValue - low) * 100) / (high - low);
  };

  /* Extract the Style and/or the Image related to a Region
        Equivalent to getItem
        return: Style, Symbol
    */
  cwDiagramShape.prototype.getRegionTextStyleImage = function(region, defaultRegionSymbol, defaultRegionStyle) {
    var bandingRows = region.BandingRows;
    var regionType = region.RegionTypeString;
    var style = null,
      symbol = null,
      text = [],
      gaugeRegion = null,
      propertyValue;
    var propertyInfo, multiplePropertyNames, multiplePropertyAssociationsInfo, associationMultiplePropertyNames, associationKey, listAssoc, infoAssoc;

    if (!cwApi.isUndefinedOrNull(defaultRegionSymbol)) {
      symbol = defaultRegionSymbol;
    }
    if (symbol === -1 || symbol === 4) {
      symbol = 0;
    }

    var sourcePropertyTypeName = !cwApi.isUndefinedOrNull(region) && !cwApi.isUndefinedOrNull(region.SourcePropertyTypeScriptName) ? region.SourcePropertyTypeScriptName.toLowerCase() : null;

    // Loop LookUp properties
    propertyValue = this.findPropertyTypeValuesInLookUps(region);

    // Style the region
    switch (regionType) {
      case "Label": // Label
      case "Explosion": // Explosion (drill down)
      case "ExplosionWithRuleOnly": // Explosion based on Diagram Rule
      case "Navigation": // Navigation
        style = bandingRows[0].Style;
        text = bandingRows[0].Value;
        break;

      case "LocalPropertyActualValue": // Property Values
        style = bandingRows[0].Style;
        text = this.checkPropertyTypeandGetText(sourcePropertyTypeName); // (1)
        break;

      case "MultipleProperties": // Property Value (Custom)
        propertyInfo = bandingRows[0].PropertyInfo;
        multiplePropertyNames = !cwApi.isUndefinedOrNull(region) && !cwApi.isUndefinedOrNull(region.MultiplePropertyNames) ? region.MultiplePropertyNames : null;

        style = bandingRows[0].Style;
        text = this.checkPropertyValuesandGetText(propertyInfo, multiplePropertyNames); // (3)
        break;

      case "MultiplePropertyAssociations": // ToDo - Association Type (Custom)
        multiplePropertyAssociationsInfo = bandingRows[0].MultiplePropertyAssociationsInfo;
        associationMultiplePropertyNames = !cwApi.isUndefinedOrNull(region) && !cwApi.isUndefinedOrNull(region.AssociationMultiplePropertyNames) ? region.AssociationMultiplePropertyNames : null;

        style = bandingRows[0].Style;
        text = this.checkPropertyValuesandGetText(multiplePropertyAssociationsInfo, associationMultiplePropertyNames); // (3)
        break;

      // These ones down could have more than one item in bandingRows
      case "ExplosionWithRuleAndReferenceProperty": // Todo  - Explosion based on Diagram Rule and Reference Property
        if (!cwApi.isUndefinedOrNull(defaultRegionSymbol)) {
          symbol = defaultRegionSymbol;
        }
        if (!cwApi.isUndefinedOrNull(defaultRegionStyle)) {
          style = defaultRegionStyle;
        }
        break;

      case "PropertiesAsDateRange": // Property Gauge using Properties as Date Range
        if (!cwApi.isUndefinedOrNull(region.DateTimeFormat) && region.DateTimeFormat !== "") {
          text = this.isDateConvertAndFormat(this.CurrentDateTime, "Format", region.DateTimeFormat);
        } else {
          text = this.isDateConvertAndFormat(this.CurrentDateTime, "Display");
        } // No break is on purpose
      case "VisualizationUsingPaletteValue":
      case "GaugeUsingPaletteValue": // Property Gauge using Palette Values
      case "GaugeUsingReferenceProperty": // Property Gauge using Reference Property ?
      case "VisualizationUsingReferenceProperty": // Property Visualization using Reference Property
        var info = this.getSymbolStyleAndText(bandingRows, propertyValue, sourcePropertyTypeName); // (4)
        style = info.style;
        symbol = info.symbol;
        text = text.length !== 0 ? text : info.text;
        gaugeRegion = info.gaugeRegion;
        break;

      case "Association":
        if (region.RegionData !== undefined && region.RegionData !== null && region.RegionData.Key !== undefined && region.RegionData.Key !== null) {
          associationKey = region.RegionData.Key;
          listAssoc = this.getAssociationListForRegion(region);

          // Additional info for Associations, maybe a different object should be created
          propertyValue.displayText = region.DisplayText;
          if (listAssoc.listAssoc !== undefined && listAssoc.listAssoc !== null) {
            propertyValue.listAssoc = listAssoc.listAssoc;
          }
          if (listAssoc.listExists !== undefined && listAssoc.listExists !== null) {
            propertyValue.listExists = listAssoc.listExists;
          }
          propertyValue.listAssociatedObjects = region.listAssociatedObjects;
          propertyValue.TargetObjectTypeScriptName = region.RegionData.TargetObjectTypeScriptName;
          propertyValue.defaultSymbol = symbol;
          propertyValue.AssociationsTypeDisplayName = region.RegionData.AssociationsTypeDisplayName;

          infoAssoc = this.getSymbolStyleAndTextForAssociations(bandingRows, propertyValue); // (5)
          symbol = infoAssoc.symbol;
          style = infoAssoc.style;
          text = infoAssoc.text;
        }
        break;

      default:
        style = null;
        text = "";
    }

    text = cwApi.updateUndefinedForLookupIfRequired(text);
    if (cwApi.isUndefined(text)) {
      text = null;
    }

    return {
      style: style,
      symbol: symbol,
      text: text,
      gaugeRegion: gaugeRegion,
    };
  };

  // Draw styled region
  cwDiagramShape.prototype.drawRegionStyle = function(ctx, region, style, symbol, gauge, direction, text) {
    var regionShapeMethod = cwApi.Diagrams.CwDrawShapeEngine["Symbol" + symbol];

    if (!cwApi.isUndefinedOrNull(region.AdjustSizeToText) && region.AdjustSizeToText && !Array.isArray(text)) {
      region.H = this.adjustRegionHeightToFitText(ctx, region, style, symbol, text);
    }

    // Shadow
    cwDiagramShape.setShadowInContext(ctx, style);

    if (!cwApi.isUndefined(regionShapeMethod)) {
      // Regions in Shapes and Regions in connectors
      regionShapeMethod(ctx, region.X, region.Y, region.W, region.H);
      ctx.stroke();
    } else {
      // Non supported shapes
      cwApi.Diagrams.CwDrawShapeEngine.normalRect(ctx, region.X, region.Y, region.W, region.H);
    }

    if (!cwApi.isUndefinedOrNull(style)) {
      if (!cwApi.isUndefined(style.FillPattern) && style.FillPattern.toUpperCase() === "SOLID" && style.HasGradient === false) {
        // Fill with colour
        ctx.fillStyle = style.FillColor;
        ctx.fill();
      } else if (style.HasGradient === true) {
        // Fill with gradient
        ctx.fillStyle = this.getGradientStyle(ctx, region.X, region.Y, region.W, region.H, style, gauge, direction);
        ctx.fill();
      }

      // Stroke region
      if (!cwApi.isUndefined(style.StrokePattern) && style.StrokePattern.toUpperCase() === "SOLID") {
        // ctx.lineWidth = style.LineWidth;
        ctx.lineWidth = (style.LineWidth + 1) / 3;
        ctx.strokeStyle = style.StrokeColor;
        ctx.stroke();
      }
    }
  };

  /*
    Calculate the new height of the region if option AdjustSizeToText
    */
  cwDiagramShape.prototype.adjustRegionHeightToFitText = function(ctx, region, style, shapeSymbol, text) {
    var height = region.H;
    var adjustSizeToText = region.AdjustSizeToText;
    var fontSize = cwDiagramShape.setFontInContext(ctx, style);

    // TODO: DUPLICATED CODE SIMILAR TO drawTextInsideRegion()
    var getTextZoneMethod;
    if (shapeSymbol < 0 || shapeSymbol >= 1000) {
      // An image
      getTextZoneMethod = cwApi.Diagrams.CwGetTextZone.rect;
    } else {
      getTextZoneMethod = cwApi.Diagrams.CwGetTextZone["gettextzone" + shapeSymbol];
    }

    if (!cwApi.isUndefined(getTextZoneMethod)) {
      var textZoneArea = getTextZoneMethod(region);
      var textRegionArea = this.getRegionTextSize(textZoneArea, fontSize, region.VerticalText, region.VerticalTextDirection);

      if (region.DisplayText === true && adjustSizeToText) {
        // Get the text split in lines, wrapped words and num of lines
        var splitLines = cwDiagramShape.getSplitWrappedTextAndNumLines(ctx, text, textRegionArea.w);

        // Get Region height and num of lines of text
        var newHeight = cwDiagramShape.getRegionHeightAndNumLines(splitLines.numLines, fontSize);

        height = newHeight.blockHeight;
      }
    }
    return height;
  };

  /* (1)
    Checks the propertyType for each region
    checks the type in shape.cwObject.property
    returns the text
    */
  cwDiagramShape.prototype.checkPropertyTypeandGetText = function(sourcePropertyName) {
    var otScriptName = this.paletteEntry.PaletteObjectTypeScriptName;

    if (cwApi.isUndefinedOrNull(this.shape.cwObject) === true) {
      return "";
    }
    var properties = !cwApi.isUndefined(this.shape.cwObject.properties) ? this.shape.cwObject.properties : null;

    if (cwApi.isUndefinedOrNull(sourcePropertyName) || sourcePropertyName === null) return null;
    if (this.isRelationship(otScriptName)) {
      otScriptName = "RELATIONSHIP";
    }
    var propType = cwApi.mm.getProperty(otScriptName, sourcePropertyName);
    var text = [];

    if (!cwApi.isUndefinedOrNull(properties[sourcePropertyName])) {
      if (!cwApi.isUndefined(propType)) {
        if (!cwApi.isUndefined(propType.type))
          switch (propType.type.toUpperCase()) {
            case "DATE":
              text = this.isDateConvertAndFormat(properties[sourcePropertyName], "Display");
              break;
            case "MEMO":
              text = properties[sourcePropertyName];
              break;
            case "STRING":
              text = properties[sourcePropertyName];
              break;
            case "INTEGER":
            case "DOUBLE":
            case "LOOKUP":
              text = properties[sourcePropertyName].toString();
              break;
            case "BOOLEAN":
              if (properties[sourcePropertyName] === true) {
                text = $.i18n.prop("vectordiagram_Yes");
              } else {
                text = $.i18n.prop("vectordiagram_No");
              }
              break;
            default:
              text = properties[sourcePropertyName];
              // Ensure that the text is indeed a string
              if (!cwApi.isUndefinedOrNull(text) && typeof text !== "string") {
                if (typeof text === "object") {
                  if (!cwApi.isUndefinedOrNull(text.name)) text = text.name;
                  else if (!cwApi.isUndefinedOrNull(properties.name)) text = properties.name;
                  else text = null;
                }
              }
              break;
          }
      } else {
        // Cases when is missing from the meta model i.e connectorset
        text = properties[sourcePropertyName].toString();
      }
    }

    // Special cases
    switch (sourcePropertyName) {
      case "concurrency":
      case "busycostperbatch":
      case "frequency":
      case "growth":
      case "idlecost":
      case "maximumbatchsize":
      case "minimumbatchsize":
      case "repetitions":
      case "serversperbatch":
      case "servicetimeperbatchallservers":
        var average = properties[sourcePropertyName] !== null && !cwApi.isUndefined(properties[sourcePropertyName].Average) ? properties[sourcePropertyName].Average : 0;
        var deviation = properties[sourcePropertyName] !== null && !cwApi.isUndefined(properties[sourcePropertyName].Deviation) ? properties[sourcePropertyName].Deviation : 0;
        text = average + " per seconds" + "+/-" + deviation + " Flat ";
        break;

      case "whocreated":
      case "whoowns":
      case "whoupdated":
        var userId = properties[sourcePropertyName].toString();
        text = !cwApi.isUndefinedOrNull(userId) ? cwApi.cwConfigs.UserData.UserById[userId] : "";
        break;

      case "exportflag":
        if (properties[sourcePropertyName] === 0) {
          text = $.i18n.prop("vectordiagram_Unfrozen");
        } else {
          text = $.i18n.prop("vectordiagram_Frozen");
        }
        break;

      default:
        break;
    }

    text = cwApi.updateUndefinedForLookupIfRequired(text);

    return text;
  };

  cwDiagramShape.prototype.getLookUpsPropertyName = function(propertyInfo, propertySourceName) {
    var name,
      p = propertyInfo;

    name = propertySourceName;
    if (p !== undefined && p !== null && p.ObjectType === "LOOKUP") {
      if (p.ScriptName !== "NAME") {
        name = propertySourceName + "_" + p.ScriptName.toLowerCase();
      }
    }

    return name;
  };

  /*
   */
  cwDiagramShape.prototype.getPropertyValue = function(region, property) {
    var propertyTypeName = !cwApi.isUndefinedOrNull(region) && !cwApi.isUndefinedOrNull(region[property]) ? region[property].toLowerCase() : null;
    var properties = !cwApi.isUndefinedOrNull(this.shape.cwObject) && !cwApi.isUndefined(this.shape.cwObject.properties) ? this.shape.cwObject.properties : {};
    return properties[propertyTypeName];
  };

  cwDiagramShape.prototype.isRelationship = function(scriptName) {
    return scriptName !== undefined && scriptName !== null && scriptName.indexOf("RELATIONSHIP") === 0;
  };

  cwDiagramShape.prototype.isPrecedent = function(op) {
    return this.precedence < this.getNewPrecedence(op);
  };

  cwDiagramShape.prototype.getNewPrecedence = function(op) {
    if (op !== 0) return 2;
    else return 1;
  };

  cwDiagramShape.prototype.setPrecedence = function(op) {
    this.precedence = this.getNewPrecedence(op);
  };

  // Find property values in Look ups
  cwDiagramShape.prototype.findPropertyTypeValuesInLookUps = function(region) {
    var propertyValue = null,
      type = null;

    // Get the Values
    var sourcePropertyTypeName = !cwApi.isUndefined(region) && !cwApi.isUndefined(region.SourcePropertyTypeScriptName) ? region.SourcePropertyTypeScriptName.toLowerCase() : null;
    var paletteObjectTypeScriptName = !cwApi.isUndefined(this.paletteEntry) && !cwApi.isUndefined(this.paletteEntry.PaletteObjectTypeScriptName) ? this.paletteEntry.PaletteObjectTypeScriptName : null;
    if (this.isRelationship(paletteObjectTypeScriptName)) {
      paletteObjectTypeScriptName = "RELATIONSHIP";
    }
    var propType = cwApi.mm.getProperty(paletteObjectTypeScriptName, sourcePropertyTypeName);

    var sourcePropertyTypeValue = this.getPropertyValue(region, "SourcePropertyTypeScriptName");
    var referencePropertyTypeValue = this.getPropertyValue(region, "ReferencePropertyTypeScriptName");

    if (!cwApi.isUndefined(propType) && !cwApi.isUndefined(propType.type)) {
      switch (propType.type.toUpperCase()) {
        case "LOOKUP":
          referencePropertyTypeValue = null;
          for (var i = 0; i < propType.lookups.length; i++)
            if (propType.lookups[i].name === sourcePropertyTypeValue) {
              propertyValue = propType.lookups[i].id;
              break;
            }
          break;
        case "STRING":
        case "DOUBLE":
        case "MEMO":
          propertyValue = sourcePropertyTypeValue;
          break;
        case "BOOLEAN":
          propertyValue = this.convertToBoolean(sourcePropertyTypeValue);
          break;
        case "DATE":
          propertyValue = new Date(this.isDateConvertAndFormat(sourcePropertyTypeValue));
          if (!cwApi.isUndefinedOrNull(referencePropertyTypeValue)) {
            referencePropertyTypeValue = new Date(this.isDateConvertAndFormat(referencePropertyTypeValue));
          }
          break;
        case "URL": // ToDo: Set it like clickOnCanvas method in cwDiagramViewer.js
          propertyValue = !cwApi.isUndefinedOrNull(sourcePropertyTypeValue) ? sourcePropertyTypeValue : "";
          referencePropertyTypeValue = !cwApi.isUndefinedOrNull(referencePropertyTypeValue) ? referencePropertyTypeValue : "";
          break;
        default:
          propertyValue = sourcePropertyTypeValue;
      }
      type = propType.type.toUpperCase();
    }

    return {
      sourcePropertyTypeValue: propertyValue,
      referencePropertyTypeValue: referencePropertyTypeValue,
      propertyTypeType: type,
    };
  };

  // (3) Get Property Values and Text for Regions Custom
  cwDiagramShape.prototype.checkPropertyValuesandGetText = function(propertyInfo, propertySourceNames) {
    var res = {},
      p,
      i,
      j,
      l;

    if (!cwApi.isUndefinedOrNull(propertyInfo)) {
      var literalText = propertyInfo.LiteralValues;
      for (i = 0; i < literalText.length; i++) {
        l = literalText[i];
        res[l.Index] = literalText[i].LiteralText;
      }

      if (!cwApi.isUndefinedOrNull(propertyInfo.PropTypes)) {
        var sourcePropertyName = propertySourceNames;
        var propTypes = propertyInfo.PropTypes;

        for (j = 0; j < propTypes.length; j++) {
          p = propTypes[j];
          var spv = this.getLookUpsPropertyName(p, sourcePropertyName[j].toLowerCase());
          res[p.Index] = this.checkPropertyTypeandGetText(spv); // (1)
        }
      }
    }

    var propertyValues = Object.keys(res).map(function(index) {
      return res[index];
    });

    return propertyValues.join(""); // text
  };

  // (4) Get Text, Symbol and Style from Regions
  cwDiagramShape.prototype.getSymbolStyleAndText = function(bandingRows, propertyValues, sourcePropertyTypeName) {
    var style = null,
      symbol = null,
      text = null,
      gaugeRegion = null,
      i;
    if (bandingRows !== undefined && bandingRows !== null && propertyValues !== undefined && propertyValues !== null) {
      var banding;
      var sourcePropertyTypeValue = propertyValues.sourcePropertyTypeValue;
      var undefinedCase = sourcePropertyTypeValue === 0 && propertyValues.referencePropertyTypeValue === null;

      this.precedence = 0;

      if (undefinedCase) {
        propertyValues.referencePropertyTypeValue = sourcePropertyTypeValue;
      }

      for (i = 0; i < bandingRows.length; i++) {
        banding = bandingRows[i].Value;
        if (this.isPropertyDisplayable(banding, bandingRows[i].DisplayOperator, propertyValues)) {
          if (this.isPrecedent(bandingRows[i].DisplayOperator !== 0)) {
            text = String(this.checkPropertyTypeandGetText(sourcePropertyTypeName)); // (1)
            symbol = bandingRows[i].Symbol;
            style = bandingRows[i].Style;
            if (!cwApi.isUndefinedOrNull(bandingRows[i].GaugeRegion)) {
              gaugeRegion = this.getGaugeRegionAndGradient(propertyValues, bandingRows[i].GaugeRegion, style);
            }
            this.setPrecedence(bandingRows[i].DisplayOperator);
          }
        }
      }
    }
    return {
      style: style,
      symbol: symbol,
      text: text,
      gaugeRegion: gaugeRegion,
    };
  };

  // (5) Get Text, Symbol and Style from Regions for Associations
  cwDiagramShape.prototype.getSymbolStyleAndTextForAssociations = function(bandingRows, propertyValues) {
    var style = null,
      symbol = null,
      text = null,
      i;

    if (bandingRows !== undefined && bandingRows !== null && propertyValues !== undefined && propertyValues !== null) {
      var banding;
      var sourcePropertyTypeValue = propertyValues.sourcePropertyTypeValue;
      var undefinedCase = sourcePropertyTypeValue === 0 && propertyValues.referencePropertyTypeValue === null;
      var displayText = propertyValues.displayText;
      var isThereAssoc = propertyValues.listAssoc !== undefined && propertyValues.listAssoc !== null;
      var isArrayEmpty = isThereAssoc && Array.isArray(propertyValues.listAssoc) && propertyValues.listAssoc.length <= 0;
      var isPropertyName = isThereAssoc && !Array.isArray(propertyValues.listAssoc) && propertyValues.listAssoc.length > 0;

      this.precedence = 0;

      if (undefinedCase) {
        propertyValues.referencePropertyTypeValue = sourcePropertyTypeValue;
      }

      //symbol = propertyValues.defaultSymbol;
      for (i = 0; i < bandingRows.length; i++) {
        banding = bandingRows[i].Value;

        if (this.isPropertyDisplayable(banding, bandingRows[i].DisplayOperator, propertyValues)) {
          if (this.isPrecedent(bandingRows[i].DisplayOperator !== 0)) {
            if (displayText === true) {
              if ((isArrayEmpty || isPropertyName) && propertyValues.listAssociatedObjects) {
                style = null;
                text = null;
              } else {
                text = propertyValues.listAssoc;
                style = bandingRows[i].Style;
              }
              symbol = bandingRows[i].Symbol;
            } else {
              if (bandingRows[i].DisplayOperator === 0) {
                style = bandingRows[i].Style;
                symbol = bandingRows[i].Symbol;
              } else {
                if (Array.isArray(propertyValues.listAssoc) || propertyValues.listAssociatedObjects === undefined || propertyValues.listAssociatedObjects === false) {
                  //
                  symbol = bandingRows[i].Symbol;
                  style = bandingRows[i].Style;
                }
              }
              text = null;
            }
            this.setPrecedence(bandingRows[i].DisplayOperator);
          }
        }
        if ((isArrayEmpty || isPropertyName) && style === null && bandingRows[i].DisplayOperator !== 0 && !(!isArrayEmpty && this.precedence > 0)) {
          if (!propertyValues.listExists) {
            symbol = null;
          }
          text = null;
        }
        if (Array.isArray(text) && symbol !== null && symbol >= 1000) {
          text = this.getObjectTypePlural(propertyValues.TargetObjectTypeScriptName);
        }
      }
    }
    return {
      style: style,
      symbol: symbol,
      text: text,
    };
  };

  cwDiagramShape.prototype.isThereAssociationItems = function(associations) {
    return associations !== undefined && associations !== null && associations.length > 0;
  };

  cwDiagramShape.prototype.extractAssociationsByKey = function(key) {
    if (this.shape.cwObject !== undefined && this.shape.cwObject !== null && this.shape.cwObject.associations !== undefined && this.shape.cwObject.associations !== null && key !== undefined && key !== null && typeof key === "string") {
      return this.shape.cwObject.associations[key.toLowerCase()];
    } else {
      return undefined;
    }
  };

  cwDiagramShape.prototype.getAssociationListForRegion = function(region) {
    var i,
      listAssoc = [];
    var targetObjectTypeScriptName = region.RegionData.TargetObjectTypeScriptName;

    var associations = this.extractAssociationsByKey(region.RegionData.Key);
    var listExists = this.isThereAssociationItems(associations);

    // Ticked ListAssociatedObjects and there is a list of associations
    if (region.ListAssociatedObjects && listExists) {
      for (i = 0; i < associations.length; i++) {
        listAssoc.push(associations[i].label);
      }
    }

    // Unticked ListAssociatedObjects
    if (!region.ListAssociatedObjects || listAssoc.length === 0) {
      listAssoc = region.RegionData.AssociationsTypeDisplayName !== undefined && region.RegionData.AssociationsTypeDisplayName !== null ? region.RegionData.AssociationsTypeDisplayName : this.getObjectTypePlural(targetObjectTypeScriptName);
    }

    return {
      listAssoc: listAssoc,
      listExists: listExists,
    };
  };

  cwDiagramShape.prototype.getObjectTypePlural = function(targetObjectTypeScriptName) {
    if (targetObjectTypeScriptName !== undefined && targetObjectTypeScriptName !== null) {
      var ot = cwApi.mm.getObjectType(targetObjectTypeScriptName);
      if (!cwApi.isUndefinedOrNull(ot)) {
        return ot.pluralName;
      }
    }
    return "";
  };

  // Get gauge region data and calculate the gradient
  cwDiagramShape.prototype.getGaugeRegionAndGradient = function(propertyValues, gaugeRegion, style) {
    var gaugePointer = null,
      gaugePointerStyle = null,
      fixGradient = false;
    // Calc percentage of the property value
    var percentageGradient = this.calculatePercentagePropertyValue(propertyValues, gaugeRegion);

    if (!cwApi.isUndefinedOrNull(gaugeRegion.GaugePointer)) {
      gaugePointer = gaugeRegion.GaugePointer;
      if (gaugeRegion.FixedGradientFill === true) {
        fixGradient = true;
      }
    }
    if (!cwApi.isUndefinedOrNull(gaugeRegion.GaugePointerStyle)) {
      gaugePointerStyle = gaugeRegion.GaugePointerStyle;
    }
    if (style.HasGradient && !fixGradient && !cwApi.isUndefinedOrNull(percentageGradient)) {
      // Note: Maybe it could be set somewhere later.
      style.GradientSize = percentageGradient;
    }

    return {
      gaugePointer: gaugePointer,
      gaugePointerStyle: gaugePointerStyle,
      gaugeGradientPercentage: percentageGradient,
    };
  };

  cwDiagramShape.prototype.getDatePrimitive = function(date) {
    if (date !== undefined && date !== null) {
      var x = Date.parse(date);
      if (x === null || isNaN(x)) {
        x = date;
        if (typeof x.getMonth === "function") {
          var z = new Date(x.getFullYear(), x.getMonth(), x.getDate());
          return z.getTime();
        } else {
          var enddate = x.substring(0, 10); //DD/MM/YYYY
          var split = enddate.split("/");
          return Date.parse(new Date(split[2], split[1] - 1, split[0])); //Y M D
        }
      }
    }

    return null;
  };

  // Convert Property Type value to the right variable type
  cwDiagramShape.prototype.convertValueToRightVariableType = function(value, operatorRef, propertyValues) {
    if (value !== undefined && value !== null && propertyValues.propertyTypeType != undefined && propertyValues.propertyTypeType != null) {
      switch (propertyValues.propertyTypeType.toUpperCase()) {
        case "STRING":
        case "MEMO":
          value = String(value);
          if ((operatorRef === 1 || operatorRef === 2) && value === "") {
            value = null;
          }
          break;
        case "LOOKUP":
          if ((operatorRef === 1 || operatorRef === 2) && propertyValues.sourcePropertyTypeValue === 0) {
            value = null;
          }
          break;
        case "INTEGER":
        case "DOUBLE":
          value = Number(value);
          if ((operatorRef === 1 || operatorRef === 2) && value === 0) {
            value = null;
          }
          break;
        case "BOOLEAN":
          value = this.convertToBoolean(value);
          break;
        case "DATE":
          if (!cwApi.isUndefinedOrNull(value)) {
            var x = this.getDatePrimitive(value);
            if (x !== null) {
              // handle different formats of date
              value = x;
            } else {
              value = Date.parse(value);
            }
          }
          break;
      }
    }

    return value;
  };

  cwDiagramShape.prototype.convertToBoolean = function(value) {
    if (!cwApi.isUndefinedOrNull(value)) {
      if (Boolean(value)) {
        // this is because  Boolean("false")===true and Boolean("0")===true
        value = value === "True" || value === "TRUE" || value === "true" || value === "1" || value === 1 || value === true;
      } else {
        value = false;
      }
    }
    return value;
  };

  // DO NOT CHANGE SOURCE AND REFERENCE ANYMOooooooooooooooooooooooooooooooooRE

  // Evaluate property against an array of values
  cwDiagramShape.prototype.isPropertyDisplayable = function(banding, operatorRef, propertyValues) {
    var condition = false;
    var reference = this.convertValueToRightVariableType(propertyValues.referencePropertyTypeValue, operatorRef, propertyValues);
    var source = this.convertValueToRightVariableType(propertyValues.sourcePropertyTypeValue, operatorRef, propertyValues);
    banding = this.convertValueToRightVariableType(banding, operatorRef, propertyValues);
    var value;

    if (banding === 0 || banding === "0") {
      // banding row with undefined value
      value = source;
    } else {
      value = banding;
    }
    if (cwApi.isUndefinedOrNull(reference)) {
      reference = banding;
      value = source;
    }

    switch (operatorRef) {
      case 0: //Always = 0
        condition = true;
        break;
      case 1: // Set = 1
        condition = !cwApi.isUndefinedOrNull(source);
        // Patch bug in CM
        if (propertyValues.propertyTypeType === "BOOLEAN") {
          condition = source;
        }
        break;
      case 2: // NotSet = 2,
        condition = cwApi.isUndefinedOrNull(source);
        // Patch bug in CM
        if (propertyValues.propertyTypeType === "BOOLEAN") {
          condition = source;
        }
        break;
      case 3: // LessThan = 3
        condition = value < reference;
        break;
      case 4: // LessThanOrEqual = 4
        condition = value <= reference;
        break;
      case 5: // Equal = 5
        condition = value === reference;
        break;
      case 6: // GreaterThanOrEqual = 6
        condition = value >= reference;
        break;
      case 7: // GreaterThan = 7
        condition = value > reference;
        break;
      case 8: // NotEqual = 8
        condition = value !== reference;
        break;
      case 9: // Contains = 9
      case 13: // InRange = 13
        if (!cwApi.isUndefinedOrNull(value)) {
          condition = reference !== "" && value.indexOf(reference) !== -1;
        }
        break;
      case 10: // NotContains = 10
      case 14: // NotInRange = 14
        if (!cwApi.isUndefinedOrNull(value)) {
          condition = reference === "" || value.indexOf(reference) === -1;
          // condition = (reference !== "" && value.indexOf(reference) === -1);
        }
        break;
      case 11: // IsBetween = 11
        condition = value > reference[0] && banding < reference[1];
        break;
      case 12: // NotBetween = 12
        condition = value < reference[0] && banding > reference[1];
        break;
      // Associations are not supported right now
      case 15: // Exists = 15,
      case 16: // NotExists = 16,
        break;
      case 17: // AssociationExists = 17,
        condition = propertyValues.listExists; //(Array.isArray(propertyValues.listAssoc) && propertyValues.listAssoc.length > 0)
        break;
      case 18: // AssociationNotExists = 18,
        condition = !propertyValues.listExists; //(!Array.isArray(propertyValues.listAssoc) || ;
        break;
    }
    return condition;
  };
})(cwAPI.Diagrams.CwDiagramShape, cwAPI);
