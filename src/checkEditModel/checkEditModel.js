/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";

  cwApi.CwMandatoryValueChange.prototype.checkMandatoryValues = function () {
    var config,
      view = cwAPI.getCurrentView();
    let globalConfig = cwAPI.customLibs.utils.getCustomLayoutConfiguration("checkEditModel");

    if (view && globalConfig && globalConfig[view.cwView]) {
      config = globalConfig[view.cwView];
      if (config) {
        this.modifyAutomaticProperty(config);
        this.checkNumberOfAssociation(config);
        if (config.unicityView) this.checkUniqueProperties(config);
      }
    }
    this.checkMandatoryProperties();
    this.checkMandatoryAssociations();
  };

  cwApi.CwMandatoryValueChange.prototype.modifyAutomaticProperty = function (config) {
    var propertyScriptName;
    if (this.sourceObject && this.sourceObject.properties) {
      for (let s in this.sourceObject.properties) {
        if (this.sourceObject.properties.hasOwnProperty(s) && config[s] && config[s].automaticValue) {
          this.pendingObject.objectTypeScriptName = this.objectTypeScriptName.toLowerCase();
          this.pendingObject.properties[s] = cwAPI.customLibs.utils.getCustomDisplayStringWithOutHTML(config[s].automaticValue, this.pendingObject);
        }
      }
    }
  };

  cwApi.CwMandatoryValueChange.prototype.addEmptyMandatoryPropertiesToList = function (propertyValue, propertyType) {
    if (this.isPropertyEmpty(propertyValue, propertyType.type)) {
      this.emptyMandatoryProperties.push(propertyType.name + " : " + $.i18n.prop("checkeditmode_propertywihtoutvalue"));
    }
  };

  cwApi.CwMandatoryValueChange.prototype.checkUniqueProperties = function (config) {
    var pages = {},
      propertyScriptName,
      propertyType,
      sourceIsNotNull;
    if (this.pendingObject.mandatory === undefined) this.pendingObject.mandatory = {};

    for (propertyScriptName in this.pendingObject.properties) {
      if (
        this.pendingObject.properties.hasOwnProperty(propertyScriptName) &&
        config.hasOwnProperty(propertyScriptName) &&
        config[propertyScriptName].unique
      ) {
        propertyType = cwApi.mm.getProperty(this.objectTypeScriptName, propertyScriptName);

        if (this.checkPropertyUnicity(propertyScriptName, config.unicityView, pages) === false) {
          this.emptyMandatoryProperties.push(propertyType.name + " : " + $.i18n.prop("checkeditmode_notuniquevalue"));
          this.pendingObject.mandatory[propertyScriptName] = true;
        } else {
          this.pendingObject.mandatory[propertyScriptName] = false;
        }
      }
    }
  };

  cwApi.CwMandatoryValueChange.prototype.getPropertyFromObjectPage = function (propertyScriptName, objectPage, pages, id) {
    function getQueryStringValue(key) {
      return decodeURIComponent(
        window.location.search.replace(
          new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"),
          "$1"
        )
      );
    }

    var o,
      n,
      reqEnd = true;
    if (pages.objectPage === undefined) pages[objectPage] = {};
    if (pages[objectPage][id] === undefined) {
      reqEnd = false;
      var url = cwApi.getLiveServerURL() + "page/" + objectPage + "/" + id + "?" + Math.random();

      var request = new XMLHttpRequest();
      request.open("GET", url, false); // `false` makes the request synchronous
      request.send(null);

      if (request.status === 200 && status != "Ko") {
        try {
          pages[objectPage][id] = JSON.parse(request.responseText);
        } catch (e) {
          cwAPI.notificationManager.addError(e.message);
          return null;
        }
      } else return null;
    }

    if (pages[objectPage][id].object && pages[objectPage][id].object.properties && pages[objectPage][id].object.properties[propertyScriptName])
      return pages[objectPage][id].object.properties[propertyScriptName];

    return null;
  };

  cwApi.CwMandatoryValueChange.prototype.checkPropertyUnicity = function (propertyScriptName, indexPage, pages, callback) {
    function getQueryStringValue(key) {
      return decodeURIComponent(
        window.location.search.replace(
          new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"),
          "$1"
        )
      );
    }

    var o,
      n,
      reqEnd = true;
    if (pages.hasOwnProperty(indexPage) === false) {
      reqEnd = false;
      var url = cwApi.getLiveServerURL() + "page/" + indexPage + "?" + Math.random();

      var request = new XMLHttpRequest();
      request.open("GET", url, false); // `false` makes the request synchronous
      request.send(null);

      if (request.status === 200 && status != "Ko") {
        try {
          pages[indexPage] = JSON.parse(request.responseText);
        } catch (e) {
          cwAPI.notificationManager.addError(e.message);
          return true;
        }
      }
    }

    for (n in pages[indexPage]) {
      if (pages[indexPage].hasOwnProperty(n)) {
        for (var i = 0; i < pages[indexPage][n].length; i++) {
          if (
            this.pendingObject.properties[propertyScriptName].toLowerCase() === pages[indexPage][n][i].properties[propertyScriptName].toLowerCase()
          ) {
            if (pages[indexPage][n][i].object_id.toString() !== cwApi.cwPageManager.getQueryString().cwid) {
              return false;
            }
          }
        }
      }
    }

    return true;
  };

  cwApi.CwMandatoryValueChange.prototype.checkNumberOfAssociation = function (config) {
    var node, a, n, c, l;
    for (n in this.pendingObject.associations) {
      if (this.pendingObject.associations.hasOwnProperty(n) && config.hasOwnProperty(n)) {
        node = this.pendingObject.associations[n];
        c = config[n];
        l = node.items.length;
        if ((c.min && l < c.min) || (c.max && l > c.max)) {
          var associationType = cwApi.getAssociationType(n);
          this.pendingObject.associations[n].isMandatory = true;
          var message;
          if (c.min && l < c.min) message = l + " " + $.i18n.prop("checkeditmode_minimunassociatedobjects") + " " + c.min;
          if (c.max && l > c.max) message = l + " " + $.i18n.prop("checkeditmode_maximumassociatedobjects") + " " + c.max;
          this.emptyMandatoryAssociations.push(associationType.displayNodeName + " : " + message);
        }
      }
    }
  };

  cwApi.CwPendingChangeset.prototype.hasName = function () {
    var self = this;
    if (this.objectName === "") {
      this.propertyChanges.some(function (pc) {
        if (pc.propertyTypeScriptName === "NAME") {
          self.objectName = pc.pendingProperty.value;
          return true;
        }
      });
    }
    return this.objectName.trim() !== "";
  };
})(cwAPI, jQuery);
