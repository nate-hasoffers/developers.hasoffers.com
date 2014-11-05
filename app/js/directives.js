/// <reference path="ts_defs/_all.d.ts"/>
var DocApp;
(function (DocApp) {
    var directives;
    (function (directives) {
        'use strict';
        function HasModelDetailsButton(HasModal) {
            return {
                restrict: 'A',
                scope: { model: '=' },
                template: '<a href="javascript:void(0);" ng-click="displayModal()">{{model.name}}</a>',
                link: function (scope, element, attrs) {
                    // Display the modal
                    scope.displayModal = function () {
                        HasModal.open({
                            backdropClick: true,
                            controller: function ($scope, $modalInstance, model) {
                                $scope.model = model;
                                $scope.close = function () {
                                    $modalInstance.close();
                                };
                            },
                            templateUrl: 'directive-templates/modelDetails.html',
                            resolve: {
                                model: function () {
                                    return scope.model;
                                }
                            },
                            windowClass: "model-details"
                        });
                    };
                }
            };
        }
        directives.HasModelDetailsButton = HasModelDetailsButton;
        function HasParamDataTypeDetailsButton(HasModal, DataTypeDescriber) {
            return {
                restrict: 'A',
                scope: { paramDataType: '=' },
                template: '{{dataTypeLinkName}} <a href="javascript:void(0);" ng-click="displayModal()"> <i class="icon-question-sign"></i></a>',
                link: function (scope, element, attrs) {
                    // Get the name for the link
                    scope.dataTypeLinkName = DataTypeDescriber.getParamDataTypeDescription(scope.paramDataType);
                    // Determine which modal template to use
                    var dataTypeTemplate;
                    switch (scope.paramDataType.name) {
                        case '@contain@':
                        case '@data@':
                        case '@field@':
                        case '@fields@':
                        case '@filter@':
                        case '@report_filter@':
                        case '@sort@':
                        case '@structured_object@':
                        case '@structured_object_array@':
                        case '@unstructured_object@':
                            // Strip off the @ signs
                            dataTypeTemplate = scope.paramDataType.name.substring(1, scope.paramDataType.name.length - 1);
                            break;
                        case 'array':
                            dataTypeTemplate = 'primitiveArray';
                            break;
                        default:
                            dataTypeTemplate = 'primitive';
                            break;
                    }
                    // Display the modal
                    scope.displayModal = function () {
                        HasModal.open({
                            backdropClick: true,
                            controller: function ($scope, $modalInstance, paramDataType, dataTypeLinkName) {
                                $scope.paramDataType = paramDataType;
                                $scope.dataTypeLinkName = dataTypeLinkName;
                                $scope.close = function () {
                                    $modalInstance.close();
                                };
                            },
                            template: '<div class="modal-header">Parameter Data Type: {{dataTypeLinkName}}</div><div class="modal-body" ng-include="\'directive-templates/param-data-type-descriptions/' + dataTypeTemplate + '.html\'"></div><div class="modal-footer"><button class="btn btn-warning" ng-click="close()">Close</button></div>',
                            resolve: {
                                paramDataType: function () {
                                    return scope.paramDataType;
                                },
                                dataTypeLinkName: function () {
                                    return scope.dataTypeLinkName;
                                }
                            },
                            windowClass: "param-type-details"
                        });
                    };
                }
            };
        }
        directives.HasParamDataTypeDetailsButton = HasParamDataTypeDetailsButton;
        function HasGetApiCodeButton($timeout, HasModal) {
            return {
                restrict: 'A',
                scope: { apiCallArgSet: '=', codeLanguage: '=', buttonLabel: '=' },
                template: '<button class="btn" type="button" ng-click="displayModal()">{{buttonLabel}}</button>',
                link: function (scope, element, attrs) {
                    // Display the modal
                    scope.displayModal = function () {
                        HasModal.open({
                            windowClass: 'code-example',
                            backdropClick: true,
                            resolve: {
                                apiCallArgSet: function () {
                                    return scope.apiCallArgSet;
                                }
                            },
                            controller: function ($scope, $modalInstance, apiCallArgSet) {
                                // Store the API call arg set this code is for
                                $scope.apiCallArgSet = apiCallArgSet;
                                // Perform some expensive translations of the arg dictionary so we can use it in filters and avoid
                                // having to recalculate it multiple times
                                $scope.apiCallArgDictionary = apiCallArgSet.getArgDictionary();
                                $scope.flattenedApiCallDictionary = DocApp.filters.HasFlattenArgDictionaryFilter.filter($scope.apiCallArgDictionary);
                                // Helper function to simplify logic to determine api access type
                                $scope.isAffiliateCall = function () {
                                    return scope.apiCallArgSet.method.target.api.access === 'affiliate';
                                };
                                // Helper function to simplify logic to determine api access type
                                $scope.isBrandCall = function () {
                                    return scope.apiCallArgSet.method.target.api.access === 'brand';
                                };
                                // Close the modal
                                $scope.close = function () {
                                    $modalInstance.close();
                                };
                            },
                            templateUrl: 'directive-templates/api-code-snippets/apiCall-' + scope.codeLanguage + '.html'
                        }).opened.then(function () {
                            // After opened, wait a moment and then run the syntax highlighter.
                            // It doesn't work immediately (perhaps some DOM elements are not yet in place) immediately after opened.
                            $timeout(function () {
                                SyntaxHighlighter.highlight();
                            }, 100);
                        });
                    };
                }
            };
        }
        directives.HasGetApiCodeButton = HasGetApiCodeButton;
        function HasContainArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/contain.html',
                link: function (scope, element, attrs) {
                    // No relationship by default
                    scope.newContainRelationship = null;
                    // Initialize value and default
                    scope.arg.defaultValue = [];
                    scope.arg.value = [];
                    // Returns all unused contain relationships
                    scope.getUnusedContainRelationships = function () {
                        return _.difference(scope.arg.selectedDataType.relationships, scope.arg.value);
                    };
                    // Function to add the newly selected contain relationship
                    scope.addNewContainRelationship = function () {
                        // Add the relationship
                        scope.arg.value.push(scope.newContainRelationship);
                        // Null out the temp container variable
                        scope.newContainRelationship = null;
                    };
                }
            };
        }
        directives.HasContainArg = HasContainArg;
        function HasFieldDataArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/data.html',
                link: function (scope, element, attrs) {
                    // No new field selected by default
                    scope.newField = null;
                    // Initialize value and default
                    scope.arg.defaultValue = [];
                    scope.arg.value = [];
                    // Returns writable fields which are not yet specified (no value set)
                    scope.getUnspecifiedFields = function () {
                        // Return any model fields that are unused and not read-only
                        var unusedFields = _.difference(_.toArray(scope.arg.selectedDataType.model.fields), _.pluck(scope.arg.value, 'field'));
                        return _.filter(unusedFields, function (field) {
                            return field.writable;
                        });
                    };
                    // Function to specify a new field to the argument.
                    // If a whitelist of values exists, select the first one, else empty string
                    scope.addNewField = function () {
                        // Determine the initial value for the selection
                        var initialVal = '';
                        if (scope.newField.allowedValues != null) {
                            // The field has a list of allowed values, so set it to the first one alphabetically
                            initialVal = _.sortBy(scope.newField.allowedValues, function (val) {
                                return val;
                            })[0];
                        }
                        else if (scope.newField.dataType === 'boolean') {
                            // The field is a boolean, so set it to true initially
                            initialVal = 1;
                        }
                        scope.arg.value.push({
                            'field': scope.newField,
                            'value': initialVal
                        });
                        scope.newField = null;
                    };
                }
            };
        }
        directives.HasFieldDataArg = HasFieldDataArg;
        function HasStructuredObjectArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/structured_object.html',
                link: function (scope, element, attrs) {
                    // No new field selected by default
                    scope.newField = null;
                    // Initialize value and default
                    scope.arg.defaultValue = [];
                    scope.arg.value = [];
                    // Returns structured object fields which are not yet specified (no value set)
                    scope.getUnspecifiedFields = function () {
                        // Return any fields that are unused
                        return _.difference(_.toArray(scope.arg.selectedDataType.fields), _.pluck(scope.arg.value, 'field'));
                    };
                    // Function to specify a new field to the argument.
                    // If a whitelist of values exists, select the first one, else empty string
                    scope.addNewField = function () {
                        // Determine the initial value for the selection
                        var initialVal = '';
                        if (scope.newField.allowedValues != null) {
                            // The field has a list of allowed values, so set it to the first one alphabetically
                            initialVal = _.sortBy(scope.newField.allowedValues, function (val) {
                                return val;
                            })[0];
                        }
                        else if (scope.newField.dataType === 'boolean') {
                            // The field is a boolean, so set it to true initially
                            initialVal = 1;
                        }
                        scope.arg.value.push({
                            'field': scope.newField,
                            'value': initialVal
                        });
                        scope.newField = null;
                    };
                }
            };
        }
        directives.HasStructuredObjectArg = HasStructuredObjectArg;
        function HasStructuredObjectArrayArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/structured_object_array.html',
                link: function (scope, element, attrs) {
                    // Initialize value and default
                    scope.arg.defaultValue = [];
                    scope.arg.value = [];
                    // Add a new object to the array (this is an empty array to contain a set of field/value items)
                    scope.addNewObject = function () {
                        scope.arg.value.push([]);
                    };
                    // Returns structured object fields which are not yet specified in the provided array
                    scope.getUnspecifiedFields = function (objFields) {
                        // Return any fields that are unused
                        return _.difference(_.toArray(scope.arg.selectedDataType.fields), _.pluck(objFields, 'field'));
                    };
                    // Function to specify a new field to the argument.
                    // If a whitelist of values exists, select the first one, else empty string
                    scope.addNewField = function (newField, existingFields) {
                        // Determine the initial value for the selection
                        var initialVal = '';
                        if (newField.allowedValues != null) {
                            // The field has a list of allowed values, so set it to the first one alphabetically
                            initialVal = _.sortBy(newField.allowedValues, function (val) {
                                return val;
                            })[0];
                        }
                        else if (newField.dataType === 'boolean') {
                            // The field is a boolean, so set it to true initially
                            initialVal = 1;
                        }
                        existingFields.push({
                            'field': newField,
                            'value': initialVal
                        });
                    };
                }
            };
        }
        directives.HasStructuredObjectArrayArg = HasStructuredObjectArrayArg;
        function HasUnstructuredObjectArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/unstructured_object.html',
                link: function (scope, element, attrs) {
                    // Initialize value and default
                    scope.arg.defaultValue = [];
                    scope.arg.value = [];
                    // Function to specify a new field to the argument.
                    scope.addNewField = function () {
                        scope.arg.value.push({
                            'field': '',
                            'value': ''
                        });
                    };
                }
            };
        }
        directives.HasUnstructuredObjectArg = HasUnstructuredObjectArg;
        function HasFilterArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/filter.html',
                link: function (scope, element, attrs) {
                    // Initialize value and default
                    scope.arg.defaultValue = {
                        'operator': 'AND',
                        'fieldFilters': []
                    };
                    scope.arg.value = angular.copy(scope.arg.defaultValue);
                    // Helper function to identify whether this is an affiliate API call, as we have some custom behavior
                    // modifications to the filter directive for the affiliate API.
                    var isAffiliateApi = function () {
                        return scope.arg.param.method.target.api.access === 'affiliate';
                    };
                    // Returns all fields in the argument's model that can be filtered on.
                    scope.getFilterableFields = function () {
                        // Get all the readable fields (they are filterable) that are not synthetic.
                        var readableFields = _.filter(scope.arg.selectedDataType.model.fields, function (field) {
                            // This is a hack, but some Affiliate API models expose the affiliate_id and since it is always fixed to
                            // the affiliate ID of the caller, filtering on this field does not make any sense.  As such, we simply
                            // avoid including it.
                            // This doesn't catch every one (e.g. some models use account_id), but this catches most of them and they
                            // simply won't be able to get results back if a filter includes IDs other than their own.
                            if (field.name === 'affiliate_id' && isAffiliateApi()) {
                                return false;
                            }
                            return field.readable && !field.synthetic;
                        });
                        // Remove any fields that already have filters and return what remains
                        return _.difference(readableFields, _.pluck(scope.arg.value.fieldFilters, 'field'));
                    };
                    // Function to add a new field to the filter set, using an arbitrary relational operator that it supports.
                    // Should only be called if there are valid relational operators.
                    scope.addNewFieldFilter = function () {
                        // Crete a new field filter; it will use the first available relational operator by default.
                        // We pass in the API this filter is for, because there are some differences in the way Affiliate and Brand
                        // filters work.
                        var newFieldFilter = new DocApp.domain.methodArgs.FieldFilter(scope.newField, scope.arg.param.method.target.api);
                        // Add the field filter for this argument
                        scope.arg.value.fieldFilters.push(newFieldFilter);
                        // reset field
                        scope.newField = null;
                    };
                }
            };
        }
        directives.HasFilterArg = HasFilterArg;
        function HasReportFilterArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/report_filter.html',
                link: function (scope, element, attrs) {
                    // Initialize value and default
                    scope.arg.defaultValue = [];
                    scope.arg.value = [];
                    // Returns all fields in the argument's model that can be filtered on.
                    scope.getFilterableFields = function () {
                        // Get all the readable fields (they are filterable) that are not synthetic.
                        // This is mostly a formality, as all fields in a model identified for a report filter should be readable.
                        var readableFields = _.filter(scope.arg.selectedDataType.model.fields, function (field) {
                            return field.readable && !field.synthetic;
                        });
                        // Remove any fields that already have filters and return what remains
                        return _.difference(readableFields, _.pluck(scope.arg.value, 'field'));
                    };
                    // Function to add a new field to the filter set, using an arbitrary relational operator that it supports.
                    // Should only be called if there are valid relational operators.
                    scope.addNewFieldFilter = function () {
                        // Crete a new field filter; it will use the first available relational operator by default.
                        // We pass in the API this filter is for, because there are some differences in the way Affiliate and Brand
                        // filters work.
                        var newFieldFilter = new DocApp.domain.methodArgs.ReportFieldFilter(scope.newField);
                        // Add the field filter for this argument
                        scope.arg.value.push(newFieldFilter);
                        // reset field
                        scope.newField = null;
                    };
                }
            };
        }
        directives.HasReportFilterArg = HasReportFilterArg;
        function HasSortArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/sort.html',
                link: function (scope, element, attrs) {
                    // No sort field selected by default
                    scope.newSortField = null;
                    // Initialize value and default
                    scope.arg.defaultValue = [];
                    scope.arg.value = [];
                    // Returns all fields in the parameter's model that have not been used in existing sort combos for this argument.
                    scope.getUnusedSortFields = function () {
                        // Return any model fields that are unused and readable, and not synthetic.
                        var unusedFields = _.difference(_.toArray(scope.arg.selectedDataType.model.fields), _.pluck(scope.arg.value, 'field'));
                        return _.filter(unusedFields, function (field) {
                            return field.readable && !field.synthetic;
                        });
                    };
                    // Add a new sort combo for the selected field
                    scope.addNewSortField = function () {
                        scope.arg.value.push({
                            'field': scope.newSortField,
                            'direction': 'asc'
                        });
                        scope.newSortField = null;
                    };
                }
            };
        }
        directives.HasSortArg = HasSortArg;
        function HasFieldArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/field.html',
                link: function (scope, element, attrs) {
                    // Initialize value to null (no field selected)
                    scope.arg.value = null;
                }
            };
        }
        directives.HasFieldArg = HasFieldArg;
        function HasFieldsArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/fields.html',
                link: function (scope, element, attrs) {
                    // No new field by default
                    scope.newField = null;
                    // Initialize value and default
                    scope.arg.defaultValue = [];
                    scope.arg.value = [];
                    // Returns the model fields for this arg that are not already selected
                    scope.getUnselectedModelFields = function () {
                        // Return any model fields that are unused and readable, and not synthetic.
                        var unusedFields = _.difference(_.toArray(scope.arg.selectedDataType.model.fields), scope.arg.value);
                        return _.filter(unusedFields, function (field) {
                            return field.readable && !field.synthetic;
                        });
                    };
                    // Function to add a new field to those selected
                    scope.addNewField = function () {
                        // Add this field to the selected ones
                        scope.arg.value.push(scope.newField);
                        // Clear out the temp field container
                        scope.newField = null;
                    };
                }
            };
        }
        directives.HasFieldsArg = HasFieldsArg;
        function HasPrimitiveArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/primitive.html',
                link: function (scope, element, attrs) {
                    // Initialize value and default
                    scope.arg.value = scope.arg.defaultValue = null;
                    // Function to initialize a value so that the input will show
                    scope.initializeValue = function () {
                        // Booleans initialize to true, all else empty strings
                        if (scope.arg.selectedDataType.name === 'boolean') {
                            scope.arg.value = true;
                        }
                        else {
                            scope.arg.value = '';
                        }
                    };
                    // Helper function to stringify booleans
                    scope.boolToStr = function (bool) {
                        return bool ? 'True' : 'False';
                    };
                    // Function to destroy the value so that the input will disappear
                    scope.destroyValue = function () {
                        scope.arg.value = null;
                    };
                }
            };
        }
        directives.HasPrimitiveArg = HasPrimitiveArg;
        function HasPrimitiveArrayArg() {
            return {
                restrict: 'A',
                scope: { arg: '=' },
                templateUrl: 'directive-templates/api-builder-args/primitiveArray.html',
                link: function (scope, element, attrs) {
                    // Initialize value and default
                    scope.arg.defaultValue = [];
                    scope.arg.value = [];
                    // Function to initialize a value so that a new input will show
                    scope.initializeValue = function () {
                        scope.arg.value.push('');
                    };
                    // Function to destroy a value at a specified index
                    scope.destroyValue = function (valIndex) {
                        scope.arg.value.splice(valIndex, 1);
                    };
                }
            };
        }
        directives.HasPrimitiveArrayArg = HasPrimitiveArrayArg;
        function HasApiBuilder($http, HasModal, UserInfo, DataTypeDescriber) {
            return {
                restrict: 'A',
                scope: { method: '=' },
                templateUrl: 'directive-templates/apiBuilder.html',
                link: function (scope, element, attrs) {
                    // Attach data type describer so we can provide human-readable details about data types
                    scope.DataTypeDescriber = DataTypeDescriber;
                    // Don't show code example by default
                    scope.showCodeExample = false;
                    // Default example language is HTTP URL
                    scope.codeExampleLanguage = 'url';
                    // Reset the value on an argument to the default
                    scope.resetArgValue = function (arg) {
                        arg.value = angular.copy(arg.defaultValue);
                    };
                    // Create a container to store all the arguments for this API call, including auth details as well as the
                    // method-specific arguments.
                    scope.apiCallArgs = new DocApp.domain.methodArgs.ApiCallArgSet(scope.method, UserInfo.getProperty('NetworkId'), UserInfo.getProperty('NetworkToken'), UserInfo.getProperty('AffiliateKey'));
                    // Executes the API call that the user has set up.
                    scope.runApiCall = function () {
                        // Ensure Network ID provided
                        if (scope.apiCallArgs.networkId == null || scope.apiCallArgs.networkId === '') {
                            alert('Please provide Network Id');
                            return;
                        }
                        UserInfo.setProperty('NetworkId', scope.apiCallArgs.networkId);
                        // Ensure correct token provided
                        if (scope.method.target.api.access === 'affiliate') {
                            // Affiliate API requires api_key parameter
                            if (scope.apiCallArgs.affiliateKey == null || scope.apiCallArgs.affiliateKey === '') {
                                alert('Please provide an Affiliate Key');
                                return;
                            }
                            // Store key for this user
                            UserInfo.setProperty('AffiliateKey', scope.apiCallArgs.affiliateKey);
                        }
                        else if (scope.method.target.api.access === 'brand') {
                            // Brand API requires NetworkToken parameter
                            if (scope.apiCallArgs.networkToken == null || scope.apiCallArgs.networkToken === '') {
                                alert('Please provide Network Token');
                                return;
                            }
                            // update user info
                            UserInfo.setProperty('NetworkToken', scope.apiCallArgs.networkToken);
                        }
                        // Open the modal to display the results of the call
                        HasModal.open({
                            backdropClick: true,
                            controller: function ($scope, $timeout, $modalInstance, apiCallArgs) {
                                $scope.apiCallArgs = apiCallArgs;
                                $scope.loading = true;
                                $scope.apiResponse = null;
                                // Switch from JSON to JSONP.
                                $http.jsonp(scope.getCurrentApiCallUrl('jsonp') + '&callback=JSON_CALLBACK').success(function (data) {
                                    $scope.apiResponse = angular.toJson(data, true);
                                    $scope.loading = false;
                                }).error(function (data) {
                                    $scope.apiResponse = angular.toJson(data, true) || 'an unexpected error occurred';
                                    $scope.loading = false;
                                });
                                $scope.close = function () {
                                    $modalInstance.close();
                                };
                            },
                            templateUrl: 'directive-templates/apiResponse.html',
                            windowClass: 'api-response',
                            resolve: {
                                apiCallArgs: function () {
                                    return scope.apiCallArgs;
                                }
                            }
                        });
                    };
                    // Returns an API url for the current method, using the user-provided parameters
                    scope.getCurrentApiCallUrl = function (contentType) {
                        return scope.apiCallArgs.method.target.api.baseUrl + contentType + '?' + jQuery.param(scope.apiCallArgs.getArgDictionary());
                    };
                }
            };
        }
        directives.HasApiBuilder = HasApiBuilder;
    })(directives = DocApp.directives || (DocApp.directives = {}));
})(DocApp || (DocApp = {}));
//# sourceMappingURL=directives.js.map