/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */
/*global cwAPI, jQuery */
(function(cwApi, $) {
  "use strict";
  if (cwApi && cwApi.cwLayouts && cwApi.cwLayouts.cwCoffeeMaker) {
    var cwCoffeeMaker = cwApi.cwLayouts.cwCoffeeMaker;
  } else {
    // constructor
    var cwCoffeeMaker = function(options, viewSchema) {
      cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema); // heritage
      cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations
      this.construct(options);
    };
  }

  cwCoffeeMaker.prototype.getColumnOfTableBehaviour = function(behaviour, viewSchema) {
    let prop = behaviour.Behaviour.Options["property-order"].Properties.map(function(p) {
      return {
        name: cwApi.mm.getProperty(p.ObjectTypeScriptName, p.PropertyScriptName).name,
        size: p.Size,
      };
    });

    let iprop = behaviour.Behaviour.Options["property-order"].iProperties;
    if (iprop !== null) {
      iprop = iprop.map(function(p) {
        if (iprop) iprop = iprop;
        return {
          name: cwApi.mm.getProperty(p.ObjectTypeScriptName, p.PropertyScriptName).name,
          size: p.Size,
        };
      });
    } else {
      iprop = [];
    }
    let columns = [];
    let assoColumn = viewSchema.NodesByID[behaviour.NodeID].SortedChildren.map(function(c) {
      return {
        name: viewSchema.NodesByID[c.NodeId].NodeName,
        size: 200,
      };
    });
    if (assoColumn === null) assoColumn = [];
    columns = columns.concat(prop, iprop, assoColumn);

    //viewSchema.NodesByID[behaviour.node.NodeID];
    columns.forEach(function(c, i) {
      c.order = i + 1;
      c.originalOrder = i + 1;
    });
    return columns;
  };

  cwCoffeeMaker.prototype.controller_tableComplexeEnhanced = function($container, templatePath, $scope) {
    var evolveViews = [];
    var self = this;
    let config = $scope.config;
    for (let v in $scope.views) {
      if ($scope.views.hasOwnProperty(v)) {
        if ($scope.views[v].name.indexOf("|>B") === -1) {
          let view = $scope.views[v];
          let containTable = false;
          view.schema = JSON.parse(JSON.stringify(cwAPI.getViewsSchemas()[$scope.views[v].cwView]));

          view.schema.Behaviours = view.schema.Behaviours.filter(function(b) {
            return b.Properties.Behaviour.JSMethodName === "CwKendoGrid";
          }).map(function(b, i) {
            let r = b.Properties;
            r.node = view.schema.NodesByID[b.Properties.NodeID];
            r.columns = self.getColumnOfTableBehaviour(b.Properties, view.schema);
            if (i === 0) r.selected = true;
            return r;
          });
          if (view.schema.Behaviours.length > 0) evolveViews.push(view);
        }
      }
    }
    $scope.evolveViews = evolveViews;

    $scope.selectNode = function(i) {
      $scope.currentView.schema.Behaviours.map(function(c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.selectColumn = function(behaviour, i) {
      behaviour.columns.map(function(c, ii) {
        if (i == ii) c.selected = true;
        else c.selected = false;
      });
    };

    $scope.reOrderColumn = function(behaviour, i) {
      let newOrder = behaviour.columns[i].order;
      behaviour.columns[newOrder - 1].order = i + 1;

      $scope.initColumnConfig(behaviour);
      if (config.nodes[behaviour.node.NodeID].columns[behaviour.columns[newOrder - 1].originalOrder] === undefined) {
        config.nodes[behaviour.node.NodeID].columns[behaviour.columns[newOrder - 1].originalOrder] = {};
      }
      if (config.nodes[behaviour.node.NodeID].columns[behaviour.columns[i].originalOrder] === undefined) {
        config.nodes[behaviour.node.NodeID].columns[behaviour.columns[i].originalOrder] = {};
      }
      config.nodes[behaviour.node.NodeID].columns[behaviour.columns[newOrder - 1].originalOrder].order = i + 1;
      config.nodes[behaviour.node.NodeID].columns[behaviour.columns[i].originalOrder].order = newOrder;

      behaviour.columns.sort(function(a, b) {
        return a.order - b.order;
      });
    };

    $scope.initColumnConfig = function(behaviour) {
      if ($scope.config.nodes === undefined) $scope.config.nodes = {};
      if ($scope.config.nodes[behaviour.node.NodeID] === undefined) $scope.config.nodes[behaviour.node.NodeID] = {};
      if ($scope.config.nodes[behaviour.node.NodeID].columns === undefined) $scope.config.nodes[behaviour.node.NodeID].columns = {};
    };

    return;
  };

  cwApi.cwLayouts.cwCoffeeMaker = cwCoffeeMaker;
})(cwAPI, jQuery);