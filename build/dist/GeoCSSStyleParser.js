"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoCSSStyleParser = void 0;
var flatGeoCSS = require('flat-geo-css').default;
var _castArray = require('lodash/castArray');
var _isArray = require('lodash/isArray');
var _isNil = require('lodash/isNil');
var _isNumber = require('lodash/isNumber');
var _isEqual = require('lodash/isEqual');
var _flatten = require('lodash/flatten');
var _isString = require('lodash/isString');
var _find = require('lodash/find');
var GeoCSSStyleParser = /** @class */ (function () {
    function GeoCSSStyleParser() {
        this.title = 'GeoCSS Style Parser';
        this.warnings = [];
        this.getFisrtValidPesudoselector = function (key, properties) {
            var firstValid = _find(properties, function (props) { return !_isNil(props[key]); }) || {};
            return firstValid[key] || {};
        };
    }
    GeoCSSStyleParser.prototype.addWarning = function (text) {
        this.warnings.push(text);
    };
    GeoCSSStyleParser.prototype.getWarnings = function () {
        return __spreadArrays(this.warnings);
    };
    GeoCSSStyleParser.prototype.readExpression = function (expression) {
        if (expression === undefined) {
            return null;
        }
        if (typeof expression === 'string' || expression instanceof String) {
            return expression;
        }
        if (!isNaN(expression)) {
            return expression;
        }
        var operator = expression[0], args = expression.slice(1);
        switch (operator) {
            case 'array':
                return args;
            case 'get':
                return args[0];
            case 'hex':
                return args[0];
            case 'symbol':
                return args[0];
            case 'url':
                return args[0];
            case 'bool':
                return args[0] === 'true' ? true : false;
            default:
                return expression;
        }
    };
    GeoCSSStyleParser.prototype.readSelectorsExpression = function (selectors) {
        var _this = this;
        if (!selectors) {
            return undefined;
        }
        var operator = selectors[0], operands = selectors.slice(1);
        switch (operator) {
            case 'any':
            case 'all':
                var combinationOperator = GeoCSSStyleParser.combinationMap[operator];
                return __spreadArrays([combinationOperator], operands.map(function (arg) { return _this.readSelectorsExpression(arg); }));
            case '>':
            case '<':
            case '>=':
            case '<=':
            case '!=':
            case '==':
            case 'like':
            case 'ilike':
                var comparisonOperator = GeoCSSStyleParser.comparisonMap[operator];
                return [comparisonOperator, this.readExpression(operands[0]), this.readExpression(operands[1])];
            case 'isnull':
                return ['==', this.readExpression(operands[0]), null];
            default:
                return undefined;
        }
    };
    GeoCSSStyleParser.prototype.getFilterFromSelectors = function (selectors) {
        var filter = this.readSelectorsExpression(selectors);
        if (!filter) {
            return undefined;
        }
        if ((filter[0] === '||' || filter[0] === '&&') && filter.length === 2) {
            return filter[1];
        }
        return filter;
    };
    GeoCSSStyleParser.prototype.getScaleDenominatorFromSelectors = function (scales) {
        var minScale = scales && this.readExpression(scales['min-scale']);
        var maxScale = scales && this.readExpression(scales['max-scale']);
        var minScaleParam = !_isNil(minScale) && { min: minScale[2] };
        var maxScaleParam = !_isNil(maxScale) && { max: maxScale[2] };
        return minScaleParam || maxScaleParam
            ? __assign(__assign({}, minScaleParam), maxScaleParam) : undefined;
    };
    GeoCSSStyleParser.prototype.getMarkSymbolizerFromGeoCSSRule = function (properties) {
        var symbolName = this.readExpression(properties.mark);
        var wellKnownName;
        switch (symbolName) {
            case 'circle':
            case 'square':
            case 'triangle':
            case 'star':
            case 'cross':
            case 'x':
                var wkn = symbolName.charAt(0).toUpperCase() + symbolName.slice(1);
                wellKnownName = wkn;
                break;
            case 'shape://vertline':
            case 'shape://horline':
            case 'shape://slash':
            case 'shape://backslash':
            case 'shape://dot':
            case 'shape://plus':
            case 'shape://times':
            case 'shape://oarrow':
            case 'shape://carrow':
                wellKnownName = symbolName;
                break;
            default:
                throw new Error('MarkSymbolizer cannot be parsed. Unsupported WellKnownName.');
        }
        var kind = 'Mark';
        var markSize = this.readExpression(properties['mark-size']);
        var markRotation = this.readExpression(properties['mark-rotation']);
        var markOpacity = this.readExpression(properties['mark-opacity']);
        var pseudoSelector = properties[':mark'] || {};
        var opacity = markOpacity;
        var fillOpacity = this.readExpression(pseudoSelector['fill-opacity']);
        var color = this.readExpression(pseudoSelector.fill);
        var rotate = this.readExpression(pseudoSelector.rotation) || markRotation;
        var size = (this.readExpression(pseudoSelector.size) || markSize);
        var strokeColor = this.readExpression(pseudoSelector.stroke);
        var strokeWidth = this.readExpression(pseudoSelector['stroke-width']);
        var strokeOpacity = this.readExpression(pseudoSelector['stroke-opacity']);
        var wellKnownNameParam = wellKnownName && { wellKnownName: wellKnownName };
        var opacityParam = !_isNil(opacity) && { opacity: opacity };
        var fillOpacityParam = !_isNil(fillOpacity) && { fillOpacity: fillOpacity };
        var colorParam = color && { color: color };
        var rotateParam = !_isNil(rotate) && { rotate: rotate };
        var radiusParam = !_isNil(size) && { radius: size / 2 };
        var strokeColorParam = strokeColor && { strokeColor: strokeColor };
        var strokeWidthParam = !_isNil(strokeWidth) && { strokeWidth: strokeWidth };
        var strokeOpacityParam = !_isNil(strokeOpacity) && { strokeOpacity: strokeOpacity };
        return __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ kind: kind }, wellKnownNameParam), opacityParam), fillOpacityParam), colorParam), rotateParam), radiusParam), strokeColorParam), strokeWidthParam), strokeOpacityParam);
    };
    GeoCSSStyleParser.prototype.getIconSymbolizerFromGeoCSSRule = function (properties) {
        var kind = 'Icon';
        var image = this.readExpression(properties.mark);
        var markSize = this.readExpression(properties['mark-size']);
        var markRotation = this.readExpression(properties['mark-rotation']);
        var markOpacity = this.readExpression(properties['mark-opacity']);
        var imageParam = image && { image: image };
        var opacityParam = !_isNil(markOpacity) && { opacity: markOpacity };
        var rotateParam = !_isNil(markRotation) && { rotate: markRotation };
        var sizeParam = !_isNil(markSize) && { size: markSize };
        return __assign(__assign(__assign(__assign({ kind: kind }, imageParam), opacityParam), rotateParam), sizeParam);
    };
    GeoCSSStyleParser.prototype.getPointSymbolizerFromGeoCSSRule = function (properties) {
        var externalGraphic = properties.mark[0] === 'url';
        if (externalGraphic) {
            return this.getIconSymbolizerFromGeoCSSRule(properties);
        }
        return this.getMarkSymbolizerFromGeoCSSRule(properties);
    };
    GeoCSSStyleParser.prototype.getLineSymbolizerFromGeoCSSRule = function (properties) {
        var kind = 'Line';
        var color = this.readExpression(properties.stroke);
        var width = this.readExpression(properties['stroke-width']);
        var opacity = this.readExpression(properties['stroke-opacity']);
        var join = this.readExpression(properties['stroke-linejoin']);
        var cap = this.readExpression(properties['stroke-linecap']);
        var dasharray = this.readExpression(properties['stroke-dasharray']);
        var dashOffset = this.readExpression(properties['stroke-dashoffset']);
        var perpendicularOffset = this.readExpression(properties['stroke-offset']);
        var graphicStroke = (properties.stroke[0] === 'symbol' || properties.stroke[0] === 'url')
            ? this.getPointSymbolizerFromGeoCSSRule({
                'mark': properties.stroke,
                'mark-size': properties['stroke-size'],
                'mark-rotation': properties['stroke-rotation'],
                ':mark': properties[':stroke']
            })
            : undefined;
        var colorParam = !graphicStroke && color && { color: color };
        var graphicStrokeParam = graphicStroke && { graphicStroke: graphicStroke };
        var widthParam = !_isNil(width) && { width: width };
        var opacityParam = !_isNil(opacity) && { opacity: opacity };
        var joinParam = join && { join: join };
        var capParam = cap && { cap: cap };
        var dasharrayParam = dasharray && { dasharray: dasharray };
        var dashOffsetParam = dashOffset && { dashOffset: dashOffset };
        var perpendicularOffsetParam = !_isNil(perpendicularOffset) && { perpendicularOffset: perpendicularOffset };
        return __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ kind: kind }, colorParam), graphicStrokeParam), widthParam), opacityParam), joinParam), capParam), dasharrayParam), dashOffsetParam), perpendicularOffsetParam);
    };
    GeoCSSStyleParser.prototype.getFillSymbolizerFromGeoCSSRule = function (properties) {
        var kind = 'Fill';
        var color = this.readExpression(properties.fill);
        var fillOpacity = this.readExpression(properties['fill-opacity']);
        var outlineColor = this.readExpression(properties.stroke);
        var outlineWidth = this.readExpression(properties['stroke-width']);
        var outlineOpacity = this.readExpression(properties['stroke-opacity']);
        var outlineDasharray = this.readExpression(properties['stroke-dasharray']);
        var graphicFill = (properties.fill[0] === 'symbol' || properties.fill[0] === 'url')
            ? this.getPointSymbolizerFromGeoCSSRule({
                'mark': properties.fill,
                'mark-size': properties['fill-size'],
                'mark-rotation': properties['fill-rotation'],
                ':mark': properties[':fill']
            })
            : undefined;
        var colorParam = !graphicFill && color && { color: color };
        var graphicFillParam = graphicFill && { graphicFill: graphicFill };
        var opacityParam = !color && { opacity: 0 };
        var fillOpacityParam = !_isNil(fillOpacity) && { fillOpacity: fillOpacity };
        var outlineColorParam = outlineColor && { outlineColor: outlineColor };
        var outlineWidthParam = !_isNil(outlineWidth) && { outlineWidth: outlineWidth };
        var outlineOpacityParam = !_isNil(outlineOpacity) && { outlineOpacity: outlineOpacity };
        var outlineDasharrayParam = outlineDasharray && { outlineDasharray: outlineDasharray };
        return __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ kind: kind }, colorParam), graphicFillParam), opacityParam), fillOpacityParam), outlineColorParam), outlineWidthParam), outlineOpacityParam), outlineDasharrayParam);
    };
    GeoCSSStyleParser.prototype.getTextSymbolizerLabelFromGeoCSSProperty = function (label) {
        function readLabelExpression(expression) {
            if (expression === undefined) {
                return null;
            }
            if (typeof expression === 'string' || expression instanceof String) {
                return expression;
            }
            if (!isNaN(expression)) {
                return expression;
            }
            var operator = expression[0], args = expression.slice(1);
            switch (operator) {
                case 'text':
                    return args.map(function (arg) { return readLabelExpression(arg); });
                case 'brace':
                    return readLabelExpression(args[0]);
                case 'get':
                    return '{{' + args[0] + '}}';
                default:
                    return expression;
            }
        }
        var value = readLabelExpression(label);
        if (_isArray(value)) {
            return value.join('');
        }
        return value;
    };
    GeoCSSStyleParser.prototype.getTextSymbolizerFromGeoCSSRule = function (properties) {
        var kind = 'Text';
        var label = this.getTextSymbolizerLabelFromGeoCSSProperty(properties.label);
        var color = this.readExpression(properties['font-fill']);
        var haloWidth = this.readExpression(properties['halo-radius']);
        var haloColor = this.readExpression(properties['halo-color']);
        var offset = this.readExpression(properties['label-offset']);
        var rotate = this.readExpression(properties['label-rotation']);
        var font = this.readExpression(properties['font-family']);
        var fontStyle = this.readExpression(properties['font-style']);
        var fontWeight = this.readExpression(properties['font-weight']);
        var size = this.readExpression(properties['font-size']);
        var labelParam = label && { label: label };
        var colorParam = color && { color: color };
        var haloWidthParam = !_isNil(haloWidth) && { haloWidth: haloWidth };
        var haloColorParam = haloColor && { haloColor: haloColor };
        var offsetParam = offset && { offset: offset };
        var rotateParam = !_isNil(rotate) && { rotate: rotate };
        var fontParam = font && { font: _castArray(font) };
        var fontStyleParam = fontStyle && { fontStyle: fontStyle };
        var fontWeightParam = fontWeight && { fontWeight: fontWeight };
        var sizeParam = !_isNil(size) && { size: size };
        return __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ kind: kind }, labelParam), colorParam), haloWidthParam), haloColorParam), offsetParam), rotateParam), fontParam), fontStyleParam), fontWeightParam), sizeParam);
    };
    GeoCSSStyleParser.prototype.getColorMapFromGeoCSSProperty = function (properties) {
        var _this = this;
        var colorMapEntries = properties['raster-color-map']
            && this.readExpression(properties['raster-color-map']).map(function (entry) {
                var color = _this.readExpression(entry[1]);
                var quantity = _this.readExpression(entry[2]);
                var opacity = _this.readExpression(entry[3]);
                var label = _this.readExpression(entry[4]);
                return {
                    color: color,
                    quantity: quantity,
                    label: label,
                    opacity: opacity
                };
            });
        if (!colorMapEntries || colorMapEntries.length === 0) {
            return undefined;
        }
        var type = this.readExpression(properties['raster-color-map-type']);
        var colorMapEntriesParam = colorMapEntries && { colorMapEntries: colorMapEntries };
        return __assign({ type: type || 'ramp' }, colorMapEntriesParam);
    };
    GeoCSSStyleParser.prototype.getContrastEnhancementFromGeoCSSPropertyContrastEnhancement = function (properties, index) {
        var rasterContrastEnhancement = this.readExpression(properties['raster-contrast-enhancement']);
        var rasterGamma = this.readExpression(properties['raster-gamma']);
        if (index !== undefined) {
            var rasterContrastEnhancementArray = _castArray(rasterContrastEnhancement);
            var gammaValueArray = _castArray(rasterGamma);
            if (!(rasterContrastEnhancementArray.length === 3 || rasterContrastEnhancementArray.length === 1)
                || !(gammaValueArray.length === 3 || gammaValueArray.length === 1)) {
                throw new Error("\n          optional raster-contrast-enhancement and raster-gamma properties\n          should use one or three values separated by space\n          eg:\n\n          raster-channels: 0 1 2; /* rgb */\n          raster-contrast-enhancement: nomalize nomalize nomalize;\n          raster-gamma: 0.5 0.5 0.5;\n\n          /* or */\n\n          raster-channels: 0 1 2; /* rgb */\n          raster-contrast-enhancement: nomalize;\n          raster-gamma: 0.5;\n\n        ");
            }
            var fisrtEnhancementType = rasterContrastEnhancementArray[0];
            var fisrtGammaValue = gammaValueArray[0];
            if (fisrtEnhancementType !== undefined && rasterContrastEnhancementArray[index] === undefined) {
                this.addWarning('Used first value of raster-contrast-enhancement for all rgb channel');
            }
            if (fisrtGammaValue !== undefined && gammaValueArray[index] === undefined) {
                this.addWarning('Used first value of raster-gamma for all rgb channel');
            }
            var enhancementTypeRGB = rasterContrastEnhancementArray[index] || fisrtEnhancementType;
            var gammaValueRGB = !_isNil(gammaValueArray[index])
                ? gammaValueArray[index]
                : fisrtGammaValue;
            var enhancementTypeParamRGB = enhancementTypeRGB
                && { enhancementType: this.readExpression(enhancementTypeRGB) };
            var gammaValueParamRGB = !_isNil(gammaValueRGB) && { gammaValue: this.readExpression(gammaValueRGB) };
            return __assign(__assign({}, enhancementTypeParamRGB), gammaValueParamRGB);
        }
        if (_isArray(rasterContrastEnhancement) || _isArray(rasterGamma)) {
            throw new Error("\n          optional raster-contrast-enhancement and raster-gamma properties\n          should use one value when used with gray channel\n          eg:\n\n          raster-channels: 0; /* gray */\n          raster-contrast-enhancement: nomalize;\n          raster-gamma: 0.5;\n\n      ");
        }
        var enhancementType = this.readExpression(rasterContrastEnhancement);
        var gammaValue = this.readExpression(rasterGamma);
        if (_isNil(enhancementType) && _isNil(gammaValue)) {
            return undefined;
        }
        var enhancementTypeParam = enhancementType && { enhancementType: enhancementType };
        var gammaValueParam = !_isNil(gammaValue) && { gammaValue: gammaValue };
        return __assign(__assign({}, enhancementTypeParam), gammaValueParam);
    };
    GeoCSSStyleParser.prototype.getChannelFromGeoCSSChannel = function (sourceChannelName, properties, index) {
        var contrastEnhancement = this.getContrastEnhancementFromGeoCSSPropertyContrastEnhancement(properties, index);
        var contrastEnhancementParam = contrastEnhancement && { contrastEnhancement: contrastEnhancement };
        return __assign({ sourceChannelName: sourceChannelName + '' }, contrastEnhancementParam);
    };
    GeoCSSStyleParser.prototype.getChannelSelectionFromGeoCSSPropertyChannelSelection = function (properties) {
        var rasterChannels = this.readExpression(properties['raster-channels']);
        if (rasterChannels === 'auto') {
            return undefined;
        }
        if (_isArray(rasterChannels) && rasterChannels.length === 3) {
            var red = rasterChannels[0], blue = rasterChannels[1], green = rasterChannels[2];
            var redChannel = this.getChannelFromGeoCSSChannel(red, properties, 0);
            var greenChannel = this.getChannelFromGeoCSSChannel(blue, properties, 1);
            var blueChannel = this.getChannelFromGeoCSSChannel(green, properties, 2);
            return {
                redChannel: redChannel,
                greenChannel: greenChannel,
                blueChannel: blueChannel
            };
        }
        if (_isNumber(rasterChannels) || _isString(rasterChannels)) {
            var grayChannel = this.getChannelFromGeoCSSChannel(rasterChannels, properties);
            return {
                grayChannel: grayChannel
            };
        }
        throw new Error("\n      Cannot parse raster-channels. It does not match the auto, gray or rgb structure\n      eg:\n\n      raster-channels: auto;\n      raster-channels: 0; /* gray */\n      raster-channels: 7 2 4; /* rgb */\n\n    ");
    };
    GeoCSSStyleParser.prototype.getRasterSymbolizerFromGeoCSSRule = function (properties) {
        var kind = 'Raster';
        var opacity = this.readExpression(properties['raster-opacity']);
        var colorMap = this.getColorMapFromGeoCSSProperty(properties);
        var channelSelection = this.getChannelSelectionFromGeoCSSPropertyChannelSelection(properties);
        var contrastEnhancement = !channelSelection
            && this.getContrastEnhancementFromGeoCSSPropertyContrastEnhancement(properties);
        var opacityParam = !_isNil(opacity) && { opacity: opacity };
        var colorMapParam = colorMap && { colorMap: colorMap };
        var channelSelectionParam = channelSelection && { channelSelection: channelSelection };
        var contrastEnhancementParam = contrastEnhancement && { contrastEnhancement: contrastEnhancement };
        return __assign(__assign(__assign(__assign({ kind: kind }, opacityParam), colorMapParam), channelSelectionParam), contrastEnhancementParam);
    };
    GeoCSSStyleParser.prototype.getSymbolizerTypesFromProperties = function (properties) {
        var symbolizers = [];
        if (properties.mark) {
            symbolizers.push('point');
        }
        else if (properties.stroke && (properties.fill === 'none' || !properties.fill)) {
            symbolizers.push('line');
        }
        else if (properties.fill && properties.fill !== 'none') {
            symbolizers.push('polygon');
        }
        else if (properties['raster-channels'] !== undefined) {
            symbolizers.push('raster');
        }
        if (properties.label) {
            symbolizers.push('text');
        }
        return symbolizers;
    };
    GeoCSSStyleParser.prototype.getSymbolizersFromRules = function (geoCSSProperties) {
        var _this = this;
        var propertiesGroup = _castArray(geoCSSProperties);
        var newSymbolizers = propertiesGroup.reduce(function (symbolizers, properties) {
            var symbolizerTypes = _this.getSymbolizerTypesFromProperties(properties);
            return __spreadArrays(symbolizers, symbolizerTypes.reduce(function (acc, symbolizerType) {
                if (symbolizerType === 'point') {
                    return __spreadArrays(acc, [_this.getPointSymbolizerFromGeoCSSRule(properties)]);
                }
                if (symbolizerType === 'line') {
                    return __spreadArrays(acc, [_this.getLineSymbolizerFromGeoCSSRule(properties)]);
                }
                if (symbolizerType === 'polygon') {
                    return __spreadArrays(acc, [_this.getFillSymbolizerFromGeoCSSRule(properties)]);
                }
                if (symbolizerType === 'text') {
                    return __spreadArrays(acc, [_this.getTextSymbolizerFromGeoCSSRule(properties)]);
                }
                if (symbolizerType === 'raster') {
                    return __spreadArrays(acc, [_this.getRasterSymbolizerFromGeoCSSRule(properties)]);
                }
                return __spreadArrays(acc);
            }, []));
        }, []);
        // remove duplicated symbolizers
        return newSymbolizers.reduce(function (symbolizers, symbolizer) {
            var isDuplicated = !!symbolizers.find(function (compareSymbolizer) { return _isEqual(compareSymbolizer, symbolizer); });
            return __spreadArrays(symbolizers, (isDuplicated
                ? []
                : [symbolizer]));
        }, []);
    };
    GeoCSSStyleParser.prototype.getRulesFromGeoCSSSelectors = function (geoCSSRules) {
        var _this = this;
        // merge rule with same group id
        // to render as symbolizer
        var rules = [];
        for (var i = 0; i < geoCSSRules.length; i++) {
            var rule = geoCSSRules[i];
            var lastGroup = rules[rules.length - 1] || {};
            var lastGroupId = lastGroup.group;
            if (lastGroupId !== undefined && lastGroupId === rule.group) {
                rules[rules.length - 1] = __assign(__assign({}, lastGroup), { properties: __spreadArrays((_isArray(lastGroup.properties) ? lastGroup.properties : [lastGroup.properties]), [
                        rule.properties
                    ]) });
            }
            else {
                rules.push(rule);
            }
        }
        return rules.map(function (geoCSSRule) {
            var _a = geoCSSRule.title, title = _a === void 0 ? '' : _a, filterSelectors = geoCSSRule.selector, properties = geoCSSRule.properties, others = __rest(geoCSSRule, ["title", "selector", "properties"]);
            var filter = _this.getFilterFromSelectors(filterSelectors);
            var scaleDenominator = _this.getScaleDenominatorFromSelectors(others);
            var symbolizers = _this.getSymbolizersFromRules(properties);
            var filterParam = filter && { filter: filter };
            var scaleDenominatorParam = scaleDenominator && { scaleDenominator: scaleDenominator };
            var symbolizersParam = symbolizers && { symbolizers: symbolizers };
            return __assign(__assign(__assign({ name: title }, filterParam), scaleDenominatorParam), symbolizersParam);
        });
    };
    GeoCSSStyleParser.prototype.geoCSSObjectToGeoStylerStyle = function (geoCSSObject) {
        var _a = geoCSSObject.directive, directive = _a === void 0 ? {} : _a, geoCSSRules = geoCSSObject.rules;
        if (directive['@mode'] !== 'Flat') {
            this.addWarning('Supported only \'Flat\' mode, other directive will be translated as flat GeoCSS');
        }
        var name = directive['@styleTitle'] || '';
        var rules = this.getRulesFromGeoCSSSelectors(geoCSSRules);
        return {
            name: name,
            rules: rules
        };
    };
    GeoCSSStyleParser.prototype.readStyle = function (geoCSSStyle) {
        var _this = this;
        this.warnings = [];
        return new Promise(function (resolve, reject) {
            try {
                var geoCSSObject = flatGeoCSS.read(geoCSSStyle);
                var geoStylerStyle = _this.geoCSSObjectToGeoStylerStyle(geoCSSObject);
                resolve(geoStylerStyle);
            }
            catch (error) {
                reject(error);
            }
        });
    };
    GeoCSSStyleParser.prototype.writeStyle = function (geoStylerStyle) {
        var _this = this;
        this.warnings = [];
        return new Promise(function (resolve, reject) {
            try {
                var geoCSSObject = _this.geoStylerStyleToGeoCSSObject(geoStylerStyle);
                var geoCSS = flatGeoCSS.write(geoCSSObject);
                resolve(geoCSS);
            }
            catch (error) {
                reject(error);
            }
        });
    };
    GeoCSSStyleParser.prototype.geoStylerStyleToGeoCSSObject = function (geoStylerStyle) {
        var rules = this.getGeoCSSRulesFromRules(geoStylerStyle.rules);
        return {
            directive: {
                '@mode': 'Flat',
                '@styleTitle': geoStylerStyle.name
            },
            rules: rules
        };
    };
    GeoCSSStyleParser.prototype.getGeoCSSRulesFromRules = function (rules) {
        var _this = this;
        return _flatten(rules.map(function (rule, group) {
            var title = rule.name;
            var selector = _this.getSelectorsFromFilter(rule.filter);
            var titleParam = title && { title: title };
            var _a = rule.scaleDenominator || {}, minScale = _a.min, maxScale = _a.max;
            var hasScales = !!(_isNumber(minScale) || _isNumber(maxScale));
            var minScaleParam = _isNumber(minScale) && { 'min-scale': ['>', ['get', '@sd'], minScale] };
            var maxScaleParam = _isNumber(maxScale) && { 'max-scale': ['<', ['get', '@sd'], maxScale] };
            var properties = _this.getGeoCSSPropertiesFromSymbolizers(rule.symbolizers);
            var propertiesKeys = properties.reduce(function (acc, props) { return __spreadArrays(acc, Object.keys(props)); }, []);
            return properties.map(function (props) { return (__assign(__assign(__assign(__assign({ selector: hasScales && selector === '*'
                    ? ['any', ['all']]
                    : selector }, titleParam), minScaleParam), maxScaleParam), { 
                // flatten rules using group property to display all symbolizers
                properties: propertiesKeys.reduce(function (acc, key) {
                    var _a;
                    return (__assign(__assign({}, acc), (_a = {}, _a[key] = !_isNil(props[key])
                        ? props[key]
                        : key[0] === ':'
                            ? _this.getFisrtValidPesudoselector(key, properties) // take the first array property or empty
                            : undefined // empty property
                    , _a)));
                }, {}), group: group })); });
        }));
    };
    GeoCSSStyleParser.prototype.readFilterExpression = function (filter) {
        var _this = this;
        var combinationMap = {
            '||': 'any',
            '&&': 'all'
        };
        var comparisonMap = {
            '==': '==',
            '>': '>',
            '>=': '>=',
            '<': '<',
            '<=': '<=',
            '!=': '!=',
            '*=': 'like'
        };
        if (!filter) {
            return undefined;
        }
        var operator = filter[0], operands = filter.slice(1);
        switch (operator) {
            case '||':
            case '&&':
                var combinationOperator = combinationMap[operator];
                return __spreadArrays([combinationOperator], operands.map(function (arg) { return _this.readFilterExpression(arg); }));
            case '>':
            case '<':
            case '>=':
            case '<=':
            case '!=':
            case '==':
            case '*=':
                if (operator === '==' && operands[1] === null) {
                    return ['isnull', ['get', operands[0]]];
                }
                var comparisonOperator = comparisonMap[operator];
                return [comparisonOperator, ['get', operands[0]], operands[1]];
            default:
                return undefined;
        }
    };
    GeoCSSStyleParser.prototype.getSelectorsFromFilter = function (filter) {
        if (!filter) {
            return '*';
        }
        return this.readFilterExpression(filter);
    };
    GeoCSSStyleParser.prototype.getGeoCSSPropertiesFromSymbolizers = function (symbolizers) {
        var _this = this;
        return symbolizers.map(function (symbolizer) {
            switch (symbolizer.kind) {
                case 'Mark':
                    return _this.getGeoCSSPropertiesFromMarkSymbolizer(symbolizer);
                case 'Icon':
                    return _this.getGeoCSSPropertiesFromIconSymbolizer(symbolizer);
                case 'Text':
                    return _this.getGeoCSSPropertiesFromTextSymbolizer(symbolizer);
                case 'Line':
                    return _this.getGeoCSSPropertiesFromLineSymbolizer(symbolizer);
                case 'Fill':
                    return _this.getGeoCSSPropertiesFromFillSymbolizer(symbolizer);
                case 'Raster':
                    return _this.getGeoCSSPropertiesFromRasterSymbolizer(symbolizer);
                default:
                    return null;
            }
        }).filter(function (value) { return value; });
    };
    GeoCSSStyleParser.prototype.getGeoCSSPropertiesFromMarkSymbolizer = function (markSymbolizer, prefix) {
        var _a, _b, _c, _d;
        if (prefix === void 0) { prefix = 'mark'; }
        var mark = markSymbolizer.wellKnownName && ['symbol', markSymbolizer.wellKnownName.toLowerCase()];
        var markOpacity = markSymbolizer.opacity;
        var markSize = markSymbolizer.radius !== undefined && markSymbolizer.radius * 2;
        var markRotation = markSymbolizer.rotate;
        var fill = markSymbolizer.color && ['hex', markSymbolizer.color];
        var fillOpacity = markSymbolizer.fillOpacity;
        var stroke = markSymbolizer.strokeColor && ['hex', markSymbolizer.strokeColor];
        var strokeWidth = markSymbolizer.strokeWidth;
        var strokeOpacity = markSymbolizer.strokeOpacity;
        var hasPseudoSelector = fill || stroke;
        var markParam = mark && (_a = {}, _a[prefix] = mark, _a);
        var markOpacityParam = prefix === 'mark' && !_isNil(markOpacity) && { 'mark-opacity': markOpacity };
        var markSizeParam = !hasPseudoSelector && markSize !== false
            && !_isNil(markSize) && (_b = {}, _b[prefix + '-size'] = markSize, _b);
        var markRotationParam = !hasPseudoSelector && !_isNil(markRotation) && (_c = {}, _c[prefix + '-rotation'] = markRotation, _c);
        var fillParam = fill && { fill: fill };
        var fillOpacityParam = fillOpacity && { 'fill-opacity': fillOpacity };
        var strokeParam = stroke && { stroke: stroke };
        var strokeWidthParam = strokeWidth && { 'stroke-width': strokeWidth };
        var strokeOpacityParam = strokeOpacity && { 'stroke-opacity': strokeOpacity };
        var sizeParam = markSize !== false && !_isNil(markSize) && { size: markSize };
        var rotationParam = !_isNil(markRotation) && { rotation: markRotation };
        var colonMarkParam = hasPseudoSelector && (_d = {},
            _d[':' + prefix] = __assign(__assign(__assign(__assign(__assign(__assign(__assign({}, fillParam), fillOpacityParam), strokeParam), strokeWidthParam), strokeOpacityParam), sizeParam), rotationParam),
            _d);
        return __assign(__assign(__assign(__assign(__assign({}, markParam), markOpacityParam), markSizeParam), markRotationParam), colonMarkParam);
    };
    GeoCSSStyleParser.prototype.getGeoCSSPropertiesFromIconSymbolizer = function (iconSymbolizer, prefix) {
        var _a, _b, _c, _d;
        if (prefix === void 0) { prefix = 'mark'; }
        var mark = iconSymbolizer.image && ['url', iconSymbolizer.image];
        var markOpacity = iconSymbolizer.opacity;
        var markSize = iconSymbolizer.size;
        var markRotation = iconSymbolizer.rotate;
        var markParam = mark && (_a = {}, _a[prefix] = mark, _a);
        var markOpacityParam = prefix === 'mark' && !_isNil(markOpacity) && (_b = {}, _b[prefix + '-opacity'] = markOpacity, _b);
        var markSizeParam = !_isNil(markSize) && (_c = {}, _c[prefix + '-size'] = markSize, _c);
        var markRotationParam = !_isNil(markRotation) && (_d = {}, _d[prefix + '-rotation'] = markRotation, _d);
        return __assign(__assign(__assign(__assign({}, markParam), markOpacityParam), markSizeParam), markRotationParam);
    };
    GeoCSSStyleParser.prototype.getGeoCSSLabelPropertyFromTextSymbolizer = function (template) {
        if (!template) {
            return undefined;
        }
        var parts = template.split(/(\{\{)|(\}\})/g).filter(function (val) { return val; });
        return parts.map(function (part, idx) {
            if (part === '{{' || part === '}}') {
                return null;
            }
            if (parts[idx - 1] === '{{' && parts[idx + 1] === '}}') {
                return ['brace', ['get', part]];
            }
            return part;
        }).filter(function (val) { return val !== null; });
    };
    GeoCSSStyleParser.prototype.getGeoCSSPropertiesFromTextSymbolizer = function (textSymbolizer) {
        var label = this.getGeoCSSLabelPropertyFromTextSymbolizer(textSymbolizer.label);
        var fontFamily = textSymbolizer.font;
        var fontFill = textSymbolizer.color && ['hex', textSymbolizer.color];
        var fontSize = textSymbolizer.size;
        var fontStyle = textSymbolizer.fontStyle;
        var fontWeight = textSymbolizer.fontWeight;
        var labelOffset = textSymbolizer.offset && __spreadArrays(['array'], textSymbolizer.offset);
        var labelRotation = textSymbolizer.rotate;
        var haloRadius = textSymbolizer.haloWidth;
        var haloColor = textSymbolizer.haloColor && ['hex', textSymbolizer.haloColor];
        var labelParam = label && { label: __spreadArrays(['text'], label) };
        var fontFamilyParam = fontFamily && { 'font-family': __spreadArrays(['array'], fontFamily) };
        var fontFillParam = fontFill && { 'font-fill': fontFill };
        var fontSizeParam = !_isNil(fontSize) && { 'font-size': fontSize };
        var fontStyleParam = fontStyle && { 'font-style': ['get', fontStyle] };
        var fontWeightParam = fontWeight && { 'font-weight': ['get', fontWeight] };
        var labelOffsetParam = labelOffset && { 'label-offset': labelOffset };
        var labelRotationParam = !_isNil(labelRotation) && { 'label-rotation': labelRotation };
        var haloRadiusParam = !_isNil(haloRadius) && { 'halo-radius': haloRadius };
        var haloColorParam = haloColor && { 'halo-color': haloColor };
        return __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, labelParam), labelOffsetParam), labelRotationParam), fontFamilyParam), fontFillParam), fontSizeParam), fontStyleParam), fontWeightParam), haloRadiusParam), haloColorParam);
    };
    GeoCSSStyleParser.prototype.getGeoCSSPropertiesFromLineSymbolizer = function (lineSymbolizer) {
        var stroke = lineSymbolizer.color && ['hex', lineSymbolizer.color];
        var strokeWidth = lineSymbolizer.width;
        var strokeOpacity = lineSymbolizer.opacity;
        var strokeLinejoin = lineSymbolizer.join;
        var strokeLinecap = lineSymbolizer.cap;
        var strokeDasharray = lineSymbolizer.dasharray && __spreadArrays(['array'], lineSymbolizer.dasharray);
        var strokeDashOffset = lineSymbolizer.dashOffset;
        var graphicStrokeParam = lineSymbolizer.graphicStroke
            ? lineSymbolizer.graphicStroke.kind === 'Mark'
                ? this.getGeoCSSPropertiesFromMarkSymbolizer(lineSymbolizer.graphicStroke, 'stroke')
                : lineSymbolizer.graphicStroke.kind === 'Icon'
                    ? this.getGeoCSSPropertiesFromIconSymbolizer(lineSymbolizer.graphicStroke, 'stroke')
                    : undefined
            : undefined;
        var strokeParam = !graphicStrokeParam && stroke && { stroke: stroke };
        var strokeWidthParam = !_isNil(strokeWidth) && { 'stroke-width': strokeWidth };
        var strokeOpacityParam = !_isNil(strokeOpacity) && { 'stroke-opacity': strokeOpacity };
        var strokeLinejoinParam = strokeLinejoin && { 'stroke-linejoin': strokeLinejoin };
        var strokeLinecapParam = strokeLinecap && { 'stroke-linecap': strokeLinecap };
        var strokeDasharrayParam = strokeDasharray && { 'stroke-dasharray': strokeDasharray };
        var strokeDashOffsetParam = strokeDashOffset && { 'stroke-dashoffset': strokeDashOffset };
        return __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, strokeParam), strokeWidthParam), strokeOpacityParam), strokeLinejoinParam), strokeLinecapParam), strokeDasharrayParam), strokeDashOffsetParam), graphicStrokeParam);
    };
    GeoCSSStyleParser.prototype.getGeoCSSPropertiesFromFillSymbolizer = function (fillSymbolizer) {
        var fill = fillSymbolizer.color && ['hex', fillSymbolizer.color];
        var fillOpacity = fillSymbolizer.fillOpacity;
        var stroke = fillSymbolizer.outlineColor && ['hex', fillSymbolizer.outlineColor];
        var strokeWidth = fillSymbolizer.outlineWidth;
        var strokeOpacity = fillSymbolizer.outlineOpacity;
        var strokeDasharray = fillSymbolizer.outlineDasharray && __spreadArrays(['array'], fillSymbolizer.outlineDasharray);
        var graphicFillParam = fillSymbolizer.graphicFill
            ? fillSymbolizer.graphicFill.kind === 'Mark'
                ? this.getGeoCSSPropertiesFromMarkSymbolizer(fillSymbolizer.graphicFill, 'fill')
                : fillSymbolizer.graphicFill.kind === 'Icon'
                    ? this.getGeoCSSPropertiesFromIconSymbolizer(fillSymbolizer.graphicFill, 'fill')
                    : undefined
            : undefined;
        var fillParam = !graphicFillParam && fill && { fill: fill };
        var fillOpacityParam = !_isNil(fillOpacity) && { 'fill-opacity': fillOpacity };
        var strokeParam = stroke && { 'stroke': stroke };
        var strokeWidthParam = !_isNil(strokeWidth) && { 'stroke-width': strokeWidth };
        var strokeOpacityParam = !_isNil(strokeOpacity) && { 'stroke-opacity': strokeOpacity };
        var strokeDasharrayParam = strokeDasharray && { 'stroke-dasharray': strokeDasharray };
        return __assign(__assign(__assign(__assign(__assign(__assign(__assign({}, fillParam), fillOpacityParam), strokeParam), strokeWidthParam), strokeOpacityParam), strokeDasharrayParam), graphicFillParam);
    };
    GeoCSSStyleParser.prototype.getGeoCSSColorMapFromColorMap = function (colorMap) {
        if (!colorMap) {
            return undefined;
        }
        var rasterColorMap = colorMap.colorMapEntries && colorMap.colorMapEntries.length > 0
            && colorMap.colorMapEntries
                .map(function (_a) {
                var color = _a.color, quantity = _a.quantity, opacity = _a.opacity, label = _a.label;
                return ['color-map-entry', ['hex', color], quantity, opacity, label].filter(function (value) { return !_isNil(value); });
            })
                .filter(function (value) { return value.length > 1; });
        var rasterColorMapTypeParam = colorMap.type && { 'raster-color-map-type': ['get', colorMap.type] };
        var rasterColorMapParam = rasterColorMap && rasterColorMap.length > 0
            && { 'raster-color-map': __spreadArrays(['array'], rasterColorMap) };
        return __assign(__assign({}, rasterColorMapTypeParam), rasterColorMapParam);
    };
    GeoCSSStyleParser.prototype.getGeoCSSChannelSelectionFromChannelSelection = function (channelSelection) {
        var redChannelKey = 'redChannel';
        var greenChannelKey = 'greenChannel';
        var blueChannelKey = 'blueChannel';
        var redChannel = channelSelection && channelSelection[redChannelKey];
        var greenChannel = channelSelection && channelSelection[greenChannelKey];
        var blueChannel = channelSelection && channelSelection[blueChannelKey];
        if (redChannel && greenChannel && blueChannel) {
            var red = redChannel.sourceChannelName;
            var green = greenChannel.sourceChannelName;
            var blue = blueChannel.sourceChannelName;
            var _a = redChannel.contrastEnhancement, redEnhancementType = _a.enhancementType, redGammaValue = _a.gammaValue;
            var _b = greenChannel.contrastEnhancement, greenEnhancementType = _b.enhancementType, greenGammaValue = _b.gammaValue;
            var _c = blueChannel.contrastEnhancement, blueEnhancementType = _c.enhancementType, blueGammaValue = _c.gammaValue;
            var rasterContrastEnhancementParam = (redEnhancementType && greenEnhancementType && blueEnhancementType)
                && { 'raster-contrast-enhancement': ['array',
                        ['get', redEnhancementType],
                        ['get', greenEnhancementType],
                        ['get', blueEnhancementType]] };
            var rasterGammaParam = (!_isNil(redGammaValue) && !_isNil(greenGammaValue) && !_isNil(blueGammaValue))
                && { 'raster-gamma': ['array', redGammaValue, greenGammaValue, blueGammaValue] };
            return __assign(__assign({ 'raster-channels': ['array', parseFloat(red), parseFloat(green), parseFloat(blue)] }, rasterContrastEnhancementParam), rasterGammaParam);
        }
        var grayChannelKey = 'grayChannel';
        var grayChannel = channelSelection && channelSelection[grayChannelKey];
        if (grayChannel) {
            var gray = grayChannel.sourceChannelName;
            var _d = grayChannel.contrastEnhancement, grayEnhancementType = _d.enhancementType, grayGammaValue = _d.gammaValue;
            var rasterContrastEnhancementParam = grayEnhancementType
                && { 'raster-contrast-enhancement': ['get', grayEnhancementType] };
            var rasterGammaParam = !_isNil(grayGammaValue)
                && { 'raster-gamma': grayGammaValue };
            return __assign(__assign({ 'raster-channels': parseFloat(gray) }, rasterContrastEnhancementParam), rasterGammaParam);
        }
        return {
            'raster-channels': ['get', 'auto']
        };
    };
    GeoCSSStyleParser.prototype.getGeoCSSPropertiesFromRasterSymbolizer = function (rasterSymbolizer) {
        var rasterOpacityParam = !_isNil(rasterSymbolizer.opacity) && { 'raster-opacity': rasterSymbolizer.opacity };
        var rasterColorMapParams = this.getGeoCSSColorMapFromColorMap(rasterSymbolizer.colorMap);
        var rasterChannelsParams = this.getGeoCSSChannelSelectionFromChannelSelection(rasterSymbolizer.channelSelection);
        var _a = rasterSymbolizer && rasterSymbolizer.contrastEnhancement || {}, enhancementType = _a.enhancementType, gammaValue = _a.gammaValue;
        var isAuto = rasterChannelsParams['raster-channels'] && rasterChannelsParams['raster-channels'][1] === 'auto';
        var rasterContrastEnhancementParam = isAuto && enhancementType
            && { 'raster-contrast-enhancement': ['get', enhancementType] };
        var rasterGammaParam = isAuto && !_isNil(gammaValue)
            && { 'raster-gamma': gammaValue };
        return __assign(__assign(__assign(__assign(__assign({}, rasterChannelsParams), rasterContrastEnhancementParam), rasterGammaParam), rasterOpacityParam), rasterColorMapParams);
    };
    /**
     * The name of the GeoCSS Style Parser.
     */
    GeoCSSStyleParser.title = 'GeoCSS Style Parser';
    GeoCSSStyleParser.combinationMap = {
        'all': '&&',
        'any': '||'
    };
    GeoCSSStyleParser.comparisonMap = {
        '==': '==',
        '>': '>',
        '>=': '>=',
        '<': '<',
        '<=': '<=',
        '!=': '!=',
        'like': '*=',
        'ilike': '*='
    };
    return GeoCSSStyleParser;
}());
exports.GeoCSSStyleParser = GeoCSSStyleParser;
exports.default = GeoCSSStyleParser;
//# sourceMappingURL=GeoCSSStyleParser.js.map