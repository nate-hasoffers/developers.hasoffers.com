/// <reference path="ts_defs/_all.d.ts"/>

module DocApp.directives {
  'use strict';


  // A directive that displays a model name that is clickable to open a modal with details
  interface IHasModelDetailsButtonScope extends ng.IScope {
    model: DocApp.domain.IApiModel;
    modalInstance: ng.ui.bootstrap.IModalServiceInstance;
    displayModal: () => void;
    close: () => void;
  }
  export function HasModelDetailsButton(HasModal: DocApp.services.HasModal): ng.IDirective {
    return {
      restrict: 'A',
      scope: {model: '='},
      template: '<a href="javascript:void(0);" ng-click="displayModal()">{{model.name}}</a>',
      link: (scope: IHasModelDetailsButtonScope, element, attrs) => {
        // Display the modal
        scope.displayModal = () => {
          HasModal.open({
            backdropClick: true,
            controller: ($scope, $modalInstance: ng.ui.bootstrap.IModalServiceInstance, model) => {
              $scope.model = model;
              $scope.close = () => {
                $modalInstance.close();
              };
            },
            templateUrl: 'directive-templates/modelDetails.html',
            resolve: {
              model: () => { return scope.model; }
            },
            windowClass: "model-details"
          });
        };
      }
    };
  }


  // A directive that displays a parameter data type that is clickable to open a modal with details
  interface IHasParamDataTypeDetailsButtonScope extends ng.IScope {
    paramDataType: DocApp.domain.paramDataTypes.IParamDataType;
    modalInstance: ng.ui.bootstrap.IModalServiceInstance;
    dataTypeLinkName: string;
    displayModal: () => void;
    close: () => void;
  }
  export function HasParamDataTypeDetailsButton(HasModal: DocApp.services.HasModal,
                                                DataTypeDescriber: DocApp.services.DataTypeDescriber): ng.IDirective {
    return {
      restrict: 'A',
      scope: {paramDataType: '='},
      template: '{{dataTypeLinkName}} <a href="javascript:void(0);" ng-click="displayModal()"> <i class="icon-question-sign"></i></a>',
      link: (scope: IHasParamDataTypeDetailsButtonScope, element, attrs) => {
        // Get the name for the link
        scope.dataTypeLinkName = DataTypeDescriber.getParamDataTypeDescription(scope.paramDataType);

        // Determine which modal template to use
        var dataTypeTemplate;
        switch(scope.paramDataType.name) {
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
            dataTypeTemplate = scope.paramDataType.name.substring(1, scope.paramDataType.name.length - 1 );
            break;
          case 'array':
            dataTypeTemplate = 'primitiveArray';
            break;
          default:
            dataTypeTemplate = 'primitive';
            break;
        }

        // Display the modal
        scope.displayModal = () => {
          HasModal.open({
            backdropClick: true,
            controller: ($scope, $modalInstance: ng.ui.bootstrap.IModalServiceInstance, paramDataType, dataTypeLinkName) => {
              $scope.paramDataType = paramDataType;
              $scope.dataTypeLinkName = dataTypeLinkName;

              $scope.close = () => {
                $modalInstance.close();
              };
            },
            template: '<div class="modal-header">Parameter Data Type: {{dataTypeLinkName}}</div><div class="modal-body" ng-include="\'directive-templates/param-data-type-descriptions/' + dataTypeTemplate + '.html\'"></div><div class="modal-footer"><button class="btn btn-warning" ng-click="close()">Close</button></div>',
            resolve: {
              paramDataType: () => { return scope.paramDataType; },
              dataTypeLinkName: () => { return scope.dataTypeLinkName }
            },
            windowClass: "param-type-details"
          });
        };
      }
    }
  }


  // A directive that shows an example API call
  interface IHasGetApiCodeButtonScope extends ng.IScope {
    apiCallArgSet: DocApp.domain.methodArgs.ApiCallArgSet;
    codeLanguage: string;
    displayModal: () => void;
  }
  export function HasGetApiCodeButton($timeout: ng.ITimeoutService, HasModal: DocApp.services.HasModal): ng.IDirective {
    return {
      restrict: 'A',
      scope: {apiCallArgSet: '=', codeLanguage: '=', buttonLabel: '='},
      template: '<button class="btn" type="button" ng-click="displayModal()">{{buttonLabel}}</button>',
      link: (scope: IHasGetApiCodeButtonScope, element, attrs) => {
        // Display the modal
        scope.displayModal = () => {
          HasModal.open({
            windowClass: 'code-example',
            backdropClick: true,
            resolve: {
              apiCallArgSet: () => { return scope.apiCallArgSet; }
            },
            controller: ($scope, $modalInstance: ng.ui.bootstrap.IModalServiceInstance, apiCallArgSet) => {
              // Store the API call arg set this code is for
              $scope.apiCallArgSet = apiCallArgSet;

              // Perform some expensive translations of the arg dictionary so we can use it in filters and avoid
              // having to recalculate it multiple times
              $scope.apiCallArgDictionary = apiCallArgSet.getArgDictionary();
              $scope.flattenedApiCallDictionary = DocApp.filters.HasFlattenArgDictionaryFilter.filter($scope.apiCallArgDictionary);

              // Helper function to simplify logic to determine api access type
              $scope.isAffiliateCall = (): boolean => {
                return scope.apiCallArgSet.method.target.api.access === 'affiliate';
              };

              // Helper function to simplify logic to determine api access type
              $scope.isBrandCall = (): boolean => {
                return scope.apiCallArgSet.method.target.api.access === 'brand';
              };

              // Close the modal
              $scope.close = () => {
                $modalInstance.close();
              };
            },
            templateUrl: 'directive-templates/api-code-snippets/apiCall-' + scope.codeLanguage + '.html'
          }).opened.then(() => {
              // After opened, wait a moment and then run the syntax highlighter.
              // It doesn't work immediately (perhaps some DOM elements are not yet in place) immediately after opened.
              $timeout(() => {
                  SyntaxHighlighter.highlight();
                },
                100
              );
            });
        };
      }
    };
  }


  // Contain arg (models related to the return model to attach)
  interface IHasContainArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IContainArg;
    getUnusedContainRelationships: () => DocApp.domain.paramDataTypes.IContainRelationship[];
    newContainRelationship: DocApp.domain.paramDataTypes.IContainRelationship;
    addNewContainRelationship: () => void;
  }
  export function HasContainArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/contain.html',
      link: (scope: IHasContainArgScope, element, attrs) => {
        // No relationship by default
        scope.newContainRelationship = null;

        // Initialize value and default
        scope.arg.defaultValue = [];
        scope.arg.value = [];

        // Returns all unused contain relationships
        scope.getUnusedContainRelationships = () : DocApp.domain.paramDataTypes.IContainRelationship[] => {
          return _.difference<DocApp.domain.paramDataTypes.IContainRelationship>(
            scope.arg.selectedDataType.relationships,
            scope.arg.value
          );
        };

        // Function to add the newly selected contain relationship
        scope.addNewContainRelationship = (): void => {
          // Add the relationship
          scope.arg.value.push(scope.newContainRelationship);

          // Null out the temp container variable
          scope.newContainRelationship = null;
        }
      }
    };
  }


  // Data arg (model fields with values for each)
  interface IHasFieldDataArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IFieldDataArg;
    getUnspecifiedFields: () => DocApp.domain.IApiModelField[];
    newField: DocApp.domain.IApiModelField;
    addNewField: () => void;
  }
  export function HasFieldDataArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/data.html',
      link: (scope: IHasFieldDataArgScope, element, attrs) => {
        // No new field selected by default
        scope.newField = null;

        // Initialize value and default
        scope.arg.defaultValue = [];
        scope.arg.value = [];

        // Returns writable fields which are not yet specified (no value set)
        scope.getUnspecifiedFields = (): DocApp.domain.IApiModelField[] => {
          // Return any model fields that are unused and not read-only
          var unusedFields = _.difference(
            _.toArray(scope.arg.selectedDataType.model.fields),
            _.pluck(scope.arg.value, 'field')
          );
          return _.filter(unusedFields, (field: DocApp.domain.IApiModelField) => {
            return field.writable;
          });
        };

        // Function to specify a new field to the argument.
        // If a whitelist of values exists, select the first one, else empty string
        scope.addNewField = () => {
          // Determine the initial value for the selection
          var initialVal: any = '';
          if(scope.newField.allowedValues != null) {
            // The field has a list of allowed values, so set it to the first one alphabetically
            initialVal = _.sortBy(scope.newField.allowedValues, (val) => { return val; })[0];
          }
          else if(scope.newField.dataType === 'boolean') {
            // The field is a boolean, so set it to true initially
            initialVal = 1;
          }

          scope.arg.value.push(
            {
              'field': scope.newField,
              'value':  initialVal
            }
          );
          scope.newField = null;
        };
      }
    };
  }



  // Structured object arg (predefined fields/values)
  interface IHasStructuredObjectArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IStructuredObjectArg;
    getUnspecifiedFields: () => DocApp.domain.paramDataTypes.IStructuredObjectField[];
    newField: DocApp.domain.paramDataTypes.IStructuredObjectField;
    addNewField: () => void;
  }
  export function HasStructuredObjectArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/structured_object.html',
      link: (scope: IHasStructuredObjectArgScope, element, attrs) => {
        // No new field selected by default
        scope.newField = null;

        // Initialize value and default
        scope.arg.defaultValue = [];
        scope.arg.value = [];

        // Returns structured object fields which are not yet specified (no value set)
        scope.getUnspecifiedFields = (): DocApp.domain.paramDataTypes.IStructuredObjectField[] => {
          // Return any fields that are unused
          return _.difference(
            _.toArray(scope.arg.selectedDataType.fields),
            _.pluck(scope.arg.value, 'field')
          );
        };

        // Function to specify a new field to the argument.
        // If a whitelist of values exists, select the first one, else empty string
        scope.addNewField = () => {
          // Determine the initial value for the selection
          var initialVal: any = '';
          if(scope.newField.allowedValues != null) {
            // The field has a list of allowed values, so set it to the first one alphabetically
            initialVal = _.sortBy(scope.newField.allowedValues, (val) => { return val; })[0];
          }
          else if(scope.newField.dataType === 'boolean') {
            // The field is a boolean, so set it to true initially
            initialVal = 1;
          }

          scope.arg.value.push(
            {
              'field': scope.newField,
              'value':  initialVal
            }
          );
          scope.newField = null;
        };
      }
    };
  }



  // An array of Structured object arg (predefined fields/values for each entry in the array)
  interface IHasStructuredObjectArrayArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IStructuredObjectArrayArg;
    addNewObject: () => void;
    getUnspecifiedFields: (objFields: DocApp.domain.methodArgs.IStructuredObjectFieldWithValue[]) => DocApp.domain.paramDataTypes.IStructuredObjectField[];
    addNewField: (newField: DocApp.domain.paramDataTypes.IStructuredObjectField, existingFields: DocApp.domain.methodArgs.IStructuredObjectFieldWithValue[]) => void;
  }
  export function HasStructuredObjectArrayArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/structured_object_array.html',
      link: (scope: IHasStructuredObjectArrayArgScope, element, attrs) => {
        // Initialize value and default
        scope.arg.defaultValue = [];
        scope.arg.value = [];

        // Add a new object to the array (this is an empty array to contain a set of field/value items)
        scope.addNewObject = () => {
          scope.arg.value.push([]);
        };

        // Returns structured object fields which are not yet specified in the provided array
        scope.getUnspecifiedFields = (objFields: DocApp.domain.methodArgs.IStructuredObjectFieldWithValue[]): DocApp.domain.paramDataTypes.IStructuredObjectField[] => {
          // Return any fields that are unused
          return _.difference(
            _.toArray(scope.arg.selectedDataType.fields),
            _.pluck(objFields, 'field')
          );
        };

        // Function to specify a new field to the argument.
        // If a whitelist of values exists, select the first one, else empty string
        scope.addNewField = (newField: DocApp.domain.paramDataTypes.IStructuredObjectField, existingFields: DocApp.domain.methodArgs.IStructuredObjectFieldWithValue[]) => {
          // Determine the initial value for the selection
          var initialVal: any = '';
          if(newField.allowedValues != null) {
            // The field has a list of allowed values, so set it to the first one alphabetically
            initialVal = _.sortBy(newField.allowedValues, (val) => { return val; })[0];
          }
          else if(newField.dataType === 'boolean') {
            // The field is a boolean, so set it to true initially
            initialVal = 1;
          }

          existingFields.push(
            {
              'field': newField,
              'value': initialVal
            }
          );
        };
      }
    };
  }



  // Unstructured object arg (any field/value the user chooses)
  interface IHasUnstructuredObjectArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IUnstructuredObjectArg;
    addNewField: () => void;
  }
  export function HasUnstructuredObjectArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/unstructured_object.html',
      link: (scope: IHasUnstructuredObjectArgScope, element, attrs) => {
        // Initialize value and default
        scope.arg.defaultValue = [];
        scope.arg.value = [];

        // Function to specify a new field to the argument.
        scope.addNewField = () => {
          scope.arg.value.push(
            {
              'field': '',
              'value': ''
            }
          );
        };
      }
    };
  }



  // Filter arg (filtering criteria to apply against model fields)
  interface IHasFilterArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IFilterArg;
    getFilterableFields: () => DocApp.domain.IApiModelField[];
    newField: DocApp.domain.IApiModelField;
    addNewFieldFilter: () => void;
  }
  export function HasFilterArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/filter.html',
      link: (scope: IHasFilterArgScope, element, attrs) => {
        // Initialize value and default
        scope.arg.defaultValue = {
          'operator': 'AND',
          'fieldFilters': []
        };
        scope.arg.value = angular.copy(scope.arg.defaultValue);

        // Helper function to identify whether this is an affiliate API call, as we have some custom behavior
        // modifications to the filter directive for the affiliate API.
        var isAffiliateApi = () => {
          return scope.arg.param.method.target.api.access === 'affiliate';
        };

        // Returns all fields in the argument's model that can be filtered on.
        scope.getFilterableFields = (): DocApp.domain.IApiModelField[] => {
          // Get all the readable fields (they are filterable) that are not synthetic.
          var readableFields = _.filter(scope.arg.selectedDataType.model.fields, (field: DocApp.domain.IApiModelField) => {
            // This is a hack, but some Affiliate API models expose the affiliate_id and since it is always fixed to
            // the affiliate ID of the caller, filtering on this field does not make any sense.  As such, we simply
            // avoid including it.
            // This doesn't catch every one (e.g. some models use account_id), but this catches most of them and they
            // simply won't be able to get results back if a filter includes IDs other than their own.
            if(field.name === 'affiliate_id' && isAffiliateApi()) {
              return false;
            }

            return field.readable && !field.synthetic;
          });

          // Remove any fields that already have filters and return what remains
          return _.difference(readableFields, _.pluck(scope.arg.value.fieldFilters, 'field'));
        };

        // Function to add a new field to the filter set, using an arbitrary relational operator that it supports.
        // Should only be called if there are valid relational operators.
        scope.addNewFieldFilter = () : void => {
          // Crete a new field filter; it will use the first available relational operator by default.
          // We pass in the API this filter is for, because there are some differences in the way Affiliate and Brand
          // filters work.
          var newFieldFilter = new DocApp.domain.methodArgs.FieldFilter(scope.newField, scope.arg.param.method.target.api);

          // Add the field filter for this argument
          scope.arg.value.fieldFilters.push(newFieldFilter);

          // reset field
          scope.newField = null;
        }
      }
    };
  }


  // Report Filter arg (filtering criteria to apply against model fields)
  interface IHasReportFilterArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IReportFilterArg;
    getFilterableFields: () => DocApp.domain.IApiModelField[];
    newField: DocApp.domain.IApiModelField;
    addNewFieldFilter: () => void;
  }
  export function HasReportFilterArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/report_filter.html',
      link: (scope: IHasReportFilterArgScope, element, attrs) => {
        // Initialize value and default
        scope.arg.defaultValue = [];
        scope.arg.value = [];

        // Returns all fields in the argument's model that can be filtered on.
        scope.getFilterableFields = (): DocApp.domain.IApiModelField[] => {
          // Get all the readable fields (they are filterable) that are not synthetic.
          // This is mostly a formality, as all fields in a model identified for a report filter should be readable.
          var readableFields = _.filter(scope.arg.selectedDataType.model.fields, (field: DocApp.domain.IApiModelField) => {
            return field.readable && !field.synthetic;
          });

          // Remove any fields that already have filters and return what remains
          return _.difference(readableFields, _.pluck(scope.arg.value, 'field'));
        };

        // Function to add a new field to the filter set, using an arbitrary relational operator that it supports.
        // Should only be called if there are valid relational operators.
        scope.addNewFieldFilter = () : void => {
          // Crete a new field filter; it will use the first available relational operator by default.
          // We pass in the API this filter is for, because there are some differences in the way Affiliate and Brand
          // filters work.
          var newFieldFilter = new DocApp.domain.methodArgs.ReportFieldFilter(scope.newField);

          // Add the field filter for this argument
          scope.arg.value.push(newFieldFilter);

          // reset field
          scope.newField = null;
        }
      }
    };
  }


  // Sort arg (model fields and a direction)
  interface IHasSortArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.ISortArg;
    getUnusedSortFields: () => DocApp.domain.IApiModelField[];
    newSortField: DocApp.domain.IApiModelField;
    addNewSortField: () => void;
  }
  export function HasSortArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/sort.html',
      link: (scope: IHasSortArgScope, element, attrs) => {
        // No sort field selected by default
        scope.newSortField = null;

        // Initialize value and default
        scope.arg.defaultValue = [];
        scope.arg.value = [];

        // Returns all fields in the parameter's model that have not been used in existing sort combos for this argument.
        scope.getUnusedSortFields = (): DocApp.domain.IApiModelField[] => {
          // Return any model fields that are unused and readable, and not synthetic.
          var unusedFields = _.difference(
            _.toArray(scope.arg.selectedDataType.model.fields),
            _.pluck(scope.arg.value, 'field')
          );
          return _.filter(unusedFields, (field: DocApp.domain.IApiModelField) => {
            return field.readable && !field.synthetic;
          });
        };

        // Add a new sort combo for the selected field
        scope.addNewSortField = (): void => {
          scope.arg.value.push({
            'field': scope.newSortField,
            'direction': 'asc'
          });

          scope.newSortField = null;
        }
      }
    };
  }


  // Field arg (one field)
  interface IHasFieldArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IFieldArg;
  }
  export function HasFieldArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/field.html',
      link: (scope: IHasFieldArgScope, element, attrs) => {
        // Initialize value to null (no field selected)
        scope.arg.value = null;
      }
    };
  }


  // Fields arg (array of fields)
  interface IHasFieldsArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IFieldsArg;
    newField: DocApp.domain.IApiModelField;
    addNewField: (field: DocApp.domain.IApiModelField) => void;
    getUnselectedModelFields: () => DocApp.domain.IApiModelField[];
  }
  export function HasFieldsArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/fields.html',
      link: (scope: IHasFieldsArgScope, element, attrs) => {
        // No new field by default
        scope.newField = null;

        // Initialize value and default
        scope.arg.defaultValue = [];
        scope.arg.value = [];

        // Returns the model fields for this arg that are not already selected
        scope.getUnselectedModelFields = (): DocApp.domain.IApiModelField[] => {
          // Return any model fields that are unused and readable, and not synthetic.
          var unusedFields = _.difference(
            _.toArray<DocApp.domain.IApiModelField>(scope.arg.selectedDataType.model.fields),
            scope.arg.value
          );

          return _.filter(unusedFields, (field: DocApp.domain.IApiModelField) => {
            return field.readable && !field.synthetic;
          });
        };

        // Function to add a new field to those selected
        scope.addNewField = (): void => {
          // Add this field to the selected ones
          scope.arg.value.push(scope.newField);

          // Clear out the temp field container
          scope.newField = null;
        };
      }
    };
  }


  // Primitive arg (single input for string or number)
  interface IHasPrimitiveArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IPrimitiveArg;
    initializeValue: () => void;
    destroyValue: () => void;
    boolToStr: (bool: boolean) => string;
  }
  export function HasPrimitiveArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/primitive.html',
      link: (scope: IHasPrimitiveArgScope, element, attrs) => {
        // Initialize value and default
        scope.arg.value = scope.arg.defaultValue = null;

        // Function to initialize a value so that the input will show
        scope.initializeValue = (): void => {
          if(scope.arg.selectedDataType.name === 'boolean') {
            // Booleans initialize to true
            scope.arg.value = true;
          }
          else if(scope.arg.selectedDataType.allowedValues == null) {
            // Free-form primitives empty string
            scope.arg.value = '';
          }
          else {
            // If this field has set values, select the first
            scope.arg.value = scope.arg.selectedDataType.allowedValues[0];
          }
        };

        // Helper function to stringify booleans
        scope.boolToStr = function(bool) {
          return bool ? 'True' : 'False';
        };

        // Function to destroy the value so that the input will disappear
        scope.destroyValue = (): void => {
          scope.arg.value = null;
        };
      }
    };
  }


  // Primitive array arg (array of primitives)
  interface IHasPrimitiveArrayArgScope extends ng.IScope {
    arg: DocApp.domain.methodArgs.IPrimitiveArrayArg;
    addNewValue: (any) => void;
    getUnusedAllowedValues: () => any[];
    destroyValue: (valIndex: number) => void;
  }
  export function HasPrimitiveArrayArg(): ng.IDirective {
    return {
      restrict: 'A',
      scope: {arg: '='},
      templateUrl: 'directive-templates/api-builder-args/primitiveArray.html',
      link: (scope: IHasPrimitiveArrayArgScope, element, attrs) => {
        // Initialize value and default
        scope.arg.defaultValue = [];
        scope.arg.value = [];

        // Function to return any valid values that haven't been used
        scope.getUnusedAllowedValues = (): any[] => {
            var unusedAllowedValues = [];
            if(scope.arg.selectedDataType.allowedValues != null) {
                unusedAllowedValues = _.difference(
                    scope.arg.selectedDataType.allowedValues,
                    scope.arg.value
                );
            }
            return unusedAllowedValues;
        };

        // Function to add a new value to the arg
        scope.addNewValue = (val: any) => {
            scope.arg.value.push(val);
        };

        // Function to destroy a value at a specified index
        scope.destroyValue = (valIndex: number): void => {
          scope.arg.value.splice(valIndex, 1);
        };
      }
    };
  }


  // API builder directive
  interface IAPiBuilderScope extends ng.IScope {
    method: DocApp.domain.IApiMethod;
    apiCallArgs: DocApp.domain.methodArgs.ApiCallArgSet;
    showCodeExample: boolean;
    codeExampleLanguage: string;

    DataTypeDescriber: DocApp.services.DataTypeDescriber;
    resetArgValue: (arg: DocApp.domain.methodArgs.IMethodArg) => void;
    runApiCall: () => void;
    getCurrentApiCallDictionary: () => {[s: string]: any};
    getCurrentApiCallUrl: (contentType: string) => string;
  }

  export function HasApiBuilder($http: ng.IHttpService,
                                HasModal: DocApp.services.HasModal,
                                UserInfo: DocApp.services.UserInfo,
                                DataTypeDescriber: DocApp.services.DataTypeDescriber): ng.IDirective {
    return {
      restrict: 'A',
      scope: {method: '='},
      templateUrl: 'directive-templates/apiBuilder.html',
      link: (scope: IAPiBuilderScope, element, attrs) => {
        // Attach data type describer so we can provide human-readable details about data types
        scope.DataTypeDescriber = DataTypeDescriber;

        // Don't show code example by default
        scope.showCodeExample = false;

        // Default example language is HTTP URL
        scope.codeExampleLanguage = 'url';

        // Reset the value on an argument to the default
        scope.resetArgValue = (arg: DocApp.domain.methodArgs.IMethodArg): void => {
          arg.value = angular.copy(arg.defaultValue);
        };

        // Create a container to store all the arguments for this API call, including auth details as well as the
        // method-specific arguments.
        scope.apiCallArgs = new DocApp.domain.methodArgs.ApiCallArgSet(
          scope.method,
          UserInfo.getProperty('NetworkId'),
          UserInfo.getProperty('NetworkToken'),
          UserInfo.getProperty('AffiliateKey')
        );

        // Executes the API call that the user has set up.
        scope.runApiCall = (): void => {
          // Ensure Network ID provided
          if(scope.apiCallArgs.networkId == null || scope.apiCallArgs.networkId === '') {
            alert('Please provide Network Id');
            return;
          }
          UserInfo.setProperty('NetworkId', scope.apiCallArgs.networkId);

          // Ensure correct token provided
          if(scope.method.target.api.access === 'affiliate') {
            // Affiliate API requires api_key parameter
            if(scope.apiCallArgs.affiliateKey == null || scope.apiCallArgs.affiliateKey === '') {
              alert('Please provide an Affiliate Key');
              return;
            }
            // Store key for this user
            UserInfo.setProperty('AffiliateKey', scope.apiCallArgs.affiliateKey);
          }
          else if(scope.method.target.api.access === 'brand') {
            // Brand API requires NetworkToken parameter
            if(scope.apiCallArgs.networkToken == null || scope.apiCallArgs.networkToken === '') {
              alert('Please provide Network Token');
              return;
            }
            // update user info
            UserInfo.setProperty('NetworkToken', scope.apiCallArgs.networkToken);
          }

          // Open the modal to display the results of the call
          HasModal.open({
            backdropClick: true,
            controller: ($scope,$timeout,
                         $modalInstance: ng.ui.bootstrap.IModalServiceInstance,
                         apiCallArgs: DocApp.domain.methodArgs.ApiCallArgSet) => {

              $scope.apiCallArgs = apiCallArgs;
              $scope.loading = true;
              $scope.apiResponse = null;

              // Switch from JSON to JSONP.
              $http.jsonp(scope.getCurrentApiCallUrl('jsonp') + '&callback=JSON_CALLBACK')
                .success( (data) => {
                    $scope.apiResponse = angular.toJson(data, true);
                    $scope.loading = false;
                })
                .error( (data) => {
                  $scope.apiResponse = angular.toJson(data, true) || 'an unexpected error occurred';
                  $scope.loading = false;
                });

              $scope.close = () => {
                $modalInstance.close();
              };
            },
            templateUrl: 'directive-templates/apiResponse.html',
            windowClass: 'api-response',
            resolve: {
              apiCallArgs: () => { return scope.apiCallArgs; }
            }
          });
        };

        // Returns an API url for the current method, using the user-provided parameters
        scope.getCurrentApiCallUrl = (contentType: string): string => {
          return scope.apiCallArgs.method.target.api.baseUrl + contentType + '?' +
            jQuery.param(scope.apiCallArgs.getArgDictionary());
        };
      }
    };
  }
}
