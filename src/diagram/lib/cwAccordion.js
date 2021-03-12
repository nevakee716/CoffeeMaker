/* Copyright � 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI, cwBehaviours, jQuery  */

(function (cwApi, $) {
  "use strict";

  cwBehaviours.cwAccordionChild.prototype.mouseClick = function () {
    cwApi.CwPendingEventsManager.setEvent("AccodionMouseClick");
    var $divCollection = $(this.divCollection);
    if (this.span.hasClass(this.collapseClass)) {
      this.span.removeClass(this.collapseClass);
      this.span.addClass(this.expandClass);
      $divCollection.addClass("cw-state-active");
    } else {
      this.span.removeClass(this.expandClass);
      this.span.addClass(this.collapseClass);
      $divCollection.removeClass("cw-state-active");
    }

    $divCollection.next().children("canvas.cw-world-map").hide();
    $divCollection.next().children("div.cw-google-map").hide();
    $divCollection.next().find(".k-chart").hide();

    $divCollection.next().toggle("slow", function () {
      var $embedUrl, h;
      if ($divCollection.is(":visible") === true) {
        $divCollection.next().find(".k-chart").show();
        cwApi.cwDisplayManager.refreshCharts($divCollection.next());

        $divCollection.find(".cw-google-map").each(function (i, map) {
          /*jslint unparam:true*/
          cwApi.googleMapManager.reloadMap($(map).attr("id"));
        });
        $divCollection
          .next()
          .find(".cw-jvector-map")
          .each(function (i, map) {
            /*jslint unparam:true*/
            var $map, mapId;
            $map = $(map);
            mapId = $map.attr("id");
            $map.css("width", "");
            cwBehaviours.cwJVectorMap.reloadMap(mapId);
          });

        $divCollection.next().find("#cw-diagram-zoomreset").click();

        $embedUrl = $divCollection.next().find(".CwPropertiesLayoutEmbedURL");
        if ($embedUrl.length > 0) {
          $embedUrl.css("width", "100%").css("height", cwApi.CwOptions.CwEmbedUrl.InAccordionDefaultHeight + "px");
          h = $embedUrl.height() - $embedUrl.find(".cwPropertiesTableHeader").outerHeight() + "px";
          $embedUrl.find("iframe").css("min-height", h).css("height", h);
        }
      }
      cwApi.CwPendingEventsManager.deleteEvent("AccodionMouseClick");
    });
  };
})(cwAPI, jQuery);
