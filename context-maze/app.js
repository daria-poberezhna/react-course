'use strict';

class ContextMaze {
    constructor(name) {
        this.name = name;
        // this.log = this.log.bind(this);
        // this.delayedLog = this.delayedLog.bind(this);
    }

    log() {
        console.log(this.name);
    }

    delayedLog() {        
        //1
        const self = this;

        setTimeout(function() {
            console.log('1', self.name);
        }
        ,1000);

        //2
        setTimeout(() => {
            console.log('2', this.name);
        }
        ,1000);

        //3
        setTimeout(function() {
            console.log('3', this.name);
        }.bind(this),1000);
    }

    nested(fn) {
       return fn();
    }

    static createChained() {
        const a = new ContextMaze("A");
        const b = new ContextMaze("B");

        a.log();               // A
        b.log();               // B
        a.nested(b.log.bind(b));       // B
        b.nested(a.delayedLog.bind(a)); // A (3 варіанти через 1 сек)
        const lost = a.log;
        lost.call(b);   // B   
    }
}  

ContextMaze.createChained();
