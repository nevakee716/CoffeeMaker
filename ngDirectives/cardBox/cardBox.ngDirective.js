/*global cwAPI, jQuery*/
(function (cwApi, $) {
  "use strict";
  var loader = cwApi.CwAngularLoader;
  if (cwApi.ngDirectives) {
    cwApi.ngDirectives.push(function () {
      loader.registerDirective("cardbox", [
        "$http",
        function ($http) {
          return {
            restrict: "A",
            templateUrl: loader.getDirectiveTemplatePath("MarketPlace", "cardBox"),
            link: function ($scope) {
              $scope.html = $scope.item.properties.description
                ? cwApi.cwPropertiesGroups.formatMemoProperty($scope.item.properties.description)
                : null;
              let options = { year: "numeric", month: "long", day: "numeric" };

              let date = $scope.item.properties.hasOwnProperty("whenvalidated")
                ? new Date($scope.item.properties.whenvalidated)
                : $scope.item.properties.hasOwnProperty("whencreated")
                ? new Date($scope.item.properties.whencreated)
                : new Date($scope.item.properties.whenupdated);
              $scope.date = date.toLocaleDateString(undefined, options);
              let today = new Date().getTime();
              $scope.new = today - date.getTime() > 3600 * 1000 * 24 * 3 ? false : true;

              let removedProperties = [
                "cwaveragerating",
                "cwtotalcomment",
                "exportflag",
                "description",
                "name",
                "whenvalidated",
                "whencreated",
                "whenupdated",
              ];
              $scope.selectedProperties = Object.keys($scope.item.properties).filter(function (p) {
                return removedProperties.indexOf(p) === -1 && p.indexOf("abbr") !== -1 && p.indexOf("_id") !== -1;
              });
            },
          };
        },
      ]);
    });
  }
})(cwAPI, jQuery);