import type { Action } from "./actions";
export type HTMLContent = {
    text: string;
    icon?: string;
    toolTip?: string;
    images?: string[];
    url?: string;
};

export type TemplateName = 'hover' | 'content' | 'panel' | 'modal';

export type HtmlElement = {
    id: string;
    visible: boolean;
    class: string;
    style: React.CSSProperties;
    content?: HTMLContent;
    tagName?: string;
    children?: HtmlElement[];
    actions?: Action[];
    clickActionIds?: string[];
    hoverActionIds?: string[];
};

export type TemplatesDictionary = {
    [key in TemplateName]: HtmlElement;
};

export interface TemplateData {
    wrapper: HtmlElement;
    userData?: any;
    [key: string]: any;
}

export interface UiElement {
    id: string;
    content: HtmlElement;
    title?: string;
    visible?: boolean;
}

export type Focused = {
    panel: string | null;
    tab: string | null;
    element: string | null;
};


export {};
