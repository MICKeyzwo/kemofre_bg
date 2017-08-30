InputSyncer = function (target, att, init) {
    this.value = init;
    this.el = Array.from(target);
    this.el.forEach(item => {
        item.addEventListener("input", e => {
            this.value = e.target.value;
            this.el.forEach(elm => elm.value = this.value);
        });
        if(typeof att === "object") {
            for(var i in att) item.setAttribute(i, att[i]);
        }
    });
};
InputSyncer.prototype.setValue = function(val) {
    this.value = val;
    this.el.forEach(elm => elm.value = this.value);
};
InputSyncer.prototype.setAttribute = function(att, val) {
    this.el.forEach(elm => elm.setAttribute(att, val));
};
InputSyncer.prototype.on = function(evt, cb) {
    this.el.forEach(elm => {
        elm.addEventListener(evt, cb)
    });
};