/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";

  let cwPropertiesGroups = cwApi.cwPropertiesGroups;
  cwPropertiesGroups.types.booleanValue = function (value, noIcon) {
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("property");
    }
    if (!config || !config.booleanIcon || noIcon) {
      return value !== false ? $.i18n.prop("global_true") : $.i18n.prop("global_false");
    } else if (value !== false) {
      value = '<i class="fa fa-check cwTrueFaIcon"><span class="hidden">' + jQuery.i18n.prop("global_true") + "</span></i>";
    } else {
      value = '<i class="fa fa-times cwFalseFaIcon"><span class="hidden">' + jQuery.i18n.prop("global_false") + "</span></i>";
    }
    return value;
  };

  //Url
  cwPropertiesGroups.types.URLValue = function (value) {
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("property");
    }
    var targetBlank = "",
      link = value,
      text = value;

    if (!config) return "<a href='" + value + "'>" + value + "</a>";
    if (config.openUrlInNewTab) targetBlank = 'target="_blank"';
    if (config.urlText && config.urlText != "") {
      return link == ""
        ? ""
        : config.urlText +
            " <a " +
            targetBlank +
            'href="' +
            link +
            '">' +
            '<div style="display:none">' +
            link +
            "</div>" +
            "<i class='fa fa-file-text' </i>" +
            "</a>";
    }
    return "<a " + targetBlank + "href='" + value + "'>" + value + "</a>";
  };

  cwPropertiesGroups.getDisplayValue = function (
    objectTypeScriptName,
    propertyScriptName,
    currentValue,
    object,
    propertiesContainer,
    noValue,
    noIcon
  ) {
    var timePeriodValue, probabilityFunctionValue, growthRateValue, property, value;
    property = cwApi.mm.getProperty(objectTypeScriptName, propertyScriptName);
    value = currentValue;
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("property");
    }
    if (config) {
      if (config[objectTypeScriptName] && config[objectTypeScriptName][propertyScriptName]) {
        config = config[objectTypeScriptName][propertyScriptName];
      } else if (config.hardcoded && config.hardcoded.length > 0) {
        // check for label Mapping
        let r;
        let v = value == "__|UndefinedValue|__" ? $.i18n.prop("global_undefined") : value;
        config.hardcoded.forEach(function (mapping) {
          if (v.toString() === mapping.value) {
            r = mapping;
          }
        });
        if (r) config = r;
      }
    }

    if (!cwApi.isUndefined(value) && !cwApi.isUndefined(property.type) && !cwApi.isNull(value)) {
      switch (property.type) {
        case "Date":
          if (cwPropertiesGroups.types.isDefaultDate(value)) {
            value = "";
          } else {
            value = cwPropertiesGroups.types.strictDateValue(value);
          }
          break;
        case "Image":
          value = cwPropertiesGroups.types.imageValue(object, property.scriptName);
          break;
        case "Boolean":
          value = cwPropertiesGroups.types.booleanValue(value, noIcon);
          break;
        case "URL":
          value = cwPropertiesGroups.types.URLValue(value);
          break;
        case "Lookup":
          property.valueID = object[propertiesContainer][property.scriptName + "_id"];
          value = cwPropertiesGroups.types.lookupValue(value, property.valueID, config, noValue, noIcon);
          break;
        case "Memo":
          value = cwPropertiesGroups.formatMemoProperty(value, objectTypeScriptName);
          break;
        case "Frequency":
        case "Duration":
          timePeriodValue = cwPropertiesGroups.getTimePeriodValue(value);
          value = value.Average + " " + $.i18n.prop("distribution_properties_per") + " " + timePeriodValue;
          break;
        case "Rate":
          timePeriodValue = cwPropertiesGroups.getTimePeriodValue(value);
          growthRateValue = cwPropertiesGroups.getGrowthRateValue(value);
          probabilityFunctionValue = cwPropertiesGroups.getProbabilityFunctionValue(value);
          value = value.Average + " " + growthRateValue + " " + timePeriodValue + " +/- " + value.Deviation + " " + probabilityFunctionValue;
          break;
        case "NumberDistribution":
          probabilityFunctionValue = cwPropertiesGroups.getProbabilityFunctionValue(value);
          value = value.Average + " +/- " + value.Deviation + " " + probabilityFunctionValue;
          break;
        case "FrequencyDistribution":
          timePeriodValue = cwPropertiesGroups.getTimePeriodValue(value);
          probabilityFunctionValue = cwPropertiesGroups.getProbabilityFunctionValue(value);
          value =
            value.Average +
            " " +
            $.i18n.prop("distribution_properties_per") +
            " " +
            timePeriodValue +
            " +/- " +
            value.Deviation +
            " " +
            probabilityFunctionValue;
          break;
        case "DurationDistribution":
          timePeriodValue = cwPropertiesGroups.getTimePeriodValue(value);
          probabilityFunctionValue = cwPropertiesGroups.getProbabilityFunctionValue(value);
          value = value.Average + " " + timePeriodValue + " +/- " + value.Deviation + " " + probabilityFunctionValue;
          break;
        case "Integer":
        case "Double":
          if (property.scriptName !== "id") {
            value = cwPropertiesGroups.types.numericValue(value, config, noValue, noIcon);
          }
      }
    }
    return value;
  };

  cwPropertiesGroups.types.lookupValue = function (value, lookupID, config, noValue, noIcon) {
    let result = value;
    if (value === cwApi.getLookupUndefinedValue()) {
      value = $.i18n.prop("global_undefined");
      result = value;
    }
    if (config && !noIcon) {
      if (config[lookupID]) {
        result = this.getResultForStyling(value, config[lookupID], noValue);
      }
      if (config.value) {
        result = this.getResultForStyling(value, config, noValue);
      }
    }

    return result;
  };

  cwPropertiesGroups.types.numericValue = function (value, config, noValue, noIcon) {
    let selectedStep;
    if (!config || (!config.steps && !config.value) || noIcon) return cwApi.CwNumberSeparator.formatAndGetNumberWithSeperator(value);
    if (!config.steps && config.value)
      return this.getResultForStyling(cwApi.CwNumberSeparator.formatAndGetNumberWithSeperator(value), config, noValue);
    config.steps.forEach(function (step) {
      if (
        (step.min && step.max === null && step.min < value) ||
        (step.min && step.max && step.min < value && step.max > value) ||
        (step.max && step.min === null && step.max > value) ||
        ([undefined, null, ""].indexOf(step.min) !== -1 && [undefined, null, ""].indexOf(step.max) !== -1)
      ) {
        selectedStep = step;
      }
    });

    if (selectedStep) {
      function number_format(number, decimals, dec_point, thousands_sep) {
        var n = !isFinite(+number) ? 0 : +number,
          prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
          sep = typeof thousands_sep === "undefined" ? "," : thousands_sep,
          dec = typeof dec_point === "undefined" ? "." : dec_point,
          toFixedFix = function (n, prec) {
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            var k = Math.pow(10, prec);
            return Math.round(n * k) / k;
          },
          s = (prec ? toFixedFix(n, prec) : Math.round(n)).toString().split(".");
        if (s[0].length > 3) {
          s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }
        if ((s[1] || "").length < prec) {
          s[1] = s[1] || "";
          s[1] += new Array(prec - s[1].length + 1).join("0");
        }
        return s.join(dec);
      }
      let unit = selectedStep.unit ? selectedStep.unit : "";

      if (selectedStep.decimalseparator || selectedStep.thousandseparator)
        value = number_format(value, undefined, selectedStep.decimalseparator, selectedStep.thousandseparator);
      else value = cwApi.CwNumberSeparator.formatAndGetNumberWithSeperator(value);

      value = selectedStep.infront && unit ? unit + " " + value : value + " " + unit;
    } else {
      value = cwApi.CwNumberSeparator.formatAndGetNumberWithSeperator(value);
    }
    return this.getResultForStyling(value, selectedStep, noValue);
  };

  cwPropertiesGroups.types.getResultForStyling = function (value, config, noValue) {
    let result = value;
    if (!config) return result;
    if (config.icon || config.valueColor) {
      result = "";
      result += "<span class='spanLookup'";
      if (config.valueColor) result += " style='color: " + config.valueColor;
      result += "'>";
      if (config.icon && config.icon != "0") {
        result += "<i ";
        if (config.iconColor) result += " style='color: " + config.iconColor + "' ";
        result += " aria-hidden='true' class='" + config.icon + "'></i>";
      }
      if (config.imageUrl) {
        result += '<img class="scaleImg" src="' + config.imageUrl + '" />';
      }

      if (!noValue) result += "<span>" + value + "</span>";
      result += "</span>";
    }
    return result;
  };

  cwApi.cwPropertiesGroups.formatMemoProperty = function (value, objectTypeScriptName) {
    if (value.indexOf("!DOCTYPE HTML PUBLIC") === -1 && value.indexOf("!DOCTYPE html") === -1) {
      if (value.indexOf('"') !== -1) {
        value = value.replace(/\\"/g, '"');
      }

      if (value.indexOf("\\") !== -1) {
        value = value.replace(/\\\\/g, "\\");
      }

      value = cwApi.cwEditProperties.safe_tags(value);
      //restore the <br/>
      value = value.replace(/\&lt;br\/\&gt;/g, "<br/>");
      // value = value.replace(/ /g, '&nbsp;');
    }
    let config = null;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("property");
    }
    if (
      config &&
      objectTypeScriptName &&
      config.objectTypeUsedForMemoDefinitionMapping &&
      config.objectTypeUsedForMemoDefinitionMapping[objectTypeScriptName]
    ) {
      let view = config.objectTypeUsedForMemoDefinitionMapping[objectTypeScriptName];
      if (!cwApi.queryObject.isEditMode()) {
        try {
          if (!cwApi.customLibs.utils.glossary[view]) {
            let jsonFile = cwApi.getIndexViewDataUrl(view);
            var request = new XMLHttpRequest();
            request.open("GET", jsonFile, false); // `false` makes the request synchronous
            request.send(null);
            if (request.status === 200 && status != "Ko") {
              let jsonRep = JSON.parse(request.responseText);
              cwApi.customLibs.utils.glossary[view] = jsonRep[Object.keys(jsonRep)[0]];
            }
          }
          var cdsByID = {};
          cwApi.customLibs.utils.glossary[view]
            .sort(function (a, b) {
              return b.name.length - a.name.length;
            })
            .forEach(function (obj) {
              var reg = new RegExp("([^A-Z])(" + obj.name + ")([^A-Z])", "ig");
              cdsByID[obj.object_id] = {
                cds: cwAPI.customLibs.utils.getItemDisplayString(view, obj),
                name: obj.name,
              };

              value = value.replace(reg, "$1#id#" + obj.object_id + "#id#$3");
            });

          Object.keys(cdsByID).forEach(function (id) {
            value = value.replaceAll("#id#" + id + "#id#", "<delEdit name='" + cdsByID[id].name + "'>" + cdsByID[id].cds + "</delEdit>");
          });
        } catch (e) {
          console.log(e);
        }
      }
    }
    return value;
  };

  cwApi.cwEditProperties.cwEditPropertyMemo.prototype.setEditModeInDOM = function () {
    var o, value;
    o = [];
    value = this.initialDOMContent;
    let regex = /<deledit.*?name="(.*?)".*?<\/deledit>/gi;

    value = value.replace(regex, "$1");

    if (this.p.newMemoControl === true) {
      value = cwApi.cwEditProperties.cwEditPropertyMemo.replaceNewlinesWithBR(value);
    }
    if (cwApi.cwEditProperties.cwEditPropertyMemo.isHTMLContent(value) === false || this.p.newMemoControl === true) {
      o.push("<textarea ", this.createPropertyAttributesInline(), ">", value, "</textarea>");
      this.propertyDOM.html(o.join(""));

      if (this.p.newMemoControl === true) {
        tinyMCE.dom.Event.domLoaded = true;
        cwApi.cwTinymceManager.initalizeTinymce("cw-edit-attr-" + this.id, function (ed) {
          //this tinymce initialize + after loaded set the initial values
          var propertyId = String(ed.id).replace("cw-edit-attr-", "");
          if (cwApi.editPropertiesManager) {
            for (var i = 0; i < cwApi.editPropertiesManager.properties.length; i++) {
              if (String(cwApi.editPropertiesManager.properties[i].id) === propertyId) {
                var scriptName = cwApi.editPropertiesManager.properties[i].scriptName;
                if (!cwAPI.isUndefined(cwApi.editPropertiesManager.initialValues))
                  cwApi.editPropertiesManager.initialValues.properties[scriptName] = cwApi.cwTinymceManager.getFormattedHtml(ed.id);
              }
            }
          }
        });
      }
    }
    this.setMandatoryPropertyDOM();
  };

  var updatePropertyForGridReview = function (
    gridItem,
    mainItem,
    sourceItem,
    targetItem,
    displayNames,
    item,
    propertyScriptName,
    propertyFromMetaModel,
    propertiesLocation
  ) {
    if (propertyFromMetaModel.readOnly !== true) {
      sourceItem.properties[propertyScriptName] = mainItem[propertiesLocation][propertyScriptName];

      //Fix RFI Create then Edit
      if (propertyScriptName === "functionsynonym" && cwApi.isUndefined(sourceItem.properties[propertyScriptName])) {
        sourceItem.properties[propertyScriptName] = "";
      }

      if (propertyScriptName === "exportflag") {
        sourceItem.lookupSelectedText[propertyScriptName] = cwApi.cwPropertiesGroups.assignFreezeLevel(
          mainItem[propertiesLocation][propertyScriptName]
        );
        targetItem.lookupSelectedText[propertyScriptName] = cwApi.cwPropertiesGroups.assignFreezeLevel(gridItem[propertyScriptName]);
      } else if (propertyScriptName === "whoowns") {
        sourceItem.lookupSelectedText[propertyScriptName] = cwApi.cwConfigs.UserData.UserById[mainItem[propertiesLocation][propertyScriptName]];
        targetItem.lookupSelectedText[propertyScriptName] = cwApi.cwConfigs.UserData.UserById[gridItem[propertyScriptName]];
      }
      displayNames[propertyScriptName] = propertyFromMetaModel.name;

      if (propertyFromMetaModel.type === "Lookup") {
        sourceItem.properties[propertyScriptName] = mainItem[propertiesLocation][propertyScriptName + "_id"];
        propertyScriptName = propertyScriptName + "_id";
      } else if (propertyFromMetaModel.type === "Memo") {
        sourceItem.properties[propertyScriptName] = cwAPI.cwPropertiesGroups.formatMemoProperty(mainItem[propertiesLocation][propertyScriptName]);
      } else if (propertyFromMetaModel.type === "Boolean") {
        sourceItem.lookupSelectedText[propertyScriptName] = cwApi.cwPropertiesGroups.types.booleanValue(
          mainItem[propertiesLocation][propertyScriptName]
        );
        targetItem.lookupSelectedText[propertyScriptName] = cwApi.cwPropertiesGroups.types.booleanValue(gridItem[propertyScriptName]);
      } else if (propertyFromMetaModel.type === "Date") {
        sourceItem.lookupSelectedText[propertyScriptName] = cwApi.cwPropertiesGroups.types.strictDateValue(
          mainItem[propertiesLocation][propertyScriptName]
        );
        targetItem.lookupSelectedText[propertyScriptName] = cwApi.cwPropertiesGroups.types.strictDateValue(gridItem[propertyScriptName]);
      }

      if (!cwApi.isUndefined(gridItem[propertyScriptName])) {
        targetItem.properties = gridItem.checkPropertyType(
          propertyFromMetaModel,
          sourceItem,
          targetItem,
          gridItem,
          mainItem,
          propertyScriptName,
          propertyFromMetaModel
        );
      }
    }
  };

  cwBehaviours.CwKendoGridItem.prototype.outputMainObjectProperties = function (gridItem, mainItem, sourceItem, targetItem, displayNames) {
    var outputObject = new cwBehaviours.CwKendoGridData();

    outputObject.outputPropertiesGroupsContent(mainItem, this.nodeSchema, "PropertiesGroups", function (item, propertyScriptName) {
      var propertyFromMetaModel = cwApi.mm.getProperty(mainItem.objectTypeScriptName, propertyScriptName);
      updatePropertyForGridReview(
        gridItem,
        mainItem,
        sourceItem,
        targetItem,
        displayNames,
        item,
        propertyScriptName,
        propertyFromMetaModel,
        "properties"
      );
    });
  };

  cwBehaviours.CwKendoGridItem.prototype.outputintersectionObjectProperties = function (
    gridItem,
    mainItem,
    sourceItem,
    targetItem,
    intersectionGridsByUid,
    displayNames
  ) {
    var outputObject;
    outputObject = new cwBehaviours.CwKendoGridData();
    outputObject.outputPropertiesGroupsContent(mainItem, this.nodeSchema, "iPropertiesGroups", function (item, propertyScriptName) {
      var propertyFromMetaModel = cwApi.mm.getProperty(mainItem.iObjectTypeScriptName, propertyScriptName);

      updatePropertyForGridReview(
        gridItem,
        mainItem,
        sourceItem,
        targetItem,
        displayNames,
        item,
        propertyScriptName,
        propertyFromMetaModel,
        "iProperties"
      );

      if (!cwApi.isUndefined(gridItem[propertyScriptName])) {
        if (propertyScriptName === "name") {
          targetItem.properties[propertyScriptName] = gridItem.Intersection_Name;
        }
      }

      if (propertyScriptName === "functionsynonym") {
        targetItem.properties[propertyScriptName] = gridItem.Intersection_Name;
      }

      displayNames[propertyScriptName] = propertyFromMetaModel.name;
    });
  };

  cwBehaviours.CwKendoGridMemoType.prototype.setProperty = function (gridObject, item, propertyScriptName) {
    gridObject[propertyScriptName] = cwAPI.cwPropertiesGroups.formatMemoProperty(item.properties[propertyScriptName], item.objectTypeScriptName);
  };

  cwApi.cwPropertiesGroups = cwPropertiesGroups;
})(cwAPI, jQuery);
