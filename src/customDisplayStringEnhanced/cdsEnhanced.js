/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";

  var popOutEnableByDefault = true;
  var cdsEnhanced = {};
  cdsEnhanced.generateFavoriteString = function (item) {
    let output;
    if (cwAPI.customLibs.utils.isObjectFavorite(item.objectTypeScriptName, item.object_id)) {
      output =
        '<span onclick="cwAPI.customLibs.utils.manageObjectFavoriteStatus(' +
        "'" +
        item.objectTypeScriptName +
        "'," +
        item.object_id +
        ',this.firstElementChild,event)"><i class="fa fa-heart"></i></span>';
    } else {
      output =
        '<span onclick="cwAPI.customLibs.utils.manageObjectFavoriteStatus(' +
        "'" +
        item.objectTypeScriptName +
        "'," +
        item.object_id +
        ',this.firstElementChild,event)"><i class="fa fa-heart-o"></i></span>';
    }
    return output;
  };

  cdsEnhanced.generatePopoutString = function (id, popOutName, popOutText) {
    return (
      '<span class="cdsEnhancedDiagramPopOutIcon" onclick="cwAPI.customFunction.openDiagramPopoutWithID(' +
      id +
      ",'" +
      popOutName +
      "',event);\">" +
      popOutText +
      "</span>"
    );
  };

  cdsEnhanced.checkFilters = function (config, itemDisplayName, item) {
    let filterString,
      info,
      split,
      result = "",
      display,
      n = 0;
    if (config) {
      while (itemDisplayName.indexOf("<?") !== -1 && itemDisplayName.indexOf("?>") !== -1 && n < 100) {
        n++;
        info = itemDisplayName.split("<?")[1].split("?>")[0];
        if (info.indexOf("?") === -1) {
          // no splitter char
          result = "";
        } else {
          split = info.split("?");
          filterString = split[0];
          display = split[1];
          let notDisplay = split.length > 2 ? split[2] : "";
          let cwFilter = new cwApi.customLibs.utils.cwFilter();
          cwFilter.initWithString(filterString);
          result = cwFilter.isMatching(item) ? display : notDisplay;
        }

        itemDisplayName = itemDisplayName.replace("<?" + info + "?>", result);
      }
    }

    return itemDisplayName;
  };

  cdsEnhanced.checkFontAwesomeIcon = function (config, itemDisplayName, item) {
    let fa,
      info,
      split,
      result = "",
      color,
      n = 0;
    if (config) {
      while (itemDisplayName.indexOf("<¤") !== -1 && itemDisplayName.indexOf("¤>") !== -1 && n < 100) {
        n++;
        info = itemDisplayName.split("<¤")[1].split("¤>")[0];
        if (info.indexOf("¤") === -1) {
          // no splitter char
          result = '<i class="fa ' + info + '" aria-hidden="true"></i>';
        } else {
          split = info.split("¤");
          fa = split[0];
          color = split[1];
          result = '<i class="fa ' + fa + '" style="color:' + color + '"aria-hidden="true"></i>';
        }

        itemDisplayName = itemDisplayName.replace("<¤" + info + "¤>", result);
      }
    }

    return itemDisplayName;
  };

  cdsEnhanced.checkIcon = function (config, itemDisplayName, item) {
    let n = 0;
    if (config) {
      while (itemDisplayName.indexOf("{") !== -1 && itemDisplayName.indexOf("_icon}") !== -1 && n < 100) {
        let propScriptname = itemDisplayName.split("{")[1].split("_icon}")[0];
        let display = cwApi.cwPropertiesGroups.getDisplayValue(
          item.objectTypeScriptName,
          propScriptname,
          item.properties[propScriptname],
          item,
          "properties",
          true
        );

        itemDisplayName = itemDisplayName.replace("{" + propScriptname + "_icon}", display);
      }
    }

    return itemDisplayName;
  };

  cdsEnhanced.getPopoutCds = function (config, itemDisplayName, item) {
    let popOutText, popOutName, popOutSplit, popOutInfo, popoutElement;
    if (config) {
      if (config.displayPopoutByDefault && itemDisplayName.indexOf("<#") === -1 && itemDisplayName.indexOf("<@") === -1) {
        popOutText = '<i class="' + config.defaultIcon + '" aria-hidden="true"></i>';
        popOutName = cwApi.replaceSpecialCharacters(item.objectTypeScriptName) + "_diagram_popout";
        if (cwAPI.ViewSchemaManager.pageExists(popOutName) === true) {
          itemDisplayName = cdsEnhanced.generatePopoutString(item.object_id, popOutName, popOutText) + "  " + itemDisplayName;
        }
      } else {
        let n = 0;

        while (itemDisplayName.indexOf("<#") !== -1 && itemDisplayName.indexOf("#>") !== -1 && n < 100) {
          n++;
          popOutInfo = itemDisplayName.split("<#")[1].split("#>")[0];
          if (popOutInfo.indexOf("#") === -1) {
            popOutName = popOutInfo;
            popOutText = '<i class="' + config.defaultIcon + '" aria-hidden="true"></i>';
          } else {
            popOutSplit = popOutInfo.split("#");
            popOutName = popOutSplit[1];
            popOutText = popOutSplit[0];
          }
          if (cwAPI.ViewSchemaManager.pageExists(popOutName) === true) {
            popoutElement = cdsEnhanced.generatePopoutString(item.object_id, popOutName, popOutText);
          } else {
            popoutElement = "";
          }
          itemDisplayName = itemDisplayName.replace("<#" + popOutInfo + "#>", popoutElement);
        }
      }
    }
    return itemDisplayName;
  };

  cdsEnhanced.getPopoutAssociation = function (config, itemDisplayName, item) {
    let nodeID,
      info,
      split,
      result = "",
      display,
      n = 0;
    if (config) {
      while (itemDisplayName.indexOf("<§") !== -1 && itemDisplayName.indexOf("§>") !== -1 && n < 100) {
        n++;
        info = itemDisplayName.split("<§")[1].split("§>")[0];
        if (info.indexOf("§") === -1) {
          // simple node ID
          nodeID = info;
          if (item.associations[nodeID] && item.associations[nodeID].length > 0) {
            result = item.associations[nodeID]
              .map(function (a) {
                return a.name;
              })
              .join(", ");
          }
        } else {
          split = info.split("§");
          nodeID = split[0];
          display = split[1];
          if (display === "count") {
            // display number of associations
            result = item.associations[nodeID] ? item.associations[nodeID].length : "";
          } else if (display === "id") {
            // simple node ID
            if (item.associations[nodeID] && item.associations[nodeID].length > 0) {
              result = item.associations[nodeID]
                .map(function (a) {
                  return a.object_id;
                })
                .join(", ");
            }
          } else {
            // display info if more than 1 associations
            result = item.associations[nodeID] && item.associations[nodeID].length > 0 ? display : "";
          }
        }
        itemDisplayName = itemDisplayName.replace("<§" + info + "§>", result);
      }
    }

    return itemDisplayName;
  };

  cdsEnhanced.getTimeStamp = function () {
    let d = new Date();
    return (
      d.getFullYear() +
      ("0" + (d.getMonth() + 1)).slice(-2) +
      ("0" + d.getDate()).slice(-2) +
      ("0" + d.getHours()).slice(-2) +
      ("0" + d.getMinutes()).slice(-2) +
      ("0" + d.getSeconds()).slice(-2)
    );
  };

  cdsEnhanced.getEnhancedDisplayItem = function (config, itemDisplayName, item) {
    itemDisplayName = cdsEnhanced.checkFontAwesomeIcon(config, itemDisplayName, item);
    itemDisplayName = cdsEnhanced.checkIcon(config, itemDisplayName, item);
    itemDisplayName = cdsEnhanced.checkFilters(config, itemDisplayName, item);
    itemDisplayName = itemDisplayName.replace("<&>", cdsEnhanced.generateFavoriteString(item));
    itemDisplayName = cdsEnhanced.getPopoutCds(config, itemDisplayName, item);
    itemDisplayName = cdsEnhanced.getPopoutAssociation(config, itemDisplayName, item);

    itemDisplayName = itemDisplayName.replace("@currentIsoDate", new Date().toISOString());
    itemDisplayName = itemDisplayName.replace("@currentDate", new Date().toLocaleDateString());
    itemDisplayName = itemDisplayName.replace("@currentCwUserName", cwAPI.cwUser.GetCurrentUserFullName());
    itemDisplayName = itemDisplayName.replace("@currentCwUserId", cwAPI.cwUser.getCurrentUserItem().object_id);
    itemDisplayName = itemDisplayName.replace("@currentTimeStamp", cdsEnhanced.getTimeStamp());

    if (itemDisplayName.indexOf("ngDirective") !== -1) itemDisplayName = item.name;
    return itemDisplayName;
  };

  cdsEnhanced.getEnhancedDisplayItemWithoutHTML = function (config, itemDisplayName, item) {
    itemDisplayName = cdsEnhanced.checkFilters(config, itemDisplayName, item);
    itemDisplayName = cdsEnhanced.getPopoutAssociation(config, itemDisplayName, item);

    itemDisplayName = itemDisplayName.replace("@currentIsoDate", new Date().toISOString());
    itemDisplayName = itemDisplayName.replace("@currentDate", new Date().toLocaleDateString());
    itemDisplayName = itemDisplayName.replace("@currentCwUserName", cwAPI.cwUser.GetCurrentUserFullName());
    itemDisplayName = itemDisplayName.replace("@currentCwUserId", cwAPI.cwUser.getCurrentUserItem().object_id);
    itemDisplayName = itemDisplayName.replace("@currentTimeStamp", cdsEnhanced.getTimeStamp());
    return itemDisplayName;
  };

  cdsEnhanced.getDisplayItem = function (item, nameOnly) {
    var itemDisplayName, titleOnMouseOver, link, itemLabel, markedForDeletion, linkTag, linkEndTag;

    let config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("cdsEnhanced");

    // use the display property scriptname
    itemLabel = this.displayProperty.getDisplayString(item);
    link = !cwApi.isUndefined(this.defaultLinkView) ? this.singleLinkMethod(this.defaultLinkView, item) : "";
    titleOnMouseOver =
      this.hasTooltip && !cwApi.isUndefined(item.properties.description)
        ? cwApi.cwEditProperties.cwEditPropertyMemo.isHTMLContent(item.properties.description)
          ? $(item.properties.description).text()
          : item.properties.description
        : "";

    let isInDisplay = document.querySelector(".homePage_evolveView") ? true : false;
    markedForDeletion = cwApi.isObjectMarkedForDeletion(item) ? " markedForDeletion" : "";
    if (isInDisplay) {
      let cleanLabel = itemLabel.includes("<") ? item.name : itemLabel;
      linkTag =
        '<a class="contextClick ' +
        this.nodeID +
        markedForDeletion +
        '" onclick="cwAPI.customLibs.utils.clickSingleContext(event' +
        ",'" +
        item.objectTypeScriptName +
        "'," +
        item.object_id +
        ",'" +
        cleanLabel
          .replace(/<@.*?@>/, "")
          .replace(/<#.*?#>/, "")
          .replaceAll("(", "\\(")
          .replaceAll(")", "\\)")
          .replaceAll('"', '\\"')
          .replaceAll("'", "\\'") +
        "'" +
        ')" >';
      linkEndTag = "</a>";
      itemDisplayName = linkTag + itemLabel + linkEndTag;
    } else {
      if (this.options.HasLink === false) {
        if (itemLabel.indexOf("<@") !== -1 && itemLabel.indexOf("\\<@") === -1) {
          itemLabel = itemLabel.replace(/<@/g, "").replace(/@>/g, "");
        }
        itemDisplayName = "<span class='" + this.nodeID + markedForDeletion + "' title=\"" + titleOnMouseOver + '">' + itemLabel + "</span>";
      } else {
        linkTag = "<a class='" + this.nodeID + markedForDeletion + "' href='" + link + "'>";
        linkEndTag = "</a>";
        if (itemLabel.indexOf("<@") !== -1 && itemLabel.indexOf("\\<@") === -1) {
          itemDisplayName = itemLabel.replace(/<@/g, linkTag).replace(/@>/g, linkEndTag);
        } else {
          itemDisplayName = linkTag + itemLabel + linkEndTag;
        }
      }
    }

    itemDisplayName = cdsEnhanced.getEnhancedDisplayItem(config, itemDisplayName, item);

    itemDisplayName = '<a class="obj" >' + itemDisplayName + "</a>";

    $("span").attr("data-children-number");

    if (!cwApi.isUndefined(nameOnly) && nameOnly === true) {
      itemDisplayName = "<label class='" + this.nodeID + "'>" + itemLabel + "</label>";
    }
    return itemDisplayName;
  };

  if (cwAPI.customFunction === undefined) cwAPI.customFunction = {};
  cwApi.customFunction.openDiagramPopoutWithID = function (id, popOutName, evt) {
    var obj = {};
    if (evt) {
      evt.preventDefault();
      evt.stopImmediatePropagation();
    }
    obj.object_id = id;
    cwAPI.cwDiagramPopoutHelper.openDiagramPopout(obj, popOutName);
  };

  cwBehaviours.cwAccordion.prototype.implementSelector = function (searching) {
    var that, cwAccordionChildObject, aTag, cssClass, html;
    that = this;

    $("div." + that.selector).each(function (i, div) {
      /*jslint unparam:true*/

      function addPlusOrMinusImage() {
        aTag = $(div).children("a.obj");

        //Dont add any buttons if no content inside
        if (that.hasChildren(div)) {
          if (!that.collapseByDefault) {
            cssClass = that.expand;
          } else {
            cssClass = that.collapse;
          }
          //Check if Set Link is checked or not checked
          if (aTag.length > 0) {
            aTag.before(cssClass);
          } else {
            $(div).children("span").before(cssClass);
          }
        }
      }

      $(div).next().find("ul:not(:has(li))").remove();

      html = $(div).next().html();
      if (!cwApi.isUndefined(html) && html.length === 0) {
        $(div).next().remove();
      }
      if (!cwApi.isUndefined(that.removeIfEmptyChildren) && that.removeIfEmptyChildren && !searching) {
        // if there is no children
        if ($(div).parent().children().length === 1) {
          $(div).parent().remove();
        }
      }
      if ($(div).next().find(".cw-visible").length > 0) {
        //$(div).children('a').before(that.collapse);
        addPlusOrMinusImage();

        cwAccordionChildObject = new cwBehaviours.cwAccordionChild(this, that.collapseClass, that.expandClass);

        $(div).click(cwAccordionChildObject.mouseClick.bind(cwAccordionChildObject));
        $(div).hover(cwAccordionChildObject.hoverMethod.bind(cwAccordionChildObject));
      } else {
        //$(div).children('a').before(that.expand);
        addPlusOrMinusImage();
      }
    });
  };

  cwApi.cwLayouts.CwLayout.prototype.getDisplayItem = cdsEnhanced.getDisplayItem;
  cwApi.cwLayouts.CwLayout.prototype.getEnhancedDisplayItem = cdsEnhanced.getEnhancedDisplayItem;
  cwApi.cwLayouts.CwLayout.prototype.getEnhancedDisplayItemWithoutHTML = cdsEnhanced.getEnhancedDisplayItemWithoutHTML;
})(cwAPI, jQuery);
