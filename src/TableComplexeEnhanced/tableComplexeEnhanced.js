/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";

  var tableComplexeEnhanced = {};
  tableComplexeEnhanced.cwKendoGrid = {};
  tableComplexeEnhanced.cwKendoGridToolBar = {};
  tableComplexeEnhanced.cwKendoGridData = {};

  var TableComplexeEnhancedConfig = {
    urlText: "Cliquez Ici",
    openInNewTab: true,
  };

  var kendoGridDataSaved = {};

  // remove the special column of the table complexe and replace after the switch
  var clearColumn = function (columns, config) {
    var columnCleared = [];

    var result = {
      iUpdate: undefined,
      iCreate: undefined,
      columnCleared: columnCleared,
    };

    for (i = 0; i < columns.length; i++) {
      if (columns[i].title === "CanCreate" && columns[i].field === "type_id_cancreate") {
        result.Create = i;
      } else if (columns[i].title === "CanUpdate" && columns[i].field === "type_id_canupdate") {
        result.Update = i;
      } else if (columns[i].title === "Options" && columns[i].field === undefined) {
        result.Options = i;
        if (i == 0) {
          columns[i].locked = config.freezeFirstOption;
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
        if (columnConfig[i + 1].order) columnsObj[columnConfig[i + 1].order - 1] = columnConfig[i]; // custom order
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
    if (config.nodes && config.nodes[nodeID] && config.nodes[nodeID].columns) {
      let configColumn = config.nodes[nodeID].columns;
      clearColumnResult = clearColumn(columns, config);
      columnsObj = reOrderColumn(clearColumnResult.columnCleared, config, configColumn);
      result = reBuildColumn(columnsObj, clearColumnResult, columns);
      if (result === null) {
        return columns;
      } else {
        return result;
      }
    }

    return columns;
  };

  // Apply ratio to the height
  var calcHeight = function (height, nodeID) {
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("tableComplexeEnhanced");

      if (config && config.nodes && config.nodes[nodeID] && config.nodes[nodeID].heightPercent) {
        return (height * config.nodes[nodeID].heightPercent) / 100;
      }
    }
    return height;
  };

  tableComplexeEnhanced.cwKendoGrid.modifyAssociationFilter = function () {
    var self = this;
    self.associationsColumnList = [];
    this.columns.forEach(function (c) {
      if (c.isAssociationColumn) {
        let items = [];
        self.associationsColumnList.push(c.field);
        self.items.forEach(function (item) {
          item.associations[c.field].forEach(function (a) {
            if (items.indexOf(a.label) === -1) items.push(a.label);
          });
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
      itemPerPages = [5, 10, 50, 100];
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("tableComplexeEnhanced");
    }
    if (config && config.itemPerPages) {
      itemPerPages = config.itemPerPages.split(",");
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
      groupable: {
        messages: {
          empty: $.i18n.prop("grid_drop_column"),
        },
      },
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

    if (config && config.title) {
      var obj = {
        name: "Title",
        template: '<h3 style="right:50%; position:absolute">' + this.nodeSchema.NodeName + "</h3>",
      };
      kendoGridData.toolbar.unshift(obj);
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
        this.ClearFilter.call(gridObject);
      }
    }
  };

  tableComplexeEnhanced.cwKendoGrid.enableClearFilter = function (container) {
    $("." + this.nodeSchema.NodeID + " .k-grid-clearFilter").click(this.ClearFilter.bind(this));
  };

  tableComplexeEnhanced.cwKendoGrid.ClearFilter = function () {
    var datasource = $("." + this.nodeSchema.NodeID + ".k-grid").data("kendoGrid").dataSource;
    //Clear filters:
    datasource.filter([]);
  };

  tableComplexeEnhanced.cwKendoGrid.enableFilter = function (e) {
    let self = this;
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
        if (self.associationsColumnList.indexOf(f.field) !== -1 && f.field !== field) {
          setTimeout(function () {
            $("." + self.nodeSchema.NodeID + " th[data-field='" + f.field + "'] a.k-grid-filter").addClass("k-state-active");
          }, 500);
        }
      });
    }
  };

  tableComplexeEnhanced.cwKendoGrid.getFilterMenuOpen = function (e) {
    let self = this;
    if (e.sender.dataSource.filter()) {
      e.sender.dataSource.filter().filters.forEach(function (f) {
        let value = f.value.replace("'", "\\'").replace('"', '\\"');
        if (self.associationsColumnList.indexOf(e.field) !== -1) {
          var checkbox = e.container.find("input[value='" + value + "']");
          if (checkbox[0] && !checkbox[0].checked) {
            e.container.find("input[value='" + value + "']").click();
          }
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
    return (
      "#= data." +
      this.property.scriptName +
      " ? '" +
      '<i style="color:green" class="fa fa-check" aria-hidden="true"></i>' +
      "' : '" +
      '<i style="color:red" class="fa fa-times" aria-hidden="true"></i>' +
      "' #"
    );
  };

  cwAPI.cwPropertiesGroups.types.booleanValue = function (value) {
    if (value !== false) {
      value = '<i style="color:green" class="fa fa-check"><span class="hidden">' + jQuery.i18n.prop("global_true") + "</span></i>";
    } else {
      value = '<i style="color:red" class="fa fa-times"><span class="hidden">' + jQuery.i18n.prop("global_false") + "</span></i>";
    }
    return value;
  };

  //Url
  cwApi.cwPropertiesGroups.types.URLValue = function (value) {
    var txt = "",
      link = value;
    if (TableComplexeEnhancedConfig.openInNewTab) txt = 'target="_blank"';
    value =
      TableComplexeEnhancedConfig.urlText +
      " <a " +
      txt +
      'href="' +
      link +
      '">' +
      '<div style="display:none">' +
      link +
      "</div>" +
      "<i class='fa fa-file-text' </i>" +
      "</a>";
    return value;
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

      if (propertyObject.property.type === "Integer") {
        columnManager.setFormat("{0:n0}");
      } else if (propertyObject.property.type === "Date") {
        columnManager.setFormat("{0:" + cwApi.dateFormatKendo + "}");
      } else if (propertyObject.property.type === "Lookup") {
        columnManager.filterable = { multi: true };
      }
    }
    if (isAssociationColumn) {
      columnManager.filterable = {
        multi: true,
        search: true,
        operators: {
          string: {
            contains: "Contains",
          },
        },
      };
    }
    if (propertyObject.field === "name") {
      columnManager.setFilter();
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
