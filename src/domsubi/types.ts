import { Cell,Stream, StreamSink } from "sodiumjs";
import { jsxml } from "./jsxml";

export declare abstract class DOMContext {
    abstract contains(o: DOMContext): boolean;
    abstract render(value: DOMSource, old_value: DOMSource): void;
}

export type EventStreamMap = {
    abort: StreamSink<UIEvent>
    animationcancel: StreamSink<AnimationEvent>
    animationend: StreamSink<AnimationEvent>
    animationiteration: StreamSink<AnimationEvent>
    animationstart: StreamSink<AnimationEvent>
    auxclick: StreamSink<MouseEvent>
    blur: StreamSink<FocusEvent>
    cancel: StreamSink<Event>
    canplay: StreamSink<Event>
    canplaythrough: StreamSink<Event>
    change: StreamSink<Event>
    click: StreamSink<MouseEvent>
    close: StreamSink<Event>
    contextmenu: StreamSink<MouseEvent>
    cuechange: StreamSink<Event>
    dblclick: StreamSink<MouseEvent>
    drag: StreamSink<DragEvent>
    dragend: StreamSink<DragEvent>
    dragenter: StreamSink<DragEvent>
    dragexit: StreamSink<Event>
    dragleave: StreamSink<DragEvent>
    dragover: StreamSink<DragEvent>
    dragstart: StreamSink<DragEvent>
    drop: StreamSink<DragEvent>
    durationchange: StreamSink<Event>
    emptied: StreamSink<Event>
    ended: StreamSink<Event>
    error: StreamSink<ErrorEvent>
    focus: StreamSink<FocusEvent>
    focusin: StreamSink<FocusEvent>
    focusout: StreamSink<FocusEvent>
    gotpointercapture: StreamSink<PointerEvent>
    input: StreamSink<Event>
    invalid: StreamSink<Event>
    keydown: StreamSink<KeyboardEvent>
    keypress: StreamSink<KeyboardEvent>
    keyup: StreamSink<KeyboardEvent>
    load: StreamSink<Event>
    loadeddata: StreamSink<Event>
    loadedmetadata: StreamSink<Event>
    loadstart: StreamSink<Event>
    lostpointercapture: StreamSink<PointerEvent>
    mousedown: StreamSink<MouseEvent>
    mouseenter: StreamSink<MouseEvent>
    mouseleave: StreamSink<MouseEvent>
    mousemove: StreamSink<MouseEvent>
    mouseout: StreamSink<MouseEvent>
    mouseover: StreamSink<MouseEvent>
    mouseup: StreamSink<MouseEvent>
    pause: StreamSink<Event>
    play: StreamSink<Event>
    playing: StreamSink<Event>
    pointercancel: StreamSink<PointerEvent>
    pointerdown: StreamSink<PointerEvent>
    pointerenter: StreamSink<PointerEvent>
    pointerleave: StreamSink<PointerEvent>
    pointermove: StreamSink<PointerEvent>
    pointerout: StreamSink<PointerEvent>
    pointerover: StreamSink<PointerEvent>
    pointerup: StreamSink<PointerEvent>
    progress: StreamSink<ProgressEvent>
    ratechange: StreamSink<Event>
    reset: StreamSink<Event>
    resize: StreamSink<UIEvent>
    scroll: StreamSink<Event>
    securitypolicyviolation: StreamSink<SecurityPolicyViolationEvent>
    seeked: StreamSink<Event>
    seeking: StreamSink<Event>
    select: StreamSink<Event>
    selectionchange: StreamSink<Event>
    selectstart: StreamSink<Event>
    stalled: StreamSink<Event>
    // lib.dom.d.tsに存在しないため追加
    slotchange: StreamSink<Event>
    submit: StreamSink<Event>
    suspend: StreamSink<Event>
    timeupdate: StreamSink<Event>
    toggle: StreamSink<Event>
    touchcancel: StreamSink<TouchEvent>
    touchend: StreamSink<TouchEvent>
    touchmove: StreamSink<TouchEvent>
    touchstart: StreamSink<TouchEvent>
    transitioncancel: StreamSink<TransitionEvent>
    transitionend: StreamSink<TransitionEvent>
    transitionrun: StreamSink<TransitionEvent>
    transitionstart: StreamSink<TransitionEvent>
    volumechange: StreamSink<Event>
    waiting: StreamSink<Event>
    wheel: StreamSink<WheelEvent>
} & { [key:string]: StreamSink<Event> };
    

export type DOMEventHandlerExpr<E extends Event> =
    { handleEvent(e: E): any } | ((e: E) => any) | string | null;

export type DOMEventHandler = Partial<{
    onabort: DOMEventHandlerExpr<UIEvent>;
    onanimationcancel: DOMEventHandlerExpr<AnimationEvent>;
    onanimationend: DOMEventHandlerExpr<AnimationEvent>;
    onanimationiteration: DOMEventHandlerExpr<AnimationEvent>;
    onanimationstart: DOMEventHandlerExpr<AnimationEvent>;
    onauxclick: DOMEventHandlerExpr<MouseEvent>;
    onblur: DOMEventHandlerExpr<FocusEvent>;
    oncancel: DOMEventHandlerExpr<Event>;
    oncanplay: DOMEventHandlerExpr<Event>;
    oncanplaythrough: DOMEventHandlerExpr<Event>;
    onchange: DOMEventHandlerExpr<Event>;
    onclick: DOMEventHandlerExpr<MouseEvent>;
    onclose: DOMEventHandlerExpr<Event>;
    oncontextmenu: DOMEventHandlerExpr<MouseEvent>;
    oncuechange: DOMEventHandlerExpr<Event>;
    ondblclick: DOMEventHandlerExpr<MouseEvent>;
    ondrag: DOMEventHandlerExpr<DragEvent>;
    ondragend: DOMEventHandlerExpr<DragEvent>;
    ondragenter: DOMEventHandlerExpr<DragEvent>;
    ondragexit: DOMEventHandlerExpr<Event>;
    ondragleave: DOMEventHandlerExpr<DragEvent>;
    ondragover: DOMEventHandlerExpr<DragEvent>;
    ondragstart: DOMEventHandlerExpr<DragEvent>;
    ondrop: DOMEventHandlerExpr<DragEvent>;
    ondurationchange: DOMEventHandlerExpr<Event>;
    onemptied: DOMEventHandlerExpr<Event>;
    onended: DOMEventHandlerExpr<Event>;
    onerror: DOMEventHandlerExpr<ErrorEvent>;
    onfocus: DOMEventHandlerExpr<FocusEvent>;
    onfocusin: DOMEventHandlerExpr<FocusEvent>;
    onfocusout: DOMEventHandlerExpr<FocusEvent>;
    //    onformdata: DOMEventHandlerExpr<FormDataEvent>;
    onformdata: DOMEventHandlerExpr<Event & { formdata: FormData; }>;
    ongotpointercapture: DOMEventHandlerExpr<PointerEvent>;
    oninput: DOMEventHandlerExpr<Event>;
    oninvalid: DOMEventHandlerExpr<Event>;
    onkeydown: DOMEventHandlerExpr<KeyboardEvent>;
    onkeypress: DOMEventHandlerExpr<KeyboardEvent>;
    onkeyup: DOMEventHandlerExpr<KeyboardEvent>;
    onload: DOMEventHandlerExpr<Event>;
    onloadeddata: DOMEventHandlerExpr<Event>;
    onloadedmetadata: DOMEventHandlerExpr<Event>;
    onloadstart: DOMEventHandlerExpr<Event>;
    onlostpointercapture: DOMEventHandlerExpr<PointerEvent>;
    onmousedown: DOMEventHandlerExpr<MouseEvent>;
    onmouseenter: DOMEventHandlerExpr<MouseEvent>;
    onmouseleave: DOMEventHandlerExpr<MouseEvent>;
    onmousemove: DOMEventHandlerExpr<MouseEvent>;
    onmouseout: DOMEventHandlerExpr<MouseEvent>;
    onmouseover: DOMEventHandlerExpr<MouseEvent>;
    onmouseup: DOMEventHandlerExpr<MouseEvent>;
    onpause: DOMEventHandlerExpr<Event>;
    onplay: DOMEventHandlerExpr<Event>;
    onplaying: DOMEventHandlerExpr<Event>;
    onpointercancel: DOMEventHandlerExpr<PointerEvent>;
    onpointerdown: DOMEventHandlerExpr<PointerEvent>;
    onpointerenter: DOMEventHandlerExpr<PointerEvent>;
    onpointerleave: DOMEventHandlerExpr<PointerEvent>;
    onpointermove: DOMEventHandlerExpr<PointerEvent>;
    onpointerout: DOMEventHandlerExpr<PointerEvent>;
    onpointerover: DOMEventHandlerExpr<PointerEvent>;
    onpointerup: DOMEventHandlerExpr<PointerEvent>;
    onprogress: DOMEventHandlerExpr<ProgressEvent>;
    onratechange: DOMEventHandlerExpr<Event>;
    onreset: DOMEventHandlerExpr<Event>;
    onresize: DOMEventHandlerExpr<UIEvent>;
    onscroll: DOMEventHandlerExpr<Event>;
    onsecuritypolicyviolation: DOMEventHandlerExpr<SecurityPolicyViolationEvent>;
    onseeked: DOMEventHandlerExpr<Event>;
    onseeking: DOMEventHandlerExpr<Event>;
    onselect: DOMEventHandlerExpr<Event>;
    onselectionchange: DOMEventHandlerExpr<Event>;
    onselectstart: DOMEventHandlerExpr<Event>;
    // lib.dom.d.tsに存在しないため追加
    onslotchange: DOMEventHandlerExpr<Event>;
    onstalled: DOMEventHandlerExpr<Event>;
    onsubmit: DOMEventHandlerExpr<Event>;
    onsuspend: DOMEventHandlerExpr<Event>;
    ontimeupdate: DOMEventHandlerExpr<Event>;
    ontoggle: DOMEventHandlerExpr<Event>;
    ontouchcancel: DOMEventHandlerExpr<TouchEvent>;
    ontouchend: DOMEventHandlerExpr<TouchEvent>;
    ontouchmove: DOMEventHandlerExpr<TouchEvent>;
    ontouchstart: DOMEventHandlerExpr<TouchEvent>;
    ontransitioncancel: DOMEventHandlerExpr<TransitionEvent>;
    ontransitionend: DOMEventHandlerExpr<TransitionEvent>;
    ontransitionrun: DOMEventHandlerExpr<TransitionEvent>;
    ontransitionstart: DOMEventHandlerExpr<TransitionEvent>;
    onvolumechange: DOMEventHandlerExpr<Event>;
    onwaiting: DOMEventHandlerExpr<Event>;
    onwheel: DOMEventHandlerExpr<WheelEvent>;
}>;

export interface WebComponentConstructor extends CustomElementConstructor {
    tag: string;
    shadowOpen: boolean;
    prefix?: string;
    observedAttributes?: string[];
    observedMutation?: MutationObserverInit;
}

export interface WebComponentClass {
    attributeChangedCallback?(name: string, oldValue: string, newValue: string): void;
    connectedCallback?(): void;
    disconnectedCallback?(): void;
    adoptedCallback?(olddoc: Document, newdoc: Document): void;
}

export type HTMLAttrName =
    "abbr" | "accept" | "accept-charset" | "accesskey" | "action" | "allow" | "allowfullscreen" | "allowpaymentrequest" | "alt" | "as" | "async" | "autocapitalize" | "autocomplete" | "autofocus" | "autoplay" | "charset" | "checked" | "cite" | "class" | "color" | "cols" | "colspan" | "content" | "contenteditable" | "controls" | "coords" | "crossorigin" | "data" | "datetime" | "decoding" | "default" | "defer" | "dir" | "dir" | "dirname" | "disabled" | "download" | "draggable" | "enctype" | "enterkeyhint" | "for" | "form" | "formaction" | "formenctype" | "formmethod" | "formnovalidate" | "formtarget" | "headers" | "height" | "hidden" | "high" | "href" | "hreflang" | "http-equiv" | "id" | "imagesizes" | "imagesrcset" | "inputmode" | "integrity" | "is" | "ismap" | "itemid" | "itemprop" | "itemref" | "itemscope" | "itemtype" | "kind" | "label" | "lang" | "list" | "loop" | "low" | "manifest" | "max" | "maxlength" | "media" | "method" | "min" | "minlength" | "multiple" | "muted" | "name" | "nomodule" | "nonce" | "novalidate" | "open" | "optimum" | "pattern" | "ping" | "placeholder" | "playsinline" | "poster" | "preload" | "readonly" | "referrerpolicy" | "rel" | "required" | "reversed" | "rows" | "rowspan" | "sandbox" | "scope" | "selected" | "shape" | "size" | "sizes" | "slot" | "span" | "spellcheck" | "src" | "srcdoc" | "srclang" | "srcset" | "start" | "step" | "style" | "tabindex" | "target" | "title" | "translate" | "type" | "usemap" | "value";

export type CSSPropertyName =
    { [P in keyof CSSStyleDeclaration]: CSSStyleDeclaration[P] extends string ? P : never }[keyof CSSStyleDeclaration];

export type ElementSource = {
    $?: AttributesSource;
} & {
        [P in keyof HTMLElementTagNameMap]?: NodeSource;
    } | {
        [key: string]: NodeSource | AttributesSource | Cell<AttributesSource>;
    };

export type DOMStringSource = string | number | boolean | null | undefined | { toString(): string };

export type TextNodeSource = DOMStringSource;

export type DocumentFragmentSource =
    NodeSource[];

export type NodeSource =
    Node | TextNodeSource | DocumentFragmentSource | ElementSource | Stream<NodeSource> | Cell<NodeSource>;

export type AttrValue =
    DOMStringSource | string[] | DOMEventHandler[keyof DOMEventHandler] | StyleSource | DatasetSource | Promise<AttrValue> | Cell<AttrValue>;

export type StyleSource = {
    [P in CSSPropertyName]: Cell<DOMStringSource> | DOMStringSource;
};

export type DatasetSource = {
    [key: string]: Cell<DOMStringSource> | DOMStringSource;
};

export type AttributesSource =
    ({ [P in HTMLAttrName]?: AttrValue; } & DOMEventHandler & { [key: string]: AttrValue | DOMEventHandler[keyof DOMEventHandler] })
    | Stream<AttributesSource>
    | Cell<AttributesSource>;

export type AttrSource =
    AttributesSource | StyleSource | DatasetSource;

export type PointReference = [Node] | [Node, Node];

export type FRPV<V> = Promise<V> | Cell<V> | Stream<V>;


export type DOMSource =
    NodeSource | AttrSource | AttrValue | StyleSource | DatasetSource;

export type CustomCSSVariables = {
    [key:string]: string | Cell<string>
};

    