import { Filter, StyleParser, Style, Rule, ScaleDenominator, PointSymbolizer, Symbolizer, IconSymbolizer, LineSymbolizer, FillSymbolizer, TextSymbolizer, RasterSymbolizer, ColorMap, ChannelSelection, MarkSymbolizer, Channel, ContrastEnhancement } from 'geostyler-style';
export declare class GeoCSSStyleParser implements StyleParser {
    /**
     * The name of the GeoCSS Style Parser.
     */
    static title: string;
    title: string;
    private warnings;
    private addWarning;
    getWarnings(): string[];
    static combinationMap: {
        all: string;
        any: string;
    };
    static comparisonMap: {
        '==': string;
        '>': string;
        '>=': string;
        '<': string;
        '<=': string;
        '!=': string;
        like: string;
        ilike: string;
    };
    private readExpression;
    private readSelectorsExpression;
    getFilterFromSelectors(selectors: any): Filter | undefined;
    getScaleDenominatorFromSelectors(scales: any): ScaleDenominator | undefined;
    getMarkSymbolizerFromGeoCSSRule(properties: any): MarkSymbolizer;
    getIconSymbolizerFromGeoCSSRule(properties: any): IconSymbolizer;
    getPointSymbolizerFromGeoCSSRule(properties: any): PointSymbolizer;
    getLineSymbolizerFromGeoCSSRule(properties: any): LineSymbolizer;
    getFillSymbolizerFromGeoCSSRule(properties: any): FillSymbolizer;
    getTextSymbolizerLabelFromGeoCSSProperty(label: any): string | undefined;
    getTextSymbolizerFromGeoCSSRule(properties: any): TextSymbolizer;
    getColorMapFromGeoCSSProperty(properties: any): ColorMap | undefined;
    getContrastEnhancementFromGeoCSSPropertyContrastEnhancement(properties: any, index?: number): ContrastEnhancement | undefined;
    getChannelFromGeoCSSChannel(sourceChannelName: any, properties: any, index?: number): Channel;
    getChannelSelectionFromGeoCSSPropertyChannelSelection(properties: any): ChannelSelection | undefined;
    getRasterSymbolizerFromGeoCSSRule(properties: any): RasterSymbolizer;
    getSymbolizerTypesFromProperties(properties: any): String[];
    getSymbolizersFromRules(geoCSSProperties: any): Symbolizer[];
    getRulesFromGeoCSSSelectors(geoCSSRules: any): Rule[];
    geoCSSObjectToGeoStylerStyle(geoCSSObject: any): Style;
    readStyle(geoCSSStyle: string): Promise<Style>;
    writeStyle(geoStylerStyle: Style): Promise<string>;
    geoStylerStyleToGeoCSSObject(geoStylerStyle: Style): any;
    private getFisrtValidPesudoselector;
    getGeoCSSRulesFromRules(rules: Rule[]): any;
    private readFilterExpression;
    getSelectorsFromFilter(filter: Filter | undefined): any;
    getGeoCSSPropertiesFromSymbolizers(symbolizers: Symbolizer[]): any;
    getGeoCSSPropertiesFromMarkSymbolizer(markSymbolizer: MarkSymbolizer, prefix?: string): any;
    getGeoCSSPropertiesFromIconSymbolizer(iconSymbolizer: IconSymbolizer, prefix?: string): any;
    getGeoCSSLabelPropertyFromTextSymbolizer(template: string | undefined): any;
    getGeoCSSPropertiesFromTextSymbolizer(textSymbolizer: TextSymbolizer): any;
    getGeoCSSPropertiesFromLineSymbolizer(lineSymbolizer: LineSymbolizer): any;
    getGeoCSSPropertiesFromFillSymbolizer(fillSymbolizer: FillSymbolizer): any;
    getGeoCSSColorMapFromColorMap(colorMap: ColorMap | undefined): any;
    getGeoCSSChannelSelectionFromChannelSelection(channelSelection: ChannelSelection | undefined): any;
    getGeoCSSPropertiesFromRasterSymbolizer(rasterSymbolizer: RasterSymbolizer): any;
}
export default GeoCSSStyleParser;
