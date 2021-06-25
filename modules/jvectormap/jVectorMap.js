/* Copyright � 2012-2017 erwin, Inc. - All rights reserved */

/*global  cwBehaviours, $, cwAPI, jvm*/

(function (cwApi, jvm) {
  "use strict";

  var that, registerMap, reloadMap, loadMap, goToPage, setTooltip, MAX_REGION_COLOR;

  MAX_REGION_COLOR = "#004488";

  cwBehaviours.cwJVectorMap = (function () {
    that = {};
    that.maps = {};
    that.pieChartData = {};

    function setHeight(chart) {
      var height = cwApi.getFullScreenHeight();
      chart.$mDiv.css("height", height);
    }

    function getChart(parentId, properties) {
      var chart;
      chart = {};
      chart.ID = "cw-jvectormap-id-" + parentId;
      chart.$mDiv = $('<div class="cw-jvector-map" id="' + chart.ID + '"></div>');

      setHeight(chart);

      if (properties.PageType === 0) {
        if (properties.ParentNodeID === null) {
          switch (properties.LayoutName) {
            case "list":
            case "enhanced-map-list":
              properties.LayoutName = "list";
              chart.parentDiv = $("ul." + parentId).parent();
              break;
            case "empty":
            case "enhanced-map":
              properties.LayoutName = "empty";
              chart.parentDiv = $("div." + parentId).parent();
              break;
            default:
              chart.parentDiv = $("ul." + parentId).parent();
              properties.LayoutName = "list";
              break;
          }
        } else {
          switch (properties.LayoutName) {
            case "list":
            case "enhanced-map-list":
              properties.LayoutName = "list";
              chart.parentDiv = $("ul." + parentId).parent();
              break;
            case "empty":
            case "enhanced-map":
              properties.LayoutName = "empty";
              chart.parentDiv = $("." + parentId).parent();
              break;
            case "list-box":
              chart.parentDiv = $("div." + properties.NodeID);
              break;
            default:
              chart.parentDiv = $("ul." + parentId).parent();
              properties.LayoutName = "list";
              break;
          }
        }
      } else {
        // single page
        switch (properties.LayoutName) {
          case "list":
          case "enhanced-map-list":
            properties.LayoutName = "list";
            chart.parentDiv = $("li." + properties.NodeID)
              .parent()
              .parent();
            break;
          case "empty":
          case "enhanced-map":
            properties.LayoutName = "empty";
            chart.parentDiv = $("div." + properties.NodeID);
            break;
          case "list-box":
            chart.parentDiv = $("li." + properties.NodeID + "-value");
            break;
          default:
            chart.parentDiv = $("div." + properties.NodeID);
            properties.LayoutName = "empty";
            break;
        }
      }
      chart.parentDiv.addClass("cw-jvectormap-from-" + properties.LayoutName);

      chart.parentDiv.append(chart.$mDiv);
      var height = cwApi.getFullScreenHeight();
      chart.parentDiv.css("height", height);

      chart.container = $("#" + chart.ID);
      return chart;
    }

    function getData(content, properties) {
      var itemsMapping,
        markersMapping,
        regionsValues,
        markersValues,
        items,
        markers,
        item,
        i,
        name,
        isocode,
        latlng,
        latlngArray,
        m,
        res,
        numberOfAssociations,
        targetItems,
        pieData,
        j,
        locChildren,
        sum;

      itemsMapping = {};
      markersMapping = {};
      regionsValues = [];
      markersValues = [];
      items = {};
      markers = [];

      for (i = 0; i < content.length; i += 1) {
        item = content[i];
        name = cwApi.cwSearchEngine.removeSearchEngineZone(item.name);
        isocode = cwApi.cwSearchEngine.removeSearchEngineZone(item.properties[that.IsoCodeProperty]);
        isocode = isocode.toUpperCase();
        targetItems = [];

        // region
        if (isocode && isocode !== "") {
          if (
            properties &&
            properties.LayoutOptions &&
            properties.LayoutOptions.CustomOptions &&
            item.properties[properties.LayoutOptions.CustomOptions["property-mapping"]] !== undefined
          ) {
            items[isocode] = cwAPI.customLibs.utils.getColorFromItemValue(item, properties.LayoutOptions.CustomOptions["property-mapping"]);
          } else {
            items[isocode] = cwAPI.customLibs.utils.getCssStyle(".jvectorBackgroundRegion", "color");
          }

          itemsMapping[isocode] = item;
        }

        //dot
        latlng = cwApi.cwSearchEngine.removeSearchEngineZone(item.properties[that.LatLngProperty]);
        if (latlng && latlng !== "") {
          latlngArray = latlng.split(",");
          m = {
            latLng: [parseFloat(latlngArray[0]), parseFloat(latlngArray[1])],
            name: name,
            code: name,
          };
          markersMapping[markers.length] = item;
          markers.push(m.latLng);
          let c;
          if (
            properties &&
            properties.LayoutOptions &&
            properties.LayoutOptions.CustomOptions &&
            item.properties[properties.LayoutOptions.CustomOptions["property-mapping"]]
          ) {
            c = cwAPI.customLibs.utils.getColorFromItemValue(item, properties.LayoutOptions.CustomOptions["property-mapping"]);
          } else {
            c = cwAPI.customLibs.utils.getCssStyle(".jvectorBackgroundMarker", "color");
          }
          markersValues.push(c);
        }
      }

      res = {};
      res.regions = items;
      res.markers = markers;
      res.regionsMapping = itemsMapping;
      res.markersMapping = markersMapping;
      res.regionsValues = regionsValues;
      res.markersValues = markersValues;
      return res;
    }

    reloadMap = function (id) {
      var chart = that.maps[id];
      chart.map.setSize();
    };

    loadMap = function (nodeId, content, properties, initialMap) {
      var chart, data, map;
      chart = getChart(nodeId, properties);
      data = getData(content, properties);
      that.data = data;
      cwApi.CwCharts.cwChartHelper.pushChartContextAndGetChartWidth(chart.parentDiv, ".cw-jvector-map");
      map = new jvm.WorldMap({
        container: chart.$mDiv,
        map: initialMap,
        regionsSelectable: false,
        backgroundColor: "transparent",
        zoomMax: 60,
        regionStyle: {
          initial: {
            fill: cwAPI.customLibs.utils.getCssStyle(".jvectorBackgroundRegionDefault", "color"),
            stroke: cwAPI.customLibs.utils.getCssStyle(".jvectorBackgroundRegionDefaultStroke", "color"),
          },
        },
        markers: data.markers,
        series: {
          markers: [
            {
              values: data.markersValues,
            },
          ],
          regions: [
            {
              values: data.regions,
            },
          ],
        },
        onRegionClick: function (e, code) {
          var item = data.regionsMapping[code];
          if (!item) return;
          let popOutName = cwApi.replaceSpecialCharacters(item.objectTypeScriptName) + "_diagram_popout";
          if (cwAPI.ViewSchemaManager.pageExists(popOutName) === true) {
            if (cwAPI.customLibs.utils.openDiagramPopoutWithID) cwAPI.customLibs.utils.openDiagramPopoutWithID(item.object_id, popOutName, e);
          } else goToPage(item);
          return e;
        },
        onMarkerClick: function (e, code) {
          var item = data.markersMapping[code];
          if (!item) return;
          let popOutName = cwApi.replaceSpecialCharacters(item.objectTypeScriptName) + "_diagram_popout";
          if (cwAPI.ViewSchemaManager.pageExists(popOutName) === true) {
            if (cwAPI.customLibs.utils.openDiagramPopoutWithID) cwAPI.customLibs.utils.openDiagramPopoutWithID(item.object_id, popOutName, e);
          } else goToPage(item);
          return e;
        },
        //markers: data.markers,
        onRegionLabelShow: function (e, label, code) {
          var item = data.regionsMapping[code];
          if (!item) return;
          var cds = properties.LayoutOptions.CustomOptions["hover"] ? properties.LayoutOptions.CustomOptions["hover"] : "{name}";
          label.html(cwAPI.customLibs.utils.getCustomDisplayString(cds, item));
          return e;
        },
        onMarkerLabelShow: function (e, label, i) {
          var item = data.markersMapping[i];
          if (!item) return;
          var cds = properties.LayoutOptions.CustomOptions["hover"] ? properties.LayoutOptions.CustomOptions["hover"] : "{name}";
          label.html(cwAPI.customLibs.utils.getCustomDisplayString(cds, item));
          return e;
        },
      });

      cwApi.CwCharts.cwChartHelper.popChartContext(chart.parentDiv, ".cw-jvector-map");
      chart.map = map;
      that.maps[chart.ID] = chart;
      $(chart.container)
        .find('path[fill="' + MAX_REGION_COLOR + '"]')
        .attr("cw-selected-zone", true);

      setTimeout(function () {
        chart.map.setSize();
      }, 200); // Wait for menu to disappear then reset the size.
    };

    setTooltip = function (label, item) {
      var o, pieInfo, pieData, sum, legends;
      if (cwApi.isUndefined(item)) {
        return;
      }
      o = [];
      pieInfo = that.pieChartData[item.object_id];
      pieData = pieInfo.pieData;
      sum = pieInfo.sum;
      legends = {};

      o.push(item.name, "</br>");
      if (sum > 0) {
        legends.valueUnit = "$";
        legends.title = "Yearly Support Cost (" + sum + legends.valueUnit + ")";
        legends.id = Math.floor(Math.random() * 1e5);
        o.push('<div class="cw-apm-tooltip-chart" id="cw-chart-', legends.id, '"></div>');
      }
      label.html(o.join(""));
      if (sum > 0) {
        cwApi.cwReporting.cwKendoUIPieChart.createChart(legends, pieData);
      }
    };

    goToPage = function (item) {
      if (!cwApi.isUndefined(item)) {
        var hash;
        hash = cwApi.getSingleViewHash(that.mainObjectTypeScriptName, item.object_id);
        $(".jvectormap-label").remove();
        cwApi.updateURLHash(hash);
      }
    };

    registerMap = function (properties, allItems) {
      var initialMap, items, itemsAssociations, i, item, nodeId, $container;
      nodeId = properties.NodeID;

      if (cwApi.queryObject.isEditMode() || cwApi.isNull(allItems)) {
        $container = $("div." + nodeId);
        cwApi.cwDisplayManager.setNoDataAvailableHtml($container);
        return;
      }

      if (cwApi.queryObject.isEditMode()) {
        return;
      }
      if (cwApi.isUndefined(allItems)) {
        return;
      }

      initialMap = properties.Behaviour.Options["zoom-on-map"];
      that.mainObjectTypeScriptName = properties.ObjectTypeScriptName;
      that.LatLngProperty = properties.Behaviour.Options["latlng-pt"].toLowerCase();
      that.IsoCodeProperty = properties.Behaviour.Options["isocode-pt"].toLowerCase();

      if (properties.PageType === 0) {
        items = allItems[properties.NodeID];
        if (cwApi.isUndefined(items) && properties.ParentNodeID !== null) {
          itemsAssociations = allItems[properties.ParentNodeID];
          for (i = 0; i < itemsAssociations.length; i += 1) {
            item = itemsAssociations[i];
            that.OriginalNodeID = nodeId;
            that.NodeID = properties.NodeID + "-" + item.object_id;
            loadMap(that.NodeID, item.associations[nodeId], properties, initialMap);
          }
        } else {
          loadMap(properties.NodeID, items, properties, initialMap);
        }
      } else {
        items = allItems.associations[properties.NodeID];
        loadMap(properties.NodeID, items, properties, initialMap);
      }
    };
    return {
      reloadMap: reloadMap,
      setup: registerMap,
    };
  })();
})(cwAPI, jvm);
