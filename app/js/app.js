/// <reference path="ts_defs/_all.d.ts"/>
var DocApp;
(function (DocApp) {
    'use strict';
    var brandApi = { alias: 'brand', longName: 'Brand API' };
    var affiliateApi = { alias: 'affiliate', longName: 'Affiliate API' };
    // Disable the toolbar for SyntaxHighlighter whenever it's used
    SyntaxHighlighter.defaults.toolbar = false;
    // Create app
    var app = angular.module('Docs', ['ngRoute', 'ngSanitize', 'ui.bootstrap']);
    // Attach directives
    app.directive('hasApiBuilder', DocApp.directives.HasApiBuilder);
    app.directive('hasContainArg', DocApp.directives.HasContainArg);
    app.directive('hasFieldDataArg', DocApp.directives.HasFieldDataArg);
    app.directive('hasFieldArg', DocApp.directives.HasFieldArg);
    app.directive('hasFieldsArg', DocApp.directives.HasFieldsArg);
    app.directive('hasFilterArg', DocApp.directives.HasFilterArg);
    app.directive('hasReportFilterArg', DocApp.directives.HasReportFilterArg);
    app.directive('hasSortArg', DocApp.directives.HasSortArg);
    app.directive('hasPrimitiveArg', DocApp.directives.HasPrimitiveArg);
    app.directive('hasPrimitiveArrayArg', DocApp.directives.HasPrimitiveArrayArg);
    app.directive('hasStructuredObjectArg', DocApp.directives.HasStructuredObjectArg);
    app.directive('hasStructuredObjectArrayArg', DocApp.directives.HasStructuredObjectArrayArg);
    app.directive('hasUnstructuredObjectArg', DocApp.directives.HasUnstructuredObjectArg);
    app.directive('hasGetApiCodeButton', DocApp.directives.HasGetApiCodeButton);
    app.directive('hasModelDetailsButton', DocApp.directives.HasModelDetailsButton);
    app.directive('hasParamDataTypeDetailsButton', DocApp.directives.HasParamDataTypeDetailsButton);
    // Attach services
    app.service('DocRetriever', DocApp.services.DocRetriever);
    app.service('DataTypeDescriber', DocApp.services.DataTypeDescriber);
    app.service('UserInfo', DocApp.services.UserInfo);
    app.service('HasModal', DocApp.services.HasModal);
    // Attach filters
    app.filter('DecodeUriFilter', function () {
        return function (url) {
            return DocApp.filters.DecodeUriFilter.filter(url);
        };
    });
    app.filter('HasObjToAssocPhpArrayFilter', function () {
        return function (obj, indentation) {
            return DocApp.filters.HasObjToAssocPhpArrayFilter.filter(obj, indentation);
        };
    });
    app.filter('HasArgDictionaryToUrlParamStringFilter', function () {
        return function (apiArgDictionary) {
            return DocApp.filters.HasArgDictionaryToUrlParamStringFilter.filter(apiArgDictionary);
        };
    });
    app.filter('HasFlattenArgDictionaryFilter', function () {
        return function (apiArgDictionary) {
            return DocApp.filters.HasFlattenArgDictionaryFilter.filter(apiArgDictionary);
        };
    });
    // Attach controllers
    app.controller('MethodView', DocApp.controllers.MethodView);
    app.controller('ModelView', DocApp.controllers.ModelView);
    app.controller('Sidebar', DocApp.controllers.Sidebar);
    // Configure routes
    app.config(function ($routeProvider) {
        $routeProvider.when('/:api', {
            templateUrl: function (params) {
                return 'templates/' + params.api + '/welcome.html';
            }
        }).when('/:api/docs/:staticPage', {
            templateUrl: function (params) {
                return 'templates/' + params.api + '/' + params.staticPage + '.html';
            }
        }).when('/:api/controller/:targetName/method/:methodName', {
            controller: 'MethodView',
            templateUrl: 'templates/methodView.html',
            resolve: DocApp.controllers.MethodView.resolve()
        }).when('/:api/model/:modelName', {
            controller: 'ModelView',
            templateUrl: 'templates/modelView.html',
            resolve: DocApp.controllers.ModelView.resolve()
        }).otherwise({
            redirectTo: '/' + brandApi.alias
        });
    });
    // Run the application
    app.run(function ($rootScope, $route, $location, $anchorScroll) {
        // Set the brand and affiliate API identifiers
        $rootScope.brandApi = brandApi;
        $rootScope.affiliateApi = affiliateApi;
        // No api selected initially
        $rootScope.currentApi = null;
        // Redirect to brand if specified api does not exist
        $rootScope.$on('$routeChangeStart', function (next, current) {
            if (current.params.api !== brandApi.alias && current.params.api !== affiliateApi.alias) {
                $location.path('/' + brandApi.alias);
            }
        });
        // Only broadcast api changes if the new api is valid and different
        $rootScope.$on('$routeChangeSuccess', function (e, current, previous) {
            // Scroll to top on change
            $anchorScroll();
            var prevApi = $rootScope.currentApi;
            $rootScope.currentApi = (current.params.api === brandApi.alias ? brandApi : affiliateApi);
            if (prevApi !== $rootScope.currentApi) {
                $rootScope.$broadcast('apiChange');
            }
        });
    });
})(DocApp || (DocApp = {}));
//# sourceMappingURL=app.js.map