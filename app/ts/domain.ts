/// <reference path="ts_defs/_all.d.ts"/>

module DocApp.domain {
  'use strict';

  // The structure of our raw json file
  export interface IApiDefinition {
    access: string;
    baseUrl: string;
    modelMap: { [s: string]: IApiModel };
    models: IApiModel[];
    targets: IApiTarget[];
  }

  // A model type of the api
  export interface IApiModel {
    access: string;
    name: string;
    description: string;
    fields: { [s: string]: IApiModelField }
  }

  // A field of a model
  export interface IApiModelField {
    name: string;
    dataType: string;
    description: string;
    nullable: boolean;
    readable: boolean;
    writable: boolean;
    synthetic: boolean;
    defaultValue?: any;
    runtimeDefault?: string;
    allowedValues?: any[];
  }

  // A controller
  export interface IApiTarget {
    api: IApiDefinition;
    name: string;
    methods: IApiMethod[]
  }

  // A method inside a controller
  export interface IApiMethod {
    target: IApiTarget;
    name: string;
    verb: string;
    shortDescription: string;
    longDescription: string;
    parameters: IApiParam[];
    response: IApiMethodResponse;
    nonstandard?: string;
  }

  // A method response
  export interface IApiMethodResponse {
    description: string;
    dataTypes: responseDataTypes.IResponseDataType[]
  }

  // A parameter of a method
  export interface IApiParam {
    method: IApiMethod;
    name: string;
    description: string;
    isRequired: boolean;
    allowedDataTypes: paramDataTypes.IParamDataType[];
  }

  // Declare different return datatypes
  export module responseDataTypes {
    export interface IResponseDataType {
      name: string;
    }
  }

  // Declare different parameter datatypes
  export module paramDataTypes {
    export interface IParamDataType {
      name: string;
      allowedValues?: any[]
    }

    // Primitive data types are just a name (integer, mixed, double, etc)
    export interface IPrimitiveType extends IParamDataType {}

    // Array of primitives
    export interface IPrimitiveArrayType extends IParamDataType {
      valueType: string;
    }

    export interface ISortType extends IParamDataType {
      modelName: string
      model: IApiModel;
    }

    export interface IContainRelationship {
      modelAlias: string;
      modelName: string;
      model: IApiModel;
      description: string;
    }

    export interface IContainType extends IParamDataType {
      baseModelAlias: string;
      baseModelName: string;
      baseModel: IApiModel;
      relationships: IContainRelationship[]
    }

    export interface IFilterType extends IParamDataType {
      modelName: string;
      model: IApiModel;
    }

    export interface IReportFilterType extends IParamDataType {
      modelName: string;
      model: IApiModel;
    }

    export interface IFieldDataType extends IParamDataType {
      modelName: string;
      model: IApiModel;
    }

    export interface IFieldsType extends IParamDataType {
      modelName: string;
      model: IApiModel;
    }

    export interface IFieldType extends IParamDataType {
      modelName: string;
      model: IApiModel;
    }

    // A field definition for a structured object type param
    export interface IStructuredObjectField {
      name: string;
      description: string;
      dataType: string;
      required: boolean;
      allowedValues?: any[];
    }

    export interface IStructuredObjectType extends IParamDataType {
      fields: IStructuredObjectField[]
    }

    export interface IStructuredObjectArrayType extends IStructuredObjectType {}
  }

  // Argument types (what we pass to corresponding method parameters)
  export module methodArgs {
    // An argument to pass to an API method
    export interface IMethodArg {
      param: IApiParam;
      selectedDataType: paramDataTypes.IParamDataType;
      value: any;

      // Directives may attach a default value when they start working on an arg
      defaultValue?: any;
    }

    // The allowed sort directions
    export interface ISortCombo {
      field: IApiModelField;
      direction: string;
    }

    // Defines the structure of a Sort parameter arg
    export interface ISortArg extends IMethodArg {
      selectedDataType: paramDataTypes.ISortType;
      value: ISortCombo[];
    }

    // Defines the structure of relational filter operators
    export interface RelationalFilterOperator {
      label: string;
      value: string;
    }

    // Specify all the valid relational field operators for field filters
    var relationalFilterOperators: DocApp.domain.methodArgs.RelationalFilterOperator[]  = [
      {label: '=',        value: 'EQUAL_TO'},
      {label: '!=',       value: 'NOT_EQUAL_TO'},
      {label: '<',        value: 'LESS_THAN'},
      {label: '<=',       value: 'LESS_THAN_OR_EQUAL_TO'},
      {label: '>',        value: 'GREATER_THAN'},
      {label: '>=',       value: 'GREATER_THAN_OR_EQUAL_TO'},
      {label: 'Between',  value: 'BETWEEN'},
      {label: 'Like',     value: 'LIKE'},
      {label: 'Not Like', value: 'NOT_LIKE'},
      {label: 'True',     value: 'TRUE'},
      {label: 'False',    value: 'FALSE'},
      {label: 'Null',     value: 'NULL'},
      {label: 'Not Null', value: 'NOT_NULL'}
    ];

    export class FieldFilter  {
      // We use an array for the filter value consistency, but only the default operator (acts like an "IN") actually
      // supports more than one value.
      // The view ensures only a valid number of values are allowed based on the operator selected.
      value: any;

      relationalOperator: RelationalFilterOperator;

      constructor(public field: IApiModelField, private api: IApiDefinition) {
        this.setDefaultRelationalOperator();
        this.initializeDefaultValues();
      }

      // Function returning the valid relational operators for the field this filter is on.
      public getAllowedRelationalFilterOperators(): DocApp.domain.methodArgs.RelationalFilterOperator[] {
        // Get a list of the data types supported by this field
        var allowedOperators = [];

        if(this.field.allowedValues != null) {
          // The field only allows specific values, so limit relational operators to equality and inequality
          allowedOperators.push('EQUAL_TO', 'NOT_EQUAL_TO');
        }
        else if(_.contains(['integer', 'float', 'decimal', 'date', 'datetime'], this.field.dataType)) {
          // Field is a number type, allow numeric operators
          allowedOperators.push(
            'EQUAL_TO',
            'NOT_EQUAL_TO',
            'LESS_THAN',
            'LESS_THAN_OR_EQUAL_TO',
            'GREATER_THAN',
            'GREATER_THAN_OR_EQUAL_TO'
          );
        }
        else if(this.field.dataType === 'string') {
          // Field is a string type, allow text substring operators
          allowedOperators.push('EQUAL_TO','NOT_EQUAL_TO', 'LIKE','NOT_LIKE');
        }
        else if(this.field.dataType === 'boolean') {
          // Field is boolean type, allow boolean operators only
          allowedOperators.push('TRUE', 'FALSE');
        }

        // Nullable fields can use the NULL and NOT NULL operators in addition to their datatype-specific operators
        if(this.field.nullable) {
          allowedOperators.push('NULL', 'NOT_NULL');
        }

        // This is a hack to deal with the fact that the Affiliate API only supports equality filters on the primary key
        // fields of its models.  Attempts to use other filter types on the pkey will fail.
        // If filters are being restricted to a subset of what is generally allowed, limit the allowed operators only to
        // the ones also defined in the whitelist passed in.
        // We don't have to worry about affiliate_id pkey models because we disallow filters on them entirely.
        if(this.field.name === 'id' && this.api.access === 'affiliate') {
          allowedOperators = ['EQUAL_TO'];
        }

        // Return the valid operators that we've identified by name
        return _.filter(relationalFilterOperators, (filterOperator: DocApp.domain.methodArgs.RelationalFilterOperator) => {
          return _.contains(allowedOperators, filterOperator.value);
        });
      }

      // Appends a new default value to the existing value array.
      // This is for the default/"IN" operator which allows more than one value
      public appendNewDefaultFilterValue(): void {
        this.value.push(this.getDefaultFilterValue());
      }

      // For filters on fields that restrict values, this function returns any values not already used in the filter.
      public getAllowedFieldValues(curVal?: any): any[] {
        var usedFields = _.difference(this.field.allowedValues, this.value);

        // If one is selected at the current index, allow the existing value in addition to any other unused ones
        if(curVal != null) {
          usedFields.push(curVal);
        }

        return usedFields;
      }

      // Returns the default filter value for this field/operator
      private getDefaultFilterValue(): any {
        if(this.field.allowedValues != null) {
          // The field has a list of allowed values, so set it to the first available one (alphabetically)
          return  _.sortBy(this.getAllowedFieldValues(), (val) => { return val; })[0];
        }
        else if(this.field.dataType === 'boolean') {
          // The field is a boolean, so set it to true initially
          return 1;
        }
        else {
          // Empty string for all other types
          return '';
        }
      }

      // Sets a valid relational operator (chooses the first available one)
      public setDefaultRelationalOperator(): void {
        this.relationalOperator = this.getAllowedRelationalFilterOperators()[0];
      }

      // Initializes the default value array for this filter.
      public initializeDefaultValues(): void {
        // Replace the value array with an empty one to remove existing values.
        this.value = [this.getDefaultFilterValue()];
      }
    }

    // This is similar to the FieldFilter arg, except it is limited to Reports.
    // It also has some various differences in allowed operators and the format of them.
    export class ReportFieldFilter  {
      // We use an array for the filter value consistency, but only the EQUAL_TO and BETWEEN operators actually
      // support more than one value (unbounded for EQUAL_TO and exactly 2 for BETWEEN).
      // The view ensures only a valid number of values are allowed based on the operator selected.
      value: any;

      relationalOperator: RelationalFilterOperator;

      constructor(public field: IApiModelField) {
        this.setDefaultRelationalOperator();
        this.initializeDefaultValues();
      }

      // Function returning the valid relational operators for the field this filter is on.
      public getAllowedRelationalFilterOperators(): DocApp.domain.methodArgs.RelationalFilterOperator[] {
        // Get a list of the data types supported by this field
        var allowedOperators = [];

        if(this.field.allowedValues != null) {
          // The field only allows specific values, so limit relational operators to equality and inequality
          allowedOperators.push('EQUAL_TO', 'NOT_EQUAL_TO');
        }
        else if(_.contains(['integer', 'float', 'decimal', 'date', 'datetime'], this.field.dataType)) {
          // Field is a number type, allow numeric operators
          allowedOperators.push(
            'BETWEEN',
            'EQUAL_TO',
            'NOT_EQUAL_TO',
            'LESS_THAN',
            'LESS_THAN_OR_EQUAL_TO',
            'GREATER_THAN',
            'GREATER_THAN_OR_EQUAL_TO'
          );
        }
        else if(this.field.dataType === 'string') {
          // Field is a string type, allow text substring operators
          allowedOperators.push('EQUAL_TO','NOT_EQUAL_TO', 'LIKE', 'NOT_LIKE');
        }
        else if(this.field.dataType === 'boolean') {
          // Field is boolean type, allow boolean operators only
          allowedOperators.push('EQUAL_TO');
        }

        // Nullable fields can use the NULL and NOT NULL operators in addition to their datatype-specific operators
        if(this.field.nullable) {
          allowedOperators.push('NULL', 'NOT_NULL');
        }

        // Return the valid operators that we've identified by name
        return _.filter(relationalFilterOperators, (filterOperator: DocApp.domain.methodArgs.RelationalFilterOperator) => {
          return _.contains(allowedOperators, filterOperator.value);
        });
      }

      // Appends a new default value to the existing value array.
      public appendNewDefaultFilterValue(): void {
        this.value.push(this.getDefaultFilterValue());
      }

      // For filters on fields that restrict values, this function returns any values not already used in the filter.
      public getAllowedFieldValues(curVal?: any): any[] {
        var usedFields = _.difference(this.field.allowedValues, this.value);

        // If one is selected at the current index, allow the existing value in addition to any other unused ones
        if(curVal != null) {
          usedFields.push(curVal);
        }

        return usedFields;
      }

      // Returns the default filter value for this field
      private getDefaultFilterValue(): any {
        if(this.field.allowedValues != null) {
          // The field has a list of allowed values, so set it to the first available one (alphabetically)
          return  _.sortBy(this.getAllowedFieldValues(), (val) => { return val; })[0];
        }
        else if(this.field.dataType === 'boolean') {
          // The field is a boolean, so set it to true initially
          return 1;
        }
        else {
          // Empty string for all other types
          return '';
        }
      }

      // Sets a valid relational operator (chooses the first available one)
      public setDefaultRelationalOperator(): void {
        this.relationalOperator = this.getAllowedRelationalFilterOperators()[0];
      }

      // Initializes the default value array for this filter.
      public initializeDefaultValues(): void {
        // Replace the value array with an empty one to remove existing values.
        this.value = [this.getDefaultFilterValue()];

        // BETWEEN operator takes exactly two values, so initialize both of them
        if(this.relationalOperator.value === 'BETWEEN') {
          this.value.push(this.getDefaultFilterValue());
        }
      }
    }

    export interface IFieldsArg extends IMethodArg {
      value: IApiModelField[];
      selectedDataType: paramDataTypes.IFieldsType;
    }

    export interface IFieldArg extends IMethodArg {
      param: DocApp.domain.IApiParam;
      value: IApiModelField;
      selectedDataType: paramDataTypes.IFieldType;
    }

    export interface IFilterArg extends IMethodArg {
      value: {
        operator: string;
        fieldFilters: FieldFilter[];
      }
      selectedDataType: paramDataTypes.IFilterType;
    }

    export interface IReportFilterArg extends IMethodArg {
      value: ReportFieldFilter[];
      selectedDataType: paramDataTypes.IReportFilterType;
    }

    export interface IModelFieldWithValue {
      field: IApiModelField;
      value: string;
    }

    export interface IFieldDataArg extends IMethodArg {
      value: IModelFieldWithValue[];
      selectedDataType: paramDataTypes.IFieldDataType;
    }

    export interface IStructuredObjectFieldWithValue {
      field: DocApp.domain.paramDataTypes.IStructuredObjectField;
      value: string;
    }

    export interface IStructuredObjectArg extends IMethodArg {
      value: IStructuredObjectFieldWithValue[];
      selectedDataType: paramDataTypes.IStructuredObjectType;
    }

    export interface IStructuredObjectArrayArg extends IMethodArg {
      value: Array<IStructuredObjectFieldWithValue[]>;
      selectedDataType: paramDataTypes.IStructuredObjectArrayType;
    }

    // Any arbitrary field name/value allowed for unstructured objects
    export interface IUnstructuredObjectFieldWithValue {
      field: string;
      value: string;
    }

    export interface IUnstructuredObjectArg extends IMethodArg {
      value: IUnstructuredObjectFieldWithValue[];
      selectedDataType: paramDataTypes.IStructuredObjectType;
    }

    export interface IContainArg extends IMethodArg {
      value: DocApp.domain.paramDataTypes.IContainRelationship[];
      selectedDataType: paramDataTypes.IContainType;
    }

    export interface IPrimitiveArg extends IMethodArg {
      selectedDataType: paramDataTypes.IPrimitiveType;
      value: any;
    }

    export interface IPrimitiveArrayArg extends IMethodArg {
      selectedDataType: paramDataTypes.IPrimitiveType;
      value: any[];
    }

    // A container for a set of arguments for a specific API call
    export class ApiCallArgSet {
      methodSpecificArgs: IMethodArg[];

      constructor(public method: DocApp.domain.IApiMethod,
                  public networkId: string,
                  public networkToken: string,
                  public affiliateKey: string) {

        // Build an object for each potential argument, initializing the initial value and selecting
        // the first available datatype for the parameter
        this.methodSpecificArgs = _.map(method.parameters, (param) => {
          return {
            'param': param,
            'selectedDataType': param.allowedDataTypes[0],
            'value': null
          };
        });
      }

      // Function to return a dictionary of params with their associated value(s)
      public getArgDictionary(): {[paramName: string]: any} {
        // Set network ID and appropriate token
        var args: {[paramName: string]: any} = {
          'NetworkId': this.networkId,
          'Target': this.method.target.name,
          'Method': this.method.name
        };

        if(this.method.target.api.access === 'affiliate') {
          args['api_key'] = this.affiliateKey;
        }
        else if(this.method.target.api.access === 'brand') {
          args['NetworkToken'] = this.networkToken;
        }
        else {
          throw new Error('Invalid access found on target API: ' + this.method.target.api.access);
        }

        // Attach any method-specific parameters provided by the user
        _.each(this.methodSpecificArgs, (arg: DocApp.domain.methodArgs.IMethodArg) => {
          // Some of our special parameter types have values that must be transformed
          switch(arg.selectedDataType.name) {
            case '@filter@':
              var filterArg = <DocApp.domain.methodArgs.IFilterArg>arg;

              if(filterArg.value && filterArg.value.fieldFilters.length > 0) {
                var filter = {};

                _.each(filterArg.value.fieldFilters, (fieldFilter: DocApp.domain.methodArgs.FieldFilter) => {
                  var fieldName = fieldFilter.field.name;

                  filter[fieldName] = {};

                  if(_.contains(['TRUE','FALSE','NULL','NOT_NULL'], fieldFilter.relationalOperator.value)) {
                    // booleans and null filters are formatted differently (value is 1)
                    filter[fieldName][fieldFilter.relationalOperator.value] = 1;
                  }
                  else if(fieldFilter.relationalOperator.value === 'EQUAL_TO') {
                    // We never use the EQUAL_TO filter; it is just a less capable version of the default filter.
                    // The EQUAL_TO filter only supports a single value, while the default filter supports a single
                    // value or an array of values (i.e. an IN filter).
                    filter[fieldName] = (fieldFilter.value.length > 1 ? fieldFilter.value : fieldFilter.value[0]);
                  }
                  else {
                    // All other filter types only support a single value, so the value array will only have one element
                    // in it.
                    filter[fieldName][fieldFilter.relationalOperator.value] = fieldFilter.value[0];
                  }
                });
                
                if(filterArg.value.operator === 'OR') {
                  // OR filters get nested
                  args[filterArg.param.name] = {'OR': filter};
                }
                else {
                  // AND filters do not require nesting
                  args[filterArg.param.name] = filter;
                }

              }
              break;
            case '@report_filter@':
              var reportFilterArg = <DocApp.domain.methodArgs.IReportFilterArg>arg;

              if(reportFilterArg.value && reportFilterArg.value.length > 0) {
                var filter = {};

                _.each(reportFilterArg.value, (fieldFilter: DocApp.domain.methodArgs.ReportFieldFilter) => {
                  var fieldName = fieldFilter.field.name;

                  filter[fieldName] = {'conditional': fieldFilter.relationalOperator.value};

                  if(fieldFilter.relationalOperator.value === 'EQUAL_TO') {
                    // The EQUAL_TO operator takes 1 or more arguments
                    filter[fieldName]['values'] = (fieldFilter.value.length > 1 ? fieldFilter.value : fieldFilter.value[0]);
                  }
                  else if(fieldFilter.relationalOperator.value === 'BETWEEN') {
                    // The BETWEEN operator takes two arguments
                    filter[fieldName]['values'] = [fieldFilter.value[0], fieldFilter.value[1]];
                  }
                  else if(!_.contains(['NULL', 'NOT_NULL'], fieldFilter.relationalOperator.value)){
                    // All remaining operators accept a single value (except NULL/NOT_NULL which have no values)
                    filter[fieldName]['values'] = fieldFilter.value[0];
                  }
                });

                args[reportFilterArg.param.name] = filter;
              }
              break;
            case '@data@':
              var fieldDataArg = <DocApp.domain.methodArgs.IFieldDataArg>arg;

              // Map each row in the array [{field: field, value: value}} to an object indexed by field.name with value
              // being the value for the corresponding field.
              if(fieldDataArg.value.length > 0) {
                var fieldData: {[index: string]: string} = {};
                _.each(fieldDataArg.value, (fieldWithValue: DocApp.domain.methodArgs.IModelFieldWithValue) => {
                  fieldData[fieldWithValue.field.name] = fieldWithValue.value;
                });

                args[fieldDataArg.param.name] = fieldData;
              }
              break;
            case '@structured_object@':
              var structuredObjectArg = <DocApp.domain.methodArgs.IStructuredObjectArg>arg;

              // Map each row in the array [{field: field, value: value}} to an object indexed by field.name with value
              // being the value for the corresponding field.
              if(structuredObjectArg.value.length > 0) {
                var fieldData: {[index: string]: string} = {};
                _.each(structuredObjectArg.value, (fieldWithValue: DocApp.domain.methodArgs.IStructuredObjectFieldWithValue) => {
                  fieldData[fieldWithValue.field.name] = fieldWithValue.value;
                });

                args[structuredObjectArg.param.name] = fieldData;
              }
              break;
            case '@structured_object_array@':
              var structuredObjectArrayArg = <DocApp.domain.methodArgs.IStructuredObjectArrayArg>arg;

              if(structuredObjectArrayArg.value.length > 0) {
                args[structuredObjectArrayArg.param.name] = [];

                // Iterate over each array of field/value sets to be converted to objects
                _.each(structuredObjectArrayArg.value, (fieldValueList: DocApp.domain.methodArgs.IStructuredObjectFieldWithValue[]) => {
                  // Map each row in the array [{field: field, value: value}} to an object indexed by field.name with value
                  // being the value for the corresponding field.
                  var fieldData: {[index: string]: string} = {};
                  _.each(fieldValueList, (fieldWithValue: DocApp.domain.methodArgs.IStructuredObjectFieldWithValue) => {
                    fieldData[fieldWithValue.field.name] = fieldWithValue.value;
                  });

                  // Add this object to the array
                  args[structuredObjectArrayArg.param.name].push(fieldData);
                });
              }
              break;
            case '@unstructured_object@':
              var unstructuredObjectArg = <DocApp.domain.methodArgs.IUnstructuredObjectArg>arg;

              // Map each row in the array [{field: field name, value: value}} to an object indexed by field name with
              // value being the value for the corresponding field.
              if(unstructuredObjectArg.value.length > 0) {
                var fieldData: {[index: string]: string} = {};
                _.each(unstructuredObjectArg.value, (fieldWithValue: DocApp.domain.methodArgs.IUnstructuredObjectFieldWithValue) => {
                  fieldData[fieldWithValue.field] = fieldWithValue.value;
                });

                args[unstructuredObjectArg.param.name] = fieldData;
              }
              break;
            case '@contain@':
              var containArg = <DocApp.domain.methodArgs.IContainArg>arg;

              if(containArg.value.length > 0) {
                args[containArg.param.name] = _.pluck(containArg.value, 'modelAlias');
              }

              break;
            case '@sort@':
              var sortArg = <DocApp.domain.methodArgs.ISortArg>arg;

              // Build an object of (sortField => sortVal) for each set
              if(sortArg.value.length > 0) {
                args[sortArg.param.name] = _.object(_.map(sortArg.value, (sortCombo: DocApp.domain.methodArgs.ISortCombo) => {
                  return [sortCombo.field.name, sortCombo.direction];
                }));
              }

              break;
            case '@field@':
              var fieldArg = <DocApp.domain.methodArgs.IFieldArg>arg;

              // Only pass the field name if one was selected
              if(fieldArg.value != null) {
                args[fieldArg.param.name] = fieldArg.value.name;
              }
              break;
            case '@fields@':
              var fieldsArg = <DocApp.domain.methodArgs.IFieldsArg>arg;

              // Only pass the field names if at least one was selected
              if(fieldsArg.value.length > 0) {
                args[fieldsArg.param.name] = _.map(fieldsArg.value, (fieldDefinition: DocApp.domain.IApiModelField) => {
                  return fieldDefinition.name;
                });

                // Affiliate API Fields-type parameters must require the primary key if this param is used.
                // This is a hack that builds upon the common assumption that if a model has a field named 'id' that it
                // is the primary key, and if not then the 'affiliate_id' field is the pkey.
                if(fieldsArg.param.method.target.api.access === 'affiliate') {
                  if(null != _.find(fieldsArg.selectedDataType.model.fields, (field) => { return 'id' === field.name; }) &&
                      !_.contains(args[fieldsArg.param.name], 'id')) {
                    // Model has an 'id' field and it was not included, add it
                    args[fieldsArg.param.name].push('id');
                  }
                  else if(null != _.find(fieldsArg.selectedDataType.model.fields, (field) => { return 'affiliate_id' === field.name; }) &&
                            !_.contains(args[fieldsArg.param.name], 'affiliate_id')) {
                    // Model doesn't have an 'id' field but it does have an 'affiliate_id' field and it was not included,
                    // so add it
                    args[fieldsArg.param.name].push('affiliate_id');
                  }
                }
              }

              break;
            case 'array':
              var primArrayArg = <DocApp.domain.methodArgs.IPrimitiveArrayArg>arg;

              if(primArrayArg.value.length > 0) {
                args[primArrayArg.param.name] =  primArrayArg.value;
              }
              break;
            case 'boolean':
              if(arg.value != null) {
                args[arg.param.name] = (arg.value === true ? '1' : '0');
              }
              break;
            default:
              if(arg.value != null) {
                args[arg.param.name] = arg.value;
              }
          }
        });

        return args;
      }
    }
  }
}