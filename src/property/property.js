/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";

  let cwPropertiesGroups = cwApi.cwPropertiesGroups;
  cwPropertiesGroups.types.booleanValue = function (value) {
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("property");
    }
    if (!config || !config.booleanIcon) {
      return value !== false ? $.i18n.prop("global_true") : $.i18n.prop("global_false");
    } else if (value !== false) {
      value = '<i style="color:green" class="fa fa-check"><span class="hidden">' + jQuery.i18n.prop("global_true") + "</span></i>";
    } else {
      value = '<i style="color:red" class="fa fa-times"><span class="hidden">' + jQuery.i18n.prop("global_false") + "</span></i>";
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
      return (
        config.urlText +
        " <a " +
        targetBlank +
        'href="' +
        link +
        '">' +
        '<div style="display:none">' +
        link +
        "</div>" +
        "<i class='fa fa-file-text' </i>" +
        "</a>"
      );
    }
    return "<a " + targetBlank + "href='" + value + "'>" + value + "</a>";
  };

  cwPropertiesGroups.getDisplayValue = function (objectTypeScriptName, propertyScriptName, currentValue, object, propertiesContainer, noValue) {
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
          if (v === mapping.value) {
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
          value = cwPropertiesGroups.types.booleanValue(value);
          break;
        case "URL":
          value = cwPropertiesGroups.types.URLValue(value);
          break;
        case "Lookup":
          property.valueID = object[propertiesContainer][property.scriptName + "_id"];
          value = cwPropertiesGroups.types.lookupValue(value, property.valueID, config, noValue);
          break;
        case "Memo":
          value = cwPropertiesGroups.formatMemoProperty(value);
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
            value = cwApi.CwNumberSeparator.formatAndGetNumberWithSeperator(value);
            value = cwPropertiesGroups.types.numericValue(value, config, noValue);
          }
      }
    }
    return value;
  };

  cwPropertiesGroups.types.lookupValue = function (value, lookupID, config, noValue) {
    let result = value;
    if (value === cwApi.getLookupUndefinedValue()) {
      value = $.i18n.prop("global_undefined");
      result = value;
    }
    if (config) {
      if (config[lookupID]) {
        result = this.getResultForStyling(value, config[lookupID], noValue);
      }
      if (config.value) {
        result = this.getResultForStyling(value, config, noValue);
      }
    }

    return result;
  };

  cwPropertiesGroups.types.numericValue = function (value, config, noValue) {
    let selectedStep;
    if (!config || (!config.steps && !config.value)) return value;
    if (!config.steps && config.value) return this.getResultForStyling(value, config, noValue);
    config.steps.forEach(function (step) {
      if (
        (step.min && step.max === null && step.min < value) ||
        (step.min && step.max && step.min < value && step.max > value) ||
        (step.max && step.min === null && step.max > value)
      ) {
        selectedStep = step;
      }
    });

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

  cwApi.cwPropertiesGroups = cwPropertiesGroups;
})(cwAPI, jQuery);
