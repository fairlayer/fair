module.exports = function () {
    for (var _i = 0, _a = Object.keys(me.metrics); _i < _a.length; _i++) {
        var name_1 = _a[_i];
        var m = me.metrics[name_1];
        m.total += m.current;
        m.last_avg = Math.round(m.current);
        if (m.last_avg > m.max) {
            m.max = m.last_avg;
        }
        m.avgs.push(m.last_avg);
        // free up memory
        if (m.avgs.length > 600)
            m.avgs.shift();
        m.current = 0; // zero the counter for next period
    }
};
