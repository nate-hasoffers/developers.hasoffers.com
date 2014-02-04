/// <reference path="ts_defs/_all.d.ts"/>
var DocApp;
(function (DocApp) {
    var services;
    (function (services) {
        'use strict';
        // Provides access to the api definitions
        var DocRetriever = (function () {
            function DocRetriever($http) {
                this.$http = $http;
                this.apiDefinitions = {};
            }
            // Retrieves a specific API definition, including its models and targets
            DocRetriever.prototype.getApiDefinition = function (apiAlias) {
                var _this = this;
                // Manage a singleton report definition
                if (this.apiDefinitions[apiAlias] == null) {
                    this.apiDefinitions[apiAlias] = this.$http.get('resource/api.' + apiAlias + '.json', { cache: true }).then(function (response) {
                        _this.wireUpApiReferences(response.data);
                        return response.data;
                    });
                }
                return this.apiDefinitions[apiAlias];
            };
            // Wires up all object references within the API.
            // This includes setting a reference from each method to its target, from each target to its api, and for some
            // specific parameter types it replaces string model names with references to the actual model
            DocRetriever.prototype.wireUpApiReferences = function (apiDefinition) {
                // Model names are unique, so we'll create a map of model name => model for easy retrieval
                apiDefinition.modelMap = _.object(_.map(apiDefinition.models, function (model) {
                    return [model.name, model];
                }));
                // Function to retrieve a model by name, which throws an exception if no such model exists
                var getModelFromMap = function (modelName) {
                    if (apiDefinition.modelMap[modelName] == null) {
                        throw new Error('No model found with name: ' + modelName);
                    }
                    return apiDefinition.modelMap[modelName];
                };
                // Wire up references for the target and all its children
                _.each(apiDefinition.targets, function (target) {
                    target.api = apiDefinition;
                    // Wire up references for all this target's methods and their children
                    _.each(target.methods, function (method) {
                        method.target = target;
                        // Wire up references for all this method's parameters and their children
                        _.each(method.parameters, function (param) {
                            param.method = method;
                            // Wire up references to models from model-driven parameter data types
                            _.each(param.allowedDataTypes, function (dataType) {
                                switch (dataType.name) {
                                    case '@contain@':
                                        // Attach base model and the remote models for all relationships
                                        var containsType = dataType;
                                        containsType.baseModel = getModelFromMap(containsType.baseModelName);
                                        _.each(containsType.relationships, function (relationship) {
                                            relationship.model = getModelFromMap(relationship.modelName);
                                        });
                                        break;
                                    case '@data@':
                                        var fieldDataType = dataType;
                                        fieldDataType.model = getModelFromMap(fieldDataType.modelName);
                                        break;
                                    case '@field@':
                                        var fieldType = dataType;
                                        fieldType.model = getModelFromMap(fieldType.modelName);
                                        break;
                                    case '@fields@':
                                        var fieldsType = dataType;
                                        fieldsType.model = getModelFromMap(fieldsType.modelName);
                                        break;
                                    case '@filter@':
                                        var filtersType = dataType;
                                        filtersType.model = getModelFromMap(filtersType.modelName);
                                        break;
                                    case '@report_filter@':
                                        var reportFiltersType = dataType;
                                        reportFiltersType.model = getModelFromMap(reportFiltersType.modelName);
                                        break;
                                    case '@sort@':
                                        var sortsType = dataType;
                                        sortsType.model = getModelFromMap(sortsType.modelName);
                                        break;
                                }
                            });
                        });
                    });
                });
            };
            return DocRetriever;
        })();
        services.DocRetriever = DocRetriever;
        // Manages storage and access of persistent data for the user/browser
        var UserInfo = (function () {
            function UserInfo() {
                this.isLocalStorageEnabled = ('localStorage' in window && window.localStorage !== null);
            }
            /**
             * Returns user value set for the specified property in localStorage.
             *
             * @param  {string} key  The property whose value to get.
             * @return {?*}          The value if set, or null if not set.
             */
            UserInfo.prototype.getProperty = function (key) {
                return this.isLocalStorageEnabled ? window.localStorage.getItem(key) : null;
            };
            /**
             * Attempts to set a property for the user in localStorage.
             * Silently fails if attempt to set property fails.
             *
             * @param {string} key    The name of the property to set.
             * @param {*}      value  The value to set for the property.
             */
            UserInfo.prototype.setProperty = function (key, value) {
                if (this.isLocalStorageEnabled) {
                    try {
                        window.localStorage.setItem(key, value);
                    }
                    catch (e) {
                    }
                }
            };
            return UserInfo;
        })();
        services.UserInfo = UserInfo;
        // Provides human-readable names/descriptions for a parameter data type
        var DataTypeDescriber = (function () {
            function DataTypeDescriber() {
            }
            DataTypeDescriber.prototype.getParamDataTypeDescription = function (dataType) {
                switch (dataType.name) {
                    case '@contain@':
                        return 'Contain';
                    case '@data@':
                        return 'Data Object';
                    case '@field@':
                        return 'Writable Model Field';
                    case '@fields@':
                        return 'Array of Model Fields';
                    case '@filter@':
                        return 'Filter';
                    case '@report_filter@':
                        return 'Report Filter';
                    case '@sort@':
                        return 'Sort';
                    case '@structured_object@':
                        return 'Structured Object';
                    case '@structured_object_array@':
                        return 'Structured Object Array';
                    case '@unstructured_object@':
                        return 'Unstructured Object';
                    case 'array':
                        var arrayDataType = dataType;
                        return 'Array of ' + arrayDataType.valueType;
                    default:
                        return dataType.name;
                }
            };
            // Provides human-readable names/descriptions for a method response data type
            DataTypeDescriber.prototype.getReturnDataTypeDescription = function (dataType) {
                return dataType.name;
            };
            return DataTypeDescriber;
        })();
        services.DataTypeDescriber = DataTypeDescriber;
        // Modal service to wrap around the ng.ui.bootstrap.IModalService so that the body won't scroll when the mousewheel is
        // used while a modal is visible.
        var HasModal = (function () {
            function HasModal($modal, $document) {
                this.$modal = $modal;
                this.$document = $document;
            }
            // Opens a modal and returns the modal instance
            HasModal.prototype.open = function (options) {
                var bodyEl = angular.element(this.$document[0].body);
                // Hide overflow on the body so that when the body won't scroll
                bodyEl.addClass('hide-overflow');
                // Open the modal
                var modalInstance = this.$modal.open(options);
                // Remove the body class when the modal closes for any reason
                modalInstance.result.then(function () {
                    bodyEl.removeClass('hide-overflow');
                }, function () {
                    bodyEl.removeClass('hide-overflow');
                });
                return modalInstance;
            };
            return HasModal;
        })();
        services.HasModal = HasModal;
    })(services = DocApp.services || (DocApp.services = {}));
})(DocApp || (DocApp = {}));
//# sourceMappingURL=services.js.map