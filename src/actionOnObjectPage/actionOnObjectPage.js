(function (cwApi, $) {
  "use strict";

  /********************************************************************************
    Config
    *********************************************************************************/
  var actionOnObjectPage = {};

  actionOnObjectPage.do = function (rootNode) {
    var config,
      i,
      self = this;
    this.config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("actionOnObjectPage");
    this.viewName = cwAPI.getCurrentView().cwView;
    var doAction = true;
    if (this.config && this.config.hasOwnProperty(this.viewName)) {
      this.config[this.viewName].forEach(function (currenConfig) {
        if (self.isActionToDo(rootNode, currenConfig)) {
          self.execute(currenConfig, rootNode);
        }
      });
    }
  };

  actionOnObjectPage.isActionToDo = function (rootNode, config) {
    let isActionToDo = true;
    var self = this;
    if (rootNode) {
      var objPropertyValue;

      if (config.notRole) {
        var currentUser = cwApi.currentUser;
        for (var i = 0; i < currentUser.RolesId.length; i++) {
          if (config.notRole.hasOwnProperty(currentUser.RolesId[i])) return false;
        }
      }

      return config.filters.every(function (filter) {
        return self.matchFilter(rootNode, filter);
      });
    }
  };

  actionOnObjectPage.matchFilter = function (rootNode, filter) {
    if (filter.scriptname) return this.matchPropertyFilter(rootNode, filter);
    else return this.matchAssociationFilter(rootNode, filter);
  };

  actionOnObjectPage.matchPropertyFilter = function (rootNode, filter) {
    let propertyType = cwApi.mm.getProperty(rootNode.objectTypeScriptName, filter.scriptname);
    let objPropertyValue;
    let value = filter.Value;
    if (filter.scriptname === "id") {
      // changing id to make usable like other property
      objPropertyValue = rootNode.object_id;
    } else {
      if (propertyType.type === "Lookup") {
        objPropertyValue = rootNode.properties[filter.scriptname + "_id"];
      } else if (propertyType.type === "Date") {
        objPropertyValue = new Date(rootNode.properties[filter.scriptname]);
        objPropertyValue = objPropertyValue.getTime();
        let d = filter.Value;
        if (d.indexOf("{@currentDate}") !== -1) {
          d = d.split("-");
          let dateOffset = 24 * 60 * 60 * 1000 * parseInt(d[1]);
          let today = new Date();
          value = today.getTime() - dateOffset;
        } else {
          d = new Date(d);
          value = d.getTime();
        }
      } else {
        objPropertyValue = rootNode.properties[filter.scriptname];
      }
    }

    switch (filter.Operator) {
      case "=":
        return objPropertyValue == value;
      case "<":
        return objPropertyValue < value;
      case ">":
        return objPropertyValue > value;
      case "!=":
        return objPropertyValue != value;
      case "In":
        return value.indexOf(objPropertyValue) !== -1;
      default:
        return false;
    }
    return false;
  };

  actionOnObjectPage.matchAssociationFilter = function (rootNode, filter) {
    let objPropertyValue;
    if (rootNode.associations[filter.nodeID]) {
      objPropertyValue = rootNode.associations[filter.nodeID].length;
    } else return;
    switch (filter.Operator) {
      case "=":
        return objPropertyValue == filter.Value;
        break;
      case "<":
        return objPropertyValue < filter.Value;
        break;
      case "<=":
        return objPropertyValue <= filter.value;
      case ">":
        return objPropertyValue > filter.value;
        break;
      case "!=":
        return objPropertyValue != filter.value;
      case "In":
        return filter.value.indexOf(objPropertyValue) !== -1;
      default:
        return false;
    }
    return false;
  };

  actionOnObjectPage.execute = function (config, mainObject) {
    var self = this;
    this.getStyleFromConfiguration(config);
    function doForElementOrArray(elem, callback) {
      if (Array.isArray(elem)) {
        for (var i = 0; i < elem.length; i += 1) {
          callback(elem[i]);
        }
      } else {
        callback(elem);
      }
    }
    if (config.actionType === "displaymsg") {
      this.displaymsg(config, mainObject);
      return;
    }

    if (config.tabs) {
      config.tabs.forEach(function (t) {
        self.actionOnId(config.style, config.styleValue, self.viewName + "-tab-" + t);
      });
    }

    if (config.views) {
      config.views.forEach(function (v) {
        self.actionOnId(config.style, config.styleValue, "navview-" + v);
      });
    }

    if (config.propertygroups) {
      config.propertygroups.forEach(function (p) {
        self.actionWithQuery(config.style, config.styleValue, "[id^=pg-" + p + "]");
      });
    }

    if (config.class) {
      doForElementOrArray(config.class, function (c) {
        self.actionOnClass(config.style, config.styleValue, c);
      });
    }
    if (config.htmlId) {
      doForElementOrArray(config.htmlId, function (id) {
        self.actionOnId(config.style, config.styleValue, id);
      });
    }
    if (config.jQuerySelector) {
      doForElementOrArray(config.jQuerySelector, function (q) {
        self.actionWithQuery(config.style, config.styleValue, q);
      });
    }
  };

  actionOnObjectPage.getStyleFromConfiguration = function (config) {
    if (config.actionType === "hide") {
      config.style = "display";
      config.styleValue = "none";
    }
    if (config.actionType === "highlight") {
      config.style = "border";
      config.styleValue = "2px solid " + config.highlightColor;
    }
  };

  actionOnObjectPage.actionOnClass = function (style, value, className) {
    var elements = document.getElementsByClassName(className);
    var i;
    for (i = 0; i < elements.length; i++) {
      elements[i].style[style] = value;
    }
  };

  actionOnObjectPage.actionWithQuery = function (style, value, query) {
    try {
      $(query).css(style, value);
    } catch (e) {
      console.log(e);
    }
  };

  actionOnObjectPage.actionOnId = function (style, value, id) {
    var element = document.getElementById(id);
    if (element && element.style) {
      element.style[style] = value;
    }
  };

  actionOnObjectPage.actionOnClassAndId = function (style, value, className, id) {
    var elements = document.getElementsByClassName(className);
    var i;
    for (i = 0; i < elements.length; i++) {
      if (elements[i].id.indexOf(id) !== -1) {
        elements[i].style[style] = value;
      }
    }
  };

  actionOnObjectPage.displaymsg = function (config, mainObject) {
    var elems = document.getElementsByClassName("tab-content");
    if (elems.length > 0) {
      for (var i = 0; i < elems.length; i += 1) {
        if (config.tabs.indexOf(elems[i].id.replace("tab-", "")) !== -1) {
          elems[i].insertBefore(this.createMsg(config, mainObject), elems[i].firstChild);
        }
      }
    } else {
      let zone = document.getElementById("zone_" + this.viewName);
      if (zone) {
        zone.insertBefore(this.createMsg(config, mainObject), zone.firstChild);
      }
    }
  };

  actionOnObjectPage.createMsg = function (config, mainObject) {
    var p = new cwApi.CwDisplayProperties(config.htmlMessage, false);
    let itemLabel = p.getDisplayString(mainObject);

    if (itemLabel !== "") {
      if (config.imageUrl && config.imageUrl !== "") {
        let widthString = "";
        let heightString = "";
        if (config.width) widthString = " width='" + config.width + "' ";
        if (config.height) heightString = " height='" + config.height + "' ";
        itemLabel = "<img" + widthString + heightString + " src='" + config.imageUrl + "'</img>" + itemLabel;
      }
      if (config.fontAwesome && config.fontAwesome.icon && config.fontAwesome.icon !== "0") {
        let color = "";
        if (config.fontAwesome.color) color = 'style="color : ' + config.fontAwesome.color + '" ';
        itemLabel = "<i " + color + 'class="' + config.fontAwesome.icon + '" aria-hidden="true"></i>' + itemLabel;
      }

      let html = '<div class="cw-visible CwPropertiesLayoutHelpText"><span>' + itemLabel + "</span></div>";
      let d = document.createElement("div");
      d.innerHTML = html;
      return d;
    }
    return document.createElement("div");
  };
  /********************************************************************************
    Configs : add trigger for single page
    *********************************************************************************/
  if (cwAPI.customLibs === undefined) {
    cwAPI.customLibs = {};
  }
  if (cwAPI.customLibs.doActionForSingle === undefined) {
    cwAPI.customLibs.doActionForSingle = {};
  }
  cwAPI.customLibs.doActionForSingle.actionOnObjectPage = actionOnObjectPage.do.bind(actionOnObjectPage);
  cwAPI.customLibs.isActionToDo = actionOnObjectPage.isActionToDo.bind(actionOnObjectPage);
})(cwAPI, jQuery);
