/*global cwAPI, jQuery*/
(function (cwApi, $) {
  "use strict";
  var loader = cwApi.CwAngularLoader;
  if (cwApi.ngDirectives) {
    cwApi.ngDirectives.push(function () {
      loader.registerDirective("horizontalbox", [
        "$http",
        "$sce",
        function ($http, $sce) {
          return {
            restrict: "A",
            templateUrl: loader.getDirectiveTemplatePath("MarketPlace", "horizontalBox"),
            link: function ($scope) {
              $scope.isFavDisplay = $scope.item.nodeID.indexOf("favorite") !== -1;
              $scope.isNoFavDisplay = $scope.item.nodeID.indexOf("novorite") !== -1;

              $scope.html = $scope.item.properties.description
                ? $sce.trustAsHtml(cwApi.cwPropertiesGroups.formatMemoProperty($scope.item.properties.description))
                : null;

              if (cwAPI.customLibs.utils.isObjectFavorite($scope.item.objectTypeScriptName, $scope.item.object_id)) {
                $scope.item.setAsFav = true;
              } else {
                $scope.item.setAsFav = false;
              }

              if ($scope.viewSchema) {
                $scope.cds = $sce.trustAsHtml(cwAPI.customLibs.utils.getCustomDisplayString("<##>{name}", $scope.item, $scope.item.nodeID));
              }

              $scope.addAsFavourite = function () {
                $scope.item.setAsFav = true;
                $scope.item.keepInTheList = true;

                cwAPI.customLibs.utils.addObjectAsFavorite($scope.item.objectTypeScriptName, $scope.item.object_id);
              };

              $scope.removeAsFavourite = function () {
                $scope.item.setAsFav = false;
                $scope.item.keepInTheList = true;
                cwAPI.customLibs.utils.removeObjectAsFavorite($scope.item.objectTypeScriptName, $scope.item.object_id);
              };

              $scope.selectedProperties = Object.keys($scope.item.properties).some(function (p) {
                if (cwApi.mm.getProperty($scope.item.objectTypeScriptName, p).type === "URL") {
                  $scope.picture = $scope.item.properties[p] + "?" + cwApi.getRandomNumber();
                  return true;
                }
              });
            },
          };
        },
      ]);
    });
  }
})(cwAPI, jQuery);
