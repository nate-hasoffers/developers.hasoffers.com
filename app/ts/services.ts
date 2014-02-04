/// <reference path="ts_defs/_all.d.ts"/>

module DocApp.services {
  'use strict';

  // Provides access to the api definitions
  export class DocRetriever {
    private apiDefinitions: {[s: string]: ng.IPromise<DocApp.domain.IApiDefinition>} = {};
    
    constructor(private $http: ng.IHttpService) {}

    // Retrieves a specific API definition, including its models and targets
    public getApiDefinition(apiAlias: string) : ng.IPromise<DocApp.domain.IApiDefinition> {
      // Manage a singleton report definition
      if(this.apiDefinitions[apiAlias] == null) {
        this.apiDefinitions[apiAlias] = this.$http.get('resource/api.' + apiAlias + '.json', {cache: true})
          .then((response: ng.IHttpPromiseCallbackArg<DocApp.domain.IApiDefinition>): DocApp.domain.IApiDefinition => {
            this.wireUpApiReferences(response.data);
            return response.data;
          });
      }

      return this.apiDefinitions[apiAlias]
    }

    // Wires up all object references within the API.
    // This includes setting a reference from each method to its target, from each target to its api, and for some
    // specific parameter types it replaces string model names with references to the actual model
    private wireUpApiReferences(apiDefinition: DocApp.domain.IApiDefinition): void {
      // Model names are unique, so we'll create a map of model name => model for easy retrieval
      apiDefinition.modelMap = _.object<{[s: string]: DocApp.domain.IApiModel}>(
        _.map(apiDefinition.models, (model: DocApp.domain.IApiModel) => {
          return [model.name, model];
        })
      );

      // Function to retrieve a model by name, which throws an exception if no such model exists
      var getModelFromMap = (modelName: string): DocApp.domain.IApiModel => {
        if(apiDefinition.modelMap[modelName] == null) {
          throw new Error('No model found with name: ' + modelName);
        }

        return apiDefinition.modelMap[modelName];
      };

      // Wire up references for the target and all its children
      _.each(apiDefinition.targets, (target: DocApp.domain.IApiTarget) => {
        target.api = apiDefinition;

        // Wire up references for all this target's methods and their children
        _.each(target.methods, (method: DocApp.domain.IApiMethod) => {
          method.target = target;

          // Wire up references for all this method's parameters and their children
          _.each(method.parameters, (param: DocApp.domain.IApiParam) => {
            param.method = method;

            // Wire up references to models from model-driven parameter data types
            _.each(param.allowedDataTypes, (dataType: DocApp.domain.paramDataTypes.IParamDataType) => {
              switch(dataType.name) {
                case '@contain@':
                  // Attach base model and the remote models for all relationships
                  var containsType = <DocApp.domain.paramDataTypes.IContainType>dataType;
                  containsType.baseModel = getModelFromMap(containsType.baseModelName);

                  _.each(containsType.relationships, (relationship: DocApp.domain.paramDataTypes.IContainRelationship) => {
                    relationship.model = getModelFromMap(relationship.modelName);
                  });
                  break;
                case '@data@':
                  var fieldDataType = <DocApp.domain.paramDataTypes.IFieldDataType>dataType;
                  fieldDataType.model = getModelFromMap(fieldDataType.modelName);
                  break;
                case '@field@':
                  var fieldType = <DocApp.domain.paramDataTypes.IFieldType>dataType;
                  fieldType.model = getModelFromMap(fieldType.modelName);
                  break;
                case '@fields@':
                  var fieldsType = <DocApp.domain.paramDataTypes.IFieldsType>dataType;
                  fieldsType.model = getModelFromMap(fieldsType.modelName);
                  break;
                case '@filter@':
                  var filtersType = <DocApp.domain.paramDataTypes.IFilterType>dataType;
                  filtersType.model = getModelFromMap(filtersType.modelName);
                  break;
                case '@report_filter@':
                  var reportFiltersType = <DocApp.domain.paramDataTypes.IReportFilterType>dataType;
                  reportFiltersType.model = getModelFromMap(reportFiltersType.modelName);
                  break;
                case '@sort@':
                  var sortsType = <DocApp.domain.paramDataTypes.ISortType>dataType;
                  sortsType.model = getModelFromMap(sortsType.modelName);
                  break;
              }
            });
          });
        });
      });
    }
  }

  // Manages storage and access of persistent data for the user/browser
  export class UserInfo {
    private isLocalStorageEnabled = ('localStorage' in window && window.localStorage !== null);
    /**
     * Returns user value set for the specified property in localStorage.
     *
     * @param  {string} key  The property whose value to get.
     * @return {?*}          The value if set, or null if not set.
     */
    public getProperty(key: any) {
      return this.isLocalStorageEnabled ? window.localStorage.getItem(key) : null;
    }

    /**
     * Attempts to set a property for the user in localStorage.
     * Silently fails if attempt to set property fails.
     *
     * @param {string} key    The name of the property to set.
     * @param {*}      value  The value to set for the property.
     */
    public setProperty(key: string, value: any) {
      if( this.isLocalStorageEnabled ) {
        try {
          window.localStorage.setItem(key, value);
        }
        catch (e) {
          // fail safe for QUOTA_EXCEEDED error
        }
      }
    }
  }

  // Provides human-readable names/descriptions for a parameter data type
  export class DataTypeDescriber {
    public getParamDataTypeDescription(dataType: DocApp.domain.paramDataTypes.IParamDataType) : string {
      switch(dataType.name) {
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
          var arrayDataType = <DocApp.domain.paramDataTypes.IPrimitiveArrayType>dataType;
          return 'Array of ' + arrayDataType.valueType;
        default:
          return dataType.name;
      }
    }

    // Provides human-readable names/descriptions for a method response data type
    public getReturnDataTypeDescription(dataType: DocApp.domain.responseDataTypes.IResponseDataType): string {
      return dataType.name;
    }
  }

  // Modal service to wrap around the ng.ui.bootstrap.IModalService so that the body won't scroll when the mousewheel is
  // used while a modal is visible.
  export class HasModal {
    constructor(private $modal: ng.ui.bootstrap.IModalService, private $document: ng.IDocumentService) {}

    // Opens a modal and returns the modal instance
    public open(options: ng.ui.bootstrap.IModalSettings): ng.ui.bootstrap.IModalServiceInstance {
      var bodyEl = angular.element( (<any>this.$document[0]).body );

      // Hide overflow on the body so that when the body won't scroll
      bodyEl.addClass('hide-overflow');

      // Open the modal
      var modalInstance = this.$modal.open(options);

      // Remove the body class when the modal closes for any reason
      modalInstance.result.then(() => {
        bodyEl.removeClass('hide-overflow');
      }, () => {
        bodyEl.removeClass('hide-overflow')
      });

      return modalInstance;
    }
  }
}
