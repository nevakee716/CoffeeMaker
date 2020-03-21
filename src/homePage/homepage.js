(function(cwApi, $, cwCustomerSiteActions) {
  "use strict";

  var testConfig = {
    removeMyMenu: true,
    columns: [
      {
        label: "Column 0",
        displays: [
          {
            label: "Display 0",
            order: 1,
            width: "100%",
            selected: true,
            type: "links_in_bloc",
            justify: "space-between",
            boxLinkwidth: "100px",
            expendable: false,
            expended: true,
            linksToDisplay: [
              {
                imgUrl: "https://www.online-learning-college.com/wp-content/uploads/2016/02/business-gcse-course.jpg",
                order: 1,
                Label: "Processus",
                targetUrl: "#cwtype=index&cwview=index_processus&lang=fr",
              },
              {
                imgUrl: "https://specialist-wanted.com/wp-content/uploads/2019/09/Business-Plan-Specialist-Wanted-300x300.jpg",
                order: 2,
                Label: "Application",
                targetUrl: "#cwtype=index&cwview=index_portefeuilles_applicatifs&lang=fr",
              },
              {
                imgUrl: "https://blogs.mulesoft.com/wp-content/uploads/business-agility-300x300.jpg",
                order: 3,
                Label: "Risque",
                targetUrl: "#/cwtype=index&cwview=index_risques&lang=fr&cwtabid=tab1",
              },
              {
                imgUrl: "https://www.focusur.fr/wp-content/uploads/2017/12/business-strategy-300x300.jpg",
                order: 4,
                Label: "Projet",
                targetUrl: "#/cwtype=single&cwview=objectif&lang=fr&cwid=24&cwtabid=tab2",
              },
              {
                imgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcR79pLCqxVv5FMqijzUBU7uYGjizYkZJHn5ARZpGnrY76w7e04r",
                order: 5,
                Label: "Parcours Client",
                targetUrl: "#cwtype=index&cwview=index_parcours_candidat&lang=fr",
              },
              {
                imgUrl:
                  "data:image/jpeg;base64,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",
                order: 11,
                Label: "Processus 2",
                targetUrl: "#cwtype=index&cwview=index_processus&lang=fr",
              },
              {
                imgUrl: "https://www.rts.ch/2012/11/20/14/43/4446800.image?w=300&h=300",
                order: 12,
                Label: "Application 2",
                targetUrl: "#cwtype=index&cwview=index_portefeuilles_applicatifs&lang=fr",
              },
              {
                imgUrl: "https://sloanreview.mit.edu/content/uploads/2017/12/LE-Siegel-Office-Seating-Chart-Plan-Leadership-1200-300x300.jpg",
                order: 13,
                Label: "Risque 2 ",
                targetUrl: "#/cwtype=index&cwview=index_risques&lang=fr&cwtabid=tab1",
              },
              {
                imgUrl:
                  "data:image/jpeg;base64,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",
                order: 14,
                Label: "Projet 2",
                targetUrl: "#/cwtype=single&cwview=objectif&lang=fr&cwid=24&cwtabid=tab2",
              },
              {
                imgUrl: "https://www.formation-cad.com/wp-content/uploads/2019/03/Formation-CAD-Montreal-Laval-300x300.jpg",
                order: 15,
                Label: "Parcours Client 2",
                targetUrl: "#cwtype=index&cwview=index_parcours_candidat&lang=fr",
              },
            ],
          },
          {
            label: "Favourites",
            order: 1,
            width: "50%",
            height: "180px",
            selected: true,
            type: "favorite",
            expendable: true,
            expended: false,
          },
          {
            label: "Quick Links",
            order: 1,
            width: "50%",
            height: "220px",
            selected: true,
            type: "quicklink",
            expendable: true,
            expended: true,
          },
          {
            label: "Bienvenue dans le référentiel d'architecture d'entreprise.",
            order: 2,
            width: "100%",
            selected: true,
            type: "object_description",
            descriptionObjectTypeScriptname: "aidedarchitecture",
            descriptionObjectID: 79,
            expendable: true,
            expended: false,
          },
          {
            label: "Arborescence",
            order: 5,
            selected: false,
            type: "evolve_view",
            view: "index_test_home",
            width: "200px",
            height: "500px",
            expendable: true,
            expended: false,
          },
          {
            label: "Cartographie Processus",
            order: 4,
            selected: false,
            type: "evolve_view",
            view: "index_test_home1",
            width: "500px",
            expendable: true,
            expended: true,
          },
          {
            label: "Vue Evolve",
            order: 50,
            objectTypeToSelect: [],
            selected: false,
            type: "evolve_view",
            view: "index_test_home2",
            width: "800px",
            height: "300px",
            expendable: true,
            expended: true,
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
            delay: "999,100,200",
            cdsSelected: "activité",
            width: "100%",
            expendable: false,
            expended: true,
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
            menu.parentElement.parentElement.parentElement.parentElement.parentElement.removeChild(
              menu.parentElement.parentElement.parentElement.parentElement
            );
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
      var homeContainerAngular = document.createElement("div");
      homeContainerAngular.id = "cw-home-navigation-angular";

      var homeContainer = document.getElementById("cw-home-navigation");
      homeContainer.append(homeContainerAngular);
      //homeContainer.firstChild.className += " cw-hidden";

      let templatePath = cwAPI.getCommonContentPath() + "/html/homePage/home.ng.html" + "?" + Math.random();
      loader.loadControllerWithTemplate("homePage", $("#cw-home-navigation-angular"), templatePath, function($scope, $sce) {
        $scope.metamodel = cwAPI.mm.getMetaModel();

        // duplicate config to not spoil it
        $scope.config = JSON.parse(JSON.stringify(config));
        $scope.cwApi = cwApi;

        $scope.getStyleForColumn = function(col) {
          return { width: col.width };
        };

        setTimeout(function() {
          var favHTML = document.createElement("ul");
          favHTML.className = "level-0";

          var quicklinkHTML = document.createElement("ul");
          quicklinkHTML.className = "level-0";

          let iToAppend = [];
          for (let i = 0; i < homeContainer.firstChild.children.length; i++) {
            if (homeContainer.firstChild.children[i].querySelector(".cwHomeFavorite")) {
              iToAppend.push(i);
            }
          }

          iToAppend.reverse().forEach(function(i) {
            favHTML.append(homeContainer.firstChild.children[i]);
          });

          iToAppend = [];
          for (let i = 0; i < homeContainer.firstChild.children.length; i++) {
            if (homeContainer.firstChild.children[i].querySelector(".ot-cw_view")) {
              iToAppend.push(i);
            }
          }
          iToAppend.reverse().forEach(function(i) {
            quicklinkHTML.append(homeContainer.firstChild.children[i]);
          });

          let fav = angular.element(document.querySelector("#homePage_favorite"));
          if (fav) fav.append(favHTML);

          let quick = angular.element(document.querySelector("#homePage_quicklink"));
          if (quick) quick.append(quicklinkHTML);
        }, 1500);

        $scope.getFavElement = function() {};

        $scope.getStyleForDisplay = function(display) {
          let calcWidth = display.width;
          if (calcWidth.indexOf("%") !== -1) calcWidth = "calc(" + calcWidth + " - 10px)";

          let calcHeight = display.height;
          if (calcHeight && calcHeight.indexOf("vh") !== -1) calcHeight = "calc(" + calcHeight + " - 70px)";
          if (display.expendable) {
            if (display.expended === true) {
              calcHeight = "unset";
            } else {
              calcHeight = display.height ? display.height : "0px";
            }
          }

          return { width: calcWidth };
        };

        $scope.getStyleForDisplayContent = function(display) {
          let calcWidth = display.width;
          if (calcWidth.indexOf("%") !== -1) calcWidth = "calc(" + calcWidth + " - 10px)";

          let calcHeight = display.height;
          if (calcHeight && calcHeight.indexOf("vh") !== -1) calcHeight = "calc(" + calcHeight + " - 70px)";
          if (display.expendable) {
            if (display.expended === true) {
              calcHeight = "unset";
            } else {
              calcHeight = display.height ? display.height : "0px";
            }
          }

          return { height: calcHeight };
        };

        $scope.getLinkBoxContainerStyle = function(display) {
          return { "justify-content": display.justify };
        };
        $scope.getLinkBoxStyle = function(display) {
          return { width: display.boxLinkwidth };
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
            Where: [{ PropertyScriptName: "ID", Value: display.descriptionObjectID }],
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
              display.date.dateOptions = display.delay.split(",");
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
