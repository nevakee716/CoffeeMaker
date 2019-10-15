(function(cwApi, $) { 
  "use strict";

    /********************************************************************************
    Config
    *********************************************************************************/

    var hideElementIf = {};
    hideElementIf.config = {
        "pia" : [
            {
                "style": "display",
                "styleValue": "none",
                "type" : "view",
                "id" : ["pia_evaluateur","pia_creation","pia_validation","pia_modification"]
            }, {
                "style": "display",
                "styleValue": "list-item",
                "type" : "view",
                "id" : ["pia"]
            }
        ],
        "pia_validation" : [
            {
                "style": "display",
                "styleValue": "none",
                "type" : "view",
                "id" : ["pia_evaluateur","pia_creation","pia","pia_modification"]
            }, {
                "style": "display",
                "styleValue": "list-item",
                "type" : "view",
                "id" : ["pia_validation"]
            }
        ],
        "pia_evaluateur" : [
            {
                "style": "display",
                "styleValue": "none",
                "type" : "view",
                "id" : ["pia","pia_creation","pia_validation","pia_modification"]
            }, {
                "style": "display",
                "styleValue": "list-item",
                "type" : "view",
                "id" : ["pia_evaluateur"]
            }
        ],
        "pia_modification" : [
            {
                "style": "display",
                "styleValue": "none",
                "type" : "view",
                "id" : ["pia","pia_creation","pia_validation","pia_evaluateur"]
            }, {
                "style": "display",
                "styleValue": "list-item",
                "type" : "view",
                "id" : ["pia_modification"]
            }
        ],
        "process" : [
            {
                "style": "display",
                "styleValue": "none",
                "type" : "class", 
                "class" : "fa-question-circle",
            },
            {
                "style": "display",
                "styleValue": "none",
                "type" : "class",
                "class" : "cwTabLink",
                "property" : "validated",
                "operator"  : "=",
                "value" : false,
                "nonActiveRole" : [2,3,4,5]
            },
            {
                "style": "display",
                "styleValue": "none",
                "type" : "class",
                "class" : "diagramme_1810699244",
                "property" : "validated",
                "operator"  : "=",
                "value" : false,
                "nonActiveRole" : [2,3,4,5]
            },
            {
                "style": "display",
                "styleValue": "none",
                "type" : "jqueryselector",
                "query" : "[id^=pg-propertygroup_500624039]",
                "property" : "validated",
                "operator"  : "=",
                "value" : true
            }
        ],
    };


    /********************************************************************************
    Custom Action for Single Page : See Impact here http://bit.ly/2qy5bvB
    *********************************************************************************/
    cwCustomerSiteActions.doActionsForSingle_Custom = function (rootNode) { 
        var currentView, url,i;
        currentView = cwAPI.getCurrentView();

        for(i in cwAPI.customLibs.doActionForSingle) {
            if(cwAPI.customLibs.doActionForSingle.hasOwnProperty(i)) {
                if (typeof(cwAPI.customLibs.doActionForSingle[i]) === "function"){
                    cwAPI.customLibs.doActionForSingle[i](rootNode,currentView.cwView);
                }   
            }
        }
    };

    hideElementIf.do = function(rootNode){
        var config,i;
        this.viewName = cwAPI.getCurrentView().cwView;
        var doAction = true;
        if(this.config && this.config.hasOwnProperty(this.viewName)) {
            for (var i = 0; i < this.config[this.viewName].length; i += 1) {
                doAction = true;
                var tempConfig = this.config[this.viewName][i];
                if(tempConfig.hasOwnProperty("property") && tempConfig.hasOwnProperty("operator") && tempConfig.hasOwnProperty("value")) {
                    doAction = this.isActionToDo(rootNode,tempConfig);
                }
                if(doAction) {
                    this.execute(tempConfig);
                }
            }
        }
    };

    hideElementIf.isActionToDo = function(rootNode,config){
        if(rootNode) {
            var objPropertyValue;
            if(config.nonActiveRole) {
                var currentUser = cwApi.currentUser;
                for (var i = 0; i < currentUser.RolesId.length; i++) {
                    if(config.nonActiveRole.indexOf(currentUser.RolesId[i]) !== -1) return false;
                };                  
            }

            if(config.property == "id") {
                objPropertyValue = rootNode.object_id;
            } else {
                objPropertyValue = rootNode.properties[config.property];
            }
            switch(config.operator) {
                case "=":
                    if(Array.isArray(config.value))  {
                        for (var i = 0; i < config.value.length; i += 1) {
                           if(objPropertyValue == config.value[i] ) return true; 
                        }
                    }
                    if(objPropertyValue == config.value) return true;
                    break;
                case "<":
                    if(Array.isArray(config.value))  {
                        for (var i = 0; i < config.value.length; i += 1) {
                           if(objPropertyValue < config.value[i] ) return true; 
                        }
                    }
                    if(objPropertyValue < config.value) return true;
                    break;
                case "<=":
                    if(Array.isArray(config.value))  {
                        for (var i = 0; i < config.value.length; i += 1) {
                           if(objPropertyValue <= config.value[i] ) return true; 
                        }
                    }
                    if(objPropertyValue <= config.value) return true;
                    break;
                case ">":
                    if(Array.isArray(config.value))  {
                        for (var i = 0; i < config.value.length; i += 1) {
                           if(objPropertyValue > config.value[i] ) return true; 
                        }
                    }
                    if(objPropertyValue > config.value) return true;
                    break;
                case ">=":
                    if(Array.isArray(config.value))  {
                        for (var i = 0; i < config.value.length; i += 1) {
                           if(objPropertyValue >= config.value[i] ) return true; 
                        }
                    }
                    if(objPropertyValue >= config.value) return true;
                    break;
                case "!=":
                    if(Array.isArray(config.value))  {
                        for (var i = 0; i < config.value.length; i += 1) {
                           if(objPropertyValue != config.value[i] ) return true; 
                        }
                    }
                    if(objPropertyValue != config.value) return true;
                    break;
                default:
                    return false;
            }
        }
        return false;
    };



    hideElementIf.execute = function(config){


        var self = this;

        function doForElementOrArray(elem,callback) {
            if(Array.isArray(elem))  {
                for (var i = 0; i < elem.length; i += 1) {
                   callback(elem[i]);
                }
            } else {
                callback(elem);
            }
        };

        

        if(config.hasOwnProperty("style") && config.hasOwnProperty("styleValue") && config.hasOwnProperty("type") && (config.hasOwnProperty("id")  || config.hasOwnProperty("class") || config.hasOwnProperty("query")) ) {
            switch(config.type.toLowerCase()) {
                case "tab":
                    doForElementOrArray(config.id,function(id){
                        self.actionOnId(config.style,config.styleValue,self.viewName + "-tab-" +  id);
                    });
                    break;
                case "jqueryselector": 
                    doForElementOrArray(config.query,function(q){
                        self.actionWithQuery(config.style,config.styleValue,q);
                    });
                    break;                  
                case "propertygroup":
                    doForElementOrArray(config.id,function(id){
                        self.actionOnClassAndId(config.style,config.styleValue,"cwPropertiesTableContainer",id.toLowerCase());
                    });
                    break;
                case "class":
                    doForElementOrArray(config.class,function(c){
                        self.actionOnClass(config.style,config.styleValue,c);
                    });
                    break;
                case "id":
                    doForElementOrArray(config.id,function(id){
                       self.actionOnId(config.style,config.styleValue,id);
                    });
                    
                    break;
                case "view":
                    doForElementOrArray(config.id,function(id){
                        self.actionOnId(config.style,config.styleValue,"navview-" + id);
                    });

                    
                    break;
                default:
                    return false;
            }
        }
    };

    hideElementIf.actionOnClass = function(style,value,className){

        var elements = document.getElementsByClassName(className);
        var i;
        for (i = 0; i < elements.length; i++) {
            elements[i].style[style] = value;               
        }
    };
 
    hideElementIf.actionWithQuery = function(style,value,query){
        try {
            $(query).css(style,value);            
        } catch(e) {
            console.log(e);
        }

    };

    hideElementIf.actionOnId = function(style,value,id){

        var element = document.getElementById(id);
        if(element && element.style) {
            element.style[style] = value;               
        }
    };
    
    hideElementIf.actionOnClassAndId = function(style,value,className,id){
        var elements = document.getElementsByClassName(className);
        var i;
        for (i = 0; i < elements.length; i++) {
            if(elements[i].id.indexOf(id)!== -1) {
                elements[i].style[style] = value;               
            }       
        }
    };



    /********************************************************************************
    Configs : add trigger for single page
    *********************************************************************************/
    if(cwAPI.customLibs === undefined) { cwAPI.customLibs = {};}
    if(cwAPI.customLibs.doActionForSingle === undefined) { cwAPI.customLibs.doActionForSingle = {};}
    cwAPI.customLibs.doActionForSingle.hideElementIf = hideElementIf.do.bind(hideElementIf); 
    cwAPI.customLibs.isActionToDo = hideElementIf.isActionToDo.bind(hideElementIf); 
    
}(cwAPI, jQuery));