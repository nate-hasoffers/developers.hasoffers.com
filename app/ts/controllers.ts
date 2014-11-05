/// <reference path="ts_defs/_all.d.ts"/>

module DocApp.controllers {
  'use strict';

  // Define a common interface for all our controllers to use
  export interface IController {}

  // An interface to define the common 'view-model' scope pattern we implement where the only thing attached to the
  // scope directly is a 'vm' variable that is an instance of the controller class.
  // Extending the root scope to make it clear which instance variables are available.
  export interface IVMScope extends IAppRootScopeService {
    vm: controllers.IController;
  }

  // Controller for a list of sidebar with targets and methods.
  export class Sidebar implements IController {
    public api: DocApp.domain.IApiDefinition;
    public methodSearchQuery: string = '';
    public modelSearchQuery: string = '';

    constructor($scope: IVMScope, private DocRetriever: services.DocRetriever) {
      // Store instance of class in scope
      $scope.vm = this;

      // Whenever the api changes we need to update the sidebar to reflect the new targets/models/methods
      $scope.$on('apiChange', () => {
        DocRetriever.getApiDefinition($scope.currentApi.alias).then( (apiDef: DocApp.domain.IApiDefinition) => {
          this.api = apiDef;
          this.methodSearchQuery = '';
          this.modelSearchQuery = '';
        });
      });
    }
  }


  // Method view controller
  export class MethodView implements IController {
    // This function provides all dependencies for the constructor
    public static resolve() {
      return {
        'method': ($route: DocApp.IMethodViewRoute, $location: ng.ILocationService, DocRetriever): ng.IPromise<DocApp.domain.IApiMethod> => {
          // Retrieve the method definition; exits early if the api, target or method is invalid
          return DocRetriever.getApiDefinition($route.current.params.api)
            .then( (apiDef: DocApp.domain.IApiDefinition): any => {
              // Locate the specified target
              var target: DocApp.domain.IApiTarget = _.find(apiDef.targets, (target: DocApp.domain.IApiTarget) => {
                return target.name === $route.current.params.targetName;
              });

              // If invalid target specified; go home
              if(target == null) {
                return $location.path('/'+$route.current.params.api);
              }

              // Locate the specified method
              var method = _.find<DocApp.domain.IApiMethod>(target.methods, (method: DocApp.domain.IApiMethod) => {
                return method.name === $route.current.params.methodName;
              });

              // If invalid method specified, go to Target view
              if(method == null) {
                return $location.path('/' + $route.current.params.api + '/controller/' + target.name);
              }

              return method;
            });
        }
      };
    }

    constructor(private $scope: IVMScope,
                public DataTypeDescriber: services.DataTypeDescriber,
                public method: DocApp.domain.IApiMethod) {

      // Store instance of class in scope
      $scope.vm = this;
    }
  }


  // Model view controller
  export class ModelView implements IController {
    // This function provides all dependencies for the constructor
    public static resolve() {
      return {
        'model': ($route: DocApp.IModelViewRoute, $location: ng.ILocationService, DocRetriever): ng.IPromise<DocApp.domain.IApiMethod> => {
          // Retrieve the model definition; exits early if the api or model is invalid
          return DocRetriever.getApiDefinition($route.current.params.api)
            .then( (apiDef: DocApp.domain.IApiDefinition): any => {
              // Locate the specified model
              var model: DocApp.domain.IApiModel = apiDef.modelMap[$route.current.params.modelName]

              // If invalid model specified; go home
              if(model == null) {
                return $location.path('/'+$route.current.params.api);
              }

              return model;
            });
        }
      };
    }

    constructor(private $scope: IVMScope,
                public model: DocApp.domain.IApiModel) {

      // Store instance of class in scope
      $scope.vm = this;
    }
  }
}
