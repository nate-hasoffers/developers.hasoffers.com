/// <reference path="ts_defs/_all.d.ts"/>
var DocApp;
(function (DocApp) {
    var controllers;
    (function (controllers) {
        'use strict';
        // Controller for a list of sidebar with targets and methods.
        var Sidebar = (function () {
            function Sidebar($scope, DocRetriever) {
                var _this = this;
                this.DocRetriever = DocRetriever;
                this.methodSearchQuery = '';
                this.modelSearchQuery = '';
                // Store instance of class in scope
                $scope.vm = this;
                // Whenever the api changes we need to update the sidebar to reflect the new targets/models/methods
                $scope.$on('apiChange', function () {
                    DocRetriever.getApiDefinition($scope.currentApi.alias).then(function (apiDef) {
                        _this.api = apiDef;
                        _this.methodSearchQuery = '';
                        _this.modelSearchQuery = '';
                    });
                });
            }
            return Sidebar;
        })();
        controllers.Sidebar = Sidebar;
        // Method view controller
        var MethodView = (function () {
            function MethodView($scope, DataTypeDescriber, method) {
                this.$scope = $scope;
                this.DataTypeDescriber = DataTypeDescriber;
                this.method = method;
                // Store instance of class in scope
                $scope.vm = this;
            }
            // This function provides all dependencies for the constructor
            MethodView.resolve = function () {
                return {
                    'method': function ($route, $location, DocRetriever) {
                        // Retrieve the method definition; exits early if the api, target or method is invalid
                        return DocRetriever.getApiDefinition($route.current.params.api).then(function (apiDef) {
                            // Locate the specified target
                            var target = _.find(apiDef.targets, function (target) {
                                return target.name === $route.current.params.targetName;
                            });
                            // If invalid target specified; go home
                            if (target == null) {
                                return $location.path('/' + $route.current.params.api);
                            }
                            // Locate the specified method
                            var method = _.find(target.methods, function (method) {
                                return method.name === $route.current.params.methodName;
                            });
                            // If invalid method specified, go to Target view
                            if (method == null) {
                                return $location.path('/' + $route.current.params.api + '/controller/' + target.name);
                            }
                            return method;
                        });
                    }
                };
            };
            return MethodView;
        })();
        controllers.MethodView = MethodView;
        // Model view controller
        var ModelView = (function () {
            function ModelView($scope, model) {
                this.$scope = $scope;
                this.model = model;
                // Store instance of class in scope
                $scope.vm = this;
            }
            // This function provides all dependencies for the constructor
            ModelView.resolve = function () {
                return {
                    'model': function ($route, $location, DocRetriever) {
                        // Retrieve the model definition; exits early if the api or model is invalid
                        return DocRetriever.getApiDefinition($route.current.params.api).then(function (apiDef) {
                            // Locate the specified model
                            var model = apiDef.modelMap[$route.current.params.modelName];
                            // If invalid model specified; go home
                            if (model == null) {
                                return $location.path('/' + $route.current.params.api);
                            }
                            return model;
                        });
                    }
                };
            };
            return ModelView;
        })();
        controllers.ModelView = ModelView;
    })(controllers = DocApp.controllers || (DocApp.controllers = {}));
})(DocApp || (DocApp = {}));
//# sourceMappingURL=controllers.js.map