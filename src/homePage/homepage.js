(function(cwApi, $, cwCustomerSiteActions) {
  "use strict";

  var testConfig = {
    objectTypeToSelect: {
      application: { enable: true, cds: "{name}" },
      activité: { enable: true, cds: "{name}" },
      process: { enable: true, cds: "{name}" },
      organization: { enable: true, cds: "{name}" },
    },
    removeMyMenu: true,
    displayDescription: true,
    descriptionObjectTypeScriptname: "aidedarchitecture",
    descriptionObjectID: 79,
    displayLastMdifiedObject: true,
    delay: "100,10,200",
    lastModifiedObjectIndexpage: true,
    lastModifiedObjectIndexpage_link: "#/cwtype=index&cwview=index_processus&lang=fr",
    lastModifiedObjectIndexpage_text: "Cartographie des processus",
    lastModifiedObjectFav: true,
    lastModifiedObjectFavLink: "http://simpleicon.com/wp-content/uploads/new.png",
    columns: [
      {
        label: "Column 0",
        displays: [
          {
            label: "Object description",
            order: 0,
            objectTypeToSelect: [],
            width: "25%",
            selected: true,
            type: "object_description",
            descriptionObjectTypeScriptname: "aidedarchitecture",
            descriptionObjectID: 79,
          },
          {
            label: "Vue Evolve",
            order: 1,
            objectTypeToSelect: [],
            selected: false,
            type: "evolve_view",
            view: "index_test_home",
            width: "25%",
          },
          {
            label: "Vue Evolve",
            order: 10,
            objectTypeToSelect: [],
            selected: false,
            type: "evolve_view",
            view: "index_test_home1",
            width: "50%",
            height: "500px",
          },
          {
            label: "Vue Evolve",
            order: 20,
            objectTypeToSelect: [],
            selected: false,
            type: "evolve_view",
            view: "index_test_home2",
            width: "100%",
            height: "300px",
          },
        ],

        selected: true,
        width: "70%",
      },
      {
        label: "Column 1",
        displays: [
          {
            label: "Display 0",
            order: 0,
            selected: true,
            type: "last_modified_object",
            objectTypeToSelect: {
              activité: {
                enable: true,
                cds: "{name}",
                timeProperty: "whenupdated",
                filters: [],
              },
              application: {
                enable: true,
                cds: "{name}",
              },
            },
            delay: "200,100,1000",
            cdsSelected: "activité",
            width: "100%",
            height: "100vh",
          },
        ],
        selected: false,
        width: "30%",
      },
    ],
  };

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
            menu.parentElement.parentElement.parentElement.parentElement.parentElement.removeChild(menu.parentElement.parentElement.parentElement.parentElement);
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
          menu.parentElement.parentElement.removeChild(menu.parentElement);
        } catch (e) {
          console.log(e);
        }
      }
    }
  };

  var loadHomePage = function(config, callback) {
    cwApi.CwAsyncLoader.load("angular", function() {
      var loader = cwApi.CwAngularLoader;
      loader.setup();

      let templatePath = cwAPI.getCommonContentPath() + "/html/homePage/home.ng.html" + "?" + Math.random();
      loader.loadControllerWithTemplate("homePage", $("#cw-home-navigation"), templatePath, function($scope, $sce) {
        $scope.metamodel = cwAPI.mm.getMetaModel();

        // duplicate config to not spoil it
        $scope.config = JSON.parse(JSON.stringify(config));
        $scope.cwApi = cwApi;

        $scope.getStyleForColumn = function(col) {
          return { width: col.width };
        };

        $scope.getStyleForDisplay = function(display) {
          let calcWidth = display.width;
          if (calcWidth.indexOf("%") !== -1) calcWidth = "calc(" + calcWidth + " - 10px)";

          let calcHeight = display.height;
          if (calcHeight && calcHeight.indexOf("vh") !== -1) calcHeight = "calc(" + calcHeight + " - 70px)";

          return { width: calcWidth, height: calcHeight };
        };

        $scope.getHTMLView = function(display) {
          let jsonFile = cwApi.getIndexViewDataUrl(display.view);
          display.loading = true;
          cwApi.getJSONFile(
            jsonFile,
            function(o) {
              if (cwApi.checkJsonCallback(o)) {
                let output = [];
                let object = { associations: o };
                cwApi.cwDisplayManager.appendZoneAndTabsInOutput(output, display.view, object);
                display.html = $sce.trustAsHtml(output.join(""));
                $scope.$apply();
                cwApi.cwSiteActions.doLayoutsSpecialActions(true);
                let schema = cwApi.ViewSchemaManager.getPageSchema(display.view);
                cwApi.cwDisplayManager.enableBehaviours(schema, object, false);
              }
            },
            cwApi.errorOnLoadPage
          );
        };

        $scope.getHTMLfromObject = function(display) {
          let query = {
            ObjectTypeScriptName: display.descriptionObjectTypeScriptname.toUpperCase(),
            PropertiesToLoad: ["NAME", "DESCRIPTION"],
            Where: [{ PropertyScriptName: "ID", Value: config.descriptionObjectID }],
          };

          cwApi.CwDataServicesApi.send("flatQuery", query, function(err, res) {
            if (err) {
              console.log(err);
              return;
            }
            display.html = $sce.trustAsHtml(cwApi.cwPropertiesGroups.formatMemoProperty(res[0].properties.description));
          });
        };

        $scope.searchForObjects = function(display) {
          let associationsCalls = [];
          let objects = [];
          display.date = { selectedDelay: 30 };
          display.date.dateIsArray = false;
          if (display.delay) {
            if (display.delay.indexOf(",")) {
              display.date.dateIsArray = true;
              display.date.dateOptions = config.delay.split(",");
              display.date.selectedDelay = display.date.dateOptions[0];
              display.date.dateOptions.sort(function(a, b) {
                a - b;
              });
            } else {
              display.date.selectedDelay = config.delay;
            }
          }

          // loop to search objects
          for (let ots in display.objectTypeToSelect) {
            if (display.objectTypeToSelect.hasOwnProperty(ots) && display.objectTypeToSelect[ots].enable === true) {
              var regex = /({[a-z]+})/g;
              var found = display.objectTypeToSelect[ots].cds.match(regex);
              var pToLoad;
              var timeP = "whenupdated";
              if (display.objectTypeToSelect[ots].timeProperty) {
                timeP = display.objectTypeToSelect[ots].timeProperty;
              }
              pToLoad = [timeP.toUpperCase()];

              found.forEach(function(f) {
                f = f.replace("{", "").replace("}", "");
                pToLoad.push(f.toUpperCase());
              });

              if (display.objectTypeToSelect[ots].filters) {
                display.objectTypeToSelect[ots].filters.forEach(function(f) {
                  pToLoad.push(f.scriptname);
                });
              }

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
                    let timePe = "whenupdated";
                    if (display.objectTypeToSelect[o.objectTypeScriptName].timeProperty) {
                      timePe = display.objectTypeToSelect[o.objectTypeScriptName].timeProperty;
                    }
                    o.date = new Date(o.properties[timePe]);
                    o.cds = cwApi.customLibs.utils.getCustomDisplayString(display.objectTypeToSelect[o.objectTypeScriptName].cds, o);
                    o.objectTypeLabel = cwAPI.mm.getObjectType(o.objectTypeScriptName).name;

                    let r = true;
                    if (display.objectTypeToSelect[ots].filters) {
                      r = display.objectTypeToSelect[ots].filters.every(function(filter) {
                        return matchPropertyFilter(o, filter);
                      });
                    }

                    if (r) {
                      objects.push(o);
                    }
                  });
                  callback(null, err);
                });
              };
              associationsCalls.push(dataServiceFunction);
            }
          }

          async.series(associationsCalls, function(err, results) {
            display.objects = objects;

            $scope.$apply();
          });
        };

        $scope.displayItemString = function(item) {
          return $sce.trustAsHtml(item);
        };

        $scope.filterDate = function(display) {
          return function(date) {
            let shouldBeDisplay = date.date > new Date() - 24 * 60 * 60 * 1000 * display.date.selectedDelay;
            if (shouldBeDisplay) {
              $("#homePageFav_" + date.objectTypeScriptName + "_" + date.object_id).show();
            } else {
              $("#homePageFav_" + date.objectTypeScriptName + "_" + date.object_id).hide();
            }
            return shouldBeDisplay;
          };
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

  var matchPropertyFilter = function(rootNode, filter) {
    let propertyType = cwApi.mm.getProperty(rootNode.objectTypeScriptName, filter.scriptname);
    let objPropertyValue;
    let value = filter.Value;
    if (filter.scriptname === "id") {
      // changing id to make usable like other property
      objPropertyValue = rootNode.object_id;
    } else {
      if (propertyType.type === "Lookup") {
        objPropertyValue = rootNode.properties[filter.scriptname + "_id"];
      } else if (propertyType.type === "Date") {
        objPropertyValue = new Date(rootNode.properties[filter.scriptname]);
        objPropertyValue = objPropertyValue.getTime();
        let d = filter.Value;
        if (d.indexOf("{@currentDate}") !== -1) {
          d = d.split("-");
          let dateOffset = 24 * 60 * 60 * 1000 * parseInt(d[1]);
          let today = new Date();
          value = today.getTime() - dateOffset;
        } else {
          d = new Date(d);
          value = d.getTime();
        }
      } else {
        objPropertyValue = rootNode.properties[filter.scriptname];
      }
    }

    switch (filter.Operator) {
      case "=":
        return objPropertyValue == value;
      case "<":
        return objPropertyValue < value;
      case ">":
        return objPropertyValue > value;
      case "!=":
        return objPropertyValue != value;
      case "In":
        return value.indexOf(objPropertyValue) !== -1;
      default:
        return false;
    }
    return false;
  };

  cwAPI.CwHomePage.outputFirstPageOld = cwAPI.CwHomePage.outputFirstPage;
  cwAPI.CwHomePage.outputFirstPage = function(callback) {
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("homePage");
    }
    if (!config) {
      cwAPI.CwHomePage.outputFirstPageOld(callback);
      return;
    }
    config = testConfig;
    var homePage;
    var doActions = function(callback) {
      if (config.removeMyMenu === true) {
        removeMyMenuHomepage();
      }
      let homeContainer = document.querySelector("#cw-home-navigation");
      if (config.backgroundImageUrl) homeContainer.style.backgroundImage = "url(" + config.backgroundImageUrl + ")";

      var asynFunction = [];
      if (!cwAPI.isWebSocketConnected && cwApi.cwUser.isCurrentUserSocial()) asynFunction.push(cwApi.customLibs.utils.setupWebSocketForSocial);

      if (config.columns) {
        asynFunction.push(function(callback) {
          loadHomePage(config, function() {
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

  cwApi.isIndexPage = function() {
    return cwAPI.cwPageManager.getQueryString().cwtype === cwAPI.CwPageType.Index || cwApi.getCurrentView() === undefined;
  };

  cwApi.setToFullScreenAndGetNewHeight = function($container, insideHeightAtTop) {
    if (cwApi.isUndefined(insideHeightAtTop)) {
      insideHeightAtTop = 0;
    }

    var pageHeight = cwApi.getFullScreenHeight();
    if (cwApi.getCurrentView() === undefined) {
      // Calculate page height
      return $container.height();
    }

    // Margins
    var marginTop = parseInt($container.css("margin-top"), 10);
    var marginBottom = parseInt($container.css("margin-bottom"), 10);

    // Borders
    var borderTop = parseInt($container.css("border-top-width"), 10);
    var borderBottom = parseInt($container.css("border-bottom-width"), 10);

    return pageHeight - (marginTop + marginBottom + borderTop + borderBottom + insideHeightAtTop);
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
