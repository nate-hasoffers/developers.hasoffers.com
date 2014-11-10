/// <reference path="ts_defs/_all.d.ts"/>
var DocApp;
(function (DocApp) {
    var filters;
    (function (filters) {
        'use strict';
        // Filter to allow decoded URIs to be displayed.
        var DecodeUriFilter = (function () {
            function DecodeUriFilter() {
            }
            DecodeUriFilter.filter = function (url) {
                return decodeURI(url);
            };
            return DecodeUriFilter;
        })();
        filters.DecodeUriFilter = DecodeUriFilter;
        // Converts an object to PHP source code associative array
        var HasObjToAssocPhpArrayFilter = (function () {
            function HasObjToAssocPhpArrayFilter() {
            }
            HasObjToAssocPhpArrayFilter.convertToPhp = function (contents, currentIndentation) {
                var indentStr = Array(currentIndentation + 1).join('\t');
                if (_.isArray(contents)) {
                    // Build a numeric array
                    var retStr = 'array(\n';
                    retStr += indentStr + '\t' + _.map(contents, function (val) {
                        return HasObjToAssocPhpArrayFilter.convertToPhp(val, currentIndentation + 1);
                    }).join(',\n' + indentStr + "\t");
                    retStr += '\n' + indentStr + ')';
                    return retStr;
                }
                else if (_.isObject(contents)) {
                    // Build an associative array
                    var retStr = 'array(\n';
                    retStr += indentStr + '\t' + _.map(contents, function (val, idx) {
                        return "'" + idx + "'" + ' => ' + HasObjToAssocPhpArrayFilter.convertToPhp(val, currentIndentation + 1);
                    }).join(',\n' + indentStr + "\t");
                    retStr += '\n' + indentStr + ')';
                    return retStr;
                }
                else if (_.isNull(contents)) {
                    // Nothing should be null (empty string or not present), but check anyway
                    return 'null';
                }
                else {
                    // Simple value, return with single quotes and backslashes escaped
                    return _.isNumber(contents) ? contents : "'" + contents.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
                }
            };
            HasObjToAssocPhpArrayFilter.filter = function (obj, initialIndentation) {
                return HasObjToAssocPhpArrayFilter.convertToPhp(obj, initialIndentation);
            };
            return HasObjToAssocPhpArrayFilter;
        })();
        filters.HasObjToAssocPhpArrayFilter = HasObjToAssocPhpArrayFilter;
        // Converts a dictionary of API args into a string of URL parameters matching the expectations our the API
        // which allows for an object like {'foo': {'bar': 3}} to get converted into strings like foo[bar]=3.
        // The string is URI encoded.
        var HasArgDictionaryToUrlParamStringFilter = (function () {
            function HasArgDictionaryToUrlParamStringFilter() {
            }
            HasArgDictionaryToUrlParamStringFilter.filter = function (argDictionary) {
                return jQuery.param(argDictionary);
            };
            return HasArgDictionaryToUrlParamStringFilter;
        })();
        filters.HasArgDictionaryToUrlParamStringFilter = HasArgDictionaryToUrlParamStringFilter;
        // Takes a URL and splits the parameters and their values into an array of objects with a param and val hash.
        var HasFlattenArgDictionaryFilter = (function () {
            function HasFlattenArgDictionaryFilter() {
            }
            HasFlattenArgDictionaryFilter.filter = function (argDictionary) {
                // Convert the arg dictionary to a string of parameters
                var paramString = HasArgDictionaryToUrlParamStringFilter.filter(argDictionary);
                // Split out the params and their values.
                // If any param has the same name this will put the values into an array.
                var paramDict = URI.parseQuery(paramString);
                var params = [];
                // Convert the parsed arg dictionary into an array
                // URI-encode each value again (the parseQuery decoded any encoded values).
                _.each(paramDict, function (val, param) {
                    if (_.isArray(val)) {
                        // Multiple entries for the same param name; break them out
                        _.each(val, function (v) {
                            params.push({ 'param': param, 'val': encodeURIComponent(v) });
                        });
                    }
                    else {
                        params.push({ 'param': param, 'val': encodeURIComponent(val) });
                    }
                });
                return params;
            };
            return HasFlattenArgDictionaryFilter;
        })();
        filters.HasFlattenArgDictionaryFilter = HasFlattenArgDictionaryFilter;
    })(filters = DocApp.filters || (DocApp.filters = {}));
})(DocApp || (DocApp = {}));
//# sourceMappingURL=filters.js.map