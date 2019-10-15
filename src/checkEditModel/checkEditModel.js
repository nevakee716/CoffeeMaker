/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function(cwApi, $) {
  'use strict';
  var globalConfig = {
    applicationflow_edit_received : {
      automaticProperty: {
        name: "T_<§is_application_20027_1059939990.applicationname(zcheck_isapplication)§>_<§application_flow_20026_1971147733.applicationname(zcheck_isapplication)§>_({label})",
        type: "Application Flow"
      },
      uniqueProperty: {},
      associations: {
        is_application_20027_1059939990: {
          min: 1,
          max: 1
        }
      }      
    },
    applicationflow_edit_sent : {
      automaticProperty: {
        name: "T_<§application_flow_20027_1181631625.applicationname(zcheck_isapplication)§>_<§is_application_20026_2083245639.applicationname(zcheck_isapplication)§>_({label})",
        type: "Application Flow"
      },
      uniqueProperty: {},
      associations: {
        is_application_20026_2083245639: {
          min: 1,
          max: 1
        }
      }      
    },
    applicationflow_edit : {
      automaticProperty: {
        name: "T_<§is_application_20027_620796804.applicationname(zcheck_isapplication)§>_<§is_application_20026_161547901.applicationname(zcheck_isapplication)§>_({label})"
      },
      uniqueProperty: {},
      associations: {
        is_application_20027_620796804: {
          min: 1,
          max: 1
        },
        is_application_20026_161547901: {
          min: 1,
          max: 1
        }
      }      
    },
	  isapplication_edit_creation : {
      automaticProperty: {},
      uniqueProperty: {
      	applicationname:"zcheck_is_applications" 
      },
      associations: {}      
    }

     

  };

  cwApi.CwMandatoryValueChange.prototype.checkMandatoryValues = function() {
    var config,view = cwAPI.getCurrentView();
    if(view && globalConfig[view.cwView]) {
      config = globalConfig[view.cwView];
      this.modifyAutomaticProperty(config);
      this.checkNumberOfAssociation(config);
      this.checkUniqueProperties(config);
    }
    this.checkMandatoryProperties();
    this.checkMandatoryAssociations();


  };






  cwApi.CwMandatoryValueChange.prototype.modifyAutomaticProperty = function(config) {

    var propertyScriptName;
    if (config.automaticProperty) {
      for (propertyScriptName in config.automaticProperty) {
        if (config.automaticProperty.hasOwnProperty(propertyScriptName)) {
          let prop = cwAPI.mm.getProperty(cwAPI.getCurrentView().rootObjectType,propertyScriptName);
          if ((this.sourceObject.properties[propertyScriptName] === undefined  || this.sourceObject.properties[propertyScriptName] === "") && prop) {
            this.sourceObject.displayNames[propertyScriptName] = prop.name + " " + $.i18n.prop('editmode_Automatique'); 
            this.pendingObject.displayNames[propertyScriptName] = prop.name + " " + $.i18n.prop('editmode_Automatique');
            this.sourceObject.properties[propertyScriptName] = "";
          }
          this.pendingObject.properties[propertyScriptName] = this.getDisplayString(config.automaticProperty[propertyScriptName]);
        }
      }
    }

  };

  cwApi.CwMandatoryValueChange.prototype.getDisplayString = function(cds) {

    var assoCDSPart,pages = {},cdsP,name, prop, assoNodeID, splitPart, splitPart2, targetObjPropScriptname;
    while (cds.indexOf('<§') !== -1 && cds.indexOf('§>') !== -1) {
      cdsP = false;
      assoCDSPart = cds.split("<§")[1].split("§>")[0];
      if(assoCDSPart.indexOf(".") !== -1) {
      	var propertyToGet,url;
      	propertyToGet = assoCDSPart.split(".")[1];
      	url = propertyToGet.split("(")[1];
      	url = url.replace(")","");
      	propertyToGet = propertyToGet.split("(")[0];

      	assoNodeID = assoCDSPart.split(".")[0];
      } else assoNodeID = assoCDSPart; 
      if (this.pendingObject.associations[assoNodeID] && this.pendingObject.associations[assoNodeID].items.length > 0) {
      	if(propertyToGet) {
			name = this.getPropertyFromObjectPage(propertyToGet,url,pages,this.pendingObject.associations[assoNodeID].items[0].targetObjectID);
      	} else {
      		name = this.pendingObject.associations[assoNodeID].items[0].name;
      	}
        cds = cds.replace('<§' + assoCDSPart + '§>', name);
      } else break;
    };

    while (cds.indexOf('{') !== -1 && cds.indexOf('}') !== -1) {
      prop = cds.split("{")[1].split("}")[0];

      if (this.pendingObject.properties[prop]) {
        cds = cds.replace('{' + prop + '}', this.pendingObject.properties[prop]);
      } else break;
    };

    return cds;

  };


  cwApi.CwMandatoryValueChange.prototype.addEmptyMandatoryPropertiesToList = function(propertyValue, propertyType) {
    if (this.isPropertyEmpty(propertyValue, propertyType.type)) {
      this.emptyMandatoryProperties.push(propertyType.name + " : " + $.i18n.prop('checkeditmode_propertywihtoutvalue'));
    }
  };

  cwApi.CwMandatoryValueChange.prototype.checkUniqueProperties = function(config) {
    var pages = {},
      propertyScriptName, propertyType, sourceIsNotNull;
    if (this.pendingObject.mandatory === undefined) this.pendingObject.mandatory = {};

    if (config.uniqueProperty) {
      for (propertyScriptName in this.pendingObject.properties) {
        if (this.pendingObject.properties.hasOwnProperty(propertyScriptName) && config.uniqueProperty.hasOwnProperty(propertyScriptName)) {
          propertyType = cwApi.mm.getProperty(this.objectTypeScriptName, propertyScriptName);

          if (this.checkPropertyUnicity(propertyScriptName, config.uniqueProperty[propertyScriptName], pages) === false) {
            this.emptyMandatoryProperties.push(propertyType.name + " : " + $.i18n.prop('checkeditmode_notuniquevalue'));
            this.pendingObject.mandatory[propertyScriptName] = true;
          } else {
            this.pendingObject.mandatory[propertyScriptName] = false;
          }

        }
      }
    }
  };



   cwApi.CwMandatoryValueChange.prototype.getPropertyFromObjectPage = function(propertyScriptName, objectPage, pages,id) {

    function getQueryStringValue(key) {
      return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
    };

    var o, n, reqEnd = true;
    if (pages.objectPage === undefined) pages[objectPage] = {};
    if (pages[objectPage][id] === undefined) {
      reqEnd = false;
      var url = cwApi.getLiveServerURL() + "page/" + objectPage + "/" + id + '?' + Math.random();

      var request = new XMLHttpRequest();
      request.open('GET', url, false); // `false` makes the request synchronous
      request.send(null);

      if (request.status === 200 && status != "Ko") {
        try {
          pages[objectPage][id] = JSON.parse(request.responseText);      
        } catch (e) {
          cwAPI.notificationManager.addError(e.message);
          return null;
        }
      } else return null;
    }

    if(pages[objectPage][id].object && pages[objectPage][id].object.properties && pages[objectPage][id].object.properties[propertyScriptName]) return pages[objectPage][id].object.properties[propertyScriptName];

    return null;

  };



  cwApi.CwMandatoryValueChange.prototype.checkPropertyUnicity = function(propertyScriptName, indexPage, pages, callback) {

    function getQueryStringValue(key) {
      return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
    };

    var o, n, reqEnd = true;
    if (pages.hasOwnProperty(indexPage) === false) {
      reqEnd = false;
      var url = cwApi.getLiveServerURL() + "page/" + indexPage + '?' + Math.random();

      var request = new XMLHttpRequest();
      request.open('GET', url, false); // `false` makes the request synchronous
      request.send(null);

      if (request.status === 200 && status != "Ko") {
        try {
          pages[indexPage] = JSON.parse(request.responseText);
        } catch (e) {
          cwAPI.notificationManager.addError(e.message);
          return true;
        }
      }
    }

    for (n in pages[indexPage]) {
      if (pages[indexPage].hasOwnProperty(n)) {
        for (var i = 0; i < pages[indexPage][n].length; i++) {
          if (this.pendingObject.properties[propertyScriptName].toLowerCase() === pages[indexPage][n][i].properties[propertyScriptName].toLowerCase()) {
            if (pages[indexPage][n][i].object_id.toString() !== cwApi.cwPageManager.getQueryString().cwid) {
              return false;
            }
          }
        }
      }
    }

    return true;

  };



  cwApi.CwMandatoryValueChange.prototype.checkNumberOfAssociation = function(config) {

    var node, a, n, c, l;
    for (n in this.pendingObject.associations) {
      if (this.pendingObject.associations.hasOwnProperty(n) && config.associations.hasOwnProperty(n)) {
        node = this.pendingObject.associations[n];
        c = config.associations[n];
        l = node.items.length;
        if ((c.min && l < c.min) || (c.max && l > c.max)) {
          var associationType = cwApi.getAssociationType(n);
          this.pendingObject.associations[n].isMandatory = true;
          var message;
          if (c.min && l < c.min) message = l + " " + $.i18n.prop('checkeditmode_minimunassociatedobjects') + " " + c.min; 
          if (c.max && l > c.max) message = l + " " + $.i18n.prop('checkeditmode_maximumassociatedobjects') + " " + c.max;
          this.emptyMandatoryAssociations.push(associationType.displayNodeName + " : " + message);

        }
      }
    }
  };

  cwApi.CwPendingChangeset.prototype.hasName = function() {
    var self = this;
    if (this.objectName === "") {
      this.propertyChanges.some(function(pc) {
        if (pc.propertyTypeScriptName === "NAME") {
          self.objectName = pc.pendingProperty.value;
          return true;
        }
      });
    }
    return this.objectName.trim() !== "";
  };


}(cwAPI, jQuery));