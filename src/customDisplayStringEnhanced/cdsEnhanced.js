/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";

  var popOutEnableByDefault = true;
  var cdsEnhanced = {};

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
      display;
    if (config) {
      while (itemDisplayName.indexOf("<?") !== -1 && itemDisplayName.indexOf("?>") !== -1) {
        info = itemDisplayName.split("<?")[1].split("?>")[0];
        if (info.indexOf("?") === -1) {
          // no splitter char
          result = "";
        } else {
          split = info.split("?");
          filterString = split[0];
          display = split[1];
          let cwFilter = new cwApi.customLibs.utils.cwFilter();
          cwFilter.initWithString(filterString);
          result = cwFilter.isMatching(item) ? display : "";
        }

        itemDisplayName = itemDisplayName.replace("<?" + info + "?>", result);
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
        while (itemDisplayName.indexOf("<#") !== -1 && itemDisplayName.indexOf("#>") !== -1) {
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
      display;
    if (config) {
      while (itemDisplayName.indexOf("<§") !== -1 && itemDisplayName.indexOf("§>") !== -1) {
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

  cdsEnhanced.getEnhancedDisplayItem = function (config, itemDisplayName, item) {
    itemDisplayName = cdsEnhanced.checkFilters(config, itemDisplayName, item);
    itemDisplayName = cdsEnhanced.getPopoutCds(config, itemDisplayName, item);
    itemDisplayName = cdsEnhanced.getPopoutAssociation(config, itemDisplayName, item);
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

    markedForDeletion = cwApi.isObjectMarkedForDeletion(item) ? " markedForDeletion" : "";
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
})(cwAPI, jQuery);
