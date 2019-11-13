(function(cwApi, $) {
  "use strict";

  /********************************************************************************
    Config
    *********************************************************************************/
  var actionOnObjectPage = {};
  /********************************************************************************
    Custom Action for Single Page : See Impact here http://bit.ly/2qy5bvB
    *********************************************************************************/
  cwCustomerSiteActions.doActionsForSingle_Custom = function(rootNode) {
    var currentView, url, i;
    currentView = cwAPI.getCurrentView();

    for (i in cwAPI.customLibs.doActionForSingle) {
      if (cwAPI.customLibs.doActionForSingle.hasOwnProperty(i)) {
        if (typeof cwAPI.customLibs.doActionForSingle[i] === "function") {
          cwAPI.customLibs.doActionForSingle[i](rootNode, currentView.cwView);
        }
      }
    }
  };

  actionOnObjectPage.do = function(rootNode) {
    var config,
      i,
      self = this;
    this.config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("actionOnObjectPage");
    this.viewName = cwAPI.getCurrentView().cwView;
    var doAction = true;
    if (this.config && this.config.hasOwnProperty(this.viewName)) {
      this.config[this.viewName].forEach(function(currenConfig) {
        if (self.isActionToDo(rootNode, currenConfig)) {
          self.execute(currenConfig, rootNode);
        }
      });
    }
  };

  actionOnObjectPage.isActionToDo = function(rootNode, config) {
    let isActionToDo = true;
    var self = this;
    if (rootNode) {
      var objPropertyValue;
      // non implemented in coffemaker yet
      if (config.nonActiveRole) {
        var currentUser = cwApi.currentUser;
        for (var i = 0; i < currentUser.RolesId.length; i++) {
          if (config.nonActiveRole.indexOf(currentUser.RolesId[i]) !== -1) return false;
        }
      }

      return config.filters.every(function(filter) {
        return self.matchFilter(rootNode, filter);
      });
    }
  };

  actionOnObjectPage.matchFilter = function(rootNode, filter) {
    if (filter.scriptname) return this.matchPropertyFilter(rootNode, filter);
    else return this.matchAssociationFilter(rootNode, filter);
  };

  actionOnObjectPage.matchPropertyFilter = function(rootNode, filter) {
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
          let dateOffset = 24 * 60 * 60 * 1000 * parseInt(d[1]); //5 days
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
        return filter.value.indexOf(objPropertyValue) !== -1;
      default:
        return false;
    }
    return false;
  };

  actionOnObjectPage.matchAssociationFilter = function(rootNode, filter) {
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

  actionOnObjectPage.execute = function(config, mainObject) {
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
      config.tabs.forEach(function(t) {
        self.actionOnId(config.style, config.styleValue, self.viewName + "-tab-" + t);
      });
    }

    if (config.views) {
      config.views.forEach(function(v) {
        self.actionOnId(config.style, config.styleValue, "navview-" + v);
      });
    }

    if (config.propertygroups) {
      config.propertygroups.forEach(function(p) {
        self.actionWithQuery(config.style, config.styleValue, "[id^=pg-" + p + "]");
      });
    }

    if (config.class) {
      doForElementOrArray(config.class, function(c) {
        self.actionOnClass(config.style, config.styleValue, c);
      });
    }
    if (config.htmlId) {
      doForElementOrArray(config.htmlId, function(id) {
        self.actionOnId(config.style, config.styleValue, id);
      });
    }
    if (config.jQuerySelector) {
      doForElementOrArray(config.jQuerySelector, function(q) {
        self.actionWithQuery(config.style, config.styleValue, q);
      });
    }
  };

  actionOnObjectPage.getStyleFromConfiguration = function(config) {
    if (config.actionType === "hide") {
      config.style = "display";
      config.styleValue = "none";
    }
    if (config.actionType === "highlight") {
      config.style = "border";
      config.styleValue = "2px solid " + config.highlightColor;
    }
  };

  actionOnObjectPage.actionOnClass = function(style, value, className) {
    var elements = document.getElementsByClassName(className);
    var i;
    for (i = 0; i < elements.length; i++) {
      elements[i].style[style] = value;
    }
  };

  actionOnObjectPage.actionWithQuery = function(style, value, query) {
    try {
      $(query).css(style, value);
    } catch (e) {
      console.log(e);
    }
  };

  actionOnObjectPage.actionOnId = function(style, value, id) {
    var element = document.getElementById(id);
    if (element && element.style) {
      element.style[style] = value;
    }
  };

  actionOnObjectPage.actionOnClassAndId = function(style, value, className, id) {
    var elements = document.getElementsByClassName(className);
    var i;
    for (i = 0; i < elements.length; i++) {
      if (elements[i].id.indexOf(id) !== -1) {
        elements[i].style[style] = value;
      }
    }
  };

  actionOnObjectPage.displaymsg = function(config, mainObject) {
    var elems = document.getElementsByClassName("tab-content");

    if (elems && elems[0]) {
      var p = new cwApi.CwDisplayProperties(config.htmlMessage, false);
      let itemLabel = p.getDisplayString(mainObject);

      if (itemLabel !== "") {
        if (config.fontAwesome && config.fontAwesome.icon) {
          let color = "";
          if (config.fontAwesome.color) color = 'style="color : ' + config.fontAwesome.color + '" ';
          itemLabel = "<i " + color + 'class="' + config.fontAwesome.icon + '" aria-hidden="true"></i>' + itemLabel;
        }
        if (config.imageUrl && config.imageUrl !== "") {
          itemLabel = "<img src='" + config.imageUrl + "'</img>" + itemLabel;
        }
        let html = '<div class="cw-visible CwPropertiesLayoutHelpText"><span>' + itemLabel + "</span></div>";
        let d = document.createElement("div");
        d.innerHTML = html;
        //elems[0].innerHTML = html + elems[0].innerHTML;
        elems[0].insertBefore(d, elems[0].firstChild);
      }
    }
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
