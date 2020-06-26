/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI,$,document,cwTabManager */

(function (cwApi, cwTabManager) {
  "use strict";

  /**
   * CwShare
   */
  cwApi.CwShare = (function () {
    var enums,
      buttonId,
      filterControlId,
      submitContainerId,
      contentContainerId,
      outputButton,
      appendButton,
      registerActions,
      shareBtnClick,
      getContent,
      displayEmailShare,
      displayShareWithRoles,
      emailSubmitBtnClick,
      shareWithRolesSubmitBtnClick,
      buttonExists,
      getLinkWithTabId,
      subjectPlaceholder,
      messagePlaceholder,
      defaultSubject,
      defaultMessage,
      setSubmit,
      setContent,
      setContentLoading,
      setSubmitLoading,
      getRolesToShareWith,
      setRemainingCharacter;

    enums = {
      /**
       * The share types.
       * @enum {number}
       */
      shareType: {
        All: 0,
        EmailOnly: 1,
      },
    };

    /**
     * Element ID's.
     */
    buttonId = "btn-share";
    filterControlId = "rolesToShareWith";
    submitContainerId = "submit-container";
    contentContainerId = "content-container";

    /**
     * Determines if the share button already exists in the DOM.
     */
    buttonExists = function () {
      return $("body").find("." + buttonId).length > 0;
    };

    /**
     * Adds the Share button to the HTML parameter.
     */
    outputButton = function (html, object, allowWorkflowShare) {
      if (!buttonExists()) {
        if (allowWorkflowShare) {
          html.push(
            '<a href="#" class="btn ',
            buttonId,
            ' page-action no-text" data-shareoptions="',
            enums.shareType.All,
            '" title="',
            $.i18n.prop("share_share"),
            '">'
          );
        } else {
          html.push(
            '<a href="#" class="btn ',
            buttonId,
            ' page-action no-text" data-shareoptions="',
            enums.shareType.EmailOnly,
            '"  title="',
            $.i18n.prop("share_share"),
            '">'
          );
        }
        html.push('<span class="btn-text"></span>');
        html.push('<i class="fa fa-share"></i>');
        html.push("</a>");
        registerActions(allowWorkflowShare, object);
      }
    };

    /**
     * Appends the Share button to the $anchor parameter.
     */
    appendButton = function (object, allowWorkflowShare, $anchor) {
      var o;

      o = [];
      if (cwApi.isUndefined($anchor)) $anchor = $("#top-actions");

      outputButton(o, object, allowWorkflowShare);
      $anchor.append(o.join(""));
    };

    /**
     * Registers the events for the Share functionality.
     */
    registerActions = function (allowWorkflowShare, object) {
      var selector;

      selector = "." + buttonId;

      cwApi.CwPopout.registerElementForShow(selector, $.i18n.prop("share_share"), function () {
        shareBtnClick(object);
      });
    };

    /**
     * Gets the HTML content for the Share popout.
     */
    getContent = function (object, shareOptions) {
      var html, shareEmailArgs, shareRolesArgs, radioSelectArgs;

      html = [];
      radioSelectArgs = [];
      shareEmailArgs = {
        id: "share-by-email",
        text: $.i18n.prop("share_shareByEmail"),
        selected: true,
        onClick: displayEmailShare,
      };
      radioSelectArgs.push(shareEmailArgs);

      if (shareOptions !== enums.shareType.EmailOnly) {
        shareRolesArgs = {
          id: "share-with-roles",
          text: $.i18n.prop("share_shareWithRoles"),
          selected: false,
          onClick: function () {
            displayShareWithRoles(object);
          },
        };
        radioSelectArgs.push(shareRolesArgs);
      }

      html.push('<form action="#" class="form-share">');
      html.push("<fieldset>");
      html.push(cwApi.workflow.ui.controls.CwRadioSelect.build(radioSelectArgs));
      html.push("</fieldset>");
      html.push("<hr>");
      html.push('<fieldset id="', contentContainerId, '"></fieldset>');
      html.push("<hr>");
      html.push('<fieldset id="', submitContainerId, '"></fieldset>');
      html.push("</form>");
      return html.join("");
    };

    /**
     * Outputs the content for the default Share popout.
     */
    shareBtnClick = function (object) {
      var buttonSelector, $button, shareOptions;

      buttonSelector = "." + buttonId;
      $button = $(buttonSelector);
      shareOptions = $button.data("shareoptions");

      cwApi.CwPopout.setContent(getContent(object, shareOptions));
      displayEmailShare();
    };

    /**
     * Processes the Share by email action.
     */
    emailSubmitBtnClick = function (callback) {
      cwApi.CwPendingEventsManager.setEvent("EmailSubmitBtnClick");

      var mailto, subject, body, bodyText, link;

      mailto = [];
      body = [];
      subject = $("#email_subject").val();
      bodyText = $("#email_message").val();
      link = $.i18n.prop("share_link") + ": " + getLinkWithTabId();

      if (subject === "") {
        subject = defaultSubject();
      }
      if (bodyText === "") {
        bodyText = defaultMessage();
      }

      body.push(link, "\n\n");
      body.push(bodyText);

      mailto.push("mailto:");
      mailto.push("?subject=", encodeURIComponent(subject));
      mailto.push("&body=", encodeURIComponent(body.join("")));

      window.location.href = mailto.join("");
      callback(true);

      cwApi.CwPopout.hide();
      cwApi.CwPendingEventsManager.deleteEvent("EmailSubmitBtnClick");
    };

    /**
     * Outputs the content when the Share button is clicked.
     */
    shareWithRolesSubmitBtnClick = function (object, dueDate, submitCtrlCallback) {
      var objectId, objectName, objectTypeScriptName, link, actionLink, rolesToShareWith, subject, message, shareRequest;

      rolesToShareWith = cwApi.workflow.ui.controls.CwFilterList.getSelectedValues(filterControlId);

      if (rolesToShareWith.length > 0) {
        objectId = object.object_id;
        objectName = object.name;
        link = getLinkWithTabId();
        message = $("#share_message").val();
        subject = $("#share_task_name").val();
        objectTypeScriptName = object.objectTypeScriptName;
        actionLink = cwApi.CwAcknowledgement.addAcknowledgementParams(link);

        if (cwApi.isStringEmpty(subject)) {
          subject = defaultSubject();
        }
        if (cwApi.isStringEmpty(message)) {
          message = defaultMessage();
        }

        shareRequest = new cwApi.workflow.dataClasses.shareRequest.CwShareRequest(objectId, objectTypeScriptName, message);

        shareRequest.sendRequest(objectName, dueDate, rolesToShareWith, subject, actionLink, function (response, loginLoaded) {
          function complete() {
            var old = {
              name: object.name,
              objectTypeScriptName: objectTypeScriptName,
              object_id: objectId,
              associations: [],
              properties: { version: object.properties.version, sharevalidation: false },
            };
            let newObj = JSON.parse(JSON.stringify(old));
            newObj.properties.sharevalidation = true;
            newObj.properties.version = object.properties.version + 1;
            // edit the object
            cwAPI.customLibs.utils.editObject(old, newObj, false, function (response) {
              if (!cwApi.statusIsKo(response)) {
                //edit the cw_task
                let jsonFile = cwApi.getObjectViewJsonUrl("z_" + cwApi.replaceSpecialCharacters(objectTypeScriptName) + "_share_workflow", objectId);
                cwApi.getJSONFile(
                  jsonFile,
                  function (o) {
                    if (cwApi.checkJsonCallback(o) && o.associations["cw_task"] && o.associations["cw_task"].length > 1) {
                      cwApi.pendingChanges.clear();
                      let cwTask = o.associations["cw_task"][0];
                      let oo = {
                        name: cwTask.name,
                        objectTypeScriptName: "cw_task",
                        object_id: cwTask.object_id,
                        associations: [],
                        properties: { version: object.properties.version },
                      };
                      let nn = JSON.parse(JSON.stringify(oo));
                      nn.properties.version = object.properties.version + 1;

                      cwAPI.customLibs.utils.editObject(oo, nn, false, function (status) {
                        submitCtrlCallback(true);
                        cwApi.CwPopout.hide();
                        window.location.hash = window.location.hash + "&reload=true";
                      });
                    }
                  },
                  cwApi.errorOnLoadPage
                );
              }
            });
          }

          if (cwApi.statusIsKo(response)) {
            if (!loginLoaded) {
              if (response.code === cwAPI.cwConfigs.ErrorCodes.NoRecipientsWorkflow) {
                cwApi.notificationManager.addNotification($.i18n.prop("workflow_thereAreNoValidRecipientsForThisRequest"), "error");
                submitCtrlCallback(false, "");
              } else {
                cwApi.notificationManager.addNotification($.i18n.prop("workflow_somethingWentWrongWhileSharingThisPage"), "error");
                complete();
              }
            }
          } else {
            cwApi.notificationManager.addNotification($.i18n.prop("workflow_thisPageHasBeenSharedWithUsersInTheSelectedRoles"));
            complete();
          }
        });
      } else {
        cwApi.workflow.ui.controls.CwFilterList.setControlStatusError(filterControlId);
        submitCtrlCallback(false, $.i18n.prop("share_selectARoleToContinue"));
      }
    };

    /**
     * Returns a link to the current tab including tab ID parameter.
     */
    getLinkWithTabId = function () {
      // If there is no tab ID in the URL fetch it from the DOM.
      // Fixes a problem where you cannot confirm with acknowledgement when there isn't a tab ID in the URL.

      /*jslint browser:true*/
      var link, tabId;

      link = window.location.href;

      if (cwApi.isUndefined(cwApi.getQueryStringObject().cwtabid)) {
        tabId = cwTabManager.getCurrentTab();
        if (tabId !== "") {
          link += "&cwtabid=" + tabId;
        }
      }
      return link;
    };

    /**
     * Outputs Share by email content in the popout.
     */
    displayEmailShare = function () {
      var output, submit, pageTitle, summaryText;

      output = [];
      pageTitle = cwApi.getPageTitle();

      setSubmitLoading();
      setContentLoading();

      if (cwApi.isStringEmpty(pageTitle)) {
        summaryText = $.i18n.prop("share_recipientsWillReceiveAnEmailIncludingALinkToTheView", cwApi.getViewTitle());
      } else {
        summaryText = $.i18n.prop("share_recipientsWillReceiveAnEmailIncludingALinkToTheTabViewOnObject", cwApi.getViewTitle(), cwApi.getPageTitle());
      }

      submit = cwApi.workflow.ui.controls.CwSubmit.build(
        summaryText,
        $.i18n.prop("share_share"),
        $.i18n.prop("share_processingYourShareRequest"),
        false,
        false,
        false,
        null,
        false,
        emailSubmitBtnClick
      );

      output.push('<div class="field">');
      output.push('<label for="email_subject">', $.i18n.prop("share_subject"), "</label>");
      output.push(
        '<input type="text" name="email_subject" id="email_subject" maxlength="300" placeholder="',
        subjectPlaceholder(),
        '"><span id="subject_remaining_character" class="remaining-character"></span>'
      );
      output.push("</div>");
      output.push('<div class="field">');
      output.push('<label for="message">', $.i18n.prop("share_message"), "</label>");
      output.push(
        '<textarea name="message" id="email_message" cols="30" rows="4" maxlength="1000" placeholder="',
        messagePlaceholder(),
        '"></textarea><span id="message_remaining_character" class="remaining-character"></span>'
      );
      output.push("</div>");

      setContent(output.join(""));
      setSubmit(submit);
      setRemainingCharacter();
    };

    /**
     * Outputs Share with roles content in the popout.
     */
    displayShareWithRoles = function (object) {
      var controls, output, submit, submitButtonText, processingText, filterInputType;

      controls = cwApi.workflow.ui.controls;

      output = [];
      submit = [];
      submitButtonText = $.i18n.prop("share_share");
      processingText = $.i18n.prop("share_processingYourShareRequest");
      filterInputType = controls.CwFilterList.enums.inputType.checkbox;

      setSubmitLoading();
      setContentLoading();

      cwApi.CwWorkflowRestApi.getRoles(function (response, loginLoaded) {
        var allRoles, rolesToShareWith, summaryText;

        if (cwApi.statusIsKo(response)) {
          if (!loginLoaded) {
            cwApi.notificationManager.addNotification($.prop("error_workflow_anErrorOccuredWhileFetchingTheListOfRoles"), "error");
          }
        } else {
          allRoles = response;
          rolesToShareWith = getRolesToShareWith(object, allRoles);

          if (cwApi.isStringEmpty(cwApi.getPageTitle())) {
            summaryText = $.i18n.prop("share_recipientsWillReceiveATaskIncludingALinkToTheTabView", cwApi.getViewTitle());
          } else {
            summaryText = $.i18n.prop(
              "share_recipientsWillReceiveATaskIncludingALinkToTheTabViewOnObject",
              cwApi.getViewTitle(),
              cwApi.getPageTitle()
            );
          }

          submit = controls.CwSubmit.build(summaryText, submitButtonText, processingText, false, true, false, null, false, function (
            dueDate,
            callback
          ) {
            shareWithRolesSubmitBtnClick(object, dueDate, callback);
          });

          output.push('<div class="field">');
          output.push('<label for="task_name">', $.i18n.prop("share_taskName"), "</label>");
          output.push('<input type="text" name="task_name" id="share_task_name" placeholder="', subjectPlaceholder(), '">');
          output.push("</div>");
          output.push('<div class="field">');
          output.push('<label for="', filterControlId, '">', $.i18n.prop("share_recipients"), "</label>");
          output.push(controls.CwFilterList.build(filterControlId, filterInputType, rolesToShareWith, "object_id", "label"));
          output.push("</div>");
          output.push('<div class="field">');
          output.push('<label for="message">', $.i18n.prop("share_message"), "</label>");
          output.push('<textarea name="message" id="share_message" cols="30" rows="4" placeholder="', messagePlaceholder(), '"></textarea>');
          output.push("</div>");

          setContent(output.join(""));
          setSubmit(submit);
        }
      });
    };

    /**
     * Returns the roles available to Share this page with.
     */
    getRolesToShareWith = function (object, allRoles) {
      var objectTypeScriptName, k, i, a, pageOwnerRoleIds, roleIdsForView, viewName, viewNames, rolesToShareWith;

      pageOwnerRoleIds = [];
      rolesToShareWith = [];

      // If questionnaire view, get roles for all views as the questionnaires are added to every object page regardless of view.
      if (cwApi.isQuestionnaireView()) {
        objectTypeScriptName = object.objectTypeScriptName;
        viewNames = cwApi.getViewNamesForObjectType(objectTypeScriptName);

        for (k = 0; k < viewNames.length; k += 1) {
          viewName = viewNames[k];
          roleIdsForView = cwApi.cwConfigs.Pages[viewName].OwnerRolesID;
          pageOwnerRoleIds = pageOwnerRoleIds.concat(roleIdsForView);
        }
      } else {
        viewName = cwApi.getQueryStringObject().cwview;
        pageOwnerRoleIds = cwApi.cwConfigs.Pages[viewName].OwnerRolesID;
      }

      if (pageOwnerRoleIds.length !== 0) {
        for (i = 0; i < pageOwnerRoleIds.length; i += 1) {
          for (a = 0; a < allRoles.length; a += 1) {
            if (pageOwnerRoleIds[i] === allRoles[a].object_id) {
              rolesToShareWith.push(allRoles[a]);
              break;
            }
          }
        }
      } else {
        rolesToShareWith = allRoles;
      }
      return rolesToShareWith;
    };

    /**
     * Returns the subject placeholder.
     */
    subjectPlaceholder = function () {
      return defaultSubject().replace(/"/g, "");
    };

    /**
     * Returns the message placeholder.
     */
    messagePlaceholder = function () {
      return defaultMessage().replace(/\n/g, " ").replace(/"/g, "");
    };

    /**
     * Returns the default subject.
     */
    defaultSubject = function () {
      var placeholder, pageTitle;

      pageTitle = cwApi.getPageTitle();

      if (pageTitle === "") {
        placeholder = $.i18n.prop("share_pleaseReviewTheView", cwApi.getViewTitle());
      } else {
        placeholder = $.i18n.prop("share_pleaseReviewTabViewOnObject", cwApi.getViewTitle(), pageTitle);
      }
      return placeholder;
    };

    /**
     * Returns the default message.
     */
    defaultMessage = function () {
      var placeholder, pageTitle;

      placeholder = [];
      pageTitle = cwApi.getPageTitle();

      placeholder.push($.i18n.prop("share_hello"));
      placeholder.push(",\n\n");

      if (pageTitle === "") {
        placeholder.push($.i18n.prop("share_pleaseReviewTheView", cwApi.getViewTitle()));
      } else {
        placeholder.push($.i18n.prop("share_pleaseReviewTabViewOnObject", cwApi.getViewTitle(), pageTitle));
      }

      placeholder.push(".\n\n");
      placeholder.push($.i18n.prop("share_thanks"));

      if (cwApi.isLive()) {
        placeholder.push(",\n");
        placeholder.push(cwApi.cwUser.GetCurrentUserFullName());
      }
      return placeholder.join("");
    };

    /**
     * Sets the Share content container to the given HTML.
     */
    setContent = function (html) {
      var contentContainerSelector, $contentContainer;

      contentContainerSelector = "#" + contentContainerId;
      $contentContainer = $(contentContainerSelector);

      $contentContainer.html(html);
    };

    /**
     * Sets the Share submit container to the given HTML.
     */
    setSubmit = function (html) {
      var submitContainerSelector, $submitContainer;

      submitContainerSelector = "#" + submitContainerId;
      $submitContainer = $(submitContainerSelector);

      $submitContainer.html(html);
    };

    /**
     * Sets the content HTML to loading.
     */
    setContentLoading = function () {
      var contentContainerSelector, $contentContainer;

      contentContainerSelector = "#" + contentContainerId;
      $contentContainer = $(contentContainerSelector);

      cwApi.workflow.ui.CwDom.setElementLoading($contentContainer);
    };

    /**
     * Sets the submit HTML to empty.
     */
    setSubmitLoading = function () {
      var submitContainerSelector, $submitContainer;

      submitContainerSelector = "#" + submitContainerId;
      $submitContainer = $(submitContainerSelector);

      cwApi.workflow.ui.CwDom.clearElementContent($submitContainer);
    };

    /**
     * Binds Key Up event and sets remaining character
     */
    setRemainingCharacter = function () {
      function addRemoveClass(element, addClass, removeClass) {
        element.removeClass(removeClass);
        element.addClass(addClass);
      }
      function setRemainingCount(len, maxchar, element) {
        if (len > 0) {
          element.html(maxchar - len + "/" + maxchar);
          if (maxchar === len) {
            addRemoveClass(element, "no-remaining-character", "has-remaining-character");
          } else {
            addRemoveClass(element, "has-remaining-character", "no-remaining-character");
          }
        } else {
          element.html(maxchar + "/" + maxchar);
          addRemoveClass(element, "has-remaining-character", "no-remaining-character");
        }
      }

      $("#email_message").keyup(function () {
        var $message = $("#message_remaining_character");
        setRemainingCount(this.value.length, 1000, $message);
        $message.addClass("remaining-character-message");
      });

      $("#email_subject").keyup(function () {
        var $subject = $("#subject_remaining_character");
        setRemainingCount(this.value.length, 300, $subject);
        $subject.addClass("remaining-character-subject");
      });
    };

    return {
      outputButton: outputButton,
      appendButton: appendButton,
    };
  })();
})(cwAPI, cwTabManager);
