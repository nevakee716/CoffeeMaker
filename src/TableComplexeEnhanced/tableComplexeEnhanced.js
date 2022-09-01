/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";

  var tableComplexeEnhanced = {};
  tableComplexeEnhanced.cwKendoGrid = {};
  tableComplexeEnhanced.cwKendoGridToolBar = {};
  tableComplexeEnhanced.cwKendoGridData = {};

  var kendoGridDataSaved = {};

  // remove the special column of the table complexe and replace after the switch
  var clearColumn = function (columns, config) {
    var columnCleared = [];

    var result = {
      iUpdate: undefined,
      iCreate: undefined,
      columnCleared: columnCleared,
    };
    let firstColumnToFroze = false;
    for (let cl in config) {
      if (config.hasOwnProperty(cl) && config[cl].frozen) {
        firstColumnToFroze = true;
        break;
      }
    }
    for (i = 0; i < columns.length; i++) {
      if (columns[i].title === "CanCreate" && columns[i].field === "type_id_cancreate") {
        result.Create = i;
      } else if (columns[i].title === "CanUpdate" && columns[i].field === "type_id_canupdate") {
        result.Update = i;
      } else if (columns[i].title === "Options" && columns[i].field === undefined) {
        result.Options = i;
        if (i == 0) {
          columns[i].locked = firstColumnToFroze;
        }
      } else if (columns[i].title === "ID" && columns[i].field === "id") {
        result.ID = i;
      } else {
        columnCleared.push(columns[i]);
      }
    }
    return result;
  };

  var reOrderColumn = function (columns, config, columnConfig) {
    var columnsObj = {};
    var i;
    for (i = 0; i < columns.length; i++) {
      if (columnConfig.hasOwnProperty(i + 1)) {
        if (columnConfig[i + 1].size) columns[i].width = columnConfig[i + 1].size; // gestion size
        if (columnConfig[i + 1].name) columns[i].title = columnConfig[i + 1].name; // gestion rename
        if (columnConfig[i + 1].frozen) columns[i].locked = columnConfig[i + 1].frozen; // freeze
        // custom order
        if (columnConfig[i + 1].order) columnsObj[columnConfig[i + 1].order - 1] = columns[i];
        else columnsObj[i] = columns[i];
      } else {
        columnsObj[i] = columns[i];
      }
    }
    return columnsObj;
  };

  var reBuildColumn = function (columnsObj, iObject, columnsOrig) {
    var result = [];
    var shift = 0;

    for (i = 0; i < columnsOrig.length; i++) {
      if (i === iObject.Update || i === iObject.Create || i === iObject.Options || i === iObject.ID) {
        result.push(columnsOrig[i]);
        shift = shift + 1;
      } else if (columnsObj.hasOwnProperty(i - shift)) {
        result.push(columnsObj[i - shift]);
      } else {
        return columnsOrig;
      }
    }
    return result;
  };

  // swap the colum of the table; also add filter for association
  var columnModifier = function (columns, nodeID, datasource) {
    var columnsObj = {};
    var result = [];
    var i;
    var clearColumnResult;
    var columnCleared = [];

    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("tableComplexeEnhanced");
    }
    if (!config) return columns;

    if (config.popOut) {
      if (columns[0].title == "Options") columns[0].width += 35;
      if (columns[columns.length - 1].title == "Options") columns[columns.length - 1].width += 35;
    }

    if (config.favorite) {
      if (columns[0].title == "Options") columns[0].width += 35;
      if (columns[columns.length - 1].title == "Options") columns[columns.length - 1].width += 35;
    }

    result = columns;
    if (config.nodes && config.nodes[nodeID] && config.nodes[nodeID].columns) {
      let configColumn = config.nodes[nodeID].columns;
      clearColumnResult = clearColumn(columns, config.nodes[nodeID].columns);
      columnsObj = reOrderColumn(clearColumnResult.columnCleared, config, configColumn);
      result = reBuildColumn(columnsObj, clearColumnResult, columns);
      if (result === null) {
        result = columns;
      } else {
        result = result;
      }
    }

    if (config.nodes && config.nodes[nodeID] && config.nodes[nodeID].removeOptionColumn) {
      if (result[0].title == "Options") result.shift();
      if (result[result.length - 1].title == "Options") result.pop();
    }

    return result;
  };

  // Apply ratio to the height
  var calcHeight = function (height, nodeID) {
    let config;
    if (window.getComputedStyle(document.body).backgroundColor != "rgb(255, 255, 255)") {
      //height = height - 1.5 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    var isInDisplay = document.querySelector(".homePage_evolveView") ? true : false;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("tableComplexeEnhanced");
      if (isInDisplay) {
        height = document.querySelector(".empty.cw-list." + nodeID).parentElement.offsetHeight;
      } else if (config && config.nodes && config.nodes[nodeID] && config.nodes[nodeID].heightPercent) {
        return (height * config.nodes[nodeID].heightPercent) / 100;
      }
    }
    return height;
  };

  var sendIndexContext = function (nodeID, contextIds) {
    var isInDisplay = document.querySelector(".homePage_evolveView") ? true : false;
    if (isInDisplay) {
      let displayId = document.querySelector(".empty.cw-list." + nodeID).parentElement.parentElement.parentElement.parentElement.id;
      cwApi.customLibs.utils.sendIndexContext(displayId, contextIds);
    }
  };

  tableComplexeEnhanced.cwKendoGrid.modifyAssociationFilter = function () {
    var self = this;
    self.associationsColumnList = [];
    this.columns.forEach(function (c) {
      if (c.isAssociationColumn) {
        let items = ["caramel" + c.field];
        self.associationsColumnList.push(c.field);
        self.items.forEach(function (item) {
          item.associations[c.field].forEach(function (a) {
            if (items.indexOf(a.label) === -1) items.push(a.label);
          });
        });
        self.gridItems.forEach(function (gi) {
          if (gi[c.field] == "") gi[c.field] = "caramel" + c.field;
        });
        c.filterable.dataSource = items.map(function (i) {
          let r = {};
          r[c.field] = i;
          return r;
        });
      }
    });
  };

  tableComplexeEnhanced.cwKendoGrid.setAnGetKendoGridData = function (dataSource) {
    this.columns = columnModifier(this.columns, this.nodeSchema.NodeID, dataSource);
    this.modifyAssociationFilter();
    let config,
      groupable,
      itemPerPages = [5, 10, 50, 100];
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("tableComplexeEnhanced");
    }
    if (config && config.itemPerPages) {
      itemPerPages = config.itemPerPages.split(",");
    }
    if (config && config.groupable) {
      groupable = {
        messages: {
          empty: $.i18n.prop("grid_drop_column"),
        },
      };
    }

    var kendoGridData = {
      dataSource: dataSource,
      dataBound: this.getDataBoundEvent(),
      dataBinding: this.customDataBinding.bind(this),
      resizable: true,
      editable: {
        mode: this.getEditableString(),
        confirmation: false,
        window: {
          title: $.i18n.prop("grid_popup_edit"),
        },
      },
      pageable: {
        refresh: false,
        pageSizes: itemPerPages,
        buttonCount: 5,
      },
      page: this.enableFilterIcon.bind(this),
      filter: tableComplexeEnhanced.cwKendoGrid.enableFilter.bind(this),
      edit: this.editEvent.bind(this),
      scrollable: true,
      sortable: {
        virtual: true,
      },
      groupable: groupable,
      height: calcHeight(this.getHeight(), this.nodeSchema.NodeID), // changing height by factor
      remove: this.remove.bind(this),
      filterable: cwApi.cwKendoGridFilter.getFilterValues(),
      filterMenuOpen: tableComplexeEnhanced.cwKendoGrid.getFilterMenuOpen.bind(this),
      toolbar: cwApi.CwKendoGridToolBar.getToolBarItems(
        this.isAssociationgrid,
        this.enableAdd,
        this.canCreate,
        this.canCreateIntersection,
        this.properties.ObjectTypeScriptName,
        this.hasMandatoryAssociation,
        this.properties.Behaviour.Options,
        this.nodeSchema
      ),
      columns: this.columns,
    };

    if (!config || !config.title) {
      var obj = {
        name: "Title",
        template: '<div style="margin-left: 3rem; font-size: 1.5em; text-align: left; flex-grow:1">' + this.nodeSchema.NodeName + "</div>",
      };
      kendoGridData.toolbar.push(obj);
    }
    kendoGridDataSaved = kendoGridData;
    return kendoGridData;
  };

  tableComplexeEnhanced.cwKendoGridToolBar.getToolBarItems = function (
    isAssociation,
    isAddEnabled,
    canCreate,
    canCreateIntersection,
    objectTypeScriptName,
    hasMandatoryAssociation,
    gridOptions,
    nodeShema
  ) {
    var toolBarObject, itemList;
    toolBarObject = new cwApi.CwKendoGridToolBar(
      isAssociation,
      isAddEnabled,
      canCreate,
      canCreateIntersection,
      objectTypeScriptName,
      hasMandatoryAssociation,
      gridOptions,
      nodeShema
    );
    itemList = [];

    if (cwApi.CwPrintManager.isPrintMode()) {
      return itemList;
    }

    toolBarObject.varifyAndAppendAddSearchButtons(itemList);
    toolBarObject.varifyAndAppendExportButton(itemList);
    toolBarObject.varifyAndAppendClearFilterButton(itemList);
    return itemList;
  };

  tableComplexeEnhanced.cwKendoGridToolBar.varifyAndAppendClearFilterButton = function (itemList) {
    //no export button on pop up inex page grid
    if (((this.pageViewType === "index" && !this.isAssociation) || this.pageViewType === cwApi.CwPageType.Single) && !cwApi.isIE9()) {
      itemList.push(this.getClearFilterButton());
    }
  };

  tableComplexeEnhanced.cwKendoGridToolBar.getClearFilterButton = function () {
    let template = '<a class="k-button k-button-icontext k-grid-clearFilter"><i class="fa fa-filter"></i>' + $.i18n.prop("clearButtonName") + "</a>";
    return {
      name: "clearFilter",
      template: template,
    };
  };

  function createandGetIntersectionGrid(mainItems, properties, allitems, nodeSchema) {
    var mainItemsWithKey, gridObject, iObjectTypeScriptName;
    mainItemsWithKey = {};
    mainItemsWithKey[properties.NodeID] = mainItems;
    iObjectTypeScriptName = nodeSchema.iObjectTypeScriptName;
    if (iObjectTypeScriptName !== null) {
      iObjectTypeScriptName = iObjectTypeScriptName.toLowerCase();
    }
    gridObject = new cwBehaviours.CwKendoGridIntersectionObject(
      properties,
      mainItemsWithKey,
      allitems,
      iObjectTypeScriptName,
      nodeSchema.ObjectTypeScriptName.toLowerCase(),
      nodeSchema,
      nodeSchema.AssociationTypeScriptName.toLowerCase()
    );
    return gridObject;
  }

  tableComplexeEnhanced.cwKendoGrid.setup = function (properties, allitems, isSearchEngineEnabled) {
    cwApi.CwPendingEventsManager.setEvent("GridSetup");
    var dataSource, gridObject, nodeSchema, mainItems, isIntersection, propertyGroupString, $container;

    if (cwApi.isNull(allitems)) {
      $container = $("div." + properties.NodeID);
      cwApi.cwDisplayManager.setNoDataAvailableHtml($container);
      cwApi.CwPendingEventsManager.deleteEvent("GridSetup");
      return;
    }

    nodeSchema = cwApi.ViewSchemaManager.getNodeSchemaById(properties.PageName, properties.NodeID);
    isIntersection = properties.Behaviour.Options.is_intersection;
    propertyGroupString = "propertiesGroups";

    if (isIntersection) {
      propertyGroupString = "iPropertiesGroups";
      mainItems = allitems.associations[properties.NodeID];
      gridObject = createandGetIntersectionGrid(mainItems, properties, allitems, nodeSchema);
    } else if (properties.PageType === 1) {
      mainItems = allitems.associations[properties.NodeID];
      gridObject = createandGetIntersectionGrid(mainItems, properties, allitems, nodeSchema);
    } else {
      mainItems = allitems[properties.NodeID];
      gridObject = new cwBehaviours.CwKendoGrid(properties, allitems, nodeSchema);
    }

    gridObject.loadItemsByPageType(mainItems, properties.NodeID);

    if (!isIntersection) {
      propertyGroupString = "BOTH";
    }

    //if (gridObject.items.length > 0 && !isIntersection) {
    if (gridObject.items.length > 0) {
      //propertyGroupString = "BOTH";
      gridObject.loadHeader(propertyGroupString, nodeSchema, true);
    } else {
      nodeSchema.objectTypeScriptName = nodeSchema.ObjectTypeScriptName.toLowerCase();
      gridObject.loadHeaderForNoAssications(propertyGroupString, nodeSchema, true, properties.NodeID, isIntersection);
    }

    gridObject.isSearchEngineEnabled = isSearchEngineEnabled;
    dataSource = gridObject.loadData(propertyGroupString);

    kendo.culture(cwApi.cwConfigs.SelectedLanguage);
    cwApi.CwNumberSeparator.setupNumberSeperatorForKendoUi();

    gridObject.loadGrid(dataSource);

    gridObject.enableClearFilter();

    dataSource._filter = cwApi.upgradedParseJSON(cwApi.CwLocalStorage.getGridFilterValues(properties.NodeID));
    dataSource.filter(dataSource._filter);
    gridObject.completeAssociationColumnFilter(dataSource);

    cwApi.cwKendoGridFilter.addFilterTitle(gridObject.mainContainer);
    cwApi.gridStorage.push(gridObject);
    cwApi.CwPendingEventsManager.deleteEvent("GridSetup");

    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("tableComplexeEnhanced");
      if (config && config.clearFilterAtStart) {
        gridObject.ClearFilter();
      }
    }

    var tabHidden;
    let gridContainer = $("." + properties.NodeID + ".k-grid");
    var parentTable = gridContainer.parents("div.tab-content");
    if (parentTable.length !== 0) {
      var i = setInterval(function () {
        tabHidden = parentTable.css("visibility") == "hidden";
        if (!tabHidden) {
          clearInterval(i);
          var grid = gridContainer.data("kendoGrid");
          if (grid && grid.refresh) grid.refresh();
        }
      }, 1000);
    } else {
      window.setTimeout(function () {
        var grid = gridContainer.data("kendoGrid");
        if (grid && grid.refresh) grid.refresh();
      }, 1000);
    }
  };

  tableComplexeEnhanced.cwKendoGrid.enableClearFilter = function (container) {
    $("." + this.nodeSchema.NodeID + " .k-grid-clearFilter").click(this.ClearFilter.bind(this));
  };

  tableComplexeEnhanced.cwKendoGrid.ClearFilter = function () {
    try {
      var datasource = $("." + this.nodeSchema.NodeID + ".k-grid").data("kendoGrid").dataSource;
      //Clear filters:
      datasource.filter([]);
      var self = this;
      setTimeout(function () {
        var dataSource = $("." + self.nodeSchema.NodeID + ".k-grid").data("kendoGrid").dataSource;
        var filters = dataSource.filter();
        var allData = dataSource.data();
        var query = new kendo.data.Query(allData);
        var data = query.filter(filters).data;
        sendIndexContext(
          self.nodeSchema.NodeID,
          data.map(function (d) {
            return d.id;
          })
        );
      }, 1000);
    } catch (e) {}
  };

  tableComplexeEnhanced.cwKendoGrid.enableFilter = function (e) {
    let self = this;

    setTimeout(function () {
      var dataSource = $("." + self.nodeSchema.NodeID + ".k-grid").data("kendoGrid").dataSource;
      var filters = dataSource.filter();
      var allData = dataSource.data();
      var query = new kendo.data.Query(allData);
      var data = query.filter(filters).data;
      sendIndexContext(
        self.nodeSchema.NodeID,
        data.map(function (d) {
          return d.id;
        })
      );
    }, 1000);

    if (this.associationsColumnList.indexOf(e.field) !== -1 && e.filter) {
      e.filter.filters.forEach(function (f) {
        f.operator = "contains";
      });
      if (e.filter.filters.length > 0) {
        setTimeout(function () {
          $("." + self.nodeSchema.NodeID + " th[data-field='" + e.field + "'] a.k-grid-filter").addClass("k-state-active");
        }, 500);
      }
    }
    // refresh other association filter icon
    this.enableFilterIcon(e.field);
  };

  tableComplexeEnhanced.cwKendoGrid.enableFilterIcon = function (field) {
    let self = this;
    var dataSource = $("." + this.nodeSchema.NodeID + ".k-grid").data("kendoGrid").dataSource;
    if (dataSource && dataSource.filter() && dataSource.filter().filters) {
      dataSource.filter().filters.forEach(function (f) {
        try {
          let filter = f.value || f.value == "" ? f : f.filters[0];
          if (self.associationsColumnList.indexOf(filter.field) !== -1 && filter.field !== field) {
            setTimeout(function () {
              $("." + self.nodeSchema.NodeID + " th[data-field='" + filter.field + "'] a.k-grid-filter").addClass("k-state-active");
            }, 500);
          }
        } catch (e) {}
      });
    }
  };

  tableComplexeEnhanced.cwKendoGrid.getFilterMenuOpen = function (e) {
    let self = this;
    if (e.sender.dataSource.filter()) {
      e.sender.dataSource.filter().filters.forEach(function (f) {
        if (self.associationsColumnList.indexOf(e.field) !== -1) {
          try {
            let filter = f.value ? f : f.filters[0];
            let value = filter.value.replace ? filter.value.replace("'", "\\'").replace('"', '\\"') : filter.value;
            var checkbox = e.container.find("input[value='" + value + "']");
            if (checkbox[0] && !checkbox[0].checked) {
              e.container.find("input[value='" + value + "']").click();
            }
          } catch (e) {}
        }
      });
    }
  };

  tableComplexeEnhanced.cwKendoGrid.completeAssociationColumnFilter = function (dataSource) {
    let self = this;
    if (dataSource.filter == null || dataSource.filter() == null) return;
    dataSource.filter().filters.forEach(function (f) {
      if (self.associationsColumnList.indexOf(f.field) !== -1) {
        setTimeout(function () {
          $("." + self.nodeSchema.NodeID + " th[data-field='" + f.field + "'] a.k-grid-filter").addClass("k-state-active");
        }, 500);
      }
    });
  };

  //Vrai Faux
  cwBehaviours.CwKendoGridBooleanType.prototype.getColumnTemplate = function () {
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("property");
    }
    if (!config || !config.booleanIcon) {
      return "#= data." + this.property.scriptName + " ? '" + $.i18n.prop("global_true") + "' : '" + $.i18n.prop("global_false") + "' #";
    } else {
      return (
        "#= data." +
        this.property.scriptName +
        " ? '" +
        '<i style="color:green" class="fa fa-check" aria-hidden="true"></i>' +
        "' : '" +
        '<i style="color:red" class="fa fa-times" aria-hidden="true"></i>' +
        "' #"
      );
    }
  };

  // number display
  cwBehaviours.CwKendoGridIntegerType.prototype.getDisplayNumber = function (dataItem) {
    let result, config;
    if (!dataItem || !dataItem.item) return;
    let value = dataItem[this.property.scriptName];
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("property");
    }
    if (config) {
      if (config[dataItem.item.objectTypeScriptName] && config[dataItem.item.objectTypeScriptName][this.property.scriptName]) {
        config = config[dataItem.item.objectTypeScriptName][this.property.scriptName];
      } else if (config && config.hardcoded && config.hardcoded.length > 0) {
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
    } else config = null;

    return cwApi.cwPropertiesGroups.types.numericValue(value, config);
  };

  cwBehaviours.CwKendoGridIntegerType.prototype.getColumnTemplate = function () {
    /* if (this.property.type === "Integer") {
      return "#= kendo.toString(data." + this.property.scriptName + ",'n0')#";
    } else {
      return "#= kendo.toString(data." + this.property.scriptName + ",'n')#";
    }*/
    var self = this;
    return function (dataItem) {
      return self.getDisplayNumber(dataItem);
    };
  };

  //lookup display
  cwBehaviours.CwKendoGridLookupType.prototype.getDisplayLookup = function (dataItem) {
    let result, config;

    let value = dataItem[this.property.scriptName];
    let lookupID = dataItem[this.property.scriptName + "_id"];

    if (!dataItem || !dataItem.item) return;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("property");
    }
    if (config) {
      if (config[dataItem.item.objectTypeScriptName] && config[dataItem.item.objectTypeScriptName][this.property.scriptName]) {
        config = config[dataItem.item.objectTypeScriptName][this.property.scriptName];
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
    } else config = null;

    return cwApi.cwPropertiesGroups.types.lookupValue(value, lookupID, config);
  };

  cwBehaviours.CwKendoGridLookupType.prototype.getColumnTemplate = function () {
    var self = this;
    return function (dataItem) {
      return self.getDisplayLookup(dataItem);
    };
  };

  // popout button
  tableComplexeEnhanced.cwKendoGridData.editTemplate = function (e) {
    var output = [];
    var popOutName,
      self = this;

    function getEditColumnTemplate(isHidden, addEdit, addDelete, addRemove, isAssociation) {
      output.push(cwApi.cwKendoGridButtons.getActionZoneDiv(isHidden));
      if (isOpenButtonAvailable(isAssociation)) {
        output.push(cwApi.cwKendoGridButtons.getOpenButton());
      }
      if (addEdit) {
        output.push(cwApi.cwKendoGridButtons.getEdiButton());
      }
      if (addRemove) {
        output.push(cwApi.cwKendoGridButtons.getRemoveButton());
      }
      if (addDelete) {
        output.push(cwApi.cwKendoGridButtons.getDeleteButton());
      }

      // adding popout
      let config;
      if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
        config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("tableComplexeEnhanced");
      }

      if (config && config.popOut && e.item && e.item.nodeID) {
        if (config.nodes && config.nodes[e.item.nodeID] && config.nodes[e.item.nodeID].popOutName)
          popOutName = cwApi.replaceSpecialCharacters(config.nodes[e.item.nodeID].popOutName);
        else {
          popOutName = cwApi.replaceSpecialCharacters(e.item.objectTypeScriptName) + "_diagram_popout";
        }
        if (cwAPI.ViewSchemaManager.pageExists(popOutName) === true) {
          output.push(tableComplexeEnhanced.getPopOutButton(e, popOutName));
        }
      }

      if (config && config.favorite) {
        output.push(tableComplexeEnhanced.getFavButton(e));
      }

      output.push(cwApi.cwKendoGridButtons.getCloseDiv());
      return output.join("");
    }

    function isOpenButtonAvailable(isAssociation) {
      if (isAssociation) {
        return cwApi.getQueryStringObject().cwtype === cwApi.CwPageType.Single;
      }
      return true;
    }

    function isUserCanUpdate(e) {
      return e.enableEdit && ((e.canUpdate && !cwApi.cwUser.isCurrentUserSocial()) || cwApi.isUndefined(e.canUpdate));
    }

    function isUserCanDelete(e) {
      return e.enableDelete && ((e.canDelete && !cwApi.cwUser.isCurrentUserSocial()) || cwApi.isUndefined(e.canDelete));
    }

    function isUserCanRemoveAssociation(e, isAssociation) {
      if (isAssociation) {
        return e.enableUnlink && !cwApi.cwUser.isCurrentUserSocial() && (e.canCreateIntersection || cwApi.isUndefined(e.canCreateIntersection));
      }
      return false;
    }

    if ($(".form-edit").length > 0) {
      return getEditColumnTemplate(
        true,
        isUserCanUpdate(e),
        isUserCanDelete(e),
        isUserCanRemoveAssociation(e, this.isAssociationgrid),
        this.isAssociationgrid
      );
    }

    if (cwApi.isLive()) {
      return getEditColumnTemplate(
        false,
        isUserCanUpdate(e),
        isUserCanDelete(e),
        isUserCanRemoveAssociation(e, this.isAssociationgrid),
        this.isAssociationgrid
      );
    }
    return getEditColumnTemplate(false, false, false, false, this.isAssociationgrid);
  };

  tableComplexeEnhanced.getPopOutButton = function (e, popOutName) {
    var output = "";
    output =
      '<a class="k-button k-button-icontext k-grid-popoutitem" onclick="cwAPI.customFunction.openDiagramPopoutWithID(' +
      "'" +
      e.item.object_id +
      "','" +
      popOutName +
      "'" +
      ')"><i class="fa fa-external-link"></i>' +
      "</a>";
    return output;
  };

  tableComplexeEnhanced.getFavButton = function (e) {
    var output = "";
    if (!e || !e.item) return;
    if (cwAPI.customLibs.utils.isObjectFavorite(e.item.objectTypeScriptName, e.item.object_id)) {
      output =
        '<a class="k-button k-button-icontext k-grid-popoutitem" onclick="cwAPI.customLibs.utils.manageObjectFavoriteStatus(' +
        "'" +
        e.item.objectTypeScriptName +
        "'," +
        e.item.object_id +
        ",null,this.firstElementChild" +
        ')"><i class="fa fa-heart"></i>' +
        "</a>";
    } else {
      output =
        '<a class="k-button k-button-icontext k-grid-popoutitem" onclick="cwAPI.customLibs.utils.manageObjectFavoriteStatus(' +
        "'" +
        e.item.objectTypeScriptName +
        "'," +
        e.item.object_id +
        ",this.firstElementChild" +
        ')"><i class="fa fa-heart-o"></i>' +
        "</a>";
    }

    return output;
  };

  cwApi.cwKendoGridColumnManager.loadColumnProperties = function (
    properties,
    propertyObject,
    objecttypeScriptName,
    isId,
    isAssociationColumn,
    isCategoryColumn,
    size
  ) {
    var columnManager;
    columnManager = new cwApi.cwKendoGridColumnManager(propertyObject.field, propertyObject.title);
    columnManager.setColumnWidth(size);
    columnManager.isAssociationColumn = isAssociationColumn;
    if (!isId && !isAssociationColumn) {
      columnManager.setColumnTemplate(propertyObject);
      columnManager.setValues(propertyObject, objecttypeScriptName, isCategoryColumn);
      columnManager.setEditor(propertyObject);
      columnManager.setVisibility(isCategoryColumn);
      columnManager.filterable = {
        operators: {
          string: {
            contains: $.i18n.prop("grid_filter_contains"),
            contains: $.i18n.prop("grid_filter_contains"),
            doesnotcontain: $.i18n.prop("grid_filter_donotcontains"),
            startswith: $.i18n.prop("grid_filter_startwith"),
            eq: $.i18n.prop("grid_filter_eq"),
            isempty: $.i18n.prop("grid_filter_empty"),
          },
        },
      };
      if (propertyObject.property.type === "Integer") {
        columnManager.setFormat("{0:n0}");
      } else if (propertyObject.property.type === "Date") {
        columnManager.setFormat("{0:" + cwApi.dateFormatKendo + "}");
      } else if (propertyObject.property.type === "Lookup") {
        columnManager.filterable = { multi: true };
      }
    }
    if (isAssociationColumn) {
      var commonCheckboxTemplate = function (e) {
        //value='#=(data.${e.field}? data.${e.field}:all)#'><span>#=

        return `<div><label><input type="checkbox" name="#= data.${e.field}#" value="#= data.all || (data.${e.field}?data.${e.field}: '')#"><span>#= data.all || (data.${e.field} != 'caramel${e.field}' ?data.${e.field}: 'No Value') # </span></label></div>`;
      };
      columnManager.filterable = {
        multi: true,
        itemTemplate: commonCheckboxTemplate,
        search: true,
        operators: {
          string: {
            contains: $.i18n.prop("grid_filter_contains"),
          },
        },
      };
    }
    if (propertyObject.field === "name") {
      columnManager.filterable = {
        extra: false,
        operators: {
          string: {
            contains: $.i18n.prop("grid_filter_contains"),
            doesnotcontain: $.i18n.prop("grid_filter_donotcontains"),
            startswith: $.i18n.prop("grid_filter_startwith"),
            eq: $.i18n.prop("grid_filter_eq"),
          },
        },
      };
    }

    return columnManager;
  };

  tableComplexeEnhanced.createHeader = function (property, objectTypeScriptName, isIProperty) {
    var propertyObject, idPropertyObject;
    if (property.scriptName === "id") {
      idPropertyObject = {
        field: "Object_ID",
        title: "Id",
      };
      this.createHeaderCommon(objectTypeScriptName, property, isIProperty, idPropertyObject, true, false, false, "Object_ID");
    } else if (property.type === "Lookup") {
      this.createHeaderLookup(property, objectTypeScriptName, isIProperty);
    } else {
      propertyObject = this.loadPropertyTypeObject(property);
      this.createHeaderCommon(objectTypeScriptName, property, isIProperty, propertyObject, false, false, false, property.scriptName);
    }
  };

  cwBehaviours.CwKendoGridDetail.prototype.optionColumn = function (container) {
    let c;
    if (this.isOptionColumnAtStart()) {
      c = container.find("td[role='gridcell']:first .k-action-zone").parent();
    } else {
      c = container.find("td[role='gridcell']:last .k-action-zone").parent();
    }
    if (c.length > 0) return c;
    if (this.isOptionColumnAtStart()) {
      return container.find("td[role='gridcell']:first ");
    } else {
      return container.find("td[role='gridcell']:last ");
    }
  };

  cwApi.CwKendoGridToolBar.prototype.varifyAndAppendExportButton = function (itemList) {
    //no export button on pop up inex page grid
    var isInDisplay = document.querySelector(".homePage_evolveView") ? true : false;
    if (((this.pageViewType === "index" && !this.isAssociation) || this.pageViewType === cwApi.CwPageType.Single || isInDisplay) && !cwApi.isIE9()) {
      itemList.push(this.getExportButton());
    }
  };

  // Fixing issue with edit page when there is a collapsible listbox inside a complexe table
  cwApi.cwEditProperties.cwEditPropertyManagerAssociations.prototype.setMandatoryAssociationDOM = function (nodeId, associationBox) {
    var associationType = cwApi.getAssociationType(nodeId);
    if (associationType && associationType.isMandatoryAssociation) {
      var element = associationBox.find(".cw-property-title-displayname");
      var initialValue = element.text();
      element.text(initialValue + "*");
    }
  };

  // export in display
  cwApi.cwKendoGridDataManager.getDataSourceForUpdatedObjects = function (gridObject, gridTemp, isExport, filters, callback, isExportMode) {
    var dataSource, url, mainItems, propertiesGroup, newGridObject, pageName, currentView, objectId, indexView;

    let isInDisplay = document.querySelector(".homePage_evolveView") ? true : false;
    if (isInDisplay) {
      let display = gridTemp[0].parentElement.parentElement.parentElement.parentElement;
      pageName = display.attributes["data-view"].value;

      if (display.attributes["data-type"].value != "evolve_view") {
        objectId = display.attributes["data-object_id"].value;
        url = cwApi.getSingleViewDataUrl(pageName, objectId);
        indexView = false;
      } else {
        url = cwApi.getIndexViewDataUrl(pageName);
        indexView = true;
      }
    } else {
      currentView = cwApi.getCurrentView();
      pageName = currentView.cwView;
      if (currentView.type === "Index") {
        url = cwApi.getIndexViewDataUrl(pageName);
        indexView = true;
      } else {
        objectId = cwApi.getQueryStringObject().cwid;
        url = cwApi.getSingleViewDataUrl(pageName, objectId);
        indexView = false;
      }
    }

    propertiesGroup = "BOTH";

    $.getJSON(url, function (updateData) {
      if (!cwApi.statusIsKo(updateData)) {
        if (cwApi.isLive() === true && !indexView) {
          updateData = updateData.object;
        }
        if (cwApi.isUndefined(filters)) {
          cwApi.cwKendoGridFilter.showAddAndSearch(gridObject.mainContainer, gridObject.isAssociationgrid);
        }
        if (gridObject.isAssociationgrid) {
          mainItems = updateData.associations[gridObject.tabID];
          newGridObject = cwApi.cwKendoGridDataManager.createAndGetAssociationGrid(
            gridObject,
            mainItems,
            gridObject.tabID,
            updateData,
            gridObject.parentItem,
            gridObject.parentNodeShema,
            false,
            gridTemp.data("kendoGrid"),
            true,
            true,
            true,
            isExportMode
          );
          dataSource = gridTemp.data("kendoGrid").dataSource;
        } else {
          mainItems = updateData[gridObject.tabID];
          newGridObject = cwApi.cwKendoGridDataManager.createAndGetGrid(
            gridObject.properties,
            gridObject,
            updateData,
            gridObject.nodeSchema,
            gridObject.tabID
          );
          dataSource = cwApi.cwKendoGridDataManager.loadGridAndGetDataSource(
            newGridObject,
            propertiesGroup,
            gridObject.nodeSchema,
            mainItems,
            gridObject.tabID
          );

          //Fix - Set the current page on clicking cancel button
          if (!isExport) {
            dataSource._page = gridTemp.data("kendoGrid").dataSource._page;
            dataSource._pageSize = gridTemp.data("kendoGrid").dataSource._pageSize;
          }

          cwApi.cwKendoGridDataManager.setAndReadDataSource(gridTemp.data("kendoGrid"), dataSource, newGridObject, filters);
        }

        cwApi.cwKendoGridFilter.bindFilterActions(newGridObject);

        if (gridObject.isSearchEngineEnabled) {
          gridTemp.data("kendoGrid").unbind("edit");
          gridTemp.data("kendoGrid")._events.edit[0] = newGridObject.editEvent.bind(newGridObject);
        }
        if (cwApi.isFunction(callback)) {
          return callback(dataSource);
        }
      } else {
        cwApi.loadLoginPage(updateData);
        $(".popout").remove();
      }
    });
  };

  if (cwBehaviours.hasOwnProperty("CwKendoGrid") && cwBehaviours.CwKendoGrid.prototype.setAnGetKendoGridData) {
    cwBehaviours.CwKendoGrid.prototype.setAnGetKendoGridData = tableComplexeEnhanced.cwKendoGrid.setAnGetKendoGridData;
    cwBehaviours.CwKendoGrid.prototype.modifyAssociationFilter = tableComplexeEnhanced.cwKendoGrid.modifyAssociationFilter;
    cwBehaviours.CwKendoGrid.prototype.enableClearFilter = tableComplexeEnhanced.cwKendoGrid.enableClearFilter;
    cwBehaviours.CwKendoGrid.prototype.ClearFilter = tableComplexeEnhanced.cwKendoGrid.ClearFilter;
    cwBehaviours.CwKendoGrid.prototype.enableFilterIcon = tableComplexeEnhanced.cwKendoGrid.enableFilterIcon;
    cwBehaviours.CwKendoGrid.prototype.completeAssociationColumnFilter = tableComplexeEnhanced.cwKendoGrid.completeAssociationColumnFilter;
    cwBehaviours.cwKendoGridHeader.prototype.createHeader = tableComplexeEnhanced.createHeader;
    cwBehaviours.CwKendoGrid.setup = tableComplexeEnhanced.cwKendoGrid.setup;
  }

  if (cwAPI.CwKendoGridToolBar) {
    cwAPI.CwKendoGridToolBar.getToolBarItems = tableComplexeEnhanced.cwKendoGridToolBar.getToolBarItems;
    cwAPI.CwKendoGridToolBar.prototype.varifyAndAppendClearFilterButton = tableComplexeEnhanced.cwKendoGridToolBar.varifyAndAppendClearFilterButton;
    cwAPI.CwKendoGridToolBar.prototype.getClearFilterButton = tableComplexeEnhanced.cwKendoGridToolBar.getClearFilterButton;
  }

  if (cwBehaviours.CwKendoGridData) {
    cwBehaviours.CwKendoGridData.prototype.editTemplate = tableComplexeEnhanced.cwKendoGridData.editTemplate;
  }
})(cwAPI, jQuery);
