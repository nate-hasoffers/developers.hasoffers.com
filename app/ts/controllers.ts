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
    public methodsOpen = true;
    public modelsOpen = false;

    // Returns an subset of the provided Methods which match the current search string.
    private getMatchingMethods(methods: DocApp.domain.IApiMethod[]) : DocApp.domain.IApiMethod[] {
      return _.filter(methods, (method: DocApp.domain.IApiMethod) => {
        return this.isSubstring(method.name, this.methodSearchQuery);
      });
    }

    // Returns the number of Methods that are visible for the specified Target (depends on the search string)
    public getNumVisibleMethods(target: DocApp.domain.IApiTarget) : number {
       // If Target name is matched, all visible
      if(this.methodSearchQuery == '' || this.isSubstring(target.name, this.methodSearchQuery)) {
        return target.methods.length;
      }

      return this.getMatchingMethods(target.methods).length;
    }

    // Returns whether or not the needle (case insensitive) is found int he haystack (case insensitive).
    private isSubstring(haystack: string, needle: string) : boolean {
      return haystack.toLowerCase().match(needle.toLowerCase()) != null
    }

    // Takes a haystack and needle, and returns a HTML string of the haystack with the needle highlighted.
    public highlightSubString(haystack: string, needle: string) : string {
      // Make sure a non-empty needle specified
      if(needle == '') {
        return haystack
      }

      // Look for the needle in the haystack
      var substrLocation = haystack.toLowerCase().indexOf(needle.toLowerCase());
      if(substrLocation < 0) {
        // Not found in haystack
        return haystack;
      }

      // Highlight the needle
      var highlightedString = haystack.substr(0, substrLocation) +
        '<span class="hs">' + haystack.substr(substrLocation, needle.length) + '</span>' +
        haystack.substr(substrLocation+needle.length);

      return this.$sce.trustAsHtml(highlightedString);
    }

    // Returns whether or not the specified Target should be shown, given the current search query.
    public showTarget(target: DocApp.domain.IApiTarget) :  boolean {
      return this.methodSearchQuery == '' ||
        this.isSubstring(target.name, this.methodSearchQuery) ||
        this.getMatchingMethods(target.methods).length > 0;
    }

    // Returns whether or not the specified Method should be shown, given the current search query.
    public showMethod(method: DocApp.domain.IApiMethod) : boolean {
      // A method should be shown if there is no search query, or if its Target matches, or if the Method name matches.
      return this.methodSearchQuery == '' ||
        this.isSubstring(method.target.name, this.methodSearchQuery) ||
        this.isSubstring(method.name, this.methodSearchQuery);
    }

    constructor($scope: IVMScope, private DocRetriever: services.DocRetriever, private $sce: ng.ISCEService) {
      // Store instance of class in scope
      $scope.vm = this;

      // Function to initialize the sidebar with the current API models/targets
      var updateSidebar = () => {
        DocRetriever.getApiDefinition($scope.currentApi.alias).then( (apiDef: DocApp.domain.IApiDefinition) => {
          this.api = apiDef;
          this.methodSearchQuery = '';
          this.modelSearchQuery = '';
        });
      };

      // Initialize the sidebar (in the event the API was set already before Sidebar constructed)
      if($scope.currentApi != null) {
        updateSidebar()
      }

      // Whenever the api changes we need to update the sidebar to reflect the new targets/models/methods
      $scope.$on('apiChange', updateSidebar);
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
              var model: DocApp.domain.IApiModel = apiDef.modelMap[$route.current.params.modelName];

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
