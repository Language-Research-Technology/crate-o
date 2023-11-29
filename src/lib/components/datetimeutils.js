const timeRegex = /^([01]\d|2[0-3])\:([0-5]\d)(?:\:([0-5]\d)(?:[\.](\d+))?)?(?:[zZ]|([\+\-])([01]\d|2[0-3])\:?([0-5]\d)?)?$/;
const dateRegex = /^(?:([\+\-]\d+)|(\d{4}))(\-\d{2})?(\-\d{2})?$/;
const dateTimeRegex = new RegExp('^('+dateRegex.source.slice(1,-1) + ')(?:T(' + timeRegex.source.slice(1,-1) + '))?$');
export const utilsByType = {
  time: {
    dateTo(val) {
      if (val && !isNaN(val)) return val.toISOString().split('T')[1];
      return '';
    },
    /**
     * Convert a string value to date
     * @param {string} val New value
     * @param {Date} mval existing data value
     */
    dateFrom(val, mval) {
      let m;
      if (val && (m = val.match(timeRegex))) {
        let d = mval instanceof Date ? new Date(mval) : new Date(0);
        let [hh, mm, ss, ms] = m.slice(1, 5).map(e => parseInt(e) || 0);
        d.setUTCHours(hh, mm, ss, ms);
        if (m[5]) { //adjust timezone offset
          let [tzh, tzm] = [6, 7].map((i) => parseInt(m[i] || 0));
          let offset = parseInt(m[5] + ((tzh * 60 + tzm) * 60 * 1000));
          d.setTime(d.getTime() + offset);
        }
        return d;
      }
    },
    toNative(val) {
      var m;
      if (val && (m = val.match(/^([01]\d|2[0-3])(?:\:([0-5]\d))?(?:\:([0-5]\d))?(?:\.(\d{1,3}))?/))) {
        return m[2] ? m[0] : m[1] + ':00';
      }
    },
    fromNative(val, oldVal) {
      var m = oldVal.match(/^.+([zZ+-].*)$/);
      return val + (m && m[1] ? m[1] : '');
    }
  },

  date: {
    dateTo(val) {
      return val && !isNaN(val) ? val.toISOString().split('T')[0] : '';
    },
    /** 
     * @param {string} val 
     */
    dateFrom(val) {
      if (val && val.match(dateRegex)) return new Date(val);
    },
    toNative(val) {
      if (val) {
        //let parts = val.split('-');
        //return parts[2] ? val : ( parts[1] ? val + '-01' : val + '-01-01');
        return this.dateTo(this.dateFrom(val));
      }
    },
    fromNative(val) {
      return val;
    }
  },

  datetime: {
    dateTo(val) {
      return val && !isNaN(val) ? val.toISOString() : '';
    },
    /** @param {string} val */
    dateFrom(val) {
      if (val && val.match(dateTimeRegex)) return new Date(val);
    },
    toNative(val) {
      if (!val) return '';
      var v = val;
      var m = val.match(/([\d\-]+T[\d\:]+)(?:([zZ])|([+-]\d\d(?:\:\d\d)?))?$/);
      if (m && !m[2]) v = m[1] + 'Z';
      return this.dateTo(this.dateFrom(v)).slice(0,-1);
    },
    fromNative(val, oldVal) {
      var m = oldVal.match(/^.+T.+([zZ]|(?:[+-]\d\d\:\d\d).*)$/);
      return val + (m && m[1] ? m[1] : '');
    }
  }
};
export default utilsByType;