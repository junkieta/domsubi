import { jshtmlVisitor } from "./jshtmlVisitor";
import { jsxml } from "./jsxml";

type jshtmlInit = {
    super: { new(...args:unknown[]): HTMLElement }
    shadow: ShadowRootInit
}

export class jshtml extends jsxml {
    
    protected static visitorConstructor = jshtmlVisitor;

    defineAs(tag: string, init: Partial<jshtmlInit> = {}) {
        const super_ = init.super || HTMLElement;
        const shadow_init = init.shadow || { mode: 'closed' };
        const mount = (e: HTMLElement) => this.mountAsContents(e.attachShadow(shadow_init));
        
        const elm_class = class extends super_ {
            static tag = tag
            constructor(...args: unknown[]) {
                super(...args);
                mount(this);
            }
        }
        customElements.define(tag, elm_class)
        return elm_class;
    }

}

