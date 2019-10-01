(function(cwApi, $, cwCustomerSiteActions) {
  "use strict";

  cwCustomerSiteActions.doActionsForAll_Custom = function(rootNode) {
    var currentView, url, i, cwView;
    currentView = cwAPI.getCurrentView();
    if (currentView) cwView = currentView.cwView;

    for (i in cwAPI.customLibs.doActionsForAll_Custom) {
      if (cwAPI.customLibs.doActionsForAll_Custom.hasOwnProperty(i)) {
        if (typeof cwAPI.customLibs.doActionsForAll_Custom[i] === "function") {
          cwAPI.customLibs.doActionsForAll_Custom[i](rootNode, cwView);
        }
      }
    }
  };

  cwCustomerSiteActions.removeMonMenu = function(rootNode, cwView) {
    let config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("homePage");
    if (config && config.removeMyMenu === true) {
      var menus = document.querySelectorAll("div.menuText");
      menus.forEach(function(menu) {
        if (menu.innerHTML == $.i18n.prop("menu_homeLink")) {
          try {
            menu.parentElement.parentElement.parentElement.parentElement.remove();
          } catch (e) {
            console.log(e);
          }
        }
      });
    }
  };

  cwAPI.CwHomePage.outputFirstPageOld = cwAPI.CwHomePage.outputFirstPage;
  cwAPI.CwHomePage.outputFirstPage = function(callback) {
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("homePage");
    }
    if (!(config && (config.removeMyMenu === true || config.displayLastMdifiedObject === true))) {
      cwAPI.CwHomePage.outputFirstPageOld(callback);
      return;
    }

    var homePage;
    var doActions = function(callback) {
      if (config.removeMyMenu === true) {
        cwCustomerSiteActions.removeMonMenu();
        let menus = document.querySelectorAll(".cw-home-title");
        menus.forEach(function(menu) {
          if (menu.innerHTML == $.i18n.prop("menu_homeLink").toLowerCase()) {
            try {
              menu.parentElement.remove();
            } catch (e) {
              console.log(e);
            }
          }
        });
      }
      if (config.displayLastMdifiedObject === true) {
        let homeContainer = document.querySelector(".cw-zone.cw-home-navigation");
        homeContainer.style.display = "flex";
        homeContainer.firstElementChild.style.width = "70%";

        let container = document.createElement("div");
        container.id = "lastUpdateObjects_homepage";
        container.className = "lastUpdateObjectsTable";
        homeContainer.append(container);

        cwApi.CwAsyncLoader.load("angular", function() {
          var loader = cwApi.CwAngularLoader;
          loader.setup();

          let templatePath = cwAPI.getCommonContentPath() + "/html/lastModifiedObjects/lastModifiedObjects.ng.html" + "?" + Math.random();
          loader.loadControllerWithTemplate("lastUpdateObjects_homepage", $("#lastUpdateObjects_homepage"), templatePath, function($scope, $sce) {
            $scope.metamodel = cwAPI.mm.getMetaModel();
            self.angularScope = $scope;
            $scope.cwApi = cwApi;
            var objects = [];
            let objectTypeScriptNameToGet = config.objectTypeToSelect;
            let associationsCalls = [];

            objectTypeScriptNameToGet.forEach(function(ots) {
              let query = {
                ObjectTypeScriptName: ots.toUpperCase(),
                PropertiesToLoad: ["NAME", "WHENUPDATED"],
                Where: [],
              };

              let dataServiceFunction = function(callback) {
                cwApi.CwDataServicesApi.send("flatQuery", query, function(err, res) {
                  res.forEach(function(o) {
                    o.date = new Date(o.properties.whenupdated);
                    o.cds = cwApi.customLibs.utils.getCustomDisplayString("{name}", o);
                    o.objectTypeLabel = cwAPI.mm.getObjectType(o.objectTypeScriptName).name;
                    objects.push(o);
                  });
                  callback(null, err);
                });
              };
              associationsCalls.push(dataServiceFunction);
            });

            async.series(associationsCalls, function(err, results) {
              $scope.objects = objects;
              $scope.$apply();
            });

            $scope.displayItemString = function(item) {
              return $sce.trustAsHtml(item);
            };

            $scope.toggle = function(c, e) {
              if (c.hasOwnProperty(e)) delete c[e];
              else c[e] = true;
            };

            $scope.toggleArray = function(c, e) {
              var i = c.indexOf(e);
              if (i === -1) c.push(e);
              else c.splice(i, 1);
            };
          });
        });
      }
      callback(null);
    };

    if (cwApi.isLive()) {
      cwApi.CwMaximize.restore();
    }
    homePage = new cwApi.CwHomePage();
    cwApi.updatePageTitle("");
    document.title = cwApi.getSiteDisplayName() + " - erwin CW Evolve";
    cwApi.cleanUselessTags();
    $(".cw-zone").remove();

    if (cwApi.isLive()) {
      if (cwApi.isModelSelectionPage() === true) {
        cwApi.modelLoader.loadModelToSelect(null, {
          User: cwApi.currentUser,
        });
      } else {
        homePage.createHomePageMenus();
        /// call load and output favourites
        cwApi.CwBookmarkManager.outputFavourites(function() {
          homePage.showLeveL0();
          cwApi.CwHomePage.outputHomePageCustom();
          cwApi.pluginManager.execute("outputHomePageCustom");
          return doActions(callback);
        });
      }
    } else {
      homePage.handleOfflineHomePage(function() {
        cwHomePage.outputHomePageCustom();
        return doActions(callback);
      });
    }
    cwApi.CwPopout.init();

    callback(null);
  };

  /********************************************************************************
    Configs : add trigger for single and index
    *********************************************************************************/
  if (cwAPI.customLibs === undefined) {
    cwAPI.customLibs = {};
  }
  if (cwAPI.customLibs.doActionForAll_Custom === undefined) {
    cwAPI.customLibs.doActionsForAll_Custom = {};
  }
  cwAPI.customLibs.doActionsForAll_Custom.removeMonMenu = cwCustomerSiteActions.removeMonMenu;
})(cwAPI, jQuery, cwCustomerSiteActions);
