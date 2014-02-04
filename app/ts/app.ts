/// <reference path="ts_defs/_all.d.ts"/>

module DocApp {
  'use strict';

  // Define the two different APIs this application serves documentation for
  export interface IApiIdentifier {alias: string; longName: string;}
  var brandApi : IApiIdentifier = {alias: 'brand', longName: 'Brand API'};
  var affiliateApi : IApiIdentifier = {alias: 'affiliate', longName: 'Affiliate API'};

  // Disable the toolbar for SyntaxHighlighter whenever it's used
  SyntaxHighlighter.defaults.toolbar = false;

  // Create app
  var app = angular.module('Docs', ['ngRoute', 'ngSanitize', 'ui.bootstrap']);

  // Attach directives
  app.directive('hasApiBuilder', directives.HasApiBuilder);
  app.directive('hasContainArg', directives.HasContainArg);
  app.directive('hasFieldDataArg', directives.HasFieldDataArg);
  app.directive('hasFieldArg', directives.HasFieldArg);
  app.directive('hasFieldsArg', directives.HasFieldsArg);
  app.directive('hasFilterArg', directives.HasFilterArg);
  app.directive('hasReportFilterArg', directives.HasReportFilterArg);
  app.directive('hasSortArg', directives.HasSortArg);
  app.directive('hasPrimitiveArg', directives.HasPrimitiveArg);
  app.directive('hasPrimitiveArrayArg', directives.HasPrimitiveArrayArg);
  app.directive('hasStructuredObjectArg', directives.HasStructuredObjectArg);
  app.directive('hasStructuredObjectArrayArg', directives.HasStructuredObjectArrayArg);
  app.directive('hasUnstructuredObjectArg', directives.HasUnstructuredObjectArg);

  app.directive('hasGetApiCodeButton', directives.HasGetApiCodeButton);
  app.directive('hasModelDetailsButton', directives.HasModelDetailsButton);
  app.directive('hasParamDataTypeDetailsButton', directives.HasParamDataTypeDetailsButton);

  // Attach services
  app.service('DocRetriever', services.DocRetriever);
  app.service('DataTypeDescriber', services.DataTypeDescriber);
  app.service('UserInfo', services.UserInfo);
  app.service('HasModal', services.HasModal);

  // Attach filters
  app.filter('HasApiTargetFilter', () => {
      return (targets: DocApp.domain.IApiTarget[], methodNamePartial: string) => {
        return filters.HasApiTargetFilter.filter(targets, methodNamePartial);
      }
    }
  );
  app.filter('HasApiMethodFilter', () => {
      return (methods: DocApp.domain.IApiMethod[], methodNamePartial: string) => {
        return filters.HasApiMethodFilter.filter(methods, methodNamePartial);
      }
    }
  );
  app.filter('DecodeUriFilter', () => {
      return (url) => { return filters.DecodeUriFilter.filter(url);  }
    }
  );
  app.filter('HasObjToAssocPhpArrayFilter', () => {
      return (obj: {}, indentation: number) => {
        return filters.HasObjToAssocPhpArrayFilter.filter(obj, indentation);
      }
    }
  );
  app.filter('HasArgDictionaryToUrlParamStringFilter', () => {
      return (apiArgDictionary: {[paramName: string]: any}) => {
        return filters.HasArgDictionaryToUrlParamStringFilter.filter(apiArgDictionary);
      }
    }
  );
  app.filter('HasFlattenArgDictionaryFilter', () => {
      return (apiArgDictionary: {[paramName: string]: any}) => {
        return filters.HasFlattenArgDictionaryFilter.filter(apiArgDictionary);
      }
    }
  );

  // Attach controllers
  app.controller('MethodView', controllers.MethodView);
  app.controller('ModelView', controllers.ModelView);
  app.controller('Sidebar', controllers.Sidebar);

  // Define the available fields for the different routes
  export interface IMethodViewRoute extends ng.route.IRoute {
    current: {
      params: {
        api: string;
        targetName: string;
        methodName: string;
      }
    }
  }

  export interface IModelViewRoute extends ng.route.IRoute {
    current: {
      params: {
        api: string;
        modelName: string;
      }
    }
  }

  // Configure routes
  app.config( ($routeProvider: ng.route.IRouteProvider) => {
    $routeProvider.when('/:api',
        {
          templateUrl: (params: {api: string}) =>  {
            return 'templates/' + params.api + '/welcome.html';
          }
        }
      )
      .when('/:api/docs/:staticPage', {
        templateUrl: (params: {api: string; staticPage: string}) => {
          return 'templates/' + params.api + '/' + params.staticPage + '.html';
        }
      })
      .when('/:api/controller/:targetName/method/:methodName',
        {
          controller: 'MethodView',
          templateUrl: 'templates/methodView.html',
          resolve: controllers.MethodView.resolve()
        }
      )
      .when('/:api/model/:modelName',
        {
          controller: 'ModelView',
          templateUrl: 'templates/modelView.html',
          resolve: controllers.ModelView.resolve()
        }
      )
      .otherwise(
        {
          redirectTo: '/' + brandApi.alias
        }
      );
  });

  // Enumerate the root scope fields
  export interface IAppRootScopeService extends ng.IRootScopeService {
    currentApi: IApiIdentifier;
    brandApi: IApiIdentifier;
    affiliateApi: IApiIdentifier;
  }

  // Run the application
  app.run( ($rootScope: IAppRootScopeService,
            $route: ng.route.IRouteProvider,
            $location: ng.ILocationService) => {

    // Set the brand and affiliate API identifiers
    $rootScope.brandApi = brandApi;
    $rootScope.affiliateApi = affiliateApi;

    // No api selected initially
    $rootScope.currentApi = null;

    // Redirect to brand if specified api does not exist
    $rootScope.$on('$routeChangeStart', (next, current: {params: {api: string}}) => {
      if(current.params.api !== brandApi.alias && current.params.api !== affiliateApi.alias) {
        $location.path('/' + brandApi.alias);
      }
    });

    // Only broadcast api changes if the new api is valid and different
    $rootScope.$on('$routeChangeSuccess', (e, current: {params: {api: string}}, previous) => {
      var prevApi = $rootScope.currentApi;
      $rootScope.currentApi = (current.params.api === brandApi.alias ? brandApi : affiliateApi);

      if(prevApi !== $rootScope.currentApi) {
        $rootScope.$broadcast('apiChange');
      }
    });
  });

}
