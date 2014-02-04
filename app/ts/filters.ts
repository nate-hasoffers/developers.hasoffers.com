/// <reference path="ts_defs/_all.d.ts"/>

module DocApp.filters {
  'use strict';

  // A filter that returns targets which have a method whose name is a partial match.
  export class HasApiTargetFilter {
    static filter(targets: DocApp.domain.IApiTarget[], methodNamePartial: string) {
      // Returns all targets if no query filter provided
      if(methodNamePartial == null || methodNamePartial === '' ) {
        return targets;
      }

      // Returns targets which have methods whose names are a partial match for the provided substring.
      return _.filter(targets, (target: DocApp.domain.IApiTarget) => {
        return HasApiMethodFilter.filter(target.methods, methodNamePartial).length > 0;
      });
    }
  }

  // A filter that returns methods whose names are a partial match for a provided substring.
  export class HasApiMethodFilter {
    static filter(methods: DocApp.domain.IApiMethod[], methodNamePartial: string) {
      // Returns all methods if no query filter provided
      if(methodNamePartial == null || methodNamePartial === '') {
        return methods;
      }

      // Limit to methods whose names match the query
      return _.filter(methods, (method: DocApp.domain.IApiMethod) => {
        return method.name.toLowerCase().match(methodNamePartial.toLowerCase()) != null;
      });
    }
  }

  // Filter to allow decoded URIs to be displayed.
  export class DecodeUriFilter {
    static filter(url) {
      return decodeURI(url);
    }
  }

  // Converts an object to PHP source code associative array
  export class HasObjToAssocPhpArrayFilter {
    private static convertToPhp(contents: any, currentIndentation: number) {
      var indentStr = Array(currentIndentation+1).join('\t');
      
      if(_.isArray(contents)) {
        // Build a numeric array
        var retStr = 'array(\n';

        retStr += indentStr + '\t' +
          _.map(contents, (val) => {
            return HasObjToAssocPhpArrayFilter.convertToPhp(val, currentIndentation+1);
          }).join(',\n' + indentStr + "\t");

        retStr += '\n' + indentStr + ')';

        return retStr;
      }
      else if(_.isObject(contents)) {
        // Build an associative array
        var retStr = 'array(\n';

        retStr += indentStr + '\t' + 
          _.map(contents, (val, idx) => {
            return "'" + idx + "'" + ' => ' + HasObjToAssocPhpArrayFilter.convertToPhp(val, currentIndentation+1);
          }).join(',\n' + indentStr + "\t");

        retStr += '\n' + indentStr + ')';

        return retStr;
      }
      else if(_.isNull(contents)) {
        // Nothing should be null (empty string or not present), but check anyway
        return 'null';
      }
      else {
        // Simple value, return with single quotes and backslashes escaped
        return _.isNumber(contents) ? contents : "'" + contents.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
      }
    }

    static filter(obj: {}, initialIndentation: number) {
      return HasObjToAssocPhpArrayFilter.convertToPhp(obj, initialIndentation);
    }
  }

  // Converts a dictionary of API args into a string of URL parameters matching the expectations our the API
  // which allows for an object like {'foo': {'bar': 3}} to get converted into strings like foo[bar]=3.
  // The string is URI encoded.
  export class HasArgDictionaryToUrlParamStringFilter {
    static filter(argDictionary: {[paramName: string]: any}) {
      return jQuery.param(argDictionary);
    }
  }

  // Takes a URL and splits the parameters and their values into an array of objects with a param and val hash.
  export class HasFlattenArgDictionaryFilter {
    static filter(argDictionary: {[paramName: string]: any}) {
      // Convert the arg dictionary to a string of parameters
      var paramString = HasArgDictionaryToUrlParamStringFilter.filter(argDictionary);

      // Split out the params and their values.
      // If any param has the same name this will put the values into an array.
      var paramDict = <{[s: string]: any}>URI.parseQuery(paramString);

      var params = [];
      // Convert the parsed arg dictionary into an array
      // URI-encode each value again (the parseQuery decoded any encoded values).
      _.each(paramDict, (val: any, param: string) => {
        if(_.isArray(val)) {
          // Multiple entries for the same param name; break them out
          _.each(val, (v: any) => {
            params.push({'param': param, 'val': encodeURIComponent(v)});
          });
        }
        else {
          params.push({'param': param, 'val': encodeURIComponent(val)});
        }
      });

      return params;
    }
  }
}
