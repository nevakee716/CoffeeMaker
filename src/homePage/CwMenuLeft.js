/* Copyright � 2012-2017 erwin, Inc. - All rights reserved */
/*global cwAPI, $*/

(function (cwApi) {
  "use strict";

  cwApi.cwMenuLeft = (function () {
    var collapseClass, menuToggleClass, menuStateStorageKeyPrefix, menuId, init, load, toggleMenuState, removeMenu, menuUpdated, closeOpenItems;

    collapseClass = "main-menu-collapsed";

    menuToggleClass = "menu-toggle";

    menuStateStorageKeyPrefix = "menu-collapsed";

    function getMenuStateStorageKey() {
      if (cwApi.isLive()) {
        return menuStateStorageKeyPrefix + "-" + cwApi.currentUser.ID;
      }

      return menuStateStorageKeyPrefix;
    }

    function setMenuStateStorage(collapsed) {
      var key = getMenuStateStorageKey();

      localStorage.setItem(key, collapsed);
    }

    function getMenuStateStorage() {
      var key, menuCollapsed;

      key = getMenuStateStorageKey();

      menuCollapsed = localStorage.getItem(key);

      if (cwApi.isNull(menuCollapsed)) {
        menuCollapsed = false;
      }

      return JSON.parse(menuCollapsed);
    }

    function collapseMenu() {
      setMenuStateStorage(true);

      $("." + menuToggleClass).attr("title", $.i18n.prop("menu_showMenu"));

      $("body").addClass(collapseClass);
    }

    function expandMenu() {
      setMenuStateStorage(false);

      $("." + menuToggleClass).attr("title", $.i18n.prop("menu_collapseMenu"));

      $("body").removeClass(collapseClass);
    }

    function outputMobileTasksAndNotifications(o) {
      var taskCount, notificationCount;

      taskCount = cwApi.CwWorkflowTaskManager.getDisplayTaskCount();
      notificationCount = cwApi.CwWorkflowNotificationManager.getDispayNotificationCount();

      if (notificationCount === 0) {
        o.push(
          '<li class="btn-mobile-notifications"><a href="#"><i class="fa fa-bell-o cwMenuIcon"></i><span class="btn-text">',
          $.i18n.prop("workflow_notifications"),
          "</span> <span></span></a></li>"
        );
      } else {
        o.push(
          '<li class="btn-mobile-notifications"><a href="#"><i class="fa fa-bell-o cwMenuIcon"></i><span class="btn-text">',
          $.i18n.prop("workflow_notifications"),
          '</span> <span class="badge">',
          notificationCount,
          "</span></a></li>"
        );
      }

      if (taskCount === 0) {
        o.push(
          '<li class="btn-mobile-tasks"><a href="#"><i class="fa fa-check-square-o cwMenuIcon"></i><span class="btn-text">',
          $.i18n.prop("user_tasks"),
          "</span> <span></span></a></li>"
        );
      } else {
        o.push(
          '<li class="btn-mobile-tasks"><a href="#"><i class="fa fa-check-square-o cwMenuIcon"></i><span class="btn-text">',
          $.i18n.prop("user_tasks"),
          '</span> <span class="badge">',
          taskCount,
          "</span></a></li>"
        );
      }
    }

    function outputUser(o, currentUser) {
      var userName;

      userName = currentUser.FullName;

      o.push('<ul class="mobile-menu">');

      if (cwApi.isWorkflowEnabled() && !cwApi.isModelSelectionPage()) {
        outputMobileTasksAndNotifications(o);
      }

      if (!cwApi.isModelSelectionPage()) {
        if (cwApi.isGlobalSearchEnabled() === true) {
          o.push(
            '<li class="btn-mobile-global-search"><a href="',
            cwApi.getServerPath(),
            '"><i class="icon fa fa-search"></i> <span class="btn-text">',
            $.i18n.prop("NavigationGlobalSearch"),
            "</span></a></li>"
          );
        }
      }

      o.push('<li class="btn-mobile-profile"><a href="#"><i class="icon fa fa-user"></i> <span class="btn-text">', userName, "</span></a></li>");

      if (!cwApi.isModelSelectionPage()) {
        o.push(
          '<li class="btn-mobile-evolve-sites"><a href="',
          cwApi.getServerPath(),
          '"><i class="icon fa fa-sitemap"></i> <span class="btn-text">',
          $.i18n.prop("NavigationGoToEvolveSitesInModelPage"),
          "</span></a></li>"
        );
      }

      o.push("</ul>");
      o.push('<div class="profile collapsed">');
      o.push('<table class="user">');
      o.push("<tr>");
      o.push("<td>");
      o.push(
        '<div class="avatar"><img src="',
        cwApi.cwUser.getUserPicturePathByUserName(currentUser.Name),
        '" width="50" height="50" alt="Avatar"></div>'
      );
      o.push("</td>");
      o.push('<td><div class="name" title="', userName.trim(), '">', userName.trim(), "</div></td>");
      o.push("</tr>");
      o.push("</table>");
      o.push('<ul class="', cwApi.isWindowsAuthentication() ? "cw-profile-windows-authentication" : "", '">');
      o.push(
        '<li><a title="',
        $.i18n.prop("user_profile"),
        '" href="',
        cwApi.getSingleViewHash("user", currentUser.ID),
        '">',
        $.i18n.prop("user_profile"),
        "</a></li>"
      );
      if (!cwApi.isWindowsAuthentication() && !cwApi.isSamlAuthentication()) {
        o.push('<li><a title="', $.i18n.prop("user_logout"), '" href="#" class="cw-user-logout">', $.i18n.prop("user_logout"), "</a></li>");
      }
      o.push("</ul>");
      o.push("</div>");
    }

    function generateAbbreviation(text) {
      var abbr, split, i;

      abbr = [];

      split = text.split(" ");

      for (i = 0; i < split.length && i < 3; i += 1) {
        abbr.push(split[i].substring(0, 1));
      }

      return abbr.join("");
    }

    function outputMenuZone(o, type, href, viewName, title, icon, badgeNum, badgeNumMaxExceeded) {
      var titleAbbr, view, hasIcon;

      view = cwApi.getView(viewName);
      if (viewName && viewName.length && viewName.indexOf("redirect§") !== -1) {
        let s = viewName.split("§");
        if (s[0]) {
          let i = parseInt(s[2]);
          if (i !== i) o.push('<a class="cw-menu-link" href="#/cwtype=single&cwview=', s[1], "&cwuuid=", s[2], '">');
          else o.push('<a class="cw-menu-link" href="#/cwtype=single&cwview=', s[1], "&cwid=", s[2], '">');
        }
      } else if (viewName === "homepage") {
        o.push('<a class="cw-menu-link" href="#/homepage=true">');
      } else if (viewName === "separator") {
        o.push('<a class="separatorMenu" href="#/homepage=true">');
      } else {
        o.push('<a class="cw-menu-link" href="', href, '">');
      }

      o.push('<ul class="cw-menu-text-zone">');
      if (icon !== null) {
        o.push('<li class="cw-menu-text-zone cw-menu-icon-zone" title="', title, '">');
        o.push(icon);
        o.push("</li>");
      } else {
        if (type === "menu") {
          o.push('<li class="cw-menu-text-zone cw-menu-icon-zone cw-abbr"><div class="cw-text-abbr" title="', title, '">');

          titleAbbr = generateAbbreviation(title);

          o.push(titleAbbr);

          o.push("</div></li>");
        } else if (!cwApi.isUndefined(view) && view.ImageLibrary === "Custom") {
          hasIcon = view.Image !== "No Icon";

          o.push('<li class="cw-menu-text-zone cw-menu-icon-zone ', hasIcon ? "" : "no-icon", '" >');
          if (hasIcon) {
            cwApi.cwLayouts.cwLayoutWDAppList.outputViewImage(o, viewName, "cwIconMini");
          }
          o.push("</li>");
        } else {
          o.push('<li class="cw-menu-text-zone cw-menu-icon-zone no-icon"><div class="cwIconMini cwIconEmpty"></div></li>');
        }
      }

      o.push('<li class="cw-menu-text-zone">');
      o.push('<div class="menuText">', title, "</div>");
      o.push("</li>");
      o.push('<li class="cw-menu-text-zone cw-menu-badge-zone">');
      if (cwAPI.cwConfigs.EnabledVersion.indexOf("v2020.") === -1) {
        if (!cwApi.isUndefined(badgeNum) && badgeNum > 0) {
          o.push('<span class="badge numericFont">', badgeNum, badgeNumMaxExceeded === true ? "+" : "", "</span>");
        }
      } else {
        if (!cwApi.isUndefined(badgeNum)) {
          if (badgeNum <= 0) {
            o.push('<span style="display:none;" class="badge numericFont">', badgeNum, badgeNumMaxExceeded === true ? "+" : "", "</span>");
          } else {
            o.push('<span class="badge numericFont">', badgeNum, badgeNumMaxExceeded === true ? "+" : "", "</span>");
          }
        }
      }
      o.push("</li>");
      o.push('<li class="cw-menu-text-zone cw-menu-arrow-zone">');
      o.push('<div class="cw-menu-arrow"></div>');
      o.push("</li>");
      o.push("</ul>");
      o.push("</a>");
    }

    function outputListTasks(output) {
      var tasks, task, due, overdue, calendarDate, receivedDate, i;

      tasks = cwApi.CwWorkflowTaskManager.getUnreadTaskList();
      output.push('<li class="list list-tasks cw-menu-zone">');
      outputMenuZone(
        output,
        "special",
        "#",
        null,
        $.i18n.prop("user_tasks"),
        '<i class="fa fa-check-square-o cwMenuIcon"></i>',
        cwApi.CwWorkflowTaskManager.getDisplayTaskCount(),
        cwApi.CwWorkflowTaskManager.exceedsMaximum()
      );
      output.push('<ul class="sub-level task-list">');

      if (tasks.length > 0) {
        for (i = 0; i < tasks.length; i += 1) {
          task = tasks[i];

          due = cwApi.CwWorkflowTaskManager.isDue(task.DueDate);
          overdue = cwApi.CwWorkflowTaskManager.isOverdue(task.DueDate);
          calendarDate = cwApi.CwWorkflowTaskManager.dateToDayAndMonth(task.DueDate);
          receivedDate = cwApi.CwWorkflowTaskManager.dateToDateAndTime(task.StartDate);
          cwApi.CwWorkflowTaskManager.outputToDoTask(
            output,
            task.Id,
            task.Subject,
            calendarDate.month,
            calendarDate.day,
            task.Sender.DisplayName,
            receivedDate.date,
            receivedDate.time,
            cwApi.cwUser.getUserPicturePathByUserName(task.Sender.UserName),
            overdue,
            due,
            task.WorkflowType,
            task.Delegated,
            "",
            true,
            task.IsInvalid
          );
          cwApi.CwViewTask.registerMenuElementForShowTask(task.Id);
        }
      } else {
        cwApi.CwWorkflowTaskManager.outputNoTasksMenuItem(output);
      }
      output.push('<li class="see-all"><a href="', cwApi.getSimplePageHash("cwworkflowtasks"), '">', $.i18n.prop("tasks_seealltasks"), "</a></li>");
      output.push("</ul>");
      output.push("</li>");
    }

    function outputListNotifications(output) {
      var notifications, notification, i, sendDate;

      notifications = cwApi.CwWorkflowNotificationManager.getUnreadNotificationList();
      output.push('<li id="notifications-list" class="list list-notifications cw-menu-zone">');
      outputMenuZone(
        output,
        "special",
        "#",
        null,
        $.i18n.prop("workflow_notifications"),
        '<i class="fa fa-bell-o cwMenuIcon"></i>',
        cwApi.CwWorkflowNotificationManager.getDispayNotificationCount(),
        cwApi.CwWorkflowNotificationManager.exceedsMaximum()
      );
      output.push('<ul class="sub-level notification-list">');

      if (notifications && notifications.length > 0) {
        for (i = 0; i < notifications.length; i += 1) {
          notification = notifications[i];
          sendDate = cwApi.CwWorkflowNotificationManager.formatDate(notification.SendDate);
          if (cwAPI.cwConfigs.EnabledVersion.indexOf("v2020.") === -1) {
            cwApi.CwWorkflowNotificationManager.outputNotificationItem(
              notification.Id,
              output,
              notification.Subject,
              sendDate,
              notification.Sender,
              false
            );
            cwApi.CwViewNotification.registerMenuElementForShowNotification(notification.Id);
          } else {
            cwApi.CwWorkflowNotificationManager.outputNotificationItem(notification, output, sendDate, notification.Sender, false);
            cwApi.CwViewNotification.registerMenuElementForShowNotification(notification);
          }
        }
      } else {
        cwApi.CwWorkflowNotificationManager.outputNoNotificationsMenuItem(output);
      }
      output.push(
        '<li class="see-all"><a href="',
        cwApi.getSimplePageHash("cwworkflownotifications"),
        '">',
        $.i18n.prop("notifications_seeallnotifications"),
        "</a></li>"
      );
      output.push("</ul>");
      output.push("</li>");
    }

    function outputSubFavourites(favourites, o) {
      var i, totalUnreadCountForObjectType, favourite, unreadCount;
      totalUnreadCountForObjectType = 0;
      for (i = 0; i < favourites.length; i += 1) {
        favourite = favourites[i];
        unreadCount = favourite.properties.cwtotalcomment - favourite.iProperties.cwviewedcomments;

        totalUnreadCountForObjectType = totalUnreadCountForObjectType + unreadCount;
        o.push('<li class="cw-menu-zone">');
        outputMenuZone(
          o,
          "special",
          cwApi.getSingleViewHash(favourite.objectTypeScriptName, favourite.object_id),
          null,
          favourite.name,
          null,
          unreadCount
        );
        o.push("</li>");
      }
      return totalUnreadCountForObjectType;
    }

    function outputListFavourites(output) {
      var favourites, favouritesByObjectType, o, totalUnreadCountForObjectType, totalFavoruites, outputLevel1, key;

      totalFavoruites = 0;
      favouritesByObjectType = cwApi.CwBookmarkManager.getFavouriteList();
      outputLevel1 = [];

      for (key in favouritesByObjectType) {
        if (favouritesByObjectType.hasOwnProperty(key)) {
          o = [];

          outputLevel1.push('<li class="cw-menu-zone">');
          favourites = favouritesByObjectType[key];
          totalUnreadCountForObjectType = outputSubFavourites(favourites, o);
          totalFavoruites = totalFavoruites + totalUnreadCountForObjectType;
          outputMenuZone(outputLevel1, "special", "#", null, cwApi.mm.getObjectType(key).name, null, totalUnreadCountForObjectType);
          outputLevel1.push('<ul class="sub-level">');
          outputLevel1.push('<li class="btn-back"><a href="#">', $.i18n.prop("menu_back"), "</a></li>");
          outputLevel1.push(
            '<li class="btn-mobile-back backlnk"><a class="cw-menu-link" href="#"><i class="fa fa-backward"></i><span>',
            $.i18n.prop("menu_back"),
            "</span></a></li>"
          );
          $.merge(outputLevel1, o);
          outputLevel1.push("</ul>");
          outputLevel1.push("</li>");
        }
      }

      output.push('<li class="list-favourites cw-menu-zone">');
      outputMenuZone(output, "special", "#", null, $.i18n.prop("user_goFavorites"), '<i class="fa fa-heart-o cwMenuIcon"></i>', totalFavoruites);
      output.push('<ul class="sub-level">');
      output.push(
        '<li class="btn-mobile-back backlnk"><a class="cw-menu-link" href="#"><i class="fa fa-backward"></i><span>',
        $.i18n.prop("menu_back"),
        "</span></a></li>"
      );
      $.merge(output, outputLevel1);
      output.push("</ul>");
      output.push("</li>");
    }

    function outputMenuItem(o, menu, level) {
      var backText, i;
      o.push('<li class="cw-menu-zone">');

      var icon = null;

      if (!cwApi.isUndefined(menu.iconClassName) && menu.iconClassName !== "No Icon") {
        if (menu.iconLibrary === "Evolve Icon Library") {
          icon = '<i class="cwf ' + menu.iconClassName + ' cwMenuIcon" style="color:' + menu.iconColor + '"></i>';
        } else if (menu.iconLibrary === "Font Awesome Icon Library") {
          icon = '<i class="fa ' + menu.iconClassName + ' cwMenuIcon" style="color:' + menu.iconColor + '"></i>';
        }
      }

      outputMenuZone(o, menu.type, menu.href, menu.view, menu.title, icon);

      if (menu.Children.length > 0) {
        o.push('<ul class="sub-level">');

        backText = $.i18n.prop("menu_back");
        if (level > 0) {
          backText = $.i18n.prop("menu_back") + " " + menu.title;
        }

        o.push(
          '<li class="btn-mobile-back backlnk"><a class="cw-menu-link" href="#"><i class="fa fa-backward"></i><span>',
          backText,
          "</span></a></li>"
        );
        o.push('<li class="btn-back"><a href="#">', $.i18n.prop("menu_back"), "</a></li>");
        for (i = 0; i < menu.Children.length; i += 1) {
          if (!cwApi.isUndefined(i)) {
            outputMenuItem(o, menu.Children[i], level + 1);
          }
        }
        o.push("</ul>");
      }
      o.push("</li>");
    }

    function outputMenu(links, o) {
      var i, menu;
      o.push('<ul id="main_menu" class="main-level collapsed">');

      if (cwApi.isModelSelectionPage() === false) {
        if (cwApi.isLive()) {
          if (cwApi.cwConfigs.EnabledVersion.indexOf("v2020.") !== -1) {
            outputListNotifications(o);
            if (cwApi.isWorkflowEnabled()) outputListTasks(o);
          } else if (cwApi.isWorkflowEnabled()) {
            outputListNotifications(o);
            outputListTasks(o);
          }

          if (cwApi.cwConfigs.SocialSiteDefinition.FavouritesEnabled) {
            outputListFavourites(o);
          }
        }
      }
      cwApi.pluginManager.execute("CwMenuLeft.outputMenuBeforeItems", o);
      for (i = 0; i < links.length; i += 1) {
        menu = links[i];
        if (menu && (menu.Children.length > 0 || menu.type === "index")) {
          outputMenuItem(o, menu, 0);
        }
      }
      o.push('<li class="btn-back"><a href="#">', $.i18n.prop("menu_back"), "</a></li>");
      o.push("</ul>");
      o.push(
        '<div class ="cw-version" title = "' +
          cwApi.cwConfigs.EnabledVersion +
          '"><i class="fa fa-info-circle" aria-hidden="true"></i><span class="cw-version-text cw-hidden">' +
          cwApi.cwConfigs.EnabledVersion +
          "</span></div>"
      );
    }

    function applyMenuJavascript() {
      var menuCollapsed;

      menuCollapsed = getMenuStateStorage();

      /*jslint browser:true*/
      $(document).on("click", ".btn-show-page-menu", function (e) {
        e.preventDefault();
        cwApi.cwDisplayManager.removeContentPage();
      });

      $("li.cw-menu-zone:has(ul.sub-level) > a").addClass("hassub");

      /* Remove menu items which have no children due to access rights */
      $('li.cw-menu-zone > a:not(.hassub)[href="#"]').closest(".cw-menu-zone").remove();

      $(".main-level li.cw-menu-zone:has(ul.sub-level) > a").on("click", function (e) {
        var $this, $mainMenu;
        cwApi.CwPopout.scrollContentToTop();
        $this = $(this);
        $mainMenu = $("#main_menu");
        e.preventDefault();
        if ($this.parent().hasClass("active")) {
          $this.parent().removeClass("active");
          $this.closest(".sub-level").removeClass("subopen");
          $this.closest("ul").closest(".subsubopen").removeClass("subsubopen");
          $mainMenu.removeClass("mobile-open");
          $mainMenu.trigger("menu-close");
        } else {
          $this.parent().siblings().removeClass("active").find("li").removeClass("active subopen");
          $this.parent().addClass("active");
          $this.parents(".sub-level").addClass("subopen");
          $this.closest(".sub-level").parents("ul").addClass("subsubopen");
          $mainMenu.addClass("mobile-open");
          $mainMenu.trigger("menu-open");
        }
        if ($("#main_menu > li").is(".active")) {
          $(".content").addClass("menu-open");
        } else {
          $(".content").removeClass("menu-open");
        }
        $(".sub-menu").equalHeights();
      });

      $(".btn-back a").on("click", function (e) {
        var $this = $(this);
        e.preventDefault();
        $this.closest(".subsubopen").find(".active .active, .active .subopen").removeClass("active subopen");
        $this.closest(".subsubopen").removeClass("subsubopen").find(".subsubopen").removeClass("subsubopen");
        $(".sub-menu").equalHeights();
      });

      // Mobile menu
      $(".btn-mobile-menu").on("click", function (e) {
        e.preventDefault();
        $(".profile").addClass("collapsed");
        $("#global-search-container").addClass("collapsed");
        $(".gs-results-background").removeClass("open");
        $("#main_menu").removeClass("open-notifications open-tasks");
        $("#main_menu").toggleClass("collapsed");
      });

      $(".btn-mobile-back a").on("click", function (e) {
        e.preventDefault();
        $(this)
          .parent()
          .parent()
          .parent()
          .removeClass("active")
          .parent()
          .removeClass("subopen mobile-open")
          .parent()
          .parent()
          .removeClass("subsubopen");
      });

      // Profile, Search and Notifications
      $(".btn-mobile-profile").on("click", function (e) {
        e.preventDefault();
        $("#global-search-container").addClass("collapsed");
        $(".gs-results-background").removeClass("open");
        $("#main_menu").addClass("collapsed").removeClass("open-notifications open-tasks");
        $(".profile").toggleClass("collapsed");
      });

      $(".btn-mobile-global-search").on("click", function (e) {
        e.preventDefault();
        $("#main_menu").addClass("collapsed").removeClass("open-notifications open-tasks");
        $(".profile").addClass("collapsed");
        $("#global-search-container").toggleClass("collapsed").find("input").focus();
        if ($("#global-search-container").hasClass("collapsed") || !$("#global-search-container .gs-box ul").hasClass("gs-buttons-all")) {
          $(".gs-results-background").removeClass("open");
        } else {
          if ($("#global-search-container .gs-box ul button i").hasClass("fa-chevron-up")) {
            $(".gs-results-background").addClass("open");
          }
        }
      });

      $(".btn-mobile-tasks").on("click", function (e) {
        e.preventDefault();
        $(".profile").addClass("collapsed");
        $("#global-search-container").addClass("collapsed");
        $(".gs-results-background").removeClass("open");
        $("#main_menu").addClass("collapsed").removeClass("open-notifications");
        $("#main_menu").toggleClass("open-tasks");
      });

      $(".btn-mobile-notifications").on("click", function (e) {
        e.preventDefault();
        $(".profile").addClass("collapsed");
        $("#global-search-container").addClass("collapsed");
        $(".gs-results-background").removeClass("open");
        $("#main_menu").addClass("collapsed").removeClass("open-tasks");
        $("#main_menu").toggleClass("open-notifications");
      });

      // Content
      $(".content").on("click", function () {
        $(this).removeClass("menu-open");
        $("#main_menu").removeClass("open-notifications open-tasks mobile-open").addClass("collapsed");
        $(".main-nav ul").removeClass("subopen subsubopen");
        $(".main-nav li").removeClass("active");
        $(".profile").addClass("collapsed");
      });

      $(".page-content").on("click", function () {
        $("body").removeClass("discuss-open");
      });

      $(".sub-menu").equalHeights();

      $("." + menuToggleClass).on("click", function () {
        hideVersion();
        cwApi.cwMenuLeft.toggleMenuState();
      });

      $(".cw-version").on("click", function () {
        var span = $(".cw-version").find("span"),
          visibility = span.hasClass("cw-hidden"),
          isMenuCollapsed = $(".main-menu-collapsed").length === 1;
        if (!isMenuCollapsed) {
          if (visibility) {
            span.removeClass("cw-hidden");
          } else {
            span.addClass("cw-hidden");
          }
        }
      });

      if (menuCollapsed === true) {
        collapseMenu();
      } else {
        expandMenu();
      }
    }

    function hideVersion() {
      if (!$(".cw-version").find("span").hasClass("cw-hidden")) {
        $(".cw-version").find("span").addClass("cw-hidden");
      }
    }

    function applyActionsJavascript() {
      $(".cw-user-logout").on("click", function () {
        cwApi.userManager.logout();
      });

      cwApi.pluginManager.execute("CwMenuLeft.applyActionsJavascript");

      // Global Search
      if (cwApi.isModelSelectionPage() === false) {
        if (cwApi.isGlobalSearchEnabled() === true) {
          cwApi.GlobalSearch.init();
        }
      }
    }

    init = function () {
      $("body").addClass("menuLeft");
    };

    load = function () {
      if ($("#nav-container").length > 0) {
        return false;
      }

      var output, menus;

      output = [];

      output.push('<div id="nav-container">');

      if (!cwApi.isModelSelectionPage()) {
        output.push('<div class="fa fa-bars btn-mobile-menu"></div>');
      }

      output.push('<div class="logo ', cwApi.isModelSelectionPage() ? "modelSelection" : "", '">');
      output.push('<a href="#">Casewise</a>');
      output.push("</div>");

      menus = cwApi.CwMenuData.mainMenu;

      if (cwApi.isLive()) {
        outputUser(output, cwApi.currentUser);
        menus = menus.concat(cwApi.CwMenuData.getRolesMenuLinks());
      }

      output.push('<div class="menu-toggle-container"><div class="', menuToggleClass, '"><i class="fa fa-bars"></i></div></div>');

      if (cwApi.isModelSelectionPage() === false) {
        if (cwApi.isGlobalSearchEnabled() === true) {
          cwApi.GlobalSearch.outputContainer(output);
        }
      }

      outputMenu(menus, output);
      output.push("</div>");
      $("#main-nav").html(output.join(""));
      applyMenuJavascript();
      applyActionsJavascript();
    };

    toggleMenuState = function () {
      var $body = $("body");

      if ($body.hasClass(collapseClass)) {
        expandMenu();
      } else {
        collapseMenu();
      }
    };

    removeMenu = function (callback) {
      $("#main-nav").html("");
      $("#nav-container").remove();
      if (cwApi.isFunction(callback)) {
        return callback(null);
      }
    };

    menuUpdated = function () {
      return undefined;
    };

    closeOpenItems = function () {
      $(".content").removeClass("menu-open");

      $(".cw-menu-zone.active").removeClass("active");
    };

    return {
      init: init,
      loadMenu: load,
      removeMenu: removeMenu,
      menuUpdated: menuUpdated,
      closeOpenItems: closeOpenItems,
      toggleMenuState: toggleMenuState,
    };
  })();
})(cwAPI);

/************ libs/cwAPI/CwMenus/CwMenuManager.js ************/

/* Copyright � 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI*/
(function (cwApi) {
  "use strict";

  var menu = cwApi.cwMenuLeft;

  cwApi.cwMenuManager.loadMenu = function () {
    cwApi.CwMenuData.getLinks();
    menu.loadMenu();
  };

  cwApi.cwMenuManager.menuUpdated = function () {
    menu.menuUpdated();
  };

  cwApi.cwMenuManager.removeMenu = function (callback) {
    menu.removeMenu(callback);
  };

  cwApi.cwMenuManager.init = function () {
    menu.init();
  };
})(cwAPI);
