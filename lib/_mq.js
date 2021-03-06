const { toAny } = require('jsutil-toany');
const schedule = require('node-schedule');

exports.sub = function (redis, topic, callback, scheduleRule = "*/2 * * * * *") {
    let loopRuning = false;
    function _loop() {
        if (loopRuning) {
            return;
        }
        loopRuning = true;
        return redis.rpop(`redistool_mq_${topic}`).then(res => {
            loopRuning = false;
            if (res) {
                callback && callback(toAny(res));
                return "go next";
            }
            throw "msg empty";
        }).then(() => {
            _loop();
        }).catch(() => {
            // nothing
        });
    }
    // schedule job check mq
    schedule.scheduleJob(scheduleRule, function () {
        _loop();
    });
}

exports.pub = function (redis, topic, ...events) {
    redis.lpush(`redistool_mq_${topic}`, ...events.map((event) => {
        return toAny(event, '')
    }));
}