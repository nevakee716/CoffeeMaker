/*global cwAPI, jQuery*/
(function (cwApi, $) {
  "use strict";
  var loader = cwApi.CwAngularLoader;
  var color = [{
    "color": "#0094dc",
    "background-color": "#e1f5ff"
  },{
    "color": "#13d613",
    "background-color": "#ddffdd"
  },{
    "color": "#fd6c00",
    "background-color": "#fef0e5"
  }];


  if (cwApi.ngDirectives) {
    cwApi.ngDirectives.push(function () {
      loader.registerDirective("nicelist", function () {
        return {
          restrict: "A",
          templateUrl: loader.getDirectiveTemplatePath("MarketPlace", "niceList"),
          link: function ($scope) {
            if (cwAPI.customLibs.utils.isObjectFavorite($scope.item.objectTypeScriptName, $scope.item.object_id)) {
              $scope.item.setAsFav = true;
            } else {
              $scope.item.setAsFav = false;
            }
            
            $scope.tagProperties = [];

            Object.keys($scope.item.properties).filter(function(p) {
              return ['name'].indexOf(p) === -1 && ['exportflag'].indexOf(p) === -1 && p.indexOf("_id") === -1 && p.indexOf("_abbreviation") === -1 && ['cwaveragerating'].indexOf(p) === -1 && ['cwtotalcomment'].indexOf(p) === -1;
            }).forEach(function(ps){
              let property = cwAPI.mm.getProperty($scope.item.objectTypeScriptName,ps);
              if(property.type === "Memo") return ;
              if(property.type === "URL") {
                $scope.urlPropertiesScriptname = ps;
                $scope.url = $scope.item.properties[$scope.urlPropertiesScriptname]
              }
              else if(property.type === "Date") {
                $scope.datePropertiesScriptname = ps;
                $scope.date = $scope.item.properties[$scope.datePropertiesScriptname]
              } else {
             
                $scope.tagProperties.push($scope.item.properties[ps]);
              }
            })

            let config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("cdsEnhanced");
            if (config) {
              if (config.displayPopoutByDefault) {
          
                let popOutName = cwApi.replaceSpecialCharacters($scope.item.objectTypeScriptName) + "_diagram_popout";
                if (cwAPI.ViewSchemaManager.pageExists(popOutName) === true) {
                  $scope.popout = {id:$scope.item.object_id,name:popOutName};
                }
              }
            }

            $scope.openPopout = function(popout,id){
              cwAPI.customFunction.openDiagramPopoutWithID(id,popout)
            }

            $scope.associationsIcon = [];
            $scope.associations = [];
            Object.keys($scope.item.associations).forEach(function(k){
              
              if(k.indexOf("_icon") !== -1){
                $scope.associationsIcon.push($scope.item.associations[k]);
              } else {
                $scope.associations.push($scope.item.associations[k]);
              }
            })

            $scope.getCDS = function(item){
              return $scope.item.viewSchema.NodesByID[item.nodeID].LayoutOptions.DisplayPropertyScriptName;
            }

            $scope.color = color;
            let options = { year: "numeric", month: "long", day: "numeric" };
        
            let lDate = new Date($scope.date);
            $scope.lDate = lDate.toLocaleDateString(undefined, options);


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
          },
        };
      });
    });
  }
})(cwAPI, jQuery);
