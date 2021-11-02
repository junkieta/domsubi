import {jsxml as _jsxml} from "./domsubi/jsxml";
import {jshtml as _jshtml} from "./domsubi/jshtml";
import {jsxmlVisitor} from "./domsubi/jsxmlVisitor";
import {jshtmlVisitor} from "./domsubi/jshtmlVisitor";
import {AnimationFrameTimerSystem} from "./domsubi/AnimationFrameTimerSystem"
import {AttributesSource,EventStreamMap,NodeSource} from "./domsubi/types";
import {StreamSink,Operational,Cell, Stream, TimerSystem, Transaction, CellLoop} from "sodiumjs";

/**
 * 現在時刻から指定ミリ秒が経過するまで、0~1の範囲をサンプリングするStream
 */
export function duration(sys: TimerSystem, ms:number) : Stream<number> & { end: Stream<number> } {
    const start_t = sys.time.sample();
    const end_t = start_t + ms;
    return Transaction.run(() => {
        const oAlarm = new CellLoop<number>();
        const sAlarm = sys.at(oAlarm);
        oAlarm.loop(sAlarm
            .snapshot(sys.time, (t,now) => now < end_t ? now : t === end_t ? null : end_t)
            .hold(start_t) as Cell<number>);
        const sResult = sAlarm.map((t) => {
            const _t = t - start_t;
            return _t ? Math.min(_t / end_t-start_t, 1) : _t;
        });
        return Object.assign(sResult, { end: Operational.defer(sResult.filter((t) => t === 1)) })
    })
}

/**
 * ターゲットのイベントをStream化する。
 */
export const events = (t: EventTarget) : EventStreamMap => {
    const map = {} as EventStreamMap;
    const send = (e: Event) => map[e.type as keyof EventStreamMap].send(e)
    return new Proxy(map, {
        get: (o,p) => {
            if(typeof p === 'symbol' || o.hasOwnProperty(p)) return Reflect.get(o,p);
            t.addEventListener(p,send);
            return (o[p] = new StreamSink<Event>());
        }
    });
}

/**
 * ターゲットの変異をStream化する。
 */
export const mutations = (n: Node, init?: MutationObserverInit) => {
    const sink = new StreamSink<MutationRecord[]>();
    const observer = new MutationObserver(sink.send.bind(sink));
    observer.observe(n, init);
    return Operational.split(sink);
}

/**
 * ターゲットの属性をCell化する。
 */
export const attributes = (e: Element, filter?: string[]) : { [key:string]: Cell<string> } => {
    const sAttrChanges = mutations(e, { attributes: true, attributeFilter: filter })
    return new Proxy({}, {
        get: (o,p) => {
            if(typeof p === 'string' && !o.hasOwnProperty(p))
                Reflect.set(o,p,
                    sAttrChanges
                        .filter((r) => r.attributeName === p)
                        .map((r) => (r.target as Element).getAttribute(p) || '')
                        .hold(e.hasAttribute(p) ? e.getAttribute(p) || '' : ''))
            return Reflect.get(o,p);
        }
    });
}

/**
 * jshtml記法のノードをElementにラップする
 */
export const wrap = (tag:string, attrs?: AttributesSource) => attrs
    ? (content:NodeSource) => ({ [tag]: content, $: attrs })
    : (content:NodeSource) => ({ [tag]: content });
   

// jsxml, jshtmlは純粋関数としても活用できるようにProxyをかます
const proxy_handler = {
    apply<T extends _jsxml>(target: { new(s:NodeSource): T }, b:unknown, c:NodeSource[]) : T { return new target(c[0]) }
};

export const jsxml  = new Proxy(_jsxml, proxy_handler) as typeof _jsxml & ((s:NodeSource) => _jsxml);
export const jshtml = new Proxy(_jshtml, proxy_handler) as typeof _jshtml & ((s:NodeSource) => _jshtml);

export {jsxmlVisitor,jshtmlVisitor,AnimationFrameTimerSystem};
