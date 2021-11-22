import { Cell, CellSink, StreamSink } from "sodiumjs";
import { jshtml } from "./jshtml";
import { EventStreamMap, NodeSource } from "./types";

type AttrCells = {
    [key:string]: Cell<string>
}

type CustomCSSVariables = {
    [key:string]: string | Cell<string>
}

interface jshtmlElementConstructor {
    new(): jshtmlElement;
    observedShadowEvents?: string[];
    observedAttributes?: string[];
}

export abstract class jshtmlElement extends HTMLElement {

    static observedShadowEvents : string[];
    static observedAttributes : string[];

    /**
     * ShadowRootのコンテンツとしてmountされるjshtmlソース。
     */
    abstract shadowSource: NodeSource

    /**
     * ShadowRootでlistenするEventのStream。
     */
    shadowEvents: EventStreamMap

    /**
     * AttributesのCell。static observedAttributesで指定した属性のCell。
     */
    attrCells : AttrCells


    /**
     * CSSカスタムプロパティのリスト。ShadowDOMのスタイルで使いたい変数を設定する。変数名であることを示す二重ハイフン(--)は不要。
     */
    cssVars?: CustomCSSVariables

    /**
     * connected / disconnectedに合わせてShadowRootからmount / unmountする。
     */
    private _mount? : Function
    private _unmount : Function = () => void 0;

    constructor() {
        super();

        const {observedShadowEvents,observedAttributes} = this.constructor as jshtmlElementConstructor;
        
        this.shadowEvents = {} as EventStreamMap;
        if(observedShadowEvents)
            observedShadowEvents.forEach((e) => this.shadowEvents[e] = new StreamSink<Event>())

        this.attrCells = {};
        if(observedAttributes)
            observedAttributes.forEach((a) => this.attrCells[a] = new CellSink<string>(''))

    }

    connectedCallback() {
        if(this._mount) return this._mount();

        const shadow = this.attachShadow({ mode: "closed" })

        const {observedShadowEvents} = this.constructor as jshtmlElementConstructor;
        if(observedShadowEvents) {
            const l = (e:Event) => this.shadowEvents[e.type].send(e);
            observedShadowEvents.forEach((e) => shadow.addEventListener(e, l));
        }

        const mounter = new jshtml(this.cssVars
            ? [{ style: expandCustomCSSVariables(this.cssVars) }, this.shadowSource]
            : this.shadowSource);

        this._mount = () => {
            this._unmount();
            this._unmount = mounter.mountAsContents(shadow);
            this.dispatchEvent(new Event('jshtmlmount', { bubbles: true }));
        }

        this._mount();
    }

    disconnectedCallback() {
        this._unmount();
        this.dispatchEvent(new Event('jshtmlunmount', { bubbles: true }));
    }

    attributeChangedCallback(n:string,old:string,v:string) {
        (this.attrCells[n] as CellSink<string>).send(v || '');
    }

}

function expandCustomCSSVariables(vars: CustomCSSVariables) : NodeSource {
   const rules = Object.keys(vars)
       .map((n) => vars[n] instanceof Cell ? [`--${n}:`, vars[n], ';'] : `--${n}: ${vars[n]};`)
   return [':host {', rules ,'}']
    .flat();
}

