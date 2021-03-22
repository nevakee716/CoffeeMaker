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

    if (config.actionType === "carrousel") {
      this.displayCarrousel(config, mainObject);
      return;
    }

    if (config.actionType === "wordTemplate") {
      this.displayWordTemplate(config, mainObject);
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

  var blobToBase64 = function (blob, callback) {
    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = reader.result;
      var base64 = dataUrl.split(",")[1];
      callback(base64);
    };
    reader.readAsDataURL(blob);
  };

  actionOnObjectPage.displayWordTemplate = function (config, mainObject) {
    var wordButton = document.createElement("div");
    wordButton.innerHTML = '<a class=" page-action btn no-text" title="Word"><span class="btn-text"></span><i class="fa fa-file-word-o"></i></a>';
    var buttonContainer = document.querySelector(".right-buttons");
    buttonContainer.appendChild(wordButton);

    if (cwAPI.isDebugMode() === false) {
      let libToLoad = ["modules/docxTemplater/docxTemplater.min.js"];
      // AsyncLoad
      cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad, function (error) {
        if (error) {
          cwAPI.Log.Error(error);
        }
      });
    }

    wordButton.addEventListener("click", function () {
      cwDocxTemplate.exportWord(mainObject, config.wordTemplateUrl + "?" + cwAPI.getRandomNumber(), null, {
        property: function (item, propertyScriptName) {
          return cwApi.cwPropertiesGroups.getDisplayValue(
            item.objectTypeScriptName,
            propertyScriptName,
            item.properties[propertyScriptName],
            item,
            "properties",
            false,
            true
          );
        },
        getLink: function (item) {
          return { url: cwAPI.getSingleViewHash(cwAPI.replaceSpecialCharacters(item.objectTypeScriptName), item.name), label: item.name };
        },
        customDisplayString: function (item, cds) {
          let r = cwAPI.customLibs.utils.getCustomDisplayString(cds + "<##>", item, "", false, true);
          return '<meta charset="UTF-8"><body>' + r.replace('<a class="obj" >', "").replace("</a></a>", "</a>") + "</body>";
        },
        getAutomaticDiagram: function (lID, item, width) {
          return new Promise(function (resolve, reject) {
            var diagramViewer = cwAPI.customLibs.diagramViewerByNodeIDAndID[lID + "_" + item.object_id];
            diagramViewer.getImageFromCanvas(null, 5, null, true, function (diagramImage) {
              setTimeout(function () {
                diagramImage.canvas.toBlob(function (blob) {
                  diagramImage.remove();
                  blobToBase64(blob, function (base64) {
                    resolve({
                      width: width,
                      height: (width * diagramViewer.camera.diagramSize.h) / diagramViewer.camera.diagramSize.w,
                      data: base64,
                      extension: ".png",
                    });
                  });
                }, "image/png");
              }, 500);
            });
          });
        },
        getNetwork: function (nodeID, width) {
          let canva = document.querySelector("#cwLayoutNetwork" + nodeID + " canvas");
          let trimmedCanva = cwAPI.customLibs.utils.trimCanvas(canva);
          return new Promise(function (resolve, reject) {
            cwApi.customLibs.utils.getBlobFromCanva(trimmedCanva, function (blob) {
              blobToBase64(blob, function (base64) {
                resolve({
                  width: width,
                  height: (width * trimmedCanva.height) / trimmedCanva.width,
                  data: base64,
                  extension: ".png",
                });
              });
            });
          });
        },
        getDiagram: function (diagram, width) {
          return new Promise(function (resolve, reject) {
            var diagramViewer = cwAPI.customLibs.diagramViewerByNodeIDAndID[diagram.nodeID + "_" + diagram.object_id];
            diagramViewer.getImageFromCanvas(null, 5, null, true, function (diagramImage) {
              setTimeout(function () {
                diagramImage.canvas.toBlob(function (blob) {
                  diagramImage.remove();
                  blobToBase64(blob, function (base64) {
                    resolve({
                      width: width,
                      height: (width * diagramViewer.camera.diagramSize.h) / diagramViewer.camera.diagramSize.w,
                      data: base64,
                      extension: ".png",
                    });
                  });
                }, "image/png");
              }, 500);
            });
          });
        },
      });
    });
  };

  actionOnObjectPage.displayCarrousel = function (config, mainObject) {
    let zone = document.getElementById("zone_" + this.viewName);
    if (zone) {
      let container = document.createElement("div");
      container.className = "singlePageCarrousel";
      zone.insertBefore(container, zone.firstChild);
      cwApi.CwAsyncLoader.load("angular", function () {
        var loader = cwApi.CwAngularLoader;
        loader.setup();
        let templatePath = cwAPI.getCommonContentPath() + "/html/homePage/carrousel.ng.html" + "?" + Math.random();
        loader.loadControllerWithTemplate("homePage", $(".singlePageCarrousel"), templatePath, function ($scope, $sce) {
          $scope.display = config;
          $scope.initCarrousel = function (display) {
            display.slideSelected = 0;
            display.closed = false;
          };

          $scope.nextSlide = function (display) {
            display.slideSelected += 1;
          };

          $scope.previousSlide = function (display) {
            display.slideSelected -= 1;
          };

          $scope.closeSlides = function (display) {
            container.className += " cw-hidden";
          };
        });
      });
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
