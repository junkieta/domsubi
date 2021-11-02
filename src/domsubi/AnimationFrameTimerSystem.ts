import { TimerSystem, TimerSystemImpl } from "sodiumjs";

/**
 * MilisecondTimerSystemImplを参考に、requestAnimationFrame() を組み込むために作成
 */
class AnimationFrameTimerImpl extends TimerSystemImpl {

    now = Date.now.bind(Date)

    setTimer(t : number, callback : () => void) : () => void {
        return this.now() < t
            ? clearTimeout.bind(null, setTimeout(callback, t))
            : cancelAnimationFrame.bind(null, requestAnimationFrame(callback))
    }

}

export class AnimationFrameTimerSystem extends TimerSystem {

    constructor() {
        super(new AnimationFrameTimerImpl());
    }

}
