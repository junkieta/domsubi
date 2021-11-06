import { jshtmlVisitor } from "./jshtmlVisitor";
import { jsxml } from "./jsxml";

export class jshtml extends jsxml {
    
    protected static visitorConstructor = jshtmlVisitor;

    mountAsShadow(e: HTMLElement, init?: ShadowRootInit) {
        this.mountAsContents(e.shadowRoot || e.attachShadow(init || { mode: "closed" }));
    }

}

