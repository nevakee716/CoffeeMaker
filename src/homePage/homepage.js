(function (cwApi, $, cwCustomerSiteActions) {
  "use strict";

  cwCustomerSiteActions.removeMonMenu = function (rootNode, cwView) {
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

  cwCustomerSiteActions.activateLinks = function () {
    $("a.cw-menu-link").each(function () {
      var status = false;
      $(this)
        .parent()
        .find("a.cw-menu-link")
        .each(function () {
          var q = cwAPI.cwPageManager.parseQueryString($(this).prop("href"));
          var cq = cwAPI.cwPageManager.parseQueryString(window.location.href);
          if (
            q &&
            ((q.cwview && q.cwview == cq.cwview && ((q.cwtype !== "single" && q.cwtype !== "create") || q.cwid == cq.cwid)) ||
              (!cq.cwview && q.homepage == "true"))
          ) {
            status = true;
          }
        });
      if (status) $(this).addClass("activeLink");
      else $(this).removeClass("activeLink");
    });
  };




  var removeMyMenuHomepage = function (config, callback) {
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

  var manageFavAndBookmark = function (homeContainer, $scope) {
    $scope.favHTML = document.createElement("ul");
    $scope.favHTML.className = "level-0";
    $scope.quicklinkHTML = document.createElement("ul");
    $scope.quicklinkHTML.className = "level-0";

    let iToAppend = [];
    for (let i = 0; i < homeContainer.firstChild.children.length; i++) {
      if (homeContainer.firstChild.children[i].querySelector(".cwHomeFavorite")) {
        iToAppend.push(i);
      }
    }

    iToAppend.reverse().forEach(function (i) {
      $scope.favHTML.appendChild(homeContainer.firstChild.children[i]);
    });

    iToAppend = [];
    for (let i = 0; i < homeContainer.firstChild.children.length; i++) {
      if (homeContainer.firstChild.children[i].querySelector(".ot-cw_view")) {
        iToAppend.push(i);
      }
    }
    iToAppend.reverse().forEach(function (i) {
      $scope.quicklinkHTML.appendChild(homeContainer.firstChild.children[i]);
    });
  };

  var loadHomePage = function (config, containerId, callback) {
    console.log("cwApi.appliedLayouts " + cwApi.appliedLayouts.length);
    if (!cwApi.appliedLayoutsOriginal) cwApi.appliedLayoutsOriginal = $.extend(true, {}, { appliedLayouts: cwApi.appliedLayouts });
    else cwApi.appliedLayouts = $.extend(true, {}, cwApi.appliedLayoutsOriginal).appliedLayouts;
    console.log("cwApi.appliedLayouts " + cwApi.appliedLayouts.length);
    containerId = !containerId ? "cw-home-navigation" : containerId;
    cwApi.CwAsyncLoader.load("angular", function () {
      var loader = cwApi.CwAngularLoader;
      loader.setup();

      //adding angular container for homepage
      let homeContainerAngular = document.createElement("div");
      homeContainerAngular.id = "cw-home-navigation-angular";

      let homeContainer = document.getElementById(containerId);
      homeContainer.appendChild(homeContainerAngular);
      let templatePath = cwAPI.getCommonContentPath() + "/html/homePage/home.ng.html" + "?" + Math.random();
      loader.loadControllerWithTemplate("homePage", $("#cw-home-navigation-angular"), templatePath, function ($scope, $sce) {
        $scope.metamodel = cwAPI.mm.getMetaModel();

        $scope.checkIfRole = function (display) {
          if (display.roles && Object.keys(display.roles).length > 0) {
            var currentUser = cwApi.currentUser;
            for (var i = 0; i < currentUser.RolesId.length; i++) {
              if (display.roles.hasOwnProperty(currentUser.RolesId[i])) return true;
            }
            return false;
          }
          return true;
        };
        $scope.nextGenTheme = window.getComputedStyle(document.body).backgroundColor != "rgb(255, 255, 255)";
        // duplicate config to not spoil it
        $scope.config = JSON.parse(JSON.stringify(config));
        let acc = 0,
          viewLoaded = 0;
        config.columns.forEach(function (c) {
          if ($scope.checkIfRole(c)) {
            c.displays.forEach(function (d) {
              if ((d.type === "evolve_view" || d.type === "cw_user_view" || d.type === "object_view") && $scope.checkIfRole(d)) {
                acc += 1;
              }
            });
          }
        });
        $scope.keys = function (o) {
          return o ? Object.keys(o) : null;
        };
        $scope.viewToLoad = acc;
        $scope.cwApi = cwApi;
        manageFavAndBookmark(homeContainer, $scope);

        $scope.checkFilter = function (item, display) {
          if (display.hasOwnProperty("filters") && display.filters.length && display.filters.length > 0) {
            let cwFilter = new cwApi.customLibs.utils.cwFilter();
            display.filters.forEach(function (filter) {
              filter.Asset = filter.scriptname;
            });
            cwFilter.init(display.filters);
            return cwFilter.isMatching(item);
          }
          return true;
        };

        $scope.initFav = function () {
          let fav = angular.element(document.querySelector("#homePage_favorite"));
          if (fav) fav.append($scope.favHTML);
        };
        $scope.initQuickLink = function () {
          let quick = angular.element(document.querySelector("#homePage_quicklink"));
          if (quick) quick.append($scope.quicklinkHTML);
        };

        $scope.initCarrousel = function (display) {
          display.slideSelected = 0;
          display.closed = false;
        };

        $scope.nextSlide = function (display) {
          display.slideSelected += 1;
        };

        $scope.previousSlide = function (display) {
          display.slideSelected -= 1;
        };

        $scope.closeSlides = function (display) {
          display.closed = true;
        };

        $scope.getStyleForColumn = function (col) {
          return { width: col.width };
        };

        $scope.getStyleForDisplay = function (display) {
          let calcWidth = display.width;
          if (calcWidth.indexOf("%") !== -1) calcWidth = "calc(" + calcWidth + " - 1.5rem)";

          return { width: calcWidth };
        };

        $scope.getStyleForDisplayContent = function (display) {
          let calcHeight = display.height;
          if (calcHeight && calcHeight.indexOf("vh") !== -1) calcHeight = "calc(" + calcHeight + " - 70px)";
          if (display.extendable === true) {
            if (display.extended === true) {
              calcHeight = "unset";
            } else {
              calcHeight = display.height ? display.height : "0px";
            }
          }

          return { height: calcHeight };
        };

        $scope.getLinkBoxContainerStyle = function (display) {
          return { "justify-content": display.justify };
        };
        $scope.getLinkBoxStyle = function (display) {
          return { width: display.boxLinkwidth };
        };

        $scope.getEmptyZoneFromDisplay = function (display) {
          let output = '<div class="emptyZone">';
          if (display.pictureIfEmpty) output += '<img src="' + display.pictureIfEmpty + '">';
          if (display.textIfEmpty || display.descriptionIfEmpty || (display.linkIfEmpty && display.linkTextIfEmpty))
            output += "<div class='emptyZoneText'><div>";
          if (display.textIfEmpty) output += '<div class="emptyZoneTitle" >' + display.textIfEmpty + "</div>";
          if (display.descriptionIfEmpty) output += '<div class="emptyZoneDesciption">' + display.descriptionIfEmpty + "</div>";
          if (display.linkIfEmpty && display.linkTextIfEmpty) {
            output += '<span><a class="emptyLink" href="' + display.linkIfEmpty + '">' + display.linkTextIfEmpty + "</a></span>";
          }
          if (display.textIfEmpty || display.descriptionIfEmpty || (display.linkIfEmpty && display.linkTextIfEmpty)) output += "</div></div>";
          output += "</div></div>";
          return output;
        };

        $scope.createHTMLFromJSON = function (display, sync, rootNodeIDUD, objectpage) {
          let o = display.objects;
          if (!o) return;
          let schema = cwApi.ViewSchemaManager.getPageSchema(display.view);
          let rootNodeId;
          let containsItems = schema.RootNodesId.some(function (nId) {
            return o[nId] && o[nId].length > 0;
          });
          if (objectpage) {
            containsItems = Object.keys(o).some(function (assId) {
              return o[assId] && o[assId].length > 0;
            });
          }
          if (!containsItems && (display.textIfEmpty || display.descriptionIfEmpty || display.pictureIfEmpty)) {
            display.html = $scope.getEmptyZoneFromDisplay(display);
          } else {
            let rootNodeId = rootNodeIDUD ? rootNodeIDUD : schema.RootNodesId;

            if (rootNodeId.length && rootNodeId.length === 1) {
              o[rootNodeId[0]] = o[rootNodeId[0]].filter(function (o) {
                return $scope.checkFilter(o, display);
              });

              if (display.selectedSortProperty) {
                o[rootNodeId[0]].sort(function (a, b) {
                  if (display.selectedSortPropertyObj.type === "Date")
                    return new Date(b.properties[display.selectedSortProperty]) - new Date(a.properties[display.selectedSortProperty]);
                  if (display.selectedSortPropertyObj.type === "Double" || display.selectedSortPropertyObj.type === "Integer")
                    return a.properties[display.selectedSortProperty] - b.properties[display.selectedSortProperty];
                  return a.properties[display.selectedSortProperty].toString().localeCompare(b.properties[display.selectedSortProperty].toString());
                });
              }
            }
            let output = [];
            let object = { associations: o };
            if (display.object) {
              object = display.object;
              object.associations = o;
            }

            rootNodeId.forEach(function (r) {
              cwApi.cwDisplayManager.outputNode(output, cwApi.ViewSchemaManager.getPageSchema(display.view), r, object);
            });

            display.html = $sce.trustAsHtml(output.join(""));
            if (!sync) $scope.$apply();
          }

          viewLoaded += 1;
          if ($scope.viewToLoad === viewLoaded) {
            setTimeout(function () {
              cwApi.cwSiteActions.doLayoutsSpecialActions(true);
              cwCustomerSiteActions.doActionsForAll_Custom({});
            }, 6);
          }
          cwApi.cwDisplayManager.enableBehaviours(schema, o, false);
        };

        $scope.getHTMLView = function (display) {
          let jsonFile = cwApi.getIndexViewDataUrl(display.view);
          display.loading = true;
          cwApi.getJSONFile(
            jsonFile,
            function (o) {
              if (cwApi.checkJsonCallback(o)) {
                display.objects = o;
                $scope.createHTMLFromJSON(display);
              }
            },
            cwApi.errorOnLoadPage
          );
        };

        $scope.getHTMLViewForObjectView = function (display) {
          let jsonFile = cwApi.getObjectPageJsonUrl(display.view, cwAPI.getQueryStringObject().cwid);
          display.loading = true;
          cwApi.getJSONFile(
            jsonFile,
            function (o) {
              if (cwApi.checkJsonCallback(o)) {
                let v = cwAPI.getViewsSchemas()[display.view];
                let c = v.NodesByID[v.RootNodesId].SortedChildren;
                display.objects = o.object.associations;
                display.object = o.object;
                if (c && c.length > 0) {
                  $scope.createHTMLFromJSON(
                    display,
                    undefined,
                    c.map(function (n) {
                      return n.NodeId;
                    }),
                    true
                  );
                }
              }
            },
            cwApi.errorOnLoadPage
          );
        };

        $scope.getHTMLViewForCwUserView = function (display) {
          let jsonFile = cwApi.getObjectPageJsonUrl(display.view, cwApi.currentUser.ID);
          display.loading = true;
          cwApi.getJSONFile(
            jsonFile,
            function (o) {
              if (cwApi.checkJsonCallback(o)) {
                let v = cwAPI.getViewsSchemas()[display.view];
                let c = v.NodesByID[v.RootNodesId].SortedChildren;
                display.objects = o.object.associations;
                if (c && c.length > 0) {
                  $scope.createHTMLFromJSON(
                    display,
                    undefined,
                    c.map(function (n) {
                      return n.NodeId;
                    }),
                    true
                  );
                }
              }
            },
            cwApi.errorOnLoadPage
          );
        };

        $scope.getHTMLfromObject = function (display) {
          let query = {
            ObjectTypeScriptName: display.descriptionObjectTypeScriptname.toUpperCase(),
            PropertiesToLoad: ["NAME", "DESCRIPTION"],
            Where: [{ PropertyScriptName: "ID", Value: display.descriptionObjectID }],
          };

          cwApi.CwDataServicesApi.send("flatQuery", query, function (err, res) {
            if (err) {
              console.log(err);
              return;
            }
            display.html = $sce.trustAsHtml(cwApi.cwPropertiesGroups.formatMemoProperty(res[0].properties.description));
            $scope.$apply();
          });
        };

        $scope.getSelectSortProperty = function (display) {
          let props = Object.keys(display.sortProperties);
          let view = cwAPI.getViewsSchemas()[display.view];
          if (display.type === "cw_user_view") {
            let c = view.NodesByID[view.RootNodesId].SortedChildren;
            if (c && c.length > 0) {
              return props.map(function (ps) {
                return cwAPI.mm.getProperty(view.NodesByID[c[0].NodeId].ObjectTypeScriptName, ps);
              });
            }
          } else {
            return props.map(function (ps) {
              return cwAPI.mm.getProperty(view.NodesByID[view.RootNodesId[0]].ObjectTypeScriptName, ps);
            });
          }
        };

        $scope.selectNextSortProperty = function (display) {
          cwAPI.CwPopout.hide();
          let view = cwAPI.getViewsSchemas()[display.view];
          let childrenNodes;
          if (display.type === "cw_user_view") {
            childrenNodes = view.NodesByID[view.RootNodesId].SortedChildren;
            if (childrenNodes && childrenNodes.length > 0) {
              display.selectedSortPropertyObj = cwAPI.mm.getProperty(
                view.NodesByID[childrenNodes[0].NodeId].ObjectTypeScriptName,
                display.selectedSortProperty
              );
            }
          } else {
            display.selectedSortPropertyObj = cwAPI.mm.getProperty(
              view.NodesByID[view.RootNodesId[0]].ObjectTypeScriptName,
              display.selectedSortProperty
            );
          }

          display.sortPropertyLabel = display.selectedSortPropertyObj.name;

          if ($scope.viewToLoad == viewLoaded) {
            $scope.config.columns.forEach(function (c) {
              c.displays.forEach(function (d) {
                if (d.type === "evolve_view" || d.type === "cw_user_view" || d.type === "object_view") {
                  d.html = null;
                }
              });
            });
            viewLoaded = 0;
            $scope.config.columns.forEach(function (c) {
              c.displays.forEach(function (d) {
                if (d.type === "evolve_view") {
                  $scope.createHTMLFromJSON(d, true);
                }
                if (d.type === "cw_user_view") {
                  let cuview = cwAPI.getViewsSchemas()[d.view];
                  childrenNodes = cuview.NodesByID[cuview.RootNodesId].SortedChildren;
                  $scope.createHTMLFromJSON(
                    d,
                    true,
                    childrenNodes.map(function (n) {
                      return n.NodeId;
                    }),
                    true
                  );
                }
              });
            });
          }
        };

        $scope.searchForObjects = function (display) {
          let associationsCalls = [];
          let objects = [];
          display.date = { selectedDelay: 30 };
          display.date.dateIsArray = false;
          if (display.delay) {
            if (display.delay.indexOf(",")) {
              display.date.dateIsArray = true;
              display.date.dateOptions = display.delay.split(",");
              display.date.selectedDelay = display.date.dateOptions[0];
              display.date.dateOptions.sort(function (a, b) {
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

              found.forEach(function (f) {
                f = f.replace("{", "").replace("}", "");
                pToLoad.push(f.toUpperCase());
              });

              if (display.objectTypeToSelect[ots].filters) {
                display.objectTypeToSelect[ots].filters.forEach(function (f) {
                  pToLoad.push(f.scriptname);
                });
              }

              let query = {
                ObjectTypeScriptName: ots.toUpperCase(),
                PropertiesToLoad: pToLoad,
                Where: [],
              };

              let dataServiceFunction = function (callback) {
                cwApi.CwDataServicesApi.send("flatQuery", query, function (err, res) {
                  if (err) {
                    console.log(err);
                    callback(null, err);
                    return;
                  }
                  res.forEach(function (o) {
                    let timePe = "whenupdated";
                    if (display.objectTypeToSelect[o.objectTypeScriptName].timeProperty) {
                      timePe = display.objectTypeToSelect[o.objectTypeScriptName].timeProperty;
                    }
                    o.date = new Date(o.properties[timePe]);
                    o.cds = cwApi.customLibs.utils.getCustomDisplayString(display.objectTypeToSelect[o.objectTypeScriptName].cds, o);
                    o.objectTypeLabel = cwAPI.mm.getObjectType(o.objectTypeScriptName).name;

                    let r = true;
                    if (display.objectTypeToSelect[ots].filters) {
                      r = display.objectTypeToSelect[ots].filters.every(function (filter) {
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

          async.series(associationsCalls, function (err, results) {
            display.objects = objects;

            $scope.$apply();
          });
        };

        $scope.displayItemString = function (item) {
          return $sce.trustAsHtml(item);
        };

        $scope.filterDate = function (display) {
          return function (date) {
            let shouldBeDisplay = date.date > new Date() - 24 * 60 * 60 * 1000 * display.date.selectedDelay;
            if (shouldBeDisplay) {
              $("#homePageFav_" + date.objectTypeScriptName + "_" + date.object_id).show();
            } else {
              $("#homePageFav_" + date.objectTypeScriptName + "_" + date.object_id).hide();
            }
            return shouldBeDisplay;
          };
        };

        $scope.toggle = function (c, e) {
          if (c.hasOwnProperty(e)) delete c[e];
          else c[e] = true;
        };

        $scope.toggleArray = function (c, e) {
          var i = c.indexOf(e);
          if (i === -1) c.push(e);
          else c.splice(i, 1);
        };
      });
    });
  };

  var matchPropertyFilter = function (rootNode, filter) {
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
  cwAPI.CwHomePage.outputFirstPage = function (callback) {
    let config;
    if (cwAPI.customLibs.utils && cwAPI.customLibs.utils.getCustomLayoutConfiguration) {
      config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("homePage");
    }
    if (!config) {
      cwAPI.CwHomePage.outputFirstPageOld(callback);
      return;
    }

    var homePage;
    var doActions = function (callback) {
      if (config.removeMyMenu === true) {
        removeMyMenuHomepage();
      }
      let homeContainer = document.querySelector("#cw-home-navigation");
      if (config.backgroundImageUrl) homeContainer.style.backgroundImage = "url(" + config.backgroundImageUrl + ")";

      var asynFunction = [];
      if (!cwAPI.isWebSocketConnected && cwApi.cwUser.isCurrentUserSocial()) asynFunction.push(cwApi.customLibs.utils.setupWebSocketForSocial);
      cwAPI.customLibs.doActionForAll.activateLinks();
      if (config.columns && config.columns.length > 0) {
        asynFunction.push(function (callback) {
          loadHomePage(config, null, function () {
            callback(null, err);
          });
        });
      } else {
        cwAPI.CwHomePage.outputFirstPageOld(callback);
      }
      async.series(asynFunction, function (err, results) {
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
        cwApi.CwBookmarkManager.outputFavourites(function () {
          homePage.showLeveL0();
          cwApi.CwHomePage.outputHomePageCustom();
          cwApi.pluginManager.execute("outputHomePageCustom");

          return doActions(callback);
        });
      }
    } else {
      homePage.handleOfflineHomePage(function () {
        cwApi.CwHomePage.outputHomePageCustom();
        return doActions(callback);
      });
    }
    cwApi.CwPopout.init();

    callback(null);
  };

  cwApi.isIndexPage = function () {
    return cwAPI.cwPageManager.getQueryString().cwtype === cwAPI.CwPageType.Index || cwApi.getCurrentView() === undefined;
  };

  cwApi.setToFullScreenAndGetNewHeight = function ($container, insideHeightAtTop) {
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

  if (cwAPI.customLibs.doActionForAll === undefined) {
    cwAPI.customLibs.doActionForAll = {};
  }
  cwAPI.customLibs.loadHomePage = loadHomePage;

  cwAPI.customLibs.doActionForAll.closePopout = cwAPI.CwPopout.hide;
  cwAPI.customLibs.doActionForAll.activateLinks = cwCustomerSiteActions.activateLinks;
  cwAPI.customLibs.doActionForAll.removeMonMenu = cwCustomerSiteActions.removeMonMenu;
})(cwAPI, jQuery, cwCustomerSiteActions);
