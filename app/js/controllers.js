/// <reference path="ts_defs/_all.d.ts"/>
var DocApp;
(function (DocApp) {
    var controllers;
    (function (controllers) {
        'use strict';
        // Controller for a list of sidebar with targets and methods.
        var Sidebar = (function () {
            function Sidebar($scope, DocRetriever, $sce) {
                var _this = this;
                this.DocRetriever = DocRetriever;
                this.$sce = $sce;
                this.methodSearchQuery = '';
                this.modelSearchQuery = '';
                this.methodsOpen = true;
                this.modelsOpen = false;
                // Store instance of class in scope
                $scope.vm = this;
                // Function to initialize the sidebar with the current API models/targets
                var updateSidebar = function () {
                    DocRetriever.getApiDefinition($scope.currentApi.alias).then(function (apiDef) {
                        _this.api = apiDef;
                        _this.methodSearchQuery = '';
                        _this.modelSearchQuery = '';
                    });
                };
                // Initialize the sidebar (in the event the API was set already before Sidebar constructed)
                if ($scope.currentApi != null) {
                    updateSidebar();
                }
                // Whenever the api changes we need to update the sidebar to reflect the new targets/models/methods
                $scope.$on('apiChange', updateSidebar);
            }
            // Returns an subset of the provided Methods which match the current search string.
            Sidebar.prototype.getMatchingMethods = function (methods) {
                var _this = this;
                return _.filter(methods, function (method) {
                    return _this.isSubstring(method.name, _this.methodSearchQuery);
                });
            };
            // Returns the number of Methods that are visible for the specified Target (depends on the search string)
            Sidebar.prototype.getNumVisibleMethods = function (target) {
                // If Target name is matched, all visible
                if (this.methodSearchQuery == '' || this.isSubstring(target.name, this.methodSearchQuery)) {
                    return target.methods.length;
                }
                return this.getMatchingMethods(target.methods).length;
            };
            // Returns whether or not the needle (case insensitive) is found int he haystack (case insensitive).
            Sidebar.prototype.isSubstring = function (haystack, needle) {
                return haystack.toLowerCase().match(needle.toLowerCase()) != null;
            };
            // Takes a haystack and needle, and returns a HTML string of the haystack with the needle highlighted.
            Sidebar.prototype.highlightSubString = function (haystack, needle) {
                // Make sure a non-empty needle specified
                if (needle == '') {
                    return haystack;
                }
                // Look for the needle in the haystack
                var substrLocation = haystack.toLowerCase().indexOf(needle.toLowerCase());
                if (substrLocation < 0) {
                    // Not found in haystack
                    return haystack;
                }
                // Highlight the needle
                var highlightedString = haystack.substr(0, substrLocation) + '<span class="hs">' + haystack.substr(substrLocation, needle.length) + '</span>' + haystack.substr(substrLocation + needle.length);
                return this.$sce.trustAsHtml(highlightedString);
            };
            // Returns whether or not the specified Target should be shown, given the current search query.
            Sidebar.prototype.showTarget = function (target) {
                return this.methodSearchQuery == '' || this.isSubstring(target.name, this.methodSearchQuery) || this.getMatchingMethods(target.methods).length > 0;
            };
            // Returns whether or not the specified Method should be shown, given the current search query.
            Sidebar.prototype.showMethod = function (method) {
                // A method should be shown if there is no search query, or if its Target matches, or if the Method name matches.
                return this.methodSearchQuery == '' || this.isSubstring(method.target.name, this.methodSearchQuery) || this.isSubstring(method.name, this.methodSearchQuery);
            };
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