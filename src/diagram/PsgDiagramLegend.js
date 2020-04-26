/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/

(function (cwApi, $) {
  "use strict";

  var PsgDiagramLegend;

  PsgDiagramLegend = function () {
    this.PsgDiagramLegend = {};
  };

  PsgDiagramLegend.prototype.init = function (diagramViewer) {
    var legendButton,
      o,
      that = this;
    if (diagramViewer.$breadcrumb === undefined) return;
    let config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("diagram");
    if (!config) return;
    if (
      config.template[diagramViewer.json.properties.type_id] &&
      config.template[diagramViewer.json.properties.type_id].popout === true &&
      config.template[diagramViewer.json.properties.type_id].popoutView
    ) {
      let c = config.template[diagramViewer.json.properties.type_id];
      let popOutName = c.popoutView;
      let id = diagramViewer.json.object_id ? diagramViewer.json.object_id : c.popoutId;
      if (cwAPI.ViewSchemaManager.pageExists(popOutName) === true) {
        legendButton = diagramViewer.$breadcrumb.find("a#cw-diagram-legend");
        if (legendButton.length > 0) {
          legendButton.unbind("click");
        } else {
          o = [];
          o.push(
            '<a id="cw-diagram-legend" class="btn btn-diagram-legend no-text title="',
            $.i18n.prop("DiagramLegendIcon"),
            '"><span class="btn-text"><i class="fa fa-question" aria-hidden="true"></i></a>'
          );
          diagramViewer.$breadcrumb.find(".cwDiagramBreadcrumbZoneRight").append(o.join(""));
          legendButton = diagramViewer.$breadcrumb.find(".btn-diagram-legend");
        }

        legendButton.on("click", function () {
          cwApi.customFunction.openDiagramPopoutWithID(id, popOutName);
        });
      }
    }
  };

  PsgDiagramLegend.prototype.register = function () {
    cwApi.pluginManager.register("CwDiagramViewer.initWhenDomReady", this.init.bind(this));
  };

  cwApi.CwPlugins.PsgDiagramLegend = PsgDiagramLegend;

  /********************************************************************************
  Activation
  *********************************************************************************/
  new cwApi.CwPlugins.PsgDiagramLegend().register();
})(cwAPI, jQuery);
