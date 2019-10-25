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
      for (let i = 0; i < menus.length; i++) {
        let menu = menus[i];
        if (menu.innerHTML == $.i18n.prop("menu_homeLink")) {
          try {
            menu.parentElement.parentElement.parentElement.parentElement.remove();
          } catch (e) {
            console.log(e);
          }
        }
      }
    }
  };

  var removeMyMenuHomepage = function(config, callback) {
    cwCustomerSiteActions.removeMonMenu();
    let menus = document.querySelectorAll(".cw-home-title");
    for (let i = 0; i < menus.length; i++) {
      let menu = menus[i];
      if (menu.innerHTML == $.i18n.prop("menu_homeLink").toLowerCase()) {
        try {
          menu.parentElement.remove();
        } catch (e) {
          console.log(e);
        }
      }
    }
  };

  var getDescription = function(config, callback) {
    let query = {
      ObjectTypeScriptName: config.descriptionObjectTypeScriptname.toUpperCase(),
      PropertiesToLoad: ["NAME", "DESCRIPTION"],
      Where: [{ PropertyScriptName: "ID", Value: config.descriptionObjectID }],
    };

    cwApi.CwDataServicesApi.send("flatQuery", query, function(err, res) {
      if (err) {
        console.log(err);
        callback("", err);
        return;
      }
      callback(cwApi.cwPropertiesGroups.formatMemoProperty(res[0].properties.description), err);
    });
  };

  var loadLastModifiedObjects = function(config, callback) {
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

        for (let ots in objectTypeScriptNameToGet) {
          if (objectTypeScriptNameToGet.hasOwnProperty(ots) && objectTypeScriptNameToGet[ots].enable === true) {
            var regex = /({[a-z]+})/g;
            var found = objectTypeScriptNameToGet[ots].cds.match(regex);
            var pToLoad = ["WHENUPDATED"];
            found.forEach(function(f) {
              f = f.replace("{", "").replace("}", "");
              pToLoad.push(f.toUpperCase());
            });

            let query = {
              ObjectTypeScriptName: ots.toUpperCase(),
              PropertiesToLoad: pToLoad,
              Where: [],
            };

            let dataServiceFunction = function(callback) {
              cwApi.CwDataServicesApi.send("flatQuery", query, function(err, res) {
                if (err) {
                  console.log(err);
                  callback(null, err);
                  return;
                }
                res.forEach(function(o) {
                  o.date = new Date(o.properties.whenupdated);
                  o.cds = cwApi.customLibs.utils.getCustomDisplayString(objectTypeScriptNameToGet[ots].cds, o);
                  o.objectTypeLabel = cwAPI.mm.getObjectType(o.objectTypeScriptName).name;
                  objects.push(o);
                });
                callback(null, err);
              });
            };
            associationsCalls.push(dataServiceFunction);
          }
        }

        async.series(associationsCalls, function(err, results) {
          $scope.objects = objects;
          $scope.$apply();
        });

        $scope.vm = { selectedDelay: 30 };

        $scope.vm.dateIsArray = false;
        if (config.delay) {
          if (config.delay.indexOf(",")) {
            $scope.vm.dateIsArray = true;
            $scope.vm.dateOptions = config.delay.split(",");
            $scope.vm.selectedDelay = $scope.vm.dateOptions[0];
            $scope.vm.dateOptions.sort((a, b) => a - b);
          } else {
            $scope.vm.selectedDelay = config.delay;
          }
        }

        $scope.displayItemString = function(item) {
          return $sce.trustAsHtml(item);
        };

        $scope.filterDate = function(date) {
          return date.date > new Date() - 24 * 60 * 60 * 1000 * $scope.vm.selectedDelay;
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
  };

  cwAPI.CwHomePage.outputFirstPageOld = cwAPI.CwHomePage.outputFirstPage;
  cwAPI.CwHomePage.outputFirstPage = function(callback) {
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("homePage");
    }
    if (!(config && (config.removeMyMenu === true || config.displayLastMdifiedObject === true || config.displayDescription == true))) {
      cwAPI.CwHomePage.outputFirstPageOld(callback);
      return;
    }

    var homePage;
    var doActions = function(callback) {
      if (config.removeMyMenu === true) {
        removeMyMenuHomepage();
      }
      let homeContainer = document.querySelector("#cw-home-navigation");
      let descriptionContainer = document.createElement("div");
      let leftContainer = document.createElement("div");
      leftContainer.style.width = "70%";
      leftContainer.appendChild(descriptionContainer);
      leftContainer.appendChild(homeContainer.firstElementChild);
      let container = document.createElement("div");
      container.id = "lastUpdateObjects_homepage";
      container.className = "lastUpdateObjectsTable";

      homeContainer.appendChild(leftContainer);
      homeContainer.appendChild(container);
      homeContainer.style.display = "flex";

      var asynFunction = [];
      if (!cwAPI.isWebSocketConnected && cwApi.cwUser.isCurrentUserSocial()) asynFunction.push(cwApi.customLibs.utils.setupWebSocketForSocial);
      if (config.displayDescription) {
        asynFunction.push(function(callback) {
          getDescription(config, function(res, err) {
            descriptionContainer.innerHTML = res;
            callback(null, err);
          });
        });
      }

      if (config.displayLastMdifiedObject) {
        asynFunction.push(function(callback) {
          loadLastModifiedObjects(config, function() {
            callback(null, err);
          });
        });
      }
      async.series(asynFunction, function(err, results) {
        callback(null);
      });
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
