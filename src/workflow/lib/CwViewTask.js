/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */
/*global cwAPI, $ */

(function (cwApi, cwTabManager) {
  "use strict";

  /**
   * CwViewTask
   */
  cwApi.CwViewTask = (function () {
    var contentElementId,
      headerElementId,
      filterControlId,
      delegateElementId,
      registerListElementForShowTask,
      registerMenuElementForShowTask,
      getAndOutputTask,
      outputTask,
      registerCommonActions,
      registerApprovalActions,
      registerValidationActions,
      refreshTaskList,
      setContentHtml,
      setHeaderHtml,
      setDelegateHtml,
      setPopoutContent,
      isCurrentUserSender,
      viewTaskFromLink,
      changeReviewSubmitBtnClick,
      outputDelegationOptions,
      outputShareTaskContent,
      outputValidationRequestTaskContent,
      outputChangeRequestTaskContent,
      shareAcknowledgeSubmitButtonClick,
      validationReviewSubmitBtnClick,
      outputDelegationContent,
      delegateTaskSubmitBtnClick,
      setContentLoading,
      isUserLinkedToTask,
      outputGenericTaskIsComplete;

    /**
     * Elements Id's.
     */
    headerElementId = "task-header";
    contentElementId = "task-content";
    filterControlId = "delegate-users";
    delegateElementId = "task-delegate";

    /**
     * Registers the task with the given taskId in the task page task list to open the popout and output the task.
     */
    registerListElementForShowTask = function (taskId, markAsRead, makeActionable) {
      var selector;
      selector = ".content-box .task-list #" + cwApi.CwWorkflowTaskManager.getTaskElementId(taskId);
      cwApi.CwPopout.registerElementForShow(selector, $.i18n.prop("task_task"), function () {
        if (cwApi.getQueryStringObject().cwview !== "cwworkflowtasks") {
          cwApi.updateURLHash(cwApi.getSimplePageHash("cwworkflowtasks"));
        }
        getAndOutputTask(taskId, markAsRead, makeActionable);
      });
    };

    /**
     * Registers the task with the given taskId in the menu task list to open the popout and output the task.
     */
    registerMenuElementForShowTask = function (taskId) {
      /*jslint browser:true*/
      var selector;
      selector = "#main_menu .list-tasks #" + cwApi.CwWorkflowTaskManager.getTaskElementId(taskId);
      $(document)
        .off("click", selector)
        .on("click", selector, function (e) {
          e.preventDefault();
          cwApi.updateURLHash(cwApi.getSimplePageHashWithCwId("cwworkflowtasks", taskId));
        });
    };

    /**
     * Determines if the current user started the given task.
     */
    isCurrentUserSender = function (task) {
      return cwApi.currentUser.ID === task.Sender.Id;
    };

    /**
     * Sets the task content output to the given HTML.
     */
    setContentHtml = function (html) {
      var selector, $content;

      selector = "#" + contentElementId;
      $content = $(selector);

      $content.html(html);
    };

    /**
     * Sets the task content output to the loading HTML.
     */
    setContentLoading = function () {
      var selector, $content;

      selector = "#" + contentElementId;
      $content = $(selector);

      cwApi.workflow.ui.CwDom.setElementLoading($content);
    };

    /**
     * Sets the task header output to the given HTML.
     */
    setHeaderHtml = function (html) {
      var selector, $header;

      selector = "#" + headerElementId;
      $header = $(selector);

      $header.html(html);
    };

    /**
     * Sets the task delegate output to the given HTML.
     */
    setDelegateHtml = function (html) {
      var selector, $delegate;

      selector = "#" + delegateElementId;
      $delegate = $(selector);

      $delegate.html(html);
    };

    /**
     * Sets the popout content to the basic frame required to output a task.
     */
    setPopoutContent = function () {
      var html;

      html = [];

      html.push('<div id="', headerElementId, '"></div>');
      html.push('<form action="#" class="form-edit">');
      html.push('<fieldset id="', delegateElementId, '"></fieldset>');
      html.push('<fieldset id="', contentElementId, '">');
      html.push("</fieldset>");
      html.push("</form>");

      cwApi.CwPopout.setContent(html.join(""));
    };

    /**
     * Fetches the task with the given ID and outputs the task content.
     */
    getAndOutputTask = function (taskId, markAsRead, makeActionable) {
      // Bug 11367
      cwApi.cleanUselessTags();

      cwApi.CwPopout.setTitle($.i18n.prop("task_task"));

      cwApi.CwWorkflowRestApi.getTask(taskId, markAsRead, function (response, loginLoaded) {
        if (cwApi.statusIsKo(response)) {
          if (!loginLoaded) {
            if (!cwApi.isUndefined(response.code) && cwApi.cwConfigs.ErrorCodes.UserNoPermissionWorkflow === response.code) {
              cwApi.notificationManager.addNotification($.i18n.prop("error_workflow_youDoNotHavePermissionToViewThisTask"), "error");
              cwApi.CwPopout.outputError($.i18n.prop("error_workflow_youDoNotHavePermissionToViewThisTask") + ".");
            } else {
              cwApi.notificationManager.addNotification($.i18n.prop("task_somethingWentWrongWhileFetchingYourTask"), "error");
            }
          }
        } else {
          setPopoutContent();
          outputTask(response.task, makeActionable);
        }
      });
    };

    function outputDiagramChangeRequestTaskContent(task, makeActionable) {
      var html, userIsSender, diagramWorkflowChangeRequest, dc, taskId, buttonText, processingText;
      html = [];
      userIsSender = isCurrentUserSender(task);
      if (userIsSender) {
        makeActionable = false;
      }

      $(".popout").addClass("cw-dc-change-request");

      diagramWorkflowChangeRequest = JSON.parse(task.Content);

      // dc = new cwApi.Diagrams.CwDiagramComparator([{
      //     id: 'source',
      //     name: 'Initial Diagram',
      //     diagram: diagramWorkflowChangeRequest.InitialDiagram
      // }, {
      //     id: 'target',
      //     name: 'Workflow Diagram',
      //     diagram: diagramWorkflowChangeRequest.WorkflowDiagram
      // }]);
      // dc.outputDiagramsZone(html);

      taskId = task.Id;
      buttonText = $.i18n.prop("editmode_submit");
      processingText = $.i18n.prop("workflow_preparingYourReview");
      html.push(cwApi.CwPendingChangesUi.outputApprovalControlForValidateObject());
      html.push("<hr/>");

      cwApi.CwViewTaskHistory.outputTaskHistoryAccordion(html, task.History);

      html.push("<hr/>");

      html.push(
        cwApi.workflow.ui.controls.CwSubmit.build("", buttonText, processingText, true, false, false, null, true, function (comment, callback) {
          var content = {
            TaskId: taskId,
            Approved: $("#approvalValidate input:checked").val() === "1" ? true : false,
            Comment: comment,
            ObjectName: diagramWorkflowChangeRequest.WorkflowDiagram.properties.name,
          };
          cwApi.CwWorkflowRestApi.sendDiagramChangeRequestReview(content, callback);
        })
      );

      setContentHtml(html.join(""));

      registerValidationActions();

      // dc.setupDiagrams();
      // dc.compareDiagrams();
      // dc.outputDiagramsDisplayMode();
      // dc.outputCompareResultsAll();
    }

    isUserLinkedToTask = function (user, task) {
      if (task.Sender !== null) {
        if (task.Sender.Id === user.ID) {
          return true;
        }
      }

      for (var i = 0; i < task.Actions.length; i++) {
        var action = task.Actions[i];

        if (action.Receiver !== null) {
          if (action.Receiver.Id === user.ID) {
            return true;
          }
        }
      }

      return false;
    };

    outputGenericTaskIsComplete = function (task) {
      var html;

      html = [];

      html.push(
        '<h5 class="task-marked-as-complete"><i class="fa fa-check-square-o"></i>' + $.i18n.prop("task_thisTaskHasBeenMarkedAsComplete") + "</h5>"
      );

      cwApi.CwViewTaskHistory.outputTaskHistoryAccordion(html, task.History, true);

      setContentHtml(html.join(""));
    };

    /**
     * Outputs the task heading and calls the correct output method based on the workflow type.
     */
    outputTask = function (task, makeActionable) {
      var headingHtml, userCanSeeTaskContent, workflowType, receivedDate;

      headingHtml = [];
      workflowType = task.WorkflowType;
      userCanSeeTaskContent = isUserLinkedToTask(cwApi.currentUser, task);
      receivedDate = cwApi.CwWorkflowTaskManager.dateToDateAndTime(task.StartDate);

      if (!task.Read) {
        refreshTaskList(true);
      }
      if (task.Complete) {
        makeActionable = false;
      }

      cwApi.CwWorkflowTaskManager.outputTaskHeading(
        headingHtml,
        task.Subject,
        task.Sender.DisplayName,
        receivedDate.date,
        receivedDate.time,
        cwApi.cwUser.getUserPicturePathByUserName(task.Sender.UserName),
        task.Complete,
        task.Delegated,
        task.DelegationInfo
      );
      setHeaderHtml(headingHtml.join(""));

      if (makeActionable && cwApi.cwConfigs.WorkflowSiteDefinition.AllowTaskDelegation) {
        outputDelegationOptions(task, makeActionable);
      }

      if (userCanSeeTaskContent === false) {
        outputGenericTaskIsComplete(task);
      } else {
        switch (workflowType) {
          case cwApi.CwWorkflowTaskManager.workflows.share:
            outputShareTaskContent(task, makeActionable);
            break;
          case cwApi.CwWorkflowTaskManager.workflows.validationRequest:
            outputValidationRequestTaskContent(task, makeActionable);
            break;
          case cwApi.CwWorkflowTaskManager.workflows.changesRequest:
            outputChangeRequestTaskContent(task, makeActionable);
            break;
          case cwApi.CwWorkflowTaskManager.workflows.diagramChangeRequest:
            outputDiagramChangeRequestTaskContent(task, makeActionable);
            break;
          default:
            break;
        }
      }
    };

    /**
     * Outputs the delegation radio select control.
     */
    outputDelegationOptions = function (task, makeActionable) {
      var html, radioSelectArgs;

      html = [];

      radioSelectArgs = [
        {
          id: "complete-by-me",
          text: $.i18n.prop("task_completeByMe"),
          selected: true,
          onClick: function () {
            outputTask(task, makeActionable);
          },
        },
        {
          id: "delegate-to-user",
          text: $.i18n.prop("task_delegateToAnotherUser"),
          selected: false,
          onClick: function () {
            outputDelegationContent(task);
          },
        },
      ];

      html.push(cwApi.workflow.ui.controls.CwRadioSelect.build(radioSelectArgs));
      html.push("<hr>");

      setDelegateHtml(html.join(""));
    };

    /**
     * Outputs the content for delegating a task.
     */
    outputDelegationContent = function (task) {
      var controls, html, taskId, summaryText, processingText, buttonText, filterInputType, users;

      controls = cwApi.workflow.ui.controls;

      html = [];
      taskId = task.Id;
      buttonText = $.i18n.prop("editmode_submit");
      summaryText = $.i18n.prop("delegate_theTaskWillBeRemovedFromYourTaskListAndReassignedToTheSelectedUserForThemToAction");
      processingText = $.i18n.prop("delegate_processingYourDelegationRequest");
      filterInputType = controls.CwFilterList.enums.inputType.radio;

      setContentLoading();

      cwApi.CwWorkflowRestApi.getDelegateeUsers(taskId, function (response, loginLoaded) {
        if (cwApi.statusIsKo(response)) {
          if (!loginLoaded) {
            cwApi.notificationManager.addNotification($.prop("error_workflow_anErrorOccuredWhileFetchingTheListOfUsers"), "error");
          }
        } else {
          users = response.delegatees;

          html.push('<label for="', filterControlId, '">', $.i18n.prop("delegate_selectTheUserYouWishToDelegateThisTaskTo"), "</label>");
          html.push(controls.CwFilterList.build(filterControlId, filterInputType, users, "Id", "DisplayName"));

          html.push("<hr>");
          html.push(
            controls.CwSubmit.build(summaryText, buttonText, processingText, true, false, false, null, false, function (comment, callback) {
              delegateTaskSubmitBtnClick(task, comment, callback);
            })
          );

          setContentHtml(html.join(""));
        }
      });
    };

    /**
     * Outputs the given task as a Share task.
     */
    outputShareTaskContent = function (task, makeActionable) {
      var html, buttonText, content, processingText, link, shareRequest;

      html = [];
      link = task.Link;
      content = task.Content;
      buttonText = $.i18n.prop("button_gotolink");
      processingText = $.i18n.prop("share_loadingPage");
      shareRequest = cwApi.workflow.dataClasses.shareRequest.CwShareRequest.tryParseJson(content);

      if (shareRequest) {
        html.push(shareRequest.toHtml());
      } else {
        html.push('<p class="task-message">', cwApi.replaceLineBreaksWithBr(content), "</p>");
      }

      html.push("<hr>");

      cwApi.CwViewTaskHistory.outputTaskHistoryAccordion(html, task.History);

      if (makeActionable) {
        html.push(
          cwApi.workflow.ui.controls.CwSubmit.build("", buttonText, processingText, false, false, false, null, false, function (callback) {
            shareAcknowledgeSubmitButtonClick(link, callback);
          })
        );
      }

      setContentHtml(html.join(""));
    };

    /**
     * Outputs the given task as a Validation Request task.
     */
    outputValidationRequestTaskContent = function (task, makeActionable) {
      var html, content, taskId, objectName, validationRequest, buttonText, processingText;

      html = [];
      taskId = task.Id;
      content = JSON.parse(task.Content);
      buttonText = $.i18n.prop("editmode_submit");
      processingText = $.i18n.prop("workflow_preparingYourReview");
      validationRequest = cwApi.CwValidationRequest.parseJson(content);
      objectName = validationRequest.objectName;

      validationRequest.toTaskHtml(html, makeActionable, task, cwApi.currentUser.ID);
      html.push("<hr>");
      cwApi.CwViewTaskHistory.outputTaskHistoryAccordion(html, task.History);

      if (makeActionable) {
        html.push(
          cwApi.workflow.ui.controls.CwSubmit.build("", buttonText, processingText, true, false, false, null, true, function (comment, callback) {
            validationReviewSubmitBtnClick(taskId, objectName, comment, callback);
          })
        );
      }
      registerValidationActions();
      setContentHtml(html.join(""));
    };

    function isMandatorySetInChangeset(changeset) {
      var isMandatoryProperty = false;
      var isMandatoryAssociation = false;
      if (changeset.action === cwApi.CwPendingChangeset.ActionType.Create) return isMandatoryProperty || isMandatoryAssociation;
      if (changeset.propertyChanges.length > 0) {
        for (var i = 0; i < changeset.propertyChanges.length; i++) {
          if (changeset.propertyChanges[i].isMandatory) {
            isMandatoryProperty = true;
            break;
          }
        }
      }
      if (!isMandatoryProperty && changeset.associationChanges.length > 0) {
        for (var j = 0; j < changeset.associationChanges.length; j++) {
          if (changeset.associationChanges[j].isMandatory) {
            isMandatoryAssociation = true;
            break;
          }
        }
      }
      return isMandatoryProperty || isMandatoryAssociation;
    }

    /**
     * Outputs the given task as a Change Request task.
     */
    outputChangeRequestTaskContent = function (task, makeActionable) {
      var html, taskId, approverComments, userIsSender, pendingChanges, changeset, buttonText, processingText;

      html = [];
      taskId = task.Id;
      approverComments = task.Content;
      userIsSender = isCurrentUserSender(task);
      buttonText = $.i18n.prop("editmode_submit");
      pendingChanges = new cwApi.CwPendingChanges();
      processingText = $.i18n.prop("workflow_preparingYourReview");

      if (userIsSender) {
        makeActionable = false;
      }

      // Get first changeset as we don't support multiple changesets yet.
      pendingChanges.parseJson(task.PendingChanges);
      changeset = pendingChanges.getFirstChangeset();
      changeset.updateCommentForApproval(approverComments);

      html.push(changeset.toTaskHtml(task.Complete, userIsSender));

      if (makeActionable) {
        if (changeset.action !== cwApi.CwPendingChangeset.ActionType.Delete && changeset.hasChanges()) {
          // If there is only one change, we do not need the 'approve all' control
          if (changeset.getChangeCount() > 1) {
            html.push(cwApi.CwPendingChangesUi.outputAprovalAllControl(isMandatorySetInChangeset(changeset)));
            html.push("<hr>");
          }
        }

        cwApi.CwViewTaskHistory.outputTaskHistoryAccordion(html, task.History);

        html.push('<div id="cw-submit-error-warning"><i class="fa fa-exclamation"></i>', $.i18n.prop("workflow_submit_error_warning"), "</div>");
        html.push('<div id="cw-submit-warning"><i class="fa fa-exclamation"></i>', $.i18n.prop("workflow_submit_warning"), "</div>");

        html.push(
          cwApi.workflow.ui.controls.CwSubmit.build("", buttonText, processingText, true, false, false, null, true, function (comment, callback) {
            changeReviewSubmitBtnClick(pendingChanges, taskId, comment, callback);
          })
        );

        registerApprovalActions(pendingChanges);
      } else {
        cwApi.CwViewTaskHistory.outputTaskHistoryAccordion(html, task.History);
      }

      setContentHtml(html.join(""));
    };

    /**
     * Registers the actions common to all task types.
     */
    registerCommonActions = function () {
      var selector;

      selector = ".textarea-grow textarea";
      $(document)
        .off("focus", selector)
        .on("focus", selector, function () {
          $(this).parent().addClass("focus");
        });
    };

    function setSubmitButtonDisabledAttribute() {
      var selector = ".div-approval-control:not(#approvalAll)";
      var isAllControlSet = true;
      $(selector).each(function () {
        if (!$(this).hasClass("approved") && !$(this).hasClass("rejected")) {
          isAllControlSet = false;
          return false;
        }
      });

      var isAllPropertyWarningHidden = true;
      var isAllAssociationWarningHidden = true;

      $(".mandatory-property-warning").each(function () {
        if ($(this).is(":visible") || $(this).hasClass("disabled")) {
          isAllPropertyWarningHidden = false;
          return false;
        }
      });

      $(".mandatory-association-warning").each(function () {
        if ($(this).is(":visible") || $(this).hasClass("disabled")) {
          isAllAssociationWarningHidden = false;
          return false;
        }
      });

      var isSubmitEnable = isAllControlSet && isAllPropertyWarningHidden && isAllAssociationWarningHidden;

      isAllControlSet ? $("#cw-submit-warning").hide() : $("#cw-submit-warning").show();
      isAllPropertyWarningHidden && isAllAssociationWarningHidden ? $("#cw-submit-error-warning").hide() : $("#cw-submit-error-warning").show();

      if (isSubmitEnable) {
        $("#btn-submit").attr("disabled", false);
      } else {
        $("#btn-submit").attr("disabled", true);
      }
    }

    /**
     * Registers the actions for actioning a Validation Request task.
     */
    registerValidationActions = function () {
      var selector;

      registerCommonActions();

      selector = ".div-approval-control input";
      $(document)
        .off("change", selector)
        .on("change", selector, function () {
          var parentDiv, approval, $this;

          $this = $(this);
          parentDiv = $this.closest("div");
          approval = parseInt($this.val(), 10);
          if (parentDiv.attr("id") !== "approvalAll") {
            if (approval === cwApi.CwPendingChangeset.Approval.Approved) {
              parentDiv.removeClass("rejected");
              parentDiv.addClass("approved");
            } else if (approval === cwApi.CwPendingChangeset.Approval.Rejected) {
              parentDiv.removeClass("approved");
              parentDiv.addClass("rejected");
            }
          }

          setSubmitButtonDisabledAttribute();
        });
    };

    /**
     * Registers the actions for actioning a Change Request task.
     */
    registerApprovalActions = function (pendingChanges) {
      var selector;

      function updateControlColors($container, approval) {
        if ($container.attr("id") !== "approvalAll") {
          if (approval === cwApi.CwPendingChangeset.Approval.Approved) {
            $container.removeClass("rejected");
            $container.addClass("approved");
          } else if (approval === cwApi.CwPendingChangeset.Approval.Rejected) {
            $container.removeClass("approved");
            $container.addClass("rejected");
          }
        }
      }

      function disableControls($context) {
        var $parentDiv;

        $context.find("input").each(function () {
          $parentDiv = $(this).closest("div");
          $parentDiv.addClass("disabled");
          $(this).prop("disabled", true);
        });
      }

      function enableControls($context) {
        var $parentDiv;

        $context.find("input").each(function () {
          $parentDiv = $(this).closest("div");
          $parentDiv.removeClass("disabled");
          $(this).prop("disabled", false);
        });
      }

      function handleMandatoryFields($container, approval) {
        if ($container.hasClass("mandatory-property-control")) {
          var $propertWarning = $container.closest(".property-change-container").find(".mandatory-property-warning");
          if (approval === cwApi.CwPendingChangeset.Approval.Approved) {
            $propertWarning.hide();
          } else {
            $propertWarning.show();
          }
        } else if ($container.hasClass("mandatory-association-control")) {
          var $associationContainer = $container.closest(".association-change-container");
          var $associationWarning = $associationContainer.find(".mandatory-association-warning");
          if (approval === cwApi.CwPendingChangeset.Approval.Approved) {
            $associationWarning.hide();
          } else {
            if ($associationContainer.find(".approved.mandatory-association-control").length > 0) {
              $associationWarning.hide();
            } else {
              $associationWarning.show();
            }
          }
        }
      }

      function switchMandatoryMessageDisplay(isShow) {
        $(".mandatory-property-warning").each(function () {
          isShow ? $(this).show() : $(this).hide();
        });

        $(".mandatory-association-warning").each(function () {
          isShow ? $(this).show() : $(this).hide();
        });

        isShow ? $("#cw-submit-warning").show() : $("#cw-submit-warning").hide();
        isShow ? $("#cw-submit-error-warning").show() : $("#cw-submit-error-warning").hide();
      }

      registerCommonActions();

      selector = ".div-approval-control:not(#approvalAll):not(#approvalCreate):not(#approvalDelete) input";
      $(document)
        .off("change", selector)
        .on("change", selector, function () {
          var $input, $parentDiv, approval, changeset, controlIndex, changeType;

          $input = $(this);
          $parentDiv = $input.closest("div");
          approval = parseInt($input.val(), 10);
          changeset = pendingChanges.getFirstChangeset();

          controlIndex = $parentDiv.data("cw-index");
          changeType = $parentDiv.data("cw-changetype");

          updateControlColors($parentDiv, approval);
          handleMandatoryFields($parentDiv, approval);
          setSubmitButtonDisabledAttribute();
          changeset.updateApprovalForChange(controlIndex, approval, changeType);
        });

      selector = "#approvalAll input";
      $(document)
        .off("click", selector)
        .on("click", selector, function () {
          var $input, $parentDiv, approval, $control;

          $input = $(this);
          $parentDiv = $input.closest("div");
          approval = parseInt($input.val(), 10);

          $(".div-approval-control")
            .not("#approvalAll")
            .each(function () {
              $control = $(this);

              $control.find("input[value=" + approval + "]").get(0).checked = true;
              $control.find("input[value=" + approval + "]").trigger("change");
            });

          updateControlColors($parentDiv, approval);
          if (approval === cwApi.CwPendingChangeset.Approval.Rejected) {
            switchMandatoryMessageDisplay(false);
          }
          setSubmitButtonDisabledAttribute();
        });

      selector = "#approvalDelete input";
      $(document)
        .off("change", selector)
        .on("change", selector, function () {
          var $input, $parentDiv, approval, changeset;

          $input = $(this);
          $parentDiv = $input.closest("div");
          approval = parseInt($input.val(), 10);
          changeset = pendingChanges.getFirstChangeset();

          updateControlColors($parentDiv, approval);
          setSubmitButtonDisabledAttribute();
          changeset.updateApprovalForDelete(approval);
        });

      selector = "#approvalCreate input";
      $(document)
        .off("change", selector)
        .on("change", selector, function () {
          var $input, $parentDiv, approval, changeset, $control, $radio;

          $input = $(this);
          $parentDiv = $input.closest("div");
          approval = parseInt($input.val(), 10);
          changeset = pendingChanges.getFirstChangeset();

          updateControlColors($parentDiv, approval);
          changeset.updateApprovalForCreate(approval);

          if (approval === cwApi.CwPendingChangeset.Approval.Rejected) {
            $control = $("#approvalAll [value=" + cwApi.CwPendingChangeset.Approval.Rejected + "]");
            if ($control.length > 0) {
              $control.get(0).checked = true;
              updateControlColors($control.closest("div"), approval);
            }
          }

          selector = '.div-approval-control:not("#approvalAll"):not("#approvalCreate")';
          $(selector).each(function () {
            if (approval === cwApi.CwPendingChangeset.Approval.Rejected) {
              $radio = $(this).find("input[value=" + cwApi.CwPendingChangeset.Approval.Rejected + "]");
              $radio.get(0).checked = true;
              $radio.trigger("change");
              disableControls($(this));
              switchMandatoryMessageDisplay(false);
            } else {
              $radio = $(this).find("input[value=" + cwApi.CwPendingChangeset.Approval.Approved + "]");
              $radio.closest("div").removeClass("rejected");
              $(this).find('input[type="radio"]').removeAttr("checked");
              enableControls($(this));
              switchMandatoryMessageDisplay(true);
            }
          });
          setSubmitButtonDisabledAttribute();
        });
    };

    /**
     * Refreshes the task To Do page if it's currently
     */
    refreshTaskList = function (refreshMenu) {
      var inputValue, currentTab;

      inputValue = $("#toDoToggle input:checked").val();
      currentTab = cwTabManager.getCurrentTab();

      if (inputValue === "Open" && currentTab === "tabToDo") {
        if (refreshMenu) {
          cwApi.CwWorkflowTaskManager.loadTasks(function () {
            cwApi.CwWorkflowTaskManager.updateCount();
            cwApi.CwWorkflowTaskManager.updateList();
          });
        }
        $("#hiddenRefreshToDoTasks").trigger("click");
      }
    };

    /**
     * Loads the task page and opens a task with the given ID.
     */
    viewTaskFromLink = function (taskId) {
      var cwidRegex, hash;

      cwApi.CwPopout.show();
      getAndOutputTask(taskId, true, true);
      cwidRegex = new RegExp("&cwid=" + taskId, "g");
      hash = cwApi.getURLHash().replace(cwidRegex, "");
      cwApi.updateURLHashWithoutEvent(hash);
    };

    /**
     * Handles the submit button click for a Share task.
     * Naviagtes to the view which has been shared in the task.
     */
    shareAcknowledgeSubmitButtonClick = function (goToLink, submitCtrlCallback) {
      if (goToLink.includes("/diagrammer/#/diagram/")) window.location.replace(goToLink.replace("&tid", ""));
      else window.location.replace(goToLink);
      submitCtrlCallback(true);
      cwApi.CwPopout.hide();
    };

    /**
     * Handles the submit button click for a Validation Request task.
     * Sends the Validation review to the server and updates the repository.
     */
    validationReviewSubmitBtnClick = function (taskId, objectName, comment, submitCtrlCallback) {
      var approval;

      approval = $("#approvalValidate input:checked").val();

      cwApi.CwWorkflowRestApi.sendValidationRequestReview(taskId, objectName, approval, comment, function (response, loginLoaded) {
        if (cwApi.statusIsKo(response)) {
          if (!loginLoaded) {
            if (!cwApi.isUndefined(response.code) && cwApi.cwConfigs.ErrorCodes.UserNoPermissionWorkflow === response.code) {
              cwApi.notificationManager.addNotification($.i18n.prop("error_workflow_youDoNotHavePermissionToReviewThisValidationRequest"), "error");
            } else {
              cwApi.notificationManager.addNotification($.i18n.prop("error_workflow_anErrorOcurredWhileProcessingYourReview"), "error");
            }
            refreshTaskList(false);
          }
        } else {
          refreshTaskList(false);
          cwApi.notificationManager.addNotification($.i18n.prop("workflow_yourReviewHasBeenSubmitted"));
        }
        submitCtrlCallback(true);
        cwApi.CwPopout.hide();
      });
    };

    /**
     * Handles the submit button click for a Change Request task.
     * Sends the Change review to the server and updates the repository.
     */
    changeReviewSubmitBtnClick = function (pendingChanges, taskId, comment, submitCtrlCallback) {
      if (!cwApi.cwEditProperties.cwEditPropertyMemo.isHTMLContent(comment)) {
        pendingChanges.getFirstChangeset().updateCommentForApproval(comment);

        pendingChanges.sendAsApproval(taskId, function (response, loginLoaded) {
          if (cwApi.statusIsKo(response)) {
            if (!loginLoaded) {
              if (!cwApi.isUndefined(response.code) && cwApi.cwConfigs.ErrorCodes.UserNoPermissionWorkflow === response.code) {
                cwApi.notificationManager.addNotification($.i18n.prop("error_workflow_youDoNotHavePermissionToReviewTheseChanges"), "error");
                submitCtrlCallback(true);
                cwApi.CwPopout.hide();
                refreshTaskList(false);
              } else {
                cwApi.CwEditSave.handleSaveError(response, false, true);
                refreshTaskList(false);
              }
            }
          } else {
            refreshTaskList(false);
            cwApi.notificationManager.addNotification($.i18n.prop("workflow_workflowapprovalhasbeencompletedandapprovedchangesmade"));
            submitCtrlCallback(true);
            cwApi.CwPopout.hide();
          }
        });
      } else {
        cwApi.notificationManager.addNotification($.i18n.prop("workflow_errorparsinghtmlcontent"), "error");
        submitCtrlCallback(true);
        cwApi.CwPopout.hide();
        refreshTaskList(false);
      }
    };

    /**
     * Handles the submit button click for a Delegation request.
     * Sends the delegation request to the server.
     */
    delegateTaskSubmitBtnClick = function (task, comment, submitCtrlCallback) {
      var controls, selectedUsers, selectedUsersDisplayNames, taskId, taskSubject, toUserId, toUserDisplayName, delegationRequest;

      controls = cwApi.workflow.ui.controls;

      taskId = task.Id;
      taskSubject = task.Subject;
      selectedUsers = controls.CwFilterList.getSelectedValues(filterControlId);
      selectedUsersDisplayNames = controls.CwFilterList.getSelectedDisplayValues(filterControlId);

      if (selectedUsers.length !== 1) {
        controls.CwFilterList.setControlStatusError(filterControlId);
        submitCtrlCallback(false, $.i18n.prop("delegate_selectAUserToContinue"));
      } else {
        toUserId = selectedUsers[0];
        toUserDisplayName = selectedUsersDisplayNames[0];
        delegationRequest = new cwApi.workflow.dataClasses.delegationRequest.CwDelegationRequest(
          taskId,
          taskSubject,
          toUserId,
          toUserDisplayName,
          comment
        );

        delegationRequest.sendRequest(function (response, loginLoaded) {
          if (cwApi.statusIsKo(response)) {
            if (!loginLoaded) {
              submitCtrlCallback(true);
              cwApi.CwPopout.hide();
              cwApi.notificationManager.addNotification($.i18n.prop("delegate_thereWasAnErrorWhileDelegatingTheTask"), "error");
            }
          } else {
            submitCtrlCallback(true);
            refreshTaskList(false);
            cwApi.CwPopout.hide();
            cwApi.notificationManager.addNotification($.i18n.prop("delegate_theTaskWasDelegatedToTheSelectedUser"));
          }
        });
      }
    };

    return {
      registerListElementForShowTask: registerListElementForShowTask,
      registerMenuElementForShowTask: registerMenuElementForShowTask,
      viewTaskFromLink: viewTaskFromLink,
    };
  })();
})(cwAPI, cwTabManager);
