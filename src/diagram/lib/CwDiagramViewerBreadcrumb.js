/* Copyright � 2012-2017 erwin, Inc. - All rights reserved */
/*global jQuery:true, cwAPI:true*/
(function (cwApi, CwDiagramViewer, $) {
  "use strict";

  var defaultBreadcrumbSize = 42;

  /*Make diagram viewer to disable the gps button*/
  CwDiagramViewer.prototype.whereAmIButton = function () {
    var whereAmIButton, o, that;
    let config = cwAPI.customLibs && cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration("diagram");
    if (!config || config.deactivateGPS == false) {
      that = this;
      this.$breadcrumb.find(".btn-diagram-where").remove();
      o = [];
      o.push(
        '<a ng-hide="de.diagramViewer.isInEditMode === true" id="cw-diagram-where" class="btn btn-diagram-where no-text" title="',
        $.i18n.prop("diagramOptions_whereAmI"),
        '"><span class="btn-text"></span><i class="fa fa-map-marker"></i></a>'
      );
      this.$breadcrumb.find(".cwDiagramBreadcrumbZoneRight").append(o.join(""));

      whereAmIButton = this.$breadcrumb.find(".btn-diagram-where");

      whereAmIButton.on("click", function () {
        that.showWhereAmI();
      });
    }
  };
})(cwAPI, cwAPI.Diagrams.CwDiagramViewer, jQuery);
